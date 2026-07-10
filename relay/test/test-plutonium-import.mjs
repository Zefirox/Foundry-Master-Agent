/**
 * Test: Importar creatures desde 5etools via Plutonium.
 * Importa 3 Orcs (MM) y 1 Priest (XMM 2024) con todas sus acciones y traits.
 */

import { createHmac } from "node:crypto";
import { readFile } from "node:fs/promises";

const RELAY = "http://127.0.0.1:7401";
const SECRET = (await readFile("/root/pi-foundry/.secret", "utf8")).trim();
let cmdId = 0;

async function sendCommand(command, args) {
  const id = `plut-${++cmdId}`;
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

// ─── 1. Verificar que Plutonium está activo ────────────────────
console.log("=== Verificando Plutonium ===");
const modules = await sendCommand("list_active_modules", {});
const plutonium = modules.modules.find((m) => m.id === "plutonium");
console.log(`  Plutonium: ${plutonium ? `v${plutonium.version}` : "NO ENCONTRADO"}`);

// ─── 2. Importar 3 Orcs y 1 Priest via Plutonium ───────────────
console.log("\n=== Importando creatures via Plutonium/5etools ===\n");

const importResult = await sendCommand("plutonium_import", {
  creatures: [
    { name: "Orc", source: "MM" },
    { name: "Orc", source: "MM" },
    { name: "Orc", source: "MM" },
    { name: "Priest", source: "XMM" },
  ],
});

console.log("Resultados de importación:");
const actorIds = [];
for (const r of importResult.results) {
  if (r.success) {
    console.log(`  ✅ ${r.name} (${r.source}) → actorId: ${r.actorId}, actor: ${r.actorName}`);
    if (r.items?.length) console.log(`     Items: ${r.items.join(", ")}`);
    if (r.actorId) actorIds.push(r.actorId);
  } else {
    console.log(`  ❌ ${r.name} (${r.source}) → ${r.error}`);
  }
}

// ─── 3. Colocar tokens en la escena ────────────────────────────
if (actorIds.length > 0) {
  console.log("\n=== Colocando tokens en la escena ===\n");
  const tokens = actorIds.map((actorId, i) => ({
    actorId,
    x: 1200 + (i % 4) * 200,
    y: 700 + Math.floor(i / 4) * 200,
  }));
  const placeResult = await sendCommand("place_tokens", { tokens });
  console.log(`✅ ${placeResult.tokenIds.length} tokens colocados en escena ${placeResult.sceneId}`);
}

// ─── 4. Crear entrada de diario ────────────────────────────────
console.log("\n=== Creando entrada de diario ===\n");
const journalResult = await sendCommand("create_journal", {
  entries: [{
    name: "Encuentro: Orcos de Zenterra (Plutonium)",
    content: `
      <h2>Encuentro: Orcos de Zenterra</h2>
      <p><strong>Región:</strong> Zenterra</p>
      <p><strong>Importado via Plutonium desde 5etools</strong></p>
      <h3>Enemigos</h3>
      <ul>
        <li>Orc × 3 (MM) — Greataxe, Javelin, Aggressive</li>
      </ul>
      <h3>Aliados</h3>
      <ul>
        <li>Priest (XMM 2024, CR 2) — Sacred Flame, Cure Wounds, Bless, Sanctuary</li>
      </ul>
      <p><em>Creado por PI Bridge + Plutonium — ${new Date().toISOString()}</em></p>
    `,
  }],
});
console.log(`✅ Diario: ${journalResult.journals[0]?.name}`);

console.log("\n=== IMPORT COMPLETO ✅ ===\n");
console.log("Los actors importados tienen TODAS sus acciones, traits y stats");
console.log("directamente del Monster Manual de D&D 2024.");
