/**
 * LanceDB Store — almacenamiento vectorial persistente.
 *
 * Tabla "foundry_docs" con columnas:
 *   text (string), vector (fixed-size<float>), symbol, kind, parent,
 *   description, line, source, foundry_version, module
 */

import lancedb from "@lancedb/lancedb";

const DB_PATH = process.env.RAG_LANCEDB_PATH ?? "/root/pi-foundry/rag/data/lancedb";
const TABLE_NAME = "foundry_docs";

let db = null;
let table = null;

/**
 * Abre (o crea) la conexión a LanceDB.
 */
export async function getDB() {
  if (db) return db;
  db = await lancedb.connect(DB_PATH);
  return db;
}

/**
 * Abre la tabla de documentos existente.
 */
export async function getTable() {
  if (table) return table;
  const db = await getDB();
  const tableNames = await db.tableNames();
  if (tableNames.includes(TABLE_NAME)) {
    table = await db.openTable(TABLE_NAME);
    console.log(`[rag] Tabla "${TABLE_NAME}" abierta.`);
    return table;
  }
  return null;
}

/**
 * Crea la tabla con el primer lote de datos (LanceDB infiere el schema).
 */
export async function createTableWith(firstRecords) {
  const db = await getDB();
  table = await db.createTable(TABLE_NAME, firstRecords);
  console.log(`[rag] Tabla "${TABLE_NAME}" creada con ${firstRecords.length} registros.`);
  return table;
}

/**
 * Inserta chunks con sus embeddings.
 * Si la tabla no existe, la crea con el primer lote (schema inferido).
 */
export async function insertChunks(records) {
  let tbl = await getTable();
  if (!tbl) {
    tbl = await createTableWith(records);
    return;
  }
  await tbl.add(records);
  console.log(`[rag] Insertados ${records.length} chunks.`);
}

/**
 * Búsqueda semántica.
 * @param {number[]} queryVector
 * @param {object} filters - { foundry_version?, module?, limit? }
 * @returns {Array<{text, symbol, kind, parent, description, line, source, foundry_version, module, _distance}>}
 */
export async function search(queryVector, { foundry_version, module, limit = 5 } = {}) {
  const table = await getTable();
  if (!table) throw new Error("Índice no construido. Ejecuta la ingesta primero.");

  let query = table.search(queryVector).limit(limit * 3); // over-fetch para filtrar

  // LanceDB v0.5+ usa .where() para filtros SQL
  const conditions = [];
  if (foundry_version) conditions.push(`foundry_version = '${foundry_version}'`);
  if (module) conditions.push(`module = '${module}'`);
  if (conditions.length > 0) {
    query = query.where(conditions.join(" AND "));
  }

  const results = await query.limit(limit).toArray();

  return results.map((r) => ({
    text: r.text,
    symbol: r.symbol,
    kind: r.kind,
    parent: r.parent,
    description: r.description,
    line: r.line,
    source: r.source,
    foundry_version: r.foundry_version,
    module: r.module,
    score: r._distance,
  }));
}

/**
 * Cuenta total de documentos.
 */
export async function count() {
  const table = await getTable();
  if (!table) return 0;
  return await table.countRows();
}

/**
 * Elimina y recrea la tabla (para re-ingesta limpia).
 */
export async function dropTable() {
  const db = await getDB();
  const tableNames = await db.tableNames();
  if (tableNames.includes(TABLE_NAME)) {
    await db.dropTable(TABLE_NAME);
    console.log(`[rag] Tabla "${TABLE_NAME}" eliminada.`);
  }
  table = null;
}
