# Roadmap — PI-Foundry

## v0.1 (actual — liberada)

- ✅ Bridge: Relay (HTTP+WS), Foundry module (browser), PI extension (4 tools)
- ✅ RAG: LanceDB + Transformers.js local embeddings (384-dim)
- ✅ 14 handlers tipados (create_actors, plutonium_import, play_animation, etc.)
- ✅ Auto-learning: sync_modules, analyze_module, index_knowledge
- ✅ 12 knowledge files curados (MidiQOL, Sequencer, JB2A, DAE, etc.)
- ✅ Module analysis script (static analysis batch)
- ✅ Install scripts (Linux + Windows)
- ✅ Skill con Boot Protocol + Learning Protocol

---

## v0.2 — GraphRAG integration (Graphify + RAG)

### Objetivo

Combinar entendimiento estructural (Graphify) con búsqueda semántica (RAG)
para que el agente tenga tanto el mapa de relaciones como la búsqueda
por significado.

### Componentes nuevos

#### 1. Graphify sobre módulos de Foundry

```
graphify /path/to/foundryuserdata/Data/modules/ --mode deep
```

- AST extraction de todos los bundles JS (sin LLM, gratis)
- Community detection agrupa funcionalidad relacionada
- God nodes identifican clases críticas (ej: Workflow en MidiQOL)
- Surprising connections detectan dependencias cross-module
- Output: `graphify-out/graph.json` + `GRAPH_REPORT.md`

#### 2. Graphify sobre knowledge/ curado

```
graphify pi-foundry/knowledge/ --mode deep
```

- Grafo de los 12 archivos curados
- Detecta relaciones entre conceptos documentados
- Ej: "Sequencer.effect() se relaciona con JB2A assets"

#### 3. Nueva tool: `foundry_query_graph`

PI extension registra una 5ª tool:

```typescript
pi.registerTool({
  name: "foundry_query_graph",
  description: "Structural query over Foundry modules knowledge graph (Graphify)",
  parameters: Type.Object({
    query: Type.String(),        // pregunta natural
    mode: Type.Optional(Type.Union([
      Type.Literal("bfs"),       // broad traversal
      Type.Literal("dfs"),       // deep path tracing
    ])),
    budget: Type.Optional(Type.Number()),  // max tokens
  }),
  // → llama a `graphify query "<query>"` via bash
});
```

#### 4. Graphify `--watch` sobre modules/

Auto-rebuild del grafo cuando el usuario instala/actualiza módulos.
Se integra con el Learning Protocol:

```
sync_modules detecta módulo nuevo
  → analyze_module extrae API surface (igual que antes)
  → Graphify --update reconstruye el grafo incrementalmente
  → Agent consulta el grafo para entender relaciones estructurales
  → index_knowledge persiste en RAG (igual que antes)
```

#### 5. Boot Protocol actualizado

```
1. foundry_ping
2. foundry_list_modules
3. foundry_execute("sync_modules")
4. foundry_query_graph("What are the god nodes and communities?")  ← NUEVO
5. Para módulos desconocidos: Learning Protocol + Graphify --update
6. foundry_search_docs para cada módulo (RAG semántico)
```

### Flujo del agente con GraphRAG

```
Usuario: "Crea un encuentro con animaciones de fireball"

Agente:
  1. foundry_search_docs("Sequencer fireball animation")     → RAG semántico
     → devuelve texto: "new Sequence().effect().file(...)"
  
  2. foundry_query_graph("What calls Sequencer.effect()?")    → Graphify estructural
     → devuelve: Automated Animations → Sequencer.effect()
     → devuelve: JB2A → file assets usados por Sequencer
  
  3. foundry_search_docs("JB2A fireball asset path")         → RAG semántico
     → devuelve: "Library/3rd_Level/Fireball/"
  
  4. foundry_execute("play_animation", { ... })              → ejecución
```

### Problemas a resolver

| Problema | Solución propuesta |
|---|---|
| Bundles JS minificados pueden no parsear bien | Testear con MidiQOL (1.7MB). Si falla, usar `--mode deep` o pre-process con prettier |
| Graphify es Python, RAG es Node.js | Servicios separados, cada uno en su proceso. Graphify via CLI/bash |
| Costo de tokens (semantic extraction) | AST extraction de código es gratis (sin LLM). Solo docs/papers usan LLM |
| Grafo grande (38 módulos) | Graphify tiene community detection + aggregación para >5000 nodos |
| Mantener grafo actualizado | `--update` incremental + `--watch` auto-rebuild |

### Archivos nuevos/modificados

| Archivo | Acción |
|---|---|
| `extension/index.ts` | Añadir tool `foundry_query_graph` |
| `scripts/build-graph.sh` | Script que corre Graphify sobre modules/ y knowledge/ |
| `scripts/watch-graph.sh` | Script con `--watch` para auto-rebuild |
| `skill/foundry-encounter/SKILL.md` | Actualizar Boot Protocol con Graphify query |
| `knowledge/graphify-integration.md` | Documentar cómo usar el grafo estructural |
| `INSTALL.md` | Añadir prerrequisito: Graphify instalado |
| `INSTALL-WINDOWS.md` | Mismo para Windows |

### Dependencias nuevas

- `graphify` (Python): `uv tool install graphifyy` o `pip install graphifyy`
- Opcional: `GEMINI_API_KEY` para semantic extraction de docs (no requerido para código)

---

## v0.3 — Handlers adicionales (futuro)

- `create_scene`: crear escenas con tiles, walls, lighting
- `create_tile`: colocar tiles con triggers (Monk's Active Tiles)
- `tag_tokens`: etiquetar tokens via Tagger
- `roll_attack`: ejecutar ataque via MidiQOL workflow
- `apply_effect`: aplicar Active Effect via DAE
- `create_macro`: crear macros de Foundry programáticamente
- `play_sound`: reproducir sonido via PSFX o Sequencer

---

## v0.4 — Multi-world & multi-GM (futuro)

- Routing por worldId en relay
- Soporte múltiples GMs conectados simultáneamente
- Aislamiento de knowledge por world

---

## v0.5 — Re-indexing pipeline (futuro)

- Webhook/watcher sobre Foundry docs directory
- Auto-reingesta cuando Foundry actualiza
- Version detection: re-indexar solo si la versión cambió
