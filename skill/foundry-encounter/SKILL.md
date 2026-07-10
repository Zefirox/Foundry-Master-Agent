---
name: foundry-encounter
description: Create D&D 5e encounters on FoundryVTT — NPCs, monsters, tokens, and journal entries. Use when the user asks to create creatures, place tokens, build encounters, or interact with the FoundryVTT virtual tabletop.
---

# Foundry Encounter Skill

## Boot Protocol (ejecutar al inicio de cada sesión)

1. **Verifica conectividad**: Llama `foundry_ping`. Si falla, dile al usuario que abra Foundry en el navegador.
2. **Lista módulos activos**: Llama `foundry_list_modules` para ver qué está disponible.
3. **Sincroniza conocimiento**: Llama `foundry_execute` con comando `sync_modules`.
   - Si hay módulos **desconocidos**, ejecuta el Learning Protocol para cada uno.
   - Si hay **versiones distintas**, nota la diferencia y ten cuidado al usar APIs.
4. **Construye mapa mental**: Para cada módulo activo, busca `foundry_search_docs("<module> API")` para entender su API.

## Learning Protocol (para módulos desconocidos)

Cuando `sync_modules` reporta módulos desconocidos:

1. Para cada módulo desconocido, llama `foundry_execute` con comando `analyze_module` y args `{ moduleId: "<module-id>" }`.
2. Analiza la información devuelta:
   - `globals`: APIs expuestas en `globalThis`
   - `hooks`: Eventos que el módulo registra
   - `classes`: Clases principales
   - `publicMethods`: Métodos públicos
   - `readme`: Documentación del autor (si existe)
3. Sintetiza un archivo de conocimiento markdown estructurado:
   ```markdown
   # <Module Name> (<module-id>) — v<version>
   
   ## API Surface
   <globals y methods>
   
   ## Hooks
   <hooks encontrados>
   
   ## Uso
   <patrones inferidos del README y API>
   
   ## Ejemplos
   <ejemplos de código basados en la API>
   ```
4. Persiste el conocimiento: llama `foundry_execute` con comando `index_knowledge` y args `{ module: "<module-id>", content: "<markdown>", title: "<Module Name>" }`.
5. El conocimiento queda indexado en el RAG para futuras sesiones.

**Importante**: Si no puedes determinar con confianza cómo usar un módulo, díselo al usuario:
> "Encontré el módulo X pero no tengo conocimiento curado. Su API parece ser Y. ¿Quieres que intente usarlo o prefieres guiarme?"

## Reglas de Oro

1. **SIEMPRE busca antes de actuar**: Antes de usar cualquier módulo (MidiQOL, Sequencer, DAE, etc.), busca en `foundry_search_docs` primero. Nunca asumas cómo funciona un módulo sin verificar.
2. **Verifica conectividad**: Si `foundry_ping` falla, pide al usuario que abra Foundry en el navegador. No puedes operar sin navegador conectado.
3. **Usa Plutonium para monsters**: Prefiere `plutonium_import` sobre `create_actors` para monsters. Plutonium importa stats, acciones, traits, items y sprites completos desde 5etools.
4. **Reconoce tus límites**: Si no tienes conocimiento sobre un módulo, no inventes. Usa el Learning Protocol o pide ayuda al usuario.

## Workflow: Crear un encuentro

1. **Verifica conectividad** con `foundry_ping`.
2. **Importa monsters** con `foundry_execute` comando `plutonium_import`:
   ```
   foundry_execute("plutonium_import", { creatures: [{ name: "Orc", source: "MM" }, ...] })
   ```
3. **Coloca tokens** con `foundry_execute` comando `place_tokens`:
   ```
   foundry_execute("place_tokens", { tokens: [{ actorId: "...", x: 1000, y: 500 }, ...] })
   ```
4. **Crea diario** con `foundry_execute` comando `create_journal`:
   ```
   foundry_execute("create_journal", { entries: [{ name: "Encuentro", content: "..." }] })
   ```

## Comandos Disponibles

| Comando | Descripción |
|---|---|
| `ping` | Test de conectividad |
| `list_active_modules` | Lista módulos activos |
| `create_actors` | Crea actors manualmente |
| `place_tokens` | Coloca tokens en escena |
| `create_journal` | Crea entradas de diario |
| `run_macro` | Ejecuta macro existente |
| `update_scene` | Actualiza escena |
| `execute_batch` | Ejecuta múltiples comandos |
| `add_items` | Añade items a actors |
| `plutonium_import` | Importa monsters desde 5etools |
| `sync_modules` | Sincroniza conocimiento de módulos |
| `analyze_module` | Analiza API de un módulo |
| `index_knowledge` | Persiste conocimiento en RAG |

## Módulos Soportados (conocimiento curado)

- **MidiQOL**: Automatización de combate (hooks, workflow, macros)
- **Sequencer**: Framework de animaciones (API encadenable)
- **JB2A**: 2104 animaciones .webm (spells, weapons, conditions)
- **DAE**: Dynamic Active Effects (buffs/debuffs)
- **Active Auras**: Efectos por proximidad
- **Times Up**: Duración de efectos
- **Plutonium**: Importación desde 5etools
- **Tagger**: Etiquetado de tokens
- **Automated Animations**: Auto-play de animaciones
- **Chris's Premades**: Items pre-automatizados

## Sources de Plutonium

| Source | Descripción |
|---|---|
| `MM` | Monster Manual (2014) |
| `XMM` | Monster Manual (2024) |
| `VGM` | Volo's Guide to Monsters |
| `MPMM` | Mordenkainen Presents |
| `ToB1-2023` | Tome of Beasts 1 |
