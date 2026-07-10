/**
 * PI Bridge — Handlers
 * Cada handler ejecuta una operación específica de la API de FoundryVTT
 * en el contexto del cliente GM. Recibe args ya validados por el router.
 */

import { ping } from "./ping.mjs";
import { listActiveModules } from "./list-modules.mjs";
import { createActors } from "./create-actors.mjs";
import { placeTokens } from "./place-tokens.mjs";
import { createJournal } from "./create-journal.mjs";
import { runMacro } from "./run-macro.mjs";
import { updateScene } from "./update-scene.mjs";
import { executeBatch } from "./execute-batch.mjs";
import { unsafeEval } from "./unsafe-eval.mjs";
import { addItems } from "./add-items.mjs";
import { plutoniumImport } from "./plutonium-import.mjs";
import { syncModules } from "./sync-modules.mjs";
import { analyzeModule } from "./analyze-module.mjs";
import { indexKnowledge } from "./index-knowledge.mjs";

export const handlers = {
  ping,
  list_active_modules: listActiveModules,
  create_actors: createActors,
  place_tokens: placeTokens,
  create_journal: createJournal,
  run_macro: runMacro,
  update_scene: updateScene,
  execute_batch: executeBatch,
  add_items: addItems,
  plutonium_import: plutoniumImport,
  sync_modules: syncModules,
  analyze_module: analyzeModule,
  index_knowledge: indexKnowledge,
  "unsafe.eval": unsafeEval,
};
