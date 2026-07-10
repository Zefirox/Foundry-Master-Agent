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

### ⚠️ Prerrequisitos obligatorios

Estos componentes **deben estar instalados antes** de ejecutar el instalador:

#### 1. PI Agent (obligatorio)

[PI](https://github.com/earendil-works/pi-coding-agent) es el agente de IA que razona, decide qué comandos enviar y sintetiza conocimiento. **Sin PI, este proyecto no funciona** — el resto de componentes (relay, módulo, RAG) son infraestructura que PI usa.

```bash
# Instalar PI globalmente
npm install -g @earendil-works/pi-coding-agent

# Verificar instalación
pi --version

# El directorio ~/.pi/agent/ debe existir
ls ~/.pi/agent/
```

PI necesita un modelo LLM configurado. Ver `config/pi-settings.json.example` para referencia.

#### 2. FoundryVTT (obligatorio)

| Componente | Versión requerida | Notas |
|---|---|---|
| FoundryVTT | **V13 build 351** | El install verifica la versión y aborta si no coincide |
| D&D 5e System | **5.3.2** (D&D 2024) | Instalar desde Foundry's system installer |
| World | cualquiera creado | El agente opera sobre el world activo |

> ⚠️ **Importante**: El agente está pre-entrenado para Foundry V13 + dnd5e 5.3.2.
> Otras versiones pueden no funcionar. El install lo detecta y aborta (usa `--force` bajo tu responsabilidad).

#### 3. Node.js (obligatorio)

```bash
node --version  # debe ser v20 o superior (recomendado v24)
```

### Módulos de Foundry recomendados (pre-entrenados)

Instala estos módulos en Foundry antes de la instalación para aprovechar todo el conocimiento curado:

| Módulo | Versión | Función |
|---|---|---|
| MidiQOL | 13.0.61 | Automatización de combate |
| Sequencer | 4.0.1 | Framework de animaciones |
| JB2A DnD5e | 0.8.9 | 2104 animaciones .webm |
| DAE | 13.0.27 | Dynamic Active Effects |
| Active Auras | 0.12.7 | Efectos por proximidad |
| Times Up | 13.1.9 | Duración de efectos |
| Plutonium | 2.15.0 | Import desde 5etools |
| Tagger | 1.5.4 | Etiquetado de tokens |
| Automated Animations | 6.8.5 | Auto-play de animaciones |
| Chris's Premades | 1.5.27 | Items pre-automatizados |

> Si no tienes todos, el agente igual funciona — simplemente no tendrá conocimiento curado para los que falten. Los módulos nuevos se pueden aprender automáticamente via el Learning Protocol.

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
