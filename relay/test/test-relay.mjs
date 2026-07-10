/**
 * Test E2E del relay sin Foundry.
 * Simula un GM client (WS) y un cliente PI (HTTP).
 *
 * Uso: node test/test-relay.mjs
 */

import { WebSocket } from "ws";
import { sign } from "../lib/auth.mjs";
import { readFile } from "node:fs/promises";

const PORT = 7401;
const HOST = "127.0.0.1";
const SECRET = (await readFile("/root/pi-foundry/.secret", "utf8")).trim();

let passed = 0;
let failed = 0;

function assert(cond, msg) {
  if (cond) { passed++; console.log(`  ✓ ${msg}`); }
  else { failed++; console.error(`  ✗ ${msg}`); }
}

// 1. Health check
async function testHealth() {
  console.log("Test: health check");
  const res = await fetch(`http://${HOST}:${PORT}/health`);
  assert(res.status === 200, "GET /health returns 200");
  const data = await res.json();
  assert(data.ok === true, "health.ok === true");
  assert(data.gmConnected === false, "gmConnected === false (no GM yet)");
}

// 2. Auth failure (sin signature)
async function testAuthFail() {
  console.log("Test: auth failure (no signature)");
  const res = await fetch(`http://${HOST}:${PORT}/`, {
    method: "POST",
    body: JSON.stringify({ id: "test1", command: "ping", args: {} }),
  });
  assert(res.status === 401, "POST without signature returns 401");
}

// 3. Non-localhost rejected (simulado via header spoofing no funciona con real IP,
//    pero verificamos que el path correcto funciona)
async function testCommandWithMockGM() {
  console.log("Test: command flow with mock GM");

  // Conectar mock GM
  const ws = new WebSocket(`ws://${HOST}:${PORT}/gm`);
  await new Promise((resolve) => ws.on("open", resolve));

  // Enviar hello
  ws.send(JSON.stringify({ type: "hello", world: "test-world", token: SECRET }));
  await new Promise((resolve) => ws.on("message", resolve)); // hello_ack

  // Simular handler del GM: responder a comandos
  ws.on("message", (raw) => {
    const msg = JSON.parse(raw.toString());
    if (msg.command === "ping") {
      ws.send(JSON.stringify({ type: "result", id: msg.id, ok: true, data: { pong: true } }));
    }
  });

  // Pequeña pausa para que el relay registre el GM
  await new Promise((r) => setTimeout(r, 100));

  // Enviar comando como PI
  const cmd = { id: "cmd-1", command: "ping", args: {} };
  const body = JSON.stringify(cmd);
  const res = await fetch(`http://${HOST}:${PORT}/`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-pi-signature": sign(SECRET, body) },
    body,
  });
  assert(res.status === 200, "POST with valid signature returns 200");
  const result = await res.json();
  assert(result.ok === true, "result.ok === true");
  assert(result.data?.pong === true, "result.data.pong === true");

  ws.close();
}

// 4. GM not connected
async function testGMNotConnected() {
  console.log("Test: command when GM not connected");
  const cmd = { id: "cmd-2", command: "ping", args: {} };
  const body = JSON.stringify(cmd);
  const res = await fetch(`http://${HOST}:${PORT}/`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-pi-signature": sign(SECRET, body) },
    body,
  });
  assert(res.status === 503, "returns 503 when GM not connected");
}

// ─── Run ───────────────────────────────────────────────────────
console.log("\n=== PI Bridge Relay Tests ===\n");
try {
  await testHealth();
  await testAuthFail();
  await testCommandWithMockGM();
  await testGMNotConnected();
} catch (err) {
  console.error("Test error:", err);
  failed++;
}

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
process.exit(failed > 0 ? 1 : 0);
