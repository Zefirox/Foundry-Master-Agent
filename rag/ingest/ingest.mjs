/**
 * Ingesta de Foundry V13 — parsea foundry.mjs (JSDoc) → chunks → embed → store
 */

import { readFile } from "node:fs/promises";
import { chunkSource } from "../lib/chunker.mjs";
import { embedBatch, getEmbedDim } from "../lib/embed.mjs";
import { insertChunks, dropTable, count } from "../lib/store.mjs";

const FOUNDRY_MJS = "/root/foundry/resources/app/public/scripts/foundry.mjs";
const FOUNDRY_VERSION = "13.351";

/**
 * Ingesta la API core de Foundry.
 */
export async function ingestFoundry() {
  console.log("[ingest] === Foundry Core API ===");
  console.log("[ingest] Leyendo foundry.mjs ...");

  const source = await readFile(FOUNDRY_MJS, "utf8");
  console.log(`[ingest] Source: ${(source.length / 1024 / 1024).toFixed(1)} MB`);

  const chunks = chunkSource(source, {
    module: "core",
    sourceFile: "foundry.mjs",
    filePath: "public/scripts/foundry.mjs",
  });

  console.log(`[ingest] Chunks extraídos: ${chunks.length}`);

  // Filtrar chunks con descripción sustancial (>= 10 chars)
  const meaningful = chunks.filter((c) => c.description && c.description.length >= 10);
  console.log(`[ingest] Chunks con descripción sustancial: ${meaningful.length}`);

  return meaningful;
}

/**
 * Ingesta un módulo de terceros (Sequencer, Tagger, MidiQOL, etc.)
 */
export async function ingestModule(moduleId) {
  const modulePath = `/root/foundryuserdata/Data/modules/${moduleId}`;
  console.log(`[ingest] === Módulo: ${moduleId} ===`);

  const { glob } = await import("node:fs/promises");
  const { execSync } = await import("node:child_process");

  // Encontrar archivos JS/MJS del módulo
  let files;
  try {
    files = execSync(`find ${modulePath} -name "*.js" -o -name "*.mjs" | head -50`, { encoding: "utf8" })
      .trim()
      .split("\n")
      .filter(Boolean);
  } catch {
    console.log(`[ingest] No se encontraron archivos para ${moduleId}`);
    return [];
  }

  const allChunks = [];
  for (const file of files) {
    try {
      const source = await readFile(file, "utf8");
      const chunks = chunkSource(source, {
        module: moduleId,
        sourceFile: file.replace(modulePath + "/", ""),
        filePath: file,
      });
      const meaningful = chunks.filter((c) => c.description && c.description.length >= 10);
      allChunks.push(...meaningful);
    } catch {
      // skip binary/unreadable files
    }
  }

  console.log(`[ingest] ${moduleId}: ${allChunks.length} chunks`);
  return allChunks;
}

/**
 * Procesa chunks: genera embeddings y los inserta en LanceDB.
 */
async function processChunks(chunks, batchSize = 50) {
  const total = chunks.length;
  console.log(`[ingest] Procesando ${total} chunks en lotes de ${batchSize}...`);

  for (let i = 0; i < total; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize);
    const texts = batch.map((c) => c.text);
    const vectors = await embedBatch(texts);

    const records = batch.map((c, j) => ({
      text: c.text,
      vector: vectors[j],
      symbol: c.symbol,
      kind: c.kind,
      parent: c.parent,
      description: c.description,
      line: c.line,
      source: c.source,
      foundry_version: c.foundry_version,
      module: c.module,
    }));

    await insertChunks(records);
    console.log(`[ingest] Progress: ${Math.min(i + batchSize, total)}/${total}`);
  }
}

/**
 * Pipeline completo de ingesta.
 */
export async function runIngest({ modules = ["sequencer", "tagger", "midi-qol"] } = {}) {
  console.log("[ingest] Iniciando ingesta...");
  await dropTable();

  // 1. Foundry core
  const foundryChunks = await ingestFoundry();

  // 2. Módulos de terceros
  const moduleChunks = [];
  for (const mod of modules) {
    const chunks = await ingestModule(mod);
    moduleChunks.push(...chunks);
  }

  // 3. Combinar y procesar
  const allChunks = [...foundryChunks, ...moduleChunks];
  console.log(`[ingest] Total chunks a procesar: ${allChunks.length}`);

  await processChunks(allChunks);

  const total = await count();
  console.log(`[ingest] Ingesta completa. Total documentos en LanceDB: ${total}`);
  return total;
}
