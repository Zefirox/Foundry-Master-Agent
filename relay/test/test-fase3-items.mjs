/**
 * Poblar actores con items de D&D 2024 (armas, traits, acciones).
 * Usa el comando add_items para añadir embedded items a los actors existentes.
 */

import { createHmac } from "node:crypto";
import { readFile } from "node:fs/promises";

const RELAY = "http://127.0.0.1:7401";
const SECRET = (await readFile("/root/pi-foundry/.secret", "utf8")).trim();
let cmdId = 0;

async function sendCommand(command, args) {
  const id = `f3-items-${++cmdId}`;
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

// ─── Buscar los actors creados anteriormente ───────────────────
// Listar todos los actors y filtrar por nombre
const SECRET2 = SECRET;
const listBody = JSON.stringify({ id: "list-1", command: "unsafe.eval", args: { code: "JSON.stringify(game.actors.filter(a => a.name.includes('Orco') || a.name.includes('Clerigo')).map(a => ({id: a.id, name: a.name, type: a.type})))" } });
// unsafe.eval está deshabilitado, usamos un enfoque alternativo:
// Buscar actors por nombre via create_actors no funciona para listar.
// En su lugar, usamos los IDs que conocemos del test anterior.

// Los IDs del test anterior (test-fase3.mjs):
// Si no los tenemos, los pedimos al usuario o los buscamos.
// Asumimos que los actors ya están creados. Vamos a buscarlos.

console.log("Buscando actors existentes...");

// Usar list_active_modules como proxy para verificar conexión
const ping = await sendCommand("ping", {});
console.log("Conectado a Foundry:", ping.world);

// ─── D&D 2024 Item definitions ─────────────────────────────────

// Arma: Greataxe (Orc)
const greataxe = {
  name: "Greataxe",
  type: "weapon",
  systemData: {
    type: { value: "martialM", subtype: "" },
    damage: { parts: [["1d12 + @mod", "slashing"]], versatile: "" },
    attack: { ability: "str", bonus: "", critical: { threshold: null } },
    range: { value: 5, units: "ft", long: null, reach: null },
    activation: { type: "action", cost: 1, condition: "" },
    target: { value: 1, units: "", type: "creature", prompt: false, template: null },
    properties: { two: false, fin: false, lgt: true, hvy: true, rch: false, rel: false, ret: false, foc: false, thr: false, amp: false, sil: false, vic: false, mgc: false, ada: false, silv: false, mtl: true },
    proficiency: true,
    equipped: true,
    quantity: 1,
    weight: 7,
    price: { value: 30, denomination: "gp" },
    identifier: "greataxe",
  },
  description: "<p><em>Martial melee weapon, heavy.</em></p><p>Damage: 1d12 slashing. Reach 5 ft.</p>",
};

// Trait: Aggressive (Orc)
const aggressiveTrait = {
  name: "Aggressive",
  type: "feat",
  systemData: {
    type: { value: "monster" },
    activation: { type: "bonus", cost: 1, condition: "" },
    description: { value: "As a bonus action, the orc can move up to its speed toward a hostile creature it can see." },
  },
  description: "<p><strong>Aggressive.</strong> As a bonus action, the orc can move up to its speed toward a hostile creature it can see.</p>",
};

// Trait: Primal Intuition (Orc)
const primalIntuition = {
  name: "Primal Intuition",
  type: "feat",
  systemData: {
    type: { value: "monster" },
    description: { value: "The orc can add its proficiency bonus to any Intimidation check." },
  },
  description: "<p><strong>Primal Intuition.</strong> The orc can add its proficiency bonus to any Intimidation check.</p>",
};

// Arma: Mace (Cleric)
const mace = {
  name: "Mace",
  type: "weapon",
  systemData: {
    type: { value: "simpleM", subtype: "" },
    damage: { parts: [["1d6 + @mod", "bludgeoning"]], versatile: "" },
    attack: { ability: "str", bonus: "", critical: { threshold: null } },
    range: { value: 5, units: "ft", long: null, reach: null },
    activation: { type: "action", cost: 1, condition: "" },
    target: { value: 1, units: "", type: "creature", prompt: false, template: null },
    properties: { two: false, fin: false, lgt: true, hvy: false, rch: false, rel: false, ret: false, foc: false, thr: false, amp: false, sil: true, vic: false, mgc: false, ada: false, silv: false, mtl: true },
    proficiency: true,
    equipped: true,
    quantity: 1,
    weight: 4,
    price: { value: 5, denomination: "gp" },
    identifier: "mace",
  },
  description: "<p><em>Simple melee weapon.</em></p><p>Damage: 1d6 bludgeoning. Reach 5 ft.</p>",
};

// Equipment: Shield (Cleric)
const shield = {
  name: "Shield",
  type: "equipment",
  systemData: {
    type: { value: "shield" },
    armor: { value: 2, type: "shield", dex: null },
    equipped: true,
    quantity: 1,
    weight: 6,
    price: { value: 10, denomination: "gp" },
    proficiency: true,
    identifier: "shield",
  },
  description: "<p><em>Shield.</em> +2 to AC.</p>",
};

// Equipment: Chain Mail (Cleric)
const chainMail = {
  name: "Chain Mail",
  type: "equipment",
  systemData: {
    type: { value: "medium" },
    armor: { value: 16, type: "medium", dex: 2 },
    equipped: true,
    quantity: 1,
    weight: 55,
    price: { value: 50, denomination: "gp" },
    proficiency: true,
    identifier: "chain-mail",
    properties: { mgc: false },
  },
  description: "<p><em>Medium armor.</em> AC 16 + Dex (max 2). Weight 55 lbs.</p>",
};

// Feat: Turn Undead (Cleric)
const turnUndead = {
  name: "Turn Undead",
  type: "feat",
  systemData: {
    type: { value: "class" },
    activation: { type: "action", cost: 1, condition: "" },
    description: { value: "Each undead creature within 30 feet must make a Wisdom saving throw. On a failed save, the creature is turned for 1 minute or until it takes damage." },
    range: { value: 30, units: "ft" },
  },
  description: "<p><strong>Channel Divinity: Turn Undead.</strong> Each undead creature within 30 feet must make a Wisdom saving throw. On a failed save, the creature is turned for 1 minute or until it takes damage.</p>",
};

// Feat: Divine Intervention (Cleric)
const divineIntervention = {
  name: "Divine Intervention",
  type: "feat",
  systemData: {
    type: { value: "class" },
    activation: { type: "action", cost: 1, condition: "" },
    description: { value: "Call upon your deity. Roll a d100. If the result is 15 or lower, your deity intervenes." },
  },
  description: "<p><strong>Divine Intervention.</strong> Call upon your deity. Roll a d100. If the result is 15 or lower, your deity intervenes.</p>",
};

// Spell: Cure Wounds (Cleric)
const cureWounds = {
  name: "Cure Wounds",
  type: "spell",
  systemData: {
    level: 1,
    school: "trs",
    activation: { type: "action", cost: 1, condition: "" },
    range: { value: "touch", units: "touch" },
    target: { value: 1, units: "", type: "creature" },
    actionType: "heal",
    damage: { parts: [["1d8 + @mod", "healing"]], versatile: "" },
    save: { ability: "", dc: null, scaling: "spell" },
    preparation: { mode: "prepared", prepared: true },
    properties: { vocal: true, somatic: true, material: false },
    materials: { value: "", consumed: false, cost: 0, supply: 0 },
    description: { value: "A creature you touch regains a number of hit points equal to 1d8 + your spellcasting ability modifier." },
    uses: { value: null, max: "", per: "" },
    identifier: "cure-wounds",
  },
  description: "<p><em>Level 1 abjuration.</em> A creature you touch regains 1d8 + WIS HP.</p>",
};

// Spell: Spirit Guardians (Cleric)
const spiritGuardians = {
  name: "Spirit Guardians",
  type: "spell",
  systemData: {
    level: 3,
    school: "abj",
    activation: { type: "action", cost: 1, condition: "" },
    range: { value: 10, units: "ft" },
    target: { value: 10, units: "ft", type: "radius" },
    actionType: "save",
    damage: { parts: [["3d8", "radiant"]], versatile: "" },
    save: { ability: "wis", dc: null, scaling: "spell" },
    preparation: { mode: "prepared", prepared: true },
    properties: { vocal: true, somatic: true, material: false },
    description: { value: "Calling forth spirits, they flit around you to a distance of 10 feet. Hostile creatures that enter or start their turn there take 3d8 radiant damage." },
    duration: { value: 10, units: "minute" },
    identifier: "spirit-guardians",
  },
  description: "<p><em>Level 3 abjuration.</em> Spirits protect you. Hostile creatures in 10 ft take 3d8 radiant (WIS save for half).</p>",
};

// Spell: Guiding Bolt (Cleric)
const guidingBolt = {
  name: "Guiding Bolt",
  type: "spell",
  systemData: {
    level: 1,
    school: "evo",
    activation: { type: "action", cost: 1, condition: "" },
    range: { value: 120, units: "ft" },
    target: { value: 1, units: "", type: "creature" },
    actionType: "rsak",
    damage: { parts: [["4d6", "radiant"]], versatile: "" },
    save: { ability: "", dc: null, scaling: "spell" },
    preparation: { mode: "prepared", prepared: true },
    properties: { vocal: true, somatic: true },
    description: { value: "A flash of light streaks toward a creature. Target takes 4d6 radiant damage. The next attack roll against it has advantage." },
    identifier: "guiding-bolt",
  },
  description: "<p><em>Level 1 evocation.</em> Ranged spell attack, 4d6 radiant. Next attack vs target has advantage.</p>",
};

// ─── Ejecutar ──────────────────────────────────────────────────

// Necesitamos los IDs de los actors. Los buscamos por nombre.
// Como no tenemos un comando "list_actors", usamos execute_batch con
// unsafe.eval... pero está deshabilitado. En su lugar, usamos el
// comando create_actors que ya nos devolvió los IDs.
// Asumimos que el usuario nos pasa los IDs o los obtenemos del test anterior.

// Para ser robustos, vamos a crear actors nuevos y poblarlos.
console.log("\n=== Creando encounter completo con items ===\n");

const actors = [
  { name: "Orco Berserker", type: "npc", systemData: {
    details: { type: { value: "humanoid", subtype: "orc" }, cr: 0.5, alignment: "Chaotic Evil" },
    attributes: { ac: { value: 13 }, hp: { value: 15, max: 15, formula: "2d8 + 5" }, movement: { walk: 30 } },
    abilities: { str: { value: 16, proficient: 0 }, dex: { value: 12, proficient: 0 }, con: { value: 16, proficient: 0 }, int: { value: 7, proficient: 0 }, wis: { value: 11, proficient: 0 }, cha: { value: 10, proficient: 0 } },
  }},
  { name: "Orco Guardia", type: "npc", systemData: {
    details: { type: { value: "humanoid", subtype: "orc" }, cr: 0.5, alignment: "Chaotic Evil" },
    attributes: { ac: { value: 13 }, hp: { value: 15, max: 15, formula: "2d8 + 5" }, movement: { walk: 30 } },
    abilities: { str: { value: 16, proficient: 0 }, dex: { value: 12, proficient: 0 }, con: { value: 16, proficient: 0 }, int: { value: 7, proficient: 0 }, wis: { value: 11, proficient: 0 }, cha: { value: 10, proficient: 0 } },
  }},
  { name: "Orco Chaman", type: "npc", systemData: {
    details: { type: { value: "humanoid", subtype: "orc" }, cr: 0.5, alignment: "Chaotic Evil" },
    attributes: { ac: { value: 13 }, hp: { value: 15, max: 15, formula: "2d8 + 5" }, movement: { walk: 30 } },
    abilities: { str: { value: 16, proficient: 0 }, dex: { value: 12, proficient: 0 }, con: { value: 16, proficient: 0 }, int: { value: 7, proficient: 0 }, wis: { value: 11, proficient: 0 }, cha: { value: 10, proficient: 0 } },
  }},
  { name: "Clerigo de Zenterra (Nv 5)", type: "npc", systemData: {
    details: { type: { value: "humanoid", subtype: "" }, cr: 3, alignment: "Lawful Good" },
    attributes: { ac: { value: 18 }, hp: { value: 27, max: 27, formula: "5d8 + 5" }, movement: { walk: 30 } },
    abilities: { str: { value: 14, proficient: 0 }, dex: { value: 10, proficient: 0 }, con: { value: 12, proficient: 0 }, int: { value: 10, proficient: 0 }, wis: { value: 16, proficient: 0 }, cha: { value: 12, proficient: 0 } },
  }},
];

const createResult = await sendCommand("create_actors", { actors });
console.log("✅ Actors creados:");
const actorIds = {};
for (const a of createResult.actors) {
  console.log(`   ${a.id} — ${a.name}`);
  if (a.name.includes("Berserker")) actorIds.orc1 = a.id;
  else if (a.name.includes("Guardia")) actorIds.orc2 = a.id;
  else if (a.name.includes("Chaman")) actorIds.orc3 = a.id;
  else if (a.name.includes("Clerigo")) actorIds.cleric = a.id;
}

// ─── Poblar orcos con armas y traits ───────────────────────────
console.log("\n=== Poblando orcos con armas y traits ===\n");

const orcItems = [];
for (const orcId of [actorIds.orc1, actorIds.orc2, actorIds.orc3]) {
  // Greataxe
  orcItems.push({ actorId: orcId, ...greataxe });
  // Aggressive trait
  orcItems.push({ actorId: orcId, ...aggressiveTrait });
  // Primal Intuition
  orcItems.push({ actorId: orcId, ...primalIntuition });
}

const orcItemsResult = await sendCommand("add_items", { items: orcItems });
console.log(`✅ ${orcItemsResult.results.length} items añadidos a orcos`);
for (const r of orcItemsResult.results) {
  console.log(`   ${r.name} (${r.type}) → actor ${r.actorId.slice(0, 8)}`);
}

// ─── Poblar clérigo con armas, equipo, hechizos y feats ────────
console.log("\n=== Poblando clérigo con equipo completo ===\n");

const clericItems = [
  { actorId: actorIds.cleric, ...mace },
  { actorId: actorIds.cleric, ...shield },
  { actorId: actorIds.cleric, ...chainMail },
  { actorId: actorIds.cleric, ...turnUndead },
  { actorId: actorIds.cleric, ...divineIntervention },
  { actorId: actorIds.cleric, ...cureWounds },
  { actorId: actorIds.cleric, ...guidingBolt },
  { actorId: actorIds.cleric, ...spiritGuardians },
];

const clericItemsResult = await sendCommand("add_items", { items: clericItems });
console.log(`✅ ${clericItemsResult.results.length} items añadidos al clérigo`);
for (const r of clericItemsResult.results) {
  console.log(`   ${r.name} (${r.type})`);
}

// ─── Colocar tokens en la escena ───────────────────────────────
console.log("\n=== Colocando tokens en la escena ===\n");

const allActorIds = [actorIds.orc1, actorIds.orc2, actorIds.orc3, actorIds.cleric];
const tokens = allActorIds.map((actorId, i) => ({
  actorId,
  x: 800 + (i % 4) * 200,
  y: 500 + Math.floor(i / 4) * 200,
}));

const placeResult = await sendCommand("place_tokens", { tokens });
console.log(`✅ ${placeResult.tokenIds.length} tokens colocados en escena ${placeResult.sceneId}`);

// ─── Resumen ───────────────────────────────────────────────────
console.log("\n=== ENCOUNTER COMPLETO ===\n");
console.log("Orcos (3):");
console.log("  • Greataxe (1d12+STR slashing, melee, reach 5ft)");
console.log("  • Aggressive (bonus action: dash toward enemy)");
console.log("  • Primal Intuition (+prof to Intimidation)");
console.log();
console.log("Clérigo Nv 5:");
console.log("  • Mace (1d6+STR bludgeoning)");
console.log("  • Chain Mail (AC 16+Dex2) + Shield (+2 AC) = AC 18");
console.log("  • Turn Undead (Channel Divinity)");
console.log("  • Divine Intervention");
console.log("  • Cure Wounds (1st level, 1d8+WIS healing)");
console.log("  • Guiding Bolt (1st level, 4d6 radiant, ranged)");
console.log("  • Spirit Guardians (3rd level, 3d8 radiant, 10ft aura)");
