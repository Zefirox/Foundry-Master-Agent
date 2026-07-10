/**
 * sync_modules — Escanea módulos activos y compara con conocimiento conocido.
 *
 * args: {}
 *
 * Returns: {
 *   known: Array<{ id, title, version }>,
 *   unknown: Array<{ id, title, version }>,
 *   versionMismatches: Array<{ id, title, installed, curated }>,
 * }
 */

// Módulos con conocimiento curado en el repositorio
const CURATED = {
  "midi-qol": "13.0.61",
  "sequencer": "4.0.1",
  "JB2A_DnD5e": "0.8.9",
  "dae": "13.0.27",
  "ActiveAuras": "0.12.7",
  "times-up": "13.1.9",
  "plutonium": "2.15.0",
  "tagger": "1.5.4",
  "autoanimations": "6.8.5",
  "chris-premades": "1.5.27",
};

export async function syncModules() {
  const activeModules = Array.from(game.modules.values()).filter((m) => m.active);

  const known = [];
  const unknown = [];
  const versionMismatches = [];

  for (const m of activeModules) {
    const info = { id: m.id, title: m.title, version: m.version };

    if (CURATED[m.id]) {
      known.push(info);
      if (m.version !== CURATED[m.id]) {
        versionMismatches.push({
          id: m.id,
          title: m.title,
          installed: m.version,
          curated: CURATED[m.id],
        });
      }
    } else {
      // Skip system modules and our own
      if (m.id === "pi-bridge") continue;
      unknown.push(info);
    }
  }

  return { known, unknown, versionMismatches };
}
