/**
 * PI Bridge Relay — servidor local standalone.
 *
 * Función: puente entre el agente PI (que envía comandos por HTTP)
 * y el módulo pi-bridge del cliente GM de FoundryVTT (conectado por WebSocket).
 *
 * Seguridad:
 *  - Bind estricto a 127.0.0.1 (no 0.0.0.0)
 *  - Autenticación HMAC-SHA256 en cada request HTTP
 *  - Rate limiting por IP
 *  - Audit log de cada comando
 *
 * Uso:
 *   PI_BRIDGE_SECRET=$(cat /root/pi-foundry/.secret) node server.mjs
 */

import http from "node:http";
import { readFile } from "node:fs/promises";
import { WebSocketServer } from "ws";
import { verifySignature } from "./lib/auth.mjs";
import { audit } from "./lib/audit.mjs";
import { timingSafeEqual } from "node:crypto";

const PORT = Number(process.env.PI_BRIDGE_PORT ?? 7401);
const HOST = "127.0.0.1"; // estricto localhost

// Cargar secret: env var o archivo
async function loadSecret() {
  if (process.env.PI_BRIDGE_SECRET) return process.env.PI_BRIDGE_SECRET;
  try {
    return (await readFile("/root/pi-foundry/.secret", "utf8")).trim();
  } catch {
    console.error("FATAL: no se pudo cargar el secret. Set PI_BRIDGE_SECRET o crea /root/pi-foundry/.secret");
    process.exit(1);
  }
}

// ─── Rate limiter (simple sliding window) ───────────────────────
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 60; // 60 req/min por IP
const ipHits = new Map();

function rateLimited(ip) {
  const now = Date.now();
  const hits = (ipHits.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  hits.push(now);
  ipHits.set(ip, hits);
  return hits.length > RATE_MAX;
}

// ─── Estado del relay ──────────────────────────────────────────
/** @type {import("ws").WebSocket | null} */
let gmSocket = null;
let gmWorld = null;

/** Map<commandId, {res, timer}> — pending HTTP responses esperando ack del GM */
const pending = new Map();
const COMMAND_TIMEOUT_MS = 120_000;

function resolvePending(id, payload) {
  const entry = pending.get(id);
  if (!entry) return;
  clearTimeout(entry.timer);
  pending.delete(id);
  if (!entry.res.writableEnded) {
    entry.res.writeHead(payload.ok ? 200 : 500, { "content-type": "application/json" });
    entry.res.end(JSON.stringify(payload));
  }
}

// ─── HTTP server (PI → relay) ──────────────────────────────────
const httpServer = http.createServer(async (req, res) => {
  const ip = req.socket.remoteAddress;

  // 1. Solo localhost
  if (ip !== "127.0.0.1" && ip !== "::1" && ip !== "::ffff:127.0.0.1") {
    return res.writeHead(403).end("forbidden: non-localhost");
  }

  // 2. Rate limit
  if (rateLimited(ip)) {
    return res.writeHead(429).end("rate limited");
  }

  // 3. Health check (sin auth)
  if (req.method === "GET" && req.url === "/health") {
    return res.writeHead(200, { "content-type": "application/json" }).end(
      JSON.stringify({ ok: true, gmConnected: !!gmSocket, world: gmWorld })
    );
  }

  // 4. Solo POST en /
  if (req.method !== "POST" || req.url !== "/") {
    return res.writeHead(404).end("not found");
  }

  // 5. Leer body
  let body = "";
  for await (const chunk of req) body += chunk;
  if (!body) return res.writeHead(400).end("empty body");

  // 6. Verificar HMAC
  const signature = req.headers["x-pi-signature"] ?? "";
  if (!verifySignature(SECRET, body, signature)) {
    await audit({ type: "auth_failed", ip, bodyPreview: body.slice(0, 200) });
    return res.writeHead(401).end("unauthorized: bad signature");
  }

  // 7. Parsear comando
  let cmd;
  try {
    cmd = JSON.parse(body);
  } catch {
    return res.writeHead(400).end("invalid json");
  }

  if (!cmd.id || !cmd.command) {
    return res.writeHead(400).end("missing id or command");
  }

  // 8. Verificar que el GM está conectado
  if (!gmSocket || gmSocket.readyState !== 1 /* OPEN */) {
    return res.writeHead(503, { "content-type": "application/json" }).end(
      JSON.stringify({ ok: false, error: "GM client not connected" })
    );
  }

  // 9. Enviar al GM por WS y registrar pending
  const timer = setTimeout(() => {
    resolvePending(cmd.id, { ok: false, error: "command timeout", id: cmd.id });
  }, COMMAND_TIMEOUT_MS);

  pending.set(cmd.id, { res, timer });
  gmSocket.send(JSON.stringify(cmd));

  await audit({ type: "command", id: cmd.id, command: cmd.command, ip });
});

// ─── WebSocket server (relay → GM module) ──────────────────────
const wss = new WebSocketServer({ server: httpServer, path: "/gm" });

wss.on("connection", async (ws, req) => {
  const ip = req.socket.remoteAddress;
  console.log(`[relay] GM client conectado desde ${ip}`);

  // El GM debe enviar un "hello" con su world + token para autenticar.
  // El WS es público vía Caddy, así que el token es obligatorio.
  ws.once("message", async (raw) => {
    try {
      const msg = JSON.parse(raw.toString());
      if (msg.type === "hello" && msg.world && msg.token) {
        // Verificar token (comparación timing-safe)
        const a = Buffer.from(msg.token, "utf8");
        const b = Buffer.from(SECRET, "utf8");
        if (a.length !== b.length || !timingSafeEqual(a, b)) {
          await audit({ type: "ws_auth_failed", ip, world: msg.world });
          return ws.close(4003, "invalid token");
        }
        gmSocket = ws;
        gmWorld = msg.world;
        console.log(`[relay] GM autenticado para world: ${msg.world}`);
        ws.send(JSON.stringify({ type: "hello_ack", ok: true }));
      } else {
        ws.close(4001, "invalid hello");
      }
    } catch {
      ws.close(4001, "invalid hello");
    }
  });

  ws.on("message", (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return;
    }

    // Resultado de un comando → resolver pending HTTP response
    if (msg.type === "result" && msg.id) {
      resolvePending(msg.id, msg);
      return;
    }

    // Evento espontáneo del GM (e.g. notificación)
    if (msg.type === "event") {
      audit({ type: "gm_event", event: msg.event, data: msg.data });
    }
  });

  ws.on("close", () => {
    if (gmSocket === ws) {
      gmSocket = null;
      gmWorld = null;
      console.log("[relay] GM client desconectado");
      // Rechazar todos los pending
      for (const [id, entry] of pending) {
        clearTimeout(entry.timer);
        pending.delete(id);
        if (!entry.res.writableEnded) {
          entry.res.writeHead(503).end(JSON.stringify({ ok: false, error: "GM disconnected" }));
        }
      }
    }
  });

  ws.on("error", (err) => {
    console.error("[relay] WS error:", err.message);
  });
});

// ─── Start ─────────────────────────────────────────────────────
const SECRET = await loadSecret();

httpServer.listen(PORT, HOST, () => {
  console.log(`[relay] PI Bridge Relay escuchando en http://${HOST}:${PORT}`);
  console.log(`[relay] WebSocket GM endpoint: ws://${HOST}:${PORT}/gm`);
  console.log(`[relay] Health check: GET http://${HOST}:${PORT}/health`);
});

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("[relay] shutting down...");
  httpServer.close();
  process.exit(0);
});
process.on("SIGTERM", () => {
  httpServer.close();
  process.exit(0);
});
