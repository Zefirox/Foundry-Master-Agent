/**
 * Test E2E: Relay + Mock GM (simula el módulo pi-bridge) + Mock PI (simula la extension)
 * Valida el flujo completo: PI → relay → GM → resultado → relay → PI
 *
 * No requiere Foundry. El mock GM simula los handlers mínimos.
 */

import { WebSocket } from "ws";
import { createHmac } from "node:crypto";
import { readFile } from "node:fs/promises";

const HOST = "127.0.0.1";
const PORT = 7401;
const SECRET = (await readFile("/root/pi-foundry/.secret", "utf8")).trim();

let passed = 0;
let failed = 0;
function assert(cond, msg) {
  if (cond) { passed++; console.log(`  ✓ ${msg}`); }
  else { failed++; console.error(`  ✗ ${msg}`); }
}

function sign(body) {
  return createHmac("sha256", SECRET).update(body).digest("hex");
}

async function piSendCommand(command, args = {}) {
  const id = `test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const body = JSON.stringify({ id, command, args });
  const res = await fetch(`http://${HOST}:${PORT}/`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-pi-signature": sign(body) },
    body,
  });
  return { status: res.status, data: await res.json() };
}

// ─── Mock GM (simula el módulo pi-bridge en el browser) ────────
async function connectMockGM() {
  const ws = new WebSocket(`ws://${HOST}:${PORT}/gm`);

  await new Promise((resolve, reject) => {
    ws.on("open", resolve);
    ws.on("error", reject);
  });

  // hello
  ws.send(JSON.stringify({ type: "hello", world: "test-world", token: SECRET }));
  await new Promise((resolve) => {
    ws.once("message", (raw) => {
      const msg = JSON.parse(raw.toString());
      if (msg.type === "hello_ack") resolve();
    });
  });

  // Handler de comandos (simula los handlers del módulo)
  ws.on("message", (raw) => {
    const msg = JSON.parse(raw.toString());
    if (!msg.command) return;

    let result;
    try {
      switch (msg.command) {
        case "ping":
          result = { ok: true, data: { pong: true, foundryVersion: "13.351", world: "test-world", system: "dnd5e" } };
          break;
        case "list_active_modules":
          result = { ok: true, data: { system: { id: "dnd5e", version: "4.3.0" }, modules: [{ id: "sequencer", version: "3.2.0" }], hasSequencer: true, hasTagger: true, hasMidiQOL: true, hasDAE: true } };
          break;
        case "create_actors":
          result = { ok: true, data: { actorIds: msg.args.actors.map((_, i) => `actor-${i}`), actors: msg.args.actors.map((a, i) => ({ id: `actor-${i}`, name: a.name, type: a.type })) } };
          break;
        case "place_tokens":
          result = { ok: true, data: { tokenIds: msg.args.tokens.map((_, i) => `token-${i}`), sceneId: "scene-1" } };
          break;
        case "execute_batch":
          result = { ok: true, data: { results: msg.args.commands.map(() => ({ ok: true, data: "ok" })) } };
          break;
        default:
          result = { ok: false, error: `unknown command: ${msg.command}` };
      }
    } catch (err) {
      result = { ok: false, error: err.message };
    }
    ws.send(JSON.stringify({ type: "result", id: msg.id, ...result }));
  });

  return ws;
}

// ─── Tests ─────────────────────────────────────────────────────

async function testPing() {
  console.log("Test: ping via PI → relay → GM");
  const { status, data } = await piSendCommand("ping");
  assert(status === 200, "status 200");
  assert(data.ok === true, "ok true");
  assert(data.data?.pong === true, "pong true");
  assert(data.data?.foundryVersion === "13.351", "foundryVersion 13.351");
}

async function testListModules() {
  console.log("Test: list_active_modules");
  const { status, data } = await piSendCommand("list_active_modules");
  assert(status === 200, "status 200");
  assert(data.data?.hasSequencer === true, "hasSequencer true");
  assert(data.data?.hasMidiQOL === true, "hasMidiQOL true");
  assert(data.data?.system?.id === "dnd5e", "system dnd5e");
}

async function testCreateActors() {
  console.log("Test: create_actors (3 orcos + 1 clerigo)");
  const { status, data } = await piSendCommand("create_actors", {
    actors: [
      { name: "Orco 1", type: "npc", systemData: { details: { type: { value: "humanoid", subtype: "orc" } }, attributes: { ac: { value: 13 } } } },
      { name: "Orco 2", type: "npc", systemData: { details: { type: { value: "humanoid", subtype: "orc" } } } },
      { name: "Orco 3", type: "npc", systemData: { details: { type: { value: "humanoid", subtype: "orc" } } } },
      { name: "Clerigo de Zenterra", type: "character", systemData: { details: { class: { name: "Cleric" }, level: 5 } } },
    ],
  });
  assert(status === 200, "status 200");
  assert(data.data?.actorIds?.length === 4, "4 actors created");
  assert(data.data?.actors?.[0]?.name === "Orco 1", "first actor name correct");
  assert(data.data?.actors?.[3]?.name === "Clerigo de Zenterra", "last actor name correct");
}

async function testPlaceTokens() {
  console.log("Test: place_tokens");
  const { status, data } = await piSendCommand("place_tokens", {
    tokens: [
      { actorId: "actor-0", x: 100, y: 100 },
      { actorId: "actor-1", x: 300, y: 100 },
      { actorId: "actor-2", x: 500, y: 100 },
      { actorId: "actor-3", x: 300, y: 300 },
    ],
  });
  assert(status === 200, "status 200");
  assert(data.data?.tokenIds?.length === 4, "4 tokens placed");
}

async function testExecuteBatch() {
  console.log("Test: execute_batch (create + place en un solo comando)");
  const { status, data } = await piSendCommand("execute_batch", {
    commands: [
      { command: "create_actors", args: { actors: [{ name: "Goblin", type: "npc" }] } },
      { command: "place_tokens", args: { tokens: [{ actorId: "actor-0", x: 200, y: 200 }] } },
    ],
  });
  assert(status === 200, "status 200");
  assert(data.data?.results?.length === 2, "2 results in batch");
  assert(data.data?.results?.every((r) => r.ok), "all batch results ok");
}

async function testInvalidCommand() {
  console.log("Test: invalid command rejected");
  const { status, data } = await piSendCommand("nonexistent_command");
  assert(data.ok === false, "rejected");
}

async function testBadSignature() {
  console.log("Test: bad signature rejected");
  const body = JSON.stringify({ id: "bad-1", command: "ping", args: {} });
  const res = await fetch(`http://${HOST}:${PORT}/`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-pi-signature": "deadbeef" },
    body,
  });
  assert(res.status === 401, "401 unauthorized");
}

// ─── Run ───────────────────────────────────────────────────────
console.log("\n=== PI Bridge E2E Tests ===\n");

const gm = await connectMockGM();
await new Promise((r) => setTimeout(r, 100));

try {
  await testPing();
  await testListModules();
  await testCreateActors();
  await testPlaceTokens();
  await testExecuteBatch();
  await testInvalidCommand();
  await testBadSignature();
} catch (err) {
  console.error("Test error:", err);
  failed++;
}

gm.close();
console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
process.exit(failed > 0 ? 1 : 0);
