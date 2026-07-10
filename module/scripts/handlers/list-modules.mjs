/**
 * Listar módulos activos — devuelve los módulos y sistemas activos.
 * PI usa esto para saber qué APIs de terceros están disponibles
 * (Sequencer, Tagger, MidiQOL, etc.) antes de generar código que las use.
 */
export async function listActiveModules() {
  const modules = Array.from(game.modules.values())
    .filter((m) => m.active)
    .map((m) => ({
      id: m.id,
      title: m.title,
      version: m.version,
    }));

  return {
    system: { id: game.system.id, title: game.system.title, version: game.system.version },
    modules,
    // Flags de conveniencia para los módulos más comunes
    hasSequencer: !!globalThis.Sequencer,
    hasTagger: !!game.modules.get("tagger")?.active,
    hasMidiQOL: !!game.modules.get("midi-qol")?.active,
    hasDAE: !!game.modules.get("dae")?.active,
  };
}
