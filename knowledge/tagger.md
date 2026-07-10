# Tagger v1.5.4 — Etiquetado de Tokens

## API Global

```js
Tagger  // global
```

## Funciones Principales

```js
// Verificar si un token tiene un tag
Tagger.hasTag(token, "boss")

// Obtener todos los tags de un token
Tagger.getTags(token)
// → ["boss", "undead"]

// Añadir tags a un token
await Tagger.addTags(token, ["boss", "elite"])

// Remover tags
await Tagger.removeTags(token, ["elite"])

// Toggle tag
await Tagger.toggleTag(token, "hidden")

// Buscar tokens por tag
Tagger.getObjects("boss")  // → array de tokens con tag "boss"

// Buscar con múltiples tags (AND)
Tagger.getObjects(["boss", "undead"])

// Buscar con opciones
Tagger.getObjects("boss", { scene: canvas.scene, matchAll: true })
```

## Casos de Uso

### Marcar un boss
```js
await Tagger.addTags(token, "boss");
```

### Filtrar tokens para un encuentro
```js
const bosses = Tagger.getObjects("boss");
const minions = Tagger.getObjects("minion");
```

### En macros de MidiQOL
```js
// Hook: midi-qol.preItemRoll
const workflow = args[0];
const targets = workflow.targets;
// Solo afectar tokens taggeados como "undead"
const validTargets = targets.filter(t => Tagger.hasTag(t, "undead"));
```

## Dependencias

- Ninguna (módulo standalone)
- Integración con Sequencer (para efectos por tag)
