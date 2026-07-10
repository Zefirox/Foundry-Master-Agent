/**
 * RAG Service — servidor HTTP para búsqueda semántica sobre docs de Foundry.
 *
 * Endpoints:
 *   GET  /health       — health check
 *   POST /search       — búsqueda semántica { query, foundry_version?, module?, limit? }
 *   POST /ingest       — re-ingesta (opcional, requiere auth)
 *   POST /index-document — indexa un documento individual { text, metadata }
 *
 * Escucha en 127.0.0.1:7402 (localhost, sin auth — solo PI lo usa).
 */

import http from "node:http";
import { embed } from "./lib/embed.mjs";
import { search, count, insertChunks } from "./lib/store.mjs";
import { runIngest } from "./ingest/ingest.mjs";

const PORT = Number(process.env.RAG_PORT ?? 7402);
const HOST = "127.0.0.1";

const server = http.createServer(async (req, res) => {
  // CORS headers (por si se accede desde el browser para debug)
  res.setHeader("access-control-allow-origin", "*");
  res.setHeader("access-control-allow-methods", "GET, POST, OPTIONS");
  if (req.method === "OPTIONS") return res.writeHead(204).end();

  // Health check
  if (req.method === "GET" && req.url === "/health") {
    try {
      const total = await count();
      return res.writeHead(200, { "content-type": "application/json" }).end(
        JSON.stringify({ ok: true, documents: total ?? 0 })
      );
    } catch {
      return res.writeHead(200, { "content-type": "application/json" }).end(
        JSON.stringify({ ok: true, documents: 0, note: "index not built yet" })
      );
    }
  }

  // Solo POST
  if (req.method !== "POST") return res.writeHead(404).end("not found");

  // Leer body
  let body = "";
  for await (const chunk of req) body += chunk;
  let data;
  try {
    data = JSON.parse(body);
  } catch {
    return res.writeHead(400).end("invalid json");
  }

  // Search
  if (req.url === "/search") {
    try {
      const { query, foundry_version, module, limit = 5 } = data;
      if (!query) return res.writeHead(400).end("missing query");

      const vector = await embed(query);
      const results = await search(vector, { foundry_version, module, limit });

      return res.writeHead(200, { "content-type": "application/json" }).end(
        JSON.stringify({ ok: true, results, count: results.length })
      );
    } catch (err) {
      console.error("[rag] Search error:", err.message);
      return res.writeHead(500, { "content-type": "application/json" }).end(
        JSON.stringify({ ok: false, error: err.message })
      );
    }
  }

  // Index a single document (for agent-generated knowledge)
  if (req.url === "/index-document") {
    try {
      const { text, metadata = {} } = data;
      if (!text) return res.writeHead(400).end("missing text");

      const vector = await embed(text);
      const record = {
        text,
        vector,
        symbol: metadata.symbol ?? metadata.module ?? "unknown",
        kind: metadata.kind ?? "knowledge",
        parent: metadata.parent ?? "knowledge",
        description: metadata.description ?? "",
        line: metadata.line ?? 0,
        source: metadata.source ?? "agent-generated",
        foundry_version: metadata.foundry_version ?? "unknown",
        module: metadata.module ?? "unknown",
      };

      await insertChunks([record]);

      return res.writeHead(200, { "content-type": "application/json" }).end(
        JSON.stringify({ ok: true, module: metadata.module, indexed: 1 })
      );
    } catch (err) {
      console.error("[rag] Index-document error:", err.message);
      return res.writeHead(500, { "content-type": "application/json" }).end(
        JSON.stringify({ ok: false, error: err.message })
      );
    }
  }

  // Ingest (re-build index)
  if (req.url === "/ingest") {
    try {
      // Run async, respond immediately
      res.writeHead(202, { "content-type": "application/json" }).end(
        JSON.stringify({ ok: true, message: "ingest started" })
      );
      await runIngest(data);
    } catch (err) {
      console.error("[rag] Ingest error:", err.message);
    }
    return;
  }

  return res.writeHead(404).end("not found");
});

server.listen(PORT, HOST, () => {
  console.log(`[rag] RAG Service escuchando en http://${HOST}:${PORT}`);
  console.log(`[rag] Endpoints: GET /health, POST /search, POST /ingest`);
});

process.on("SIGINT", () => { server.close(); process.exit(0); });
process.on("SIGTERM", () => { server.close(); process.exit(0); });
