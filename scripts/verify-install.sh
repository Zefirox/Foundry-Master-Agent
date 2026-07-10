#!/bin/bash
# verify-install.sh — Health check post-instalación
set -euo pipefail

echo "=== PI-Foundry Verification ==="
echo

FAIL=0

# System services
for svc in pi-bridge-relay pi-rag; do
  if systemctl is-active --quiet "$svc" 2>/dev/null; then
    echo "  ✅ $svc: active"
  else
    echo "  ❌ $svc: inactive"
    FAIL=1
  fi
done

# Relay health
echo
if curl -sf "http://127.0.0.1:7401/health" &>/dev/null; then
  echo "  ✅ Relay health: OK"
else
  echo "  ❌ Relay health: FAIL"
  FAIL=1
fi

# RAG health
RAG_HEALTH=$(curl -sf "http://127.0.0.1:7402/health" 2>/dev/null || echo "")
if [ -n "$RAG_HEALTH" ]; then
  DOCS=$(echo "$RAG_HEALTH" | python3 -c "import json,sys; print(json.load(sys.stdin).get('documents',0))" 2>/dev/null || echo "?")
  echo "  ✅ RAG health: OK ($DOCS documents indexed)"
else
  echo "  ❌ RAG health: FAIL"
  FAIL=1
fi

# Foundry
if pgrep -f "foundry" &>/dev/null; then
  echo "  ✅ Foundry: running"
else
  echo "  ⚠️  Foundry: not detected (PM2 or process)"
fi

# Secret
if [ -f "$(dirname "$0")/../.secret" ]; then
  echo "  ✅ Secret: exists"
else
  echo "  ❌ Secret: missing"
  FAIL=1
fi

echo
if [ $FAIL -eq 0 ]; then
  echo "✅ All checks passed!"
else
  echo "❌ Some checks failed. Review above."
fi
exit $FAIL
