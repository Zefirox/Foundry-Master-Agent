#!/bin/bash
# install.sh — Instalador un solo comando para PI-Foundry
#
# Uso:
#   ./install.sh --foundry-dir /root/foundryuserdata --world astralis-legacy
#   ./install.sh --foundry-dir /root/foundryuserdata --world my-world --force
#
# Pasos:
# 1. Verificar dependencias del sistema
# 2. Verificar versiones de Foundry y dnd5e
# 3. Generar secret HMAC
# 4. Instalar dependencias npm (relay, rag)
# 5. Symlinkar módulo en Foundry
# 6. Symlinkar extensión en PI
# 7. Instalar skill en PI
# 8. Copiar systemd services
# 9. Configurar Caddy (si existe)
# 10. Analizar módulos desplegados
# 11. Ingestar knowledge + API en RAG
# 12. Verificar todo

set -euo pipefail

# ─── Defaults ─────────────────────────────────────────────────
FOUNDRY_DIR=""
WORLD=""
FORCE=false
PI_DIR="${HOME}/.pi/agent"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# ─── Parse args ───────────────────────────────────────────────
for arg in "$@"; do
  case "$arg" in
    --foundry-dir=*) FOUNDRY_DIR="${arg#*=}" ;;
    --world=*)       WORLD="${arg#*=}" ;;
    --force)         FORCE=true ;;
    --help|-h)
      echo "Uso: $0 --foundry-dir /path/to/foundryuserdata --world my-world [--force]"
      exit 0
      ;;
  esac
done

if [ -z "$FOUNDRY_DIR" ] || [ -z "$WORLD" ]; then
  echo "❌ Faltan argumentos requeridos."
  echo "Uso: $0 --foundry-dir /path/to/foundryuserdata --world my-world [--force]"
  exit 1
fi

# ─── Versiones soportadas ─────────────────────────────────────
SUPPORTED_FOUNDRY="13.351"
SUPPORTED_DND5E="5.3.2"

echo "╔══════════════════════════════════════════════════╗"
echo "║     PI-Foundry Installer                          ║"
echo "╚══════════════════════════════════════════════════╝"
echo

# ─── 1. Verificar dependencias del sistema ────────────────────
echo "=== Paso 1: Verificando dependencias del sistema ==="

check_cmd() {
  if ! command -v "$1" &>/dev/null; then
    echo "  ❌ $1 no encontrado. Instálalo e inténtalo de nuevo."
    exit 1
  fi
  echo "  ✅ $1"
}

check_cmd node
check_cmd npm
check_cmd curl

NODE_MAJOR=$(node -v | sed 's/v\([0-9]*\).*/\1/')
if [ "$NODE_MAJOR" -lt 20 ]; then
  echo "  ❌ Node.js 20+ requerido (actual: $(node -v))"
  exit 1
fi
echo "  ✅ Node.js $(node -v)"
echo

# ─── 2. Verificar versiones ──────────────────────────────────
echo "=== Paso 2: Verificando versiones ==="

# Foundry version
FOUNDRY_PKG="$FOUNDRY_DIR/../resources/app/package.json"
if [ ! -f "$FOUNDRY_PKG" ]; then
  # Try alternative path
  FOUNDRY_PKG="/root/foundry/resources/app/package.json"
fi
if [ -f "$FOUNDRY_PKG" ]; then
  FOUNDRY_VER=$(python3 -c "import json; print(json.load(open('$FOUNDRY_PKG'))['version'])" 2>/dev/null || echo "unknown")
else
  FOUNDRY_VER="unknown"
fi

# dnd5e version
DND5E_JSON="$FOUNDRY_DIR/Data/systems/dnd5e/system.json"
if [ -f "$DND5E_JSON" ]; then
  DND5E_VER=$(python3 -c "import json; print(json.load(open('$DND5E_JSON'))['version'])" 2>/dev/null || echo "unknown")
else
  DND5E_VER="unknown"
fi

echo "  FoundryVTT:  detectado $FOUNDRY_VER | requerido $SUPPORTED_FOUNDRY"
echo "  dnd5e:       detectado $DND5E_VER | requerido $SUPPORTED_DND5E"

if [ "$FORCE" = false ]; then
  if [ "$FOUNDRY_VER" != "$SUPPORTED_FOUNDRY" ]; then
    echo
    echo "❌ Versión de Foundry incompatible."
    echo "   Requerido: $SUPPORTED_FOUNDRY | Detectado: $FOUNDRY_VER"
    echo "   Usa --force para instalar bajo tu responsabilidad."
    exit 1
  fi
  if [ "$DND5E_VER" != "$SUPPORTED_DND5E" ]; then
    echo
    echo "❌ Versión de dnd5e incompatible."
    echo "   Requerido: $SUPPORTED_DND5E | Detectado: $DND5E_VER"
    echo "   Usa --force para instalar bajo tu responsabilidad."
    exit 1
  fi
else
  echo "  ⚠️  --force: instalando sin verificar versiones"
fi
echo

# ─── 3. Generar secret ───────────────────────────────────────
echo "=== Paso 3: Generando secret HMAC ==="
SECRET_FILE="$PROJECT_DIR/.secret"
if [ -f "$SECRET_FILE" ]; then
  echo "  ℹ️  Secret ya existe, manteniendo."
else
  openssl rand -hex 32 > "$SECRET_FILE"
  chmod 600 "$SECRET_FILE"
  echo "  ✅ Secret generado: $SECRET_FILE"
fi
echo

# ─── 4. Instalar dependencias npm ────────────────────────────
echo "=== Paso 4: Instalando dependencias npm ==="

echo "  [relay] npm install..."
(cd "$PROJECT_DIR/relay" && npm install --silent 2>/dev/null) && echo "  ✅ relay" || echo "  ⚠️  relay (posible error)"

echo "  [rag] npm install..."
(cd "$PROJECT_DIR/rag" && npm install --silent 2>/dev/null) && echo "  ✅ rag" || echo "  ⚠️  rag (posible error)"

echo "  [extension] npm install..."
(cd "$PROJECT_DIR/extension" && npm install --silent 2>/dev/null) && echo "  ✅ extension" || echo "  ⚠️  extension (posible error)"
echo

# ─── 5. Symlinkar módulo en Foundry ──────────────────────────
echo "=== Paso 5: Instalando módulo pi-bridge en Foundry ==="
MODULE_TARGET="$FOUNDRY_DIR/Data/modules/pi-bridge"
if [ -L "$MODULE_TARGET" ] || [ -d "$MODULE_TARGET" ]; then
  rm -f "$MODULE_TARGET"
fi
ln -s "$PROJECT_DIR/module" "$MODULE_TARGET"
echo "  ✅ $MODULE_TARGET → $PROJECT_DIR/module"
echo

# ─── 6. Symlinkar extensión en PI ────────────────────────────
echo "=== Paso 6: Instalando extensión en PI ==="
EXT_TARGET="$PI_DIR/extensions/pi-foundry"
if [ -L "$EXT_TARGET" ] || [ -d "$EXT_TARGET" ]; then
  rm -f "$EXT_TARGET"
fi
mkdir -p "$PI_DIR/extensions"
ln -s "$PROJECT_DIR/extension" "$EXT_TARGET"
echo "  ✅ $EXT_TARGET → $PROJECT_DIR/extension"
echo

# ─── 7. Instalar skill en PI ─────────────────────────────────
echo "=== Paso 7: Instalando skill en PI ==="
SKILL_TARGET="$PI_DIR/skills/foundry-encounter"
if [ -L "$SKILL_TARGET" ] || [ -d "$SKILL_TARGET" ]; then
  rm -rf "$SKILL_TARGET"
fi
mkdir -p "$PI_DIR/skills"
ln -s "$PROJECT_DIR/skill/foundry-encounter" "$SKILL_TARGET"
echo "  ✅ $SKILL_TARGET → $PROJECT_DIR/skill/foundry-encounter"
echo

# ─── 8. Copiar systemd services ──────────────────────────────
echo "=== Paso 8: Instalando servicios systemd ==="

install_service() {
  local service_file="$1"
  local service_name=$(basename "$service_file")
  local target="/etc/systemd/system/$service_name"

  # Update paths in service file
  sed "s|/root/pi-foundry|$PROJECT_DIR|g" "$service_file" > "$target"
  systemctl daemon-reload
  systemctl enable "$service_name"
  systemctl restart "$service_name"
  echo "  ✅ $service_name"
}

install_service "$PROJECT_DIR/relay/pi-bridge-relay.service"
install_service "$PROJECT_DIR/rag/pi-rag.service"
echo

# ─── 9. Configurar Caddy (si existe) ─────────────────────────
echo "=== Paso 9: Configurando Caddy ==="
if command -v caddy &>/dev/null; then
  echo "  ℹ️  Caddy detectado. Revisa manualmente /etc/caddy/Caddyfile"
  echo "  Ver config/Caddyfile.example para referencia"
else
  echo "  ℹ️  Caddy no detectado. Saltando."
fi
echo

# ─── 10. Analizar módulos desplegados ────────────────────────
echo "=== Paso 10: Analizando módulos desplegados ==="
node "$PROJECT_DIR/scripts/analyze-modules.mjs" \
  --foundry-dir="$FOUNDRY_DIR" \
  --output="$PROJECT_DIR/knowledge/analyzed" \
  --curated="$PROJECT_DIR/knowledge" 2>&1 | tail -5
echo

# ─── 11. Ingestar knowledge + API en RAG ─────────────────────
echo "=== Paso 11: Ingestando knowledge en RAG ==="
# The RAG service will pick up knowledge files on next ingest
# Trigger ingest via API
curl -s -X POST "http://127.0.0.1:7402/ingest" \
  -H "content-type: application/json" \
  -d "{\"foundryDir\": \"$FOUNDRY_DIR\", \"knowledgeDir\": \"$PROJECT_DIR/knowledge\"}" \
  && echo "  ✅ Ingesta iniciada" || echo "  ⚠️  No se pudo iniciar ingesta (¿RAG service corriendo?)"
echo

# ─── 12. Verificar ───────────────────────────────────────────
echo "=== Paso 12: Verificando instalación ==="

check_service() {
  if systemctl is-active --quiet "$1" 2>/dev/null; then
    echo "  ✅ $1: activo"
  else
    echo "  ❌ $1: inactivo"
  fi
}

check_service "pi-bridge-relay"
check_service "pi-rag"

# Check relay health
if curl -s "http://127.0.0.1:7401/health" &>/dev/null; then
  echo "  ✅ Relay health check: OK"
else
  echo "  ❌ Relay health check: FAIL"
fi

# Check RAG health
if curl -s "http://127.0.0.1:7402/health" &>/dev/null; then
  echo "  ✅ RAG health check: OK"
else
  echo "  ❌ RAG health check: FAIL"
fi

echo
echo "╔══════════════════════════════════════════════════╗"
echo "║  ✅ Instalación completa                          ║"
echo "║                                                    ║"
echo "║  Próximos pasos:                                   ║"
echo "║  1. Abre FoundryVTT en el navegador                ║"
echo "║  2. Activa el módulo 'pi-bridge' en Manage Modules ║"
echo "║  3. Recarga la página (F5)                         ║"
echo "║  4. Pídele a PI: \"Crea un encuentro con orcos\"   ║"
echo "╚══════════════════════════════════════════════════╝"
