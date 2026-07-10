/**
 * Script standalone para ejecutar la ingesta.
 * Uso: node ingest/run-ingest.mjs
 */

import { runIngest } from "./ingest.mjs";

try {
  const total = await runIngest({
    modules: ["sequencer", "tagger", "midi-qol"],
  });
  console.log(`\n✅ Ingesta completa: ${total} documentos indexados.`);
  process.exit(0);
} catch (err) {
  console.error("\n❌ Error en ingesta:", err);
  process.exit(1);
}
