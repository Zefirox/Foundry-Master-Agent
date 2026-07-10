#!/bin/bash
# ingest-knowledge.sh — Indexa knowledge/*.md + API docs en RAG
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
RAG_URL="http://127.0.0.1:7402"

FOUNDRY_DIR="${1:-/root/foundryuserdata}"

echo "=== Ingestando knowledge + API en RAG ==="

# 1. Analizar módulos primero
echo "[1/2] Analizando módulos desplegados..."
node "$PROJECT_DIR/scripts/analyze-modules.mjs" \
  --foundry-dir="$FOUNDRY_DIR" \
  --output="$PROJECT_DIR/knowledge/analyzed" \
  --curated="$PROJECT_DIR/knowledge"

echo
echo "[2/2] Disparando ingesta en RAG service..."
curl -s -X POST "$RAG_URL/ingest" \
  -H "content-type: application/json" \
  -d "{\"foundryDir\": \"$FOUNDRY_DIR\", \"knowledgeDir\": \"$PROJECT_DIR/knowledge\"}"

echo
echo "✅ Ingesta completada. Verifica con:"
echo "   curl $RAG_URL/health"
