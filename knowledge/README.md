# PI-Foundry Knowledge Base

Conocimiento curado sobre los módulos de FoundryVTT para el agente PI.
Cada archivo documenta la API, hooks, patrones de uso y ejemplos de un módulo.

## Índice

| Archivo | Módulo | Versión | Función |
|---|---|---|---|
| [midi-qol.md](midi-qol.md) | MidiQOL | 13.0.61 | Automatización de combate D&D 5e |
| [sequencer.md](sequencer.md) | Sequencer | 4.0.1 | Framework de animaciones |
| [jb2a.md](jb2a.md) | JB2A DnD5e | 0.8.9 | Biblioteca de 2104 animaciones .webm |
| [dae.md](dae.md) | DAE | 13.0.27 | Dynamic Active Effects |
| [active-auras.md](active-auras.md) | Active Auras | 0.12.7 | Efectos por proximidad |
| [times-up.md](times-up.md) | Times Up | 13.1.9 | Duración de efectos |
| [plutonium.md](plutonium.md) | Plutonium | 2.15.0 | Importación desde 5etools |
| [tagger.md](tagger.md) | Tagger | 1.5.4 | Etiquetado de tokens |
| [autoanimations.md](autoanimations.md) | Automated Animations | 6.8.5 | Auto-play de animaciones |
| [chris-premades.md](chris-premades.md) | Chris's Premades | 1.5.27 | Automatización pre-construida |
| [monks-suite.md](monks-suite.md) | Monk's Modules | varias | Suite de utilidades (11 módulos) |
| [module-inventory.md](module-inventory.md) | Todos | — | Tabla maestra de 38 módulos |

## Uso

Estos archivos se indexan en el RAG (LanceDB) durante la instalación.
El agente los consulta via `foundry_search_docs` para entender cómo usar cada módulo.

## Versiones soportadas

- FoundryVTT: V13 build 351
- Sistema: dnd5e v5.3.2 (D&D 2024)
- Ver [module-inventory.md](module-inventory.md) para versiones detalladas
