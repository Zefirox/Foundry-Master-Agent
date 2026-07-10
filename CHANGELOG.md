# Changelog

## [0.2.0] — 2026-07-10

### Added
- **Auto-learning system**: `sync_modules`, `analyze_module`, `index_knowledge` handlers
- **RAG `/index-document` endpoint**: Index individual documents at runtime
- **Knowledge base**: 12 curated `.md` files documenting MidiQOL, Sequencer, JB2A, DAE, etc.
- **Module analysis script**: `scripts/analyze-modules.mjs` for static analysis of deployed modules
- **Install script**: `scripts/install.sh` with version checking and batch analysis
- **Boot/Learning protocol** in SKILL.md for automatic module discovery
- **Plutonium import handler**: Import monsters from 5etools with full stats/actions/items
- Documentation: README.md, INSTALL.md, ARCHITECTURE.md

### Changed
- Relay timeout increased from 30s to 120s (Plutonium imports are slow)
- Extension registered 3 new commands: sync_modules, analyze_module, index_knowledge

## [0.1.0] — 2026-07-09

### Added
- Communication bridge: Relay (HTTP+WS), Foundry module (browser), PI extension (4 tools)
- RAG service: LanceDB index, Transformers.js local embeddings, HTTP API
- Handlers: ping, list_active_modules, create_actors, place_tokens, create_journal, run_macro, update_scene, execute_batch, add_items, unsafe_eval
- PI skill: foundry-encounter
- Caddy reverse proxy on :30000
- HMAC-SHA256 authentication
- Audit logging
