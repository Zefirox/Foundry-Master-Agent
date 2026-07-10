# Architecture

## Overview

PI-Foundry is a three-component system that allows an AI agent (PI) to interact
with FoundryVTT through a secure, typed command interface.

```
┌──────────┐    HTTP+HMAC    ┌──────────┐    WebSocket    ┌──────────────┐
│   PI     │ ──────────────→ │  Relay   │ ──────────────→ │  Foundry     │
│  Agent   │                 │ (Node)   │                 │  Module      │
│          │ ←────────────── │ :7401    │ ←────────────── │ (browser)    │
└──────────┘                 └──────────┘                 └──────────────┘
     │                                                          │
     │  HTTP                                                    │
     ▼                                                          ▼
┌──────────┐                                            ┌──────────────┐
│   RAG    │  Transformers.js + LanceDB                 │  FoundryVTT   │
│ Service  │  (embeddings locales, 384-dim)             │  Server       │
│ :7402    │                                            │  :30001       │
└──────────┘                                            └──────────────┘
```

## Components

### 1. PI Extension (`extension/`)

TypeScript extension that registers 4 custom tools in PI:

| Tool | Description |
|---|---|
| `foundry_execute` | Sends typed commands to FoundryVTT via relay |
| `foundry_search_docs` | Semantic search over Foundry API + module docs (RAG) |
| `foundry_ping` | Connectivity test |
| `foundry_list_modules` | List active modules and systems |

The extension talks to the relay via HTTP with HMAC-SHA256 authentication.

### 2. Relay (`relay/`)

Node.js HTTP+WebSocket server that bridges PI and the Foundry module:

- **HTTP endpoint** (`:7401`): Receives commands from PI, validates HMAC signature
- **WebSocket** (`:7401/gm`): Forwards commands to the browser-side Foundry module
- **Pending map**: Tracks in-flight commands, resolves when browser responds
- **Audit log**: All commands logged to `audit.jsonl`

### 3. Foundry Module (`module/`)

Browser-side FoundryVTT module that executes commands:

- **bridge-client.mjs**: WebSocket client, connects to relay, authenticates with shared secret
- **command-router.mjs**: Validates command schema, dispatches to handler
- **handlers/**: 15 typed command handlers:
  - `ping`, `list_active_modules`
  - `create_actors`, `add_items`, `place_tokens`
  - `create_journal`, `update_scene`
  - `run_macro`, `execute_batch`
  - `plutonium_import` (5etools import via Plutonium)
  - `sync_modules`, `analyze_module`, `index_knowledge` (auto-learning)
  - `unsafe_eval` (disabled by default)

### 4. RAG Service (`rag/`)

Node.js HTTP server providing semantic search over Foundry API documentation:

- **Embeddings**: Transformers.js with `all-MiniLM-L6-v2` (384-dim, local, no API key)
- **Vector store**: LanceDB (persistent, on-disk)
- **Endpoints**:
  - `GET /health` — health check
  - `POST /search` — semantic search
  - `POST /ingest` — rebuild index
  - `POST /index-document` — index a single document (for agent-generated knowledge)

### 5. Knowledge Base (`knowledge/`)

Pre-trained knowledge about Foundry modules:

- 12 curated `.md` files documenting MidiQOL, Sequencer, JB2A, DAE, etc.
- Auto-generated `analyzed/*.md` files from static analysis
- Indexed in the RAG for semantic search

### 6. PI Skill (`skill/`)

The `foundry-encounter` skill instructs the agent:

- **Boot Protocol**: Sync modules, learn unknown ones, build mental model
- **Learning Protocol**: Analyze → synthesize → index knowledge for new modules
- **Workflow**: How to create encounters (import → place tokens → journal)

## Data Flow

### Command execution

```
PI agent
  → foundry_execute("create_actors", { actors: [...] })
  → HTTP POST to relay (:7401) with HMAC signature
  → Relay validates signature, forwards via WebSocket
  → Foundry module (browser) receives command
  → command-router validates schema
  → handler executes: game.actors.create(...)
  → Result sent back via WebSocket
  → Relay resolves pending HTTP response
  → PI receives result
```

### Semantic search

```
PI agent
  → foundry_search_docs("create actor with system data")
  → HTTP POST to RAG (:7402)
  → Transformers.js embeds query (384-dim vector)
  → LanceDB vector search (cosine similarity)
  → Top-K results returned
  → PI uses API info to construct correct command
```

### Auto-learning

```
PI agent
  → foundry_execute("sync_modules")
  → Returns { known: [...], unknown: ["new-module"] }
  → For each unknown module:
    → foundry_execute("analyze_module", { moduleId: "new-module" })
    → Returns { globals, hooks, classes, methods, readme }
    → Agent (LLM) synthesizes knowledge markdown
    → foundry_execute("index_knowledge", { module, content })
    → RAG indexes the new knowledge
  → Future sessions: knowledge available via foundry_search_docs
```

## Security

- **HMAC-SHA256**: All relay commands signed with shared secret
- **localhost binding**: Relay and RAG only listen on 127.0.0.1
- **Typed commands**: JSON Schema validation per command, no raw eval
- **Audit log**: All commands logged with timestamp, IP, command type
- **`unsafe.eval` disabled by default**: Escape hatch, requires explicit enable

## Ports

| Service | Port | Binding |
|---|---|---|
| FoundryVTT | 30001 | 0.0.0.0 (or via Caddy) |
| Caddy proxy | 30000 | 0.0.0.0 |
| Relay | 7401 | 127.0.0.1 |
| RAG | 7402 | 127.0.0.1 |
