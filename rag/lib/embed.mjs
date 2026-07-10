/**
 * Embedding Provider
 *
 * Default: Transformers.js local (all-MiniLM-L6-v2, 384-dim, sin API key)
 * Alternativa: OpenAI API (si OPENAI_API_KEY está set)
 *
 * Config via env:
 *   RAG_EMBED_PROVIDER = "local" | "openai"  (default: "local")
 *   OPENAI_API_KEY                          (si provider=openai)
 *   RAG_EMBED_MODEL                         (default: auto)
 */

import { pipeline } from "@huggingface/transformers";

const PROVIDER = process.env.RAG_EMBED_PROVIDER ?? "local";
const LOCAL_MODEL = "Xenova/all-MiniLM-L6-v2";
const OPENAI_MODEL = process.env.RAG_EMBED_MODEL ?? "text-embedding-3-small";
const OPENAI_URL = process.env.RAG_EMBED_API_URL ?? "https://api.openai.com/v1";

let localPipeline = null;
let localPipelinePromise = null;
let embedDim = null;

/**
 * Inicializa el pipeline de embedding local (lazy, una sola vez, race-safe).
 */
async function getLocalPipeline() {
  if (localPipeline) return localPipeline;
  if (localPipelinePromise) return localPipelinePromise;
  localPipelinePromise = (async () => {
    console.log(`[rag] Cargando modelo de embedding local: ${LOCAL_MODEL} ...`);
    localPipeline = await pipeline("feature-extraction", LOCAL_MODEL, { device: "cpu" });
    embedDim = 384;
    console.log(`[rag] Modelo cargado. Dimensión: ${embedDim}`);
    return localPipeline;
  })();
  return localPipelinePromise;
}

/**
 * Genera embedding para un texto usando Transformers.js local.
 */
async function embedLocal(text) {
  const pipe = await getLocalPipeline();
  const output = await pipe(text, { pooling: "mean", normalize: true });
  return Array.from(output.data);
}

/**
 * Genera embedding para un texto usando OpenAI API.
 */
async function embedOpenAI(text) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OPENAI_API_KEY no configurada");

  const res = await fetch(`${OPENAI_URL}/embeddings`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({ model: OPENAI_MODEL, input: text }),
  });

  if (!res.ok) throw new Error(`OpenAI error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  if (!embedDim) embedDim = data.data[0].embedding.length;
  return data.data[0].embedding;
}

/**
 * Embedding público — despacha al provider configurado.
 */
export async function embed(text) {
  if (PROVIDER === "openai") return embedOpenAI(text);
  return embedLocal(text);
}

/**
 * Embedding batch — procesa múltiples textos eficientemente.
 */
export async function embedBatch(texts, batchSize = 32) {
  const all = [];
  for (let i = 0; i < texts.length; i += batchSize) {
    const batch = texts.slice(i, i + batchSize);
    const embeddings = await Promise.all(batch.map((t) => embed(t)));
    all.push(...embeddings);
    if (i + batchSize < texts.length) {
      console.log(`[rag] Embedding progress: ${i + batchSize}/${texts.length}`);
    }
  }
  return all;
}

/**
 * Retorna la dimensión del embedding.
 */
export async function getEmbedDim() {
  if (embedDim) return embedDim;
  const sample = await embed("test");
  embedDim = sample.length;
  return embedDim;
}
