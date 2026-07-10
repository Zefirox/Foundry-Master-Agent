#!/bin/bash
# generate-secret.sh — Genera el secret HMAC compartido
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
SECRET_FILE="$PROJECT_DIR/.secret"

if [ -f "$SECRET_FILE" ]; then
  echo "⚠️  Secret ya existe en $SECRET_FILE"
  read -p "¿Sobrescribir? (y/N) " -n 1 -r
  echo
  [[ ! $REPLY =~ ^[Yy]$ ]] && exit 0
fi

openssl rand -hex 32 > "$SECRET_FILE"
chmod 600 "$SECRET_FILE"
echo "✅ Secret generado: $SECRET_FILE"
echo "   (32 bytes hex, permisos 600)"
