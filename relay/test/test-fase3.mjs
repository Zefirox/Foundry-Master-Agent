/**
 * Test Fase 3 — Caso de uso real:
 * "Crea 3 orcos y un Clérigo nivel 5 para Zenterra y colocalos en la escena actual"
 *
 * Ejecuta el pipeline completo: create_actors + place_tokens via relay.
 */

import { createHmac } from "node:crypto";
import { readFile } from "node:fs/promises";

const RELAY = "http://127.0.0.1:7401";
const SECRET = (await readFile("/root/pi-foundry/.secret", "utf8")).trim();
let cmdId = 0;

async function sendCommand(command, args) {
  const id = `f3-${++cmdId}`;
  const body = JSON.stringify({ id, command, args });
  const sig = createHmac("sha256", SECRET).update(body).digest("hex");
  const res = await fetch(`${RELAY}/`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-pi-signature": sig },
    body,
  });
  const result = await res.json();
  if (!result.ok) throw new Error(`Command ${command} failed: ${result.error}`);
  return result.data;
}

// ─── D&D 5e (2024) stats ───────────────────────────────────────

const orcSystemData = {
  details: {
    type: { value: "humanoid", subtype: "orc" },
    cr: 0.5,
    alignment: "Chaotic Evil",
  },
  attributes: {
    ac: { value: 13 },
    hp: { value: 15, max: 15, formula: "2d8 + 5" },
    movement: { walk: 30 },
    senses: { darkvision: 0, units: "ft" },
  },
  abilities: {
    str: { value: 16, proficient: 0 },
    dex: { value: 12, proficient: 0 },
    con: { value: 16, proficient: 0 },
    int: { value: 7, proficient: 0 },
    wis: { value: 11, proficient: 0 },
    cha: { value: 10, proficient: 0 },
  },
  skills: {
    intimidation: { value: 2, proficient: 1 },
  },
};

const clericSystemData = {
  details: {
    type: { value: "humanoid", subtype: "" },
    cr: 3,
    alignment: "Lawful Good",
  },
  attributes: {
    ac: { value: 16 },
    hp: { value: 27, max: 27, formula: "5d8 + 5" },
    movement: { walk: 30 },
    senses: { darkvision: 0, units: "ft" },
  },
  abilities: {
    str: { value: 14, proficient: 0 },
    dex: { value: 10, proficient: 0 },
    con: { value: 12, proficient: 0 },
    int: { value: 10, proficient: 0 },
    wis: { value: 16, proficient: 0 },
    cha: { value: 12, proficient: 0 },
  },
  skills: {
    medicine: { value: 7, proficient: 1 },
    religion: { value: 3, proficient: 1 },
  },
};

// ─── 1. Crear actors ───────────────────────────────────────────
console.log("\n=== Creando 3 orcos + 1 clérigo nivel 5 ===\n");

const actors = [
  { name: "Orco Berserker", type: "npc", systemData: orcSystemData },
  { name: "Orco Guardia", type: "npc", systemData: orcSystemData },
  { name: "Orco Chaman", type: "npc", systemData: orcSystemData },
  { name: "Clerigo de Zenterra (Nv 5)", type: "npc", systemData: clericSystemData },
];

const createResult = await sendCommand("create_actors", { actors });
console.log("✅ Actors creados:");
for (const a of createResult.actors) {
  console.log(`   ${a.id} — ${a.name} (${a.type})`);
}

// ─── 2. Colocar tokens en la escena ────────────────────────────
console.log("\n=== Colocando tokens en la escena ===\n");

const gridSize = 100; // pixels per grid square
const tokens = createResult.actorIds.map((actorId, i) => ({
  actorId,
  x: 400 + (i % 4) * (gridSize * 2),
  y: 300 + Math.floor(i / 4) * (gridSize * 2),
}));

const placeResult = await sendCommand("place_tokens", { tokens });
console.log("✅ Tokens colocados:");
console.log(`   Escena: ${placeResult.sceneId}`);
console.log(`   Tokens: ${placeResult.tokenIds.length}`);

// ─── 3. Crear entrada de diario con info del encuentro ─────────
console.log("\n=== Creando entrada de diario ===\n");

const journalResult = await sendCommand("create_journal", {
  entries: [{
    name: "Encuentro: Orcos de Zenterra",
    content: `
      <h2>Encuentro: Orcos de Zenterra</h2>
      <p><strong>Región:</strong> Zenterra</p>
      <p><strong>Dificultad:</strong> Media (CR 3)</p>
      <h3>Enemigos</h3>
      <ul>
        <li>Orco Berserker (NPC, CR 1/2)</li>
        <li>Orco Guardia (NPC, CR 1/2)</li>
        <li>Orco Chaman (NPC, CR 1/2)</li>
      </ul>
      <h3>Aliados</h3>
      <ul>
        <li>Clerigo de Zenterra (Nv 5, Lawful Good)</li>
      </ul>
      <p><em>Creado por PI Bridge — ${new Date().toISOString()}</em></p>
    `,
  }],
});
console.log("✅ Diario creado:");
for (const j of journalResult.journals) {
  console.log(`   ${j.id} — ${j.name}`);
}

console.log("\n=== Caso de uso completo ✅ ===\n");
console.log("Resumen:");
console.log(`  Actors: ${createResult.actorIds.length}`);
console.log(`  Tokens: ${placeResult.tokenIds.length}`);
console.log(`  Journal: ${journalResult.journals.length}`);
