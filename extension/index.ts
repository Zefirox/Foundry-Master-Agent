/**
 * PI Foundry Extension
 *
 * Registra tools custom en PI para interactuar con FoundryVTT
 * a través del relay local (HTTP + HMAC) y el RAG service (HTTP).
 *
 * Tools registradas:
 *  - foundry_execute: envía un comando tipado al puente de FoundryVTT
 *  - foundry_search_docs: búsqueda semántica sobre la API de Foundry + módulos
 *  - foundry_list_modules: lista los módulos activos en Foundry
 *  - foundry_ping: test de conectividad
 *
 * Configuración:
 *  - PI_FOUNDRY_RELAY_URL (env) — default: http://127.0.0.1:7401
 *  - PI_FOUNDRY_RAG_URL (env)   — default: http://127.0.0.1:7402
 *  - PI_FOUNDRY_SECRET (env) — o lee de /root/pi-foundry/.secret
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { createHmac } from "node:crypto";
import { readFile } from "node:fs/promises";

const RELAY_URL = process.env.PI_FOUNDRY_RELAY_URL ?? "http://127.0.0.1:7401";
const RAG_URL = process.env.PI_FOUNDRY_RAG_URL ?? "http://127.0.0.1:7402";
const SECRET_FILE = "/root/pi-foundry/.secret";

let cachedSecret: string | null = null;

async function getSecret(): Promise<string> {
  if (cachedSecret) return cachedSecret;
  if (process.env.PI_FOUNDRY_SECRET) {
    cachedSecret = process.env.PI_FOUNDRY_SECRET;
    return cachedSecret;
  }
  try {
    cachedSecret = (await readFile(SECRET_FILE, "utf8")).trim();
    return cachedSecret;
  } catch {
    throw new Error(
      `No se pudo cargar el secret. Set PI_FOUNDRY_SECRET o crea ${SECRET_FILE}.`
    );
  }
}

function sign(secret: string, body: string): string {
  return createHmac("sha256", secret).update(body).digest("hex");
}

let commandCounter = 0;

/**
 * Envía un comando al relay y espera la respuesta del GM.
 */
async function sendCommand(command: string, args: Record<string, unknown>): Promise<unknown> {
  const secret = await getSecret();
  const id = `pi-${Date.now()}-${++commandCounter}`;
  const payload = JSON.stringify({ id, command, args });

  const res = await fetch(`${RELAY_URL}/`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-pi-signature": sign(secret, payload),
    },
    body: payload,
  });

  if (!res.ok && res.status !== 500) {
    const text = await res.text();
    throw new Error(`Relay error ${res.status}: ${text}`);
  }

  const result = await res.json() as { ok: boolean; data?: unknown; error?: string };
  if (!result.ok) {
    throw new Error(`Command failed: ${result.error ?? "unknown error"}`);
  }
  return result.data;
}

// ─── Schemas de comandos para la tool foundry_execute ──────────
const COMMAND_NAMES = [
  "ping",
  "list_active_modules",
  "create_actors",
  "place_tokens",
  "create_journal",
  "run_macro",
  "update_scene",
  "execute_batch",
  "add_items",
  "plutonium_import",
  "sync_modules",
  "analyze_module",
  "index_knowledge",
] as const;

export default function foundryExtension(pi: ExtensionAPI) {
  // ─── Tool: foundry_execute ──────────────────────────────────
  pi.registerTool({
    name: "foundry_execute",
    label: "Foundry Execute",
    description: `Envía un comando estructurado al puente de FoundryVTT para ejecución inmediata en el cliente GM.

Comandos disponibles:
- ping: test de conectividad
- list_active_modules: lista módulos y sistemas activos
- create_actors: crea actors (NPCs/personajes). args: { actors: [{ name, type: "character"|"npc", systemData?, img? }], folder? }
- place_tokens: coloca tokens en la escena. args: { tokens: [{ actorId, x?, y?, sceneId?, name? }] }
- create_journal: crea entradas de diario. args: { entries: [{ name, content?, type?, folder? }] }
- run_macro: ejecuta una macro existente. args: { name, args? }
- update_scene: actualiza la escena. args: { sceneId?, data }
- execute_batch: ejecuta múltiples comandos en secuencia. args: { commands: [{ command, args }] }
- add_items: añade items (armas, traits, hechizos) a actors existentes. args: { items: [{ actorId, name, type, systemData?, description? }] }
- plutonium_import: importa monsters completos desde 5etools via Plutonium. args: { creatures: [{ name, source? }] }. Ej: { creatures: [{ name: "Orc", source: "MM" }, { name: "Priest", source: "XMM" }] }
- sync_modules: escanea módulos activos y compara con conocimiento conocido. args: {}. Devuelve { known, unknown, versionMismatches }
- analyze_module: extrae API surface de un módulo. args: { moduleId: string }. Devuelve globals, hooks, classes, methods, readme
- index_knowledge: persiste conocimiento generado en el RAG. args: { module: string, content: string, title? }

SIEMPRE consulta foundry_search_docs antes de emitir comandos para usar la API correcta de la versión de Foundry.`,
    promptSnippet: "Execute structured commands on FoundryVTT (create actors, place tokens, etc.)",
    promptGuidelines: [
      "Use foundry_execute to create content on FoundryVTT. Always verify the correct API shape with foundry_search_docs first.",
      "Use foundry_execute with command 'list_active_modules' before generating code that uses third-party modules (Sequencer, Tagger, MidiQOL).",
      "Use foundry_execute with command 'execute_batch' when multiple operations are needed, to reduce round-trips.",
    ],
    parameters: Type.Object({
      command: Type.Union(
        COMMAND_NAMES.map((c) => Type.Literal(c)),
        { description: "Comando a ejecutar" }
      ),
      args: Type.Optional(
        Type.Record(Type.String(), Type.Unknown()),
        { description: "Argumentos del comando (ver descripción de la tool)" }
      ),
    }),
    async execute(_toolCallId, params, _signal, onUpdate) {
      onUpdate?.({ content: [{ type: "text", text: `→ ${params.command}` }] });

      const data = await sendCommand(params.command, params.args ?? {});

      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        details: { command: params.command, data },
      };
    },
  });

  // ─── Tool: foundry_ping ─────────────────────────────────────
  pi.registerTool({
    name: "foundry_ping",
    label: "Foundry Ping",
    description: "Test de conectividad con el puente de FoundryVTT. Devuelve la versión de Foundry, el world y el system activos.",
    promptSnippet: "Test connectivity to FoundryVTT bridge",
    parameters: Type.Object({}),
    async execute() {
      const data = await sendCommand("ping", {});
      return {
        content: [{ type: "text", text: `Pong! FoundryVTT ${JSON.stringify(data)}` }],
        details: { data },
      };
    },
  });

  // ─── Tool: foundry_list_modules ─────────────────────────────
  pi.registerTool({
    name: "foundry_list_modules",
    label: "Foundry List Modules",
    description: "Lista los módulos y sistemas activos en FoundryVTT. Útil para saber qué APIs de terceros están disponibles antes de generar código.",
    promptSnippet: "List active FoundryVTT modules and systems",
    parameters: Type.Object({}),
    async execute() {
      const data = await sendCommand("list_active_modules", {});
      return {
        content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
        details: { data },
      };
    },
  });

  // ─── Tool: foundry_search_docs ────────────────────────────
  pi.registerTool({
    name: "foundry_search_docs",
    label: "Foundry Search Docs",
    description: `Búsqueda semántica sobre la API de FoundryVTT y módulos de terceros (Sequencer, Tagger, MidiQOL).
Devuelve símbolos de la API (clases, métodos, propiedades) con su documentación JSDoc.

USA SIEMPRE esta tool antes de emitir comandos con foundry_execute para verificar la API correcta.

Parámetros:
- query: texto de búsqueda (ej. "create actor with system data", "place token on scene", "Sequencer animation")
- module: filtrar por módulo ("core", "sequencer", "tagger", "midi-qol"). Default: todos.
- limit: número de resultados (default: 5)`,
    promptSnippet: "Search FoundryVTT API docs semantically (classes, methods, properties)",
    promptGuidelines: [
      "Use foundry_search_docs BEFORE calling foundry_execute to verify the correct API shape for the current Foundry version.",
      "Use foundry_search_docs with module='sequencer' or 'midi-qol' when you need to use third-party module APIs.",
    ],
    parameters: Type.Object({
      query: Type.String({ description: "Texto de búsqueda sobre la API de Foundry" }),
      module: Type.Optional(
        Type.Union(
          [Type.Literal("core"), Type.Literal("sequencer"), Type.Literal("tagger"), Type.Literal("midi-qol")],
          { description: "Filtrar por módulo específico" }
        )
      ),
      limit: Type.Optional(Type.Number({ description: "Número de resultados (default: 5)" })),
    }),
    async execute(_toolCallId, params, _signal, onUpdate) {
      onUpdate?.({ content: [{ type: "text", text: `🔍 ${params.query}` }] });

      const res = await fetch(`${RAG_URL}/search`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          query: params.query,
          module: params.module,
          limit: params.limit ?? 5,
        }),
      });

      if (!res.ok) {
        throw new Error(`RAG search failed: ${res.status} ${await res.text()}`);
      }

      const data = await res.json() as { ok: boolean; results: Array<Record<string, unknown>>; count: number };
      if (!data.ok) {
        throw new Error("RAG search returned error");
      }

      const formatted = data.results.map((r, i) =>
        `[${i + 1}] [${r.module}] ${r.symbol} (${r.kind})\n    ${r.description}\n    source: ${r.source}:${r.line}`
      ).join("\n\n");

      return {
        content: [{ type: "text", text: formatted || "No results found." }],
        details: { query: params.query, count: data.count, results: data.results },
      };
    },
  });

  // ─── Notificación al cargar ─────────────────────────────────
  pi.on("session_start", (_event, ctx) => {
    ctx.ui.notify("PI Foundry extension loaded", "info");
  });
}
