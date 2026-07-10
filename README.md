# PI-Foundry: Agente IA para FoundryVTT

Arquitectura que permite a un agente de IA (PI) interactuar nativamente con FoundryVTT V13 para crear contenido on-the-fly: tokens, NPCs, macros, journal entries, animaciones y más.

## ✨ Características

- 🎯 **Importación de monsters** desde 5etools via Plutonium (stats, acciones, traits, items, sprites)
- 🎬 **Animaciones** via Sequencer + JB2A (2104 animaciones profesionales)
- ⚔️ **Automatización de combate** via MidiQOL (hooks, workflow, macros)
- 🧠 **RAG local** sobre la API de Foundry + módulos (búsqueda semántica con embeddings locales)
- 🔄 **Auto-aprendizaje**: el agente detecta módulos nuevos y aprende a usarlos automáticamente
- 🔒 **Seguridad**: localhost binding, HMAC-SHA256 auth, comandos tipados (no raw eval)

## 🚀 Quickstart (5 min)

```bash
# 1. Clonar
git clone https://github.com/tu-usuario/pi-foundry.git
cd pi-foundry

# 2. Instalar
./scripts/install.sh --foundry-dir /path/to/foundryuserdata --world my-world

# 3. Abrir Foundry en el navegador
#    (necesario para ejecución — el agente opera a través del cliente GM)

# 4. Activar módulo 'pi-bridge' en Foundry → Manage Modules → recargar (F5)

# 5. Pídele a PI:
#    "Crea un encuentro con 3 orcos y un clérigo"
```

## 📋 Requisitos

| Componente | Versión |
|---|---|
| FoundryVTT | V13 (build 351) |
| D&D 5e System | 5.3.2 (D&D 2024) |
| Node.js | 20+ (recomendado 24) |
| PI Agent | `@earendil-works/pi-coding-agent` |

### Módulos recomendados (pre-entrenados)

MidiQOL, Sequencer, JB2A, DAE, Active Auras, Times Up, Plutonium, Tagger, Automated Animations, Chris's Premades

## 🏗️ Arquitectura

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

Ver [ARCHITECTURE.md](ARCHITECTURE.md) para detalles.

## 📁 Estructura

```
pi-foundry/
├── relay/          # Bridge HTTP+WS (Node)
├── module/         # Módulo FoundryVTT (browser-side, 15 handlers)
├── extension/      # Extensión PI (4 tools)
├── rag/            # RAG service (embeddings + LanceDB)
├── skill/          # PI skill (foundry-encounter)
├── knowledge/      # Conocimiento pre-entrenado (12 archivos curados)
├── scripts/        # Instalación y mantenimiento
├── config/         # Plantillas de configuración
└── docs/           # Documentación
```

## 🧠 Auto-aprendizaje de módulos

El agente puede aprender a usar módulos nuevos automáticamente:

1. `sync_modules` detecta módulos instalados que no están en el conocimiento curado
2. `analyze_module` extrae la API surface del módulo (globals, hooks, classes, methods)
3. El agente (LLM) sintetiza un archivo de conocimiento estructurado
4. `index_knowledge` persiste el conocimiento en el RAG para futuras sesiones

Esto funciona tanto al instalar como cuando el usuario añade módulos después.

## 📚 Documentación

- [INSTALL.md](INSTALL.md) — Guía detallada de instalación
- [ARCHITECTURE.md](ARCHITECTURE.md) — Diseño y componentes
- [knowledge/](knowledge/) — Conocimiento curado sobre módulos

## 📄 Licencia

MIT
