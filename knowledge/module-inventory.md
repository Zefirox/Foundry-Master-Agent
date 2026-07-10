# Module Inventory — Tabla Maestra de Módulos

## Sistema

| ID | Título | Versión | Función |
|---|---|---|---|
| dnd5e | Dungeons & Dragons Fifth Edition | 5.3.2 | Sistema D&D 2024 |

## Módulos de Automatización

| ID | Título | Versión | Función | API Global |
|---|---|---|---|---|
| midi-qol | Midi QOL | 13.0.61 | Automatización de combate | `globalThis.MidiQOL`, `globalThis.MidiDAEEval` |
| dae | Dynamic Active Effects | 13.0.27 | Efectos dinámicos | `globalThis.DAE` |
| ActiveAuras | Active Auras | 0.12.7 | Efectos por proximidad | — |
| times-up | Times Up | 13.1.9 | Duración de efectos | — |

## Módulos de Animación

| ID | Título | Versión | Función | API Global |
|---|---|---|---|---|
| sequencer | Sequencer | 4.0.1 | Framework de animaciones | `Sequencer` |
| JB2A_DnD5e | JB2A Animated Assets | 0.8.9 | 2104 animaciones .webm | — |
| autoanimations | Automated Animations | 6.8.5 | Auto-play de animaciones | — |
| dnd5e-animations | D&D5e Animations | 3.3.0 | Animaciones del sistema | — |

## Módulos de Contenido

| ID | Título | Versión | Función | API Global |
|---|---|---|---|---|
| plutonium | Plutonium | 2.15.0 | Import desde 5etools | `game.plutonium` |
| plutonium-addon-automation | Plutonium Addon: Automation | 0.8.2 | Auto-config para imports | — |
| chris-premades | Cauldron of Plentiful Resources | 1.5.27 | Items pre-automatizados | — |

## Módulos de Utilidad

| ID | Título | Versión | Función | API Global |
|---|---|---|---|---|
| tagger | Tagger | 1.5.4 | Etiquetado de tokens | `Tagger` |
| lib-wrapper | libWrapper | 1.13.4.0 | Wrapper de funciones | `libWrapper` |
| socketlib | socketlib | v1.1.4 | Comunicación entre clientes | `socketlib` |
| dice-so-nice | Dice So Nice! | 5.3.4 | 3D dice | `game.dice3d` |
| dice-calculator | Dice Tray | 3.5.4 | Calculadora de dados | — |
| always-hp | Always HP | 13.04 | Barra de HP siempre visible | — |
| tidy5e-sheet | Tidy 5e Sheets | 13.3.0 | Sheets compactas | — |
| simple-dice-stats | Simple d20 stats | 0.2.1 | Estadísticas de dados | — |
| lootsheet-simple | Loot Sheet NPC 5e | 14.0.0 | Sheet de loot | — |
| random-loot-generator | Random Loot Generator | 14.0.1 | Generador de loot | — |
| vtta-tokenizer | Tokenizer | 5.0.3 | Recorte de tokens | — |
| wall-height | Wall Height | 7.0.8 | Altura de walls | — |
| psfx | PSFX Sound Effects | 0.13.0 | Biblioteca de sonidos | — |

## Módulos de Monk (TheRipper93)

| ID | Título | Versión | Función |
|---|---|---|---|
| monks-active-tiles | Active Tile Triggers | 13.06 | Triggers en tiles |
| monks-bloodsplats | Bloodsplats | 13.01 | Sangre visual |
| monks-combat-details | Combat Details | 13.05 | Info de combate |
| monks-combat-marker | Combat Marker | 12.01 | Marcas de combate |
| monks-common-display | Common Display | 13.01 | Display compartido |
| monks-enhanced-journal | Enhanced Journal | 13.06 | Diario mejorado |
| monks-little-details | Little Details | 13.03 | QoL variado |
| monks-sound-enhancements | Sound Enhancements | 13.02 | Sonidos ambientales |
| monks-tokenbar | TokenBar | 13.02 | Barra de tokens |
| monks-wall-enhancement | Wall Enhancement | 13.04 | Walls avanzados |
| monks-hotbar-expansion | Hotbar Expansion | 13.01 | Hotbar expandido |
| monks-player-settings | Player Settings | 13.01 | Settings por jugador |
| monks-scene-navigation | Scene Navigation | 13.03 | Navegación de escenas |
| theripper-premium-hub | Module Hub | 5.0.7 | Hub de TheRipper93 |

## Módulo PI

| ID | Título | Versión | Función |
|---|---|---|---|
| pi-bridge | PI Bridge | 0.1.0 | Agente IA ↔ FoundryVTT |

## Versiones Soportadas

| Componente | Versión Requerida |
|---|---|
| FoundryVTT | V13 (build 351) |
| dnd5e | 5.3.2 |
| Node.js | 20+ (recomendado 24) |
| PI Agent | @earendil-works/pi-coding-agent |

## Dependencias entre Módulos

```
midi-qol → dae → (times-up, active-auras)
sequencer → (jb2a, autoanimations)
autoanimations → sequencer, (midi-qol)
active-auras → dae
times-up → dae
chris-premades → midi-qol, dae, times-up
plutonium → (plutonium-addon-automation)
monks-* → socketlib, lib-wrapper
```
