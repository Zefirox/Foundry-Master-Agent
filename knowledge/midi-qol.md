# MidiQOL v13.0.61 — Automatización de Combate D&D 5e

## API Global

```js
globalThis.MidiQOL      // Objeto principal
globalThis.MidiDAEEval   // Funciones utilitarias
game.modules.get("midi-qol").api  // API oficial (= globalThis.MidiQOL)
```

## Workflow Hooks (21 hooks)

Estos hooks se disparan durante el uso de items. Úsalos en macros:

| Hook | Cuándo | Uso típico |
|---|---|---|
| `midi-qol.preItemRoll` | Antes de usar un item | Modificar opciones, cancelar |
| `midi-qol.preAttackRoll` | Antes de tirar ataque | Modificar bonificadores |
| `midi-qol.preAttackRollConfig` | Config del attack roll | Cambiar ventaja/desventaja |
| `midi-qol.AttackRollComplete` | Después del ataque | Reaccionar al resultado |
| `midi-qol.preDamageRoll` | Antes del daño | Modificar dados de daño |
| `midi-qol.DamageRollComplete` | Después del daño | Procesar resultado |
| `midi-qol.RollComplete` | Uso del item completo | Post-procesamiento |
| `midi-qol.preCheckHits` | Antes de evaluar aciertos | Override de hit/miss |
| `midi-qol.preCheckSaves` | Antes de salvaciones | Modificar DC, ventaja |
| `midi-qol.postCheckSaves` | Después de salvaciones | Reaccionar a saves |
| `midi-qol.postActiveEffects` | Después de aplicar efectos | Post-procesamiento |
| `midi-qol.preTargeting` | Antes de seleccionar targets | Filtrar targets |
| `midi-qol.targetingComplete` | Targets seleccionados | Validar targets |
| `midi-qol.preSetReactionUsed` | Antes de marcar reacción | Override |
| `midi-qol.preSetBonusActionUsed` | Antes de marcar bonus action | Override |
| `midi-qol.postCleanup` | Limpieza post-workflow | Cleanup |
| `midi-qol.preAbort` | Antes de abortar | Prevenir abort |
| `midi-qol.noAttackRoll` | Item sin attack roll | Procesar sin ataque |
| `midi-qol.ContestedRoll` | Tirada enfrentada | Procesar resultado |
| `midi-qol.preFormulaRoll` | Antes de roll de fórmula | Modificar fórmula |
| `midi-qol.preTargetSave` | Antes del save del target | Modificar save |

### Ejemplo: Macro en item (MidiQOL on-use macro)

```js
// Se ejecuta en midi-qol.RollComplete
// args[0] = workflow
const workflow = args[0];
const target = workflow.targets?.first();
if (!target) return;

// Aplicar efecto si el target falló la salvación
if (workflow.failedSaves.has(target)) {
  await MidiQOL.addEffect({
    actor: target.actor,
    effectName: "Poisoned",
    origin: workflow.item.uuid
  });
}
```

## Funciones Utilitarias (MidiDAEEval)

```js
// Visión y detección
MidiDAEEval.canSee(token, target)           // ¿token puede ver target?
MidiDAEEval.canSense(token, target)         // ¿token puede detectar target?
MidiDAEEval.canSenseModes(token, target, modes)

// Distancia y proximidad
MidiDAEEval.checkDistance(token, target, range)  // ¿dentro de range?
MidiDAEEval.getDistance(token, target)           // distancia en grid
MidiDAEEval.findNearby(token, range, opts)       // tokens cercanos
MidiDAEEval.findNearbyCount(token, range)        // count de tokens cercanos
MidiDAEEval.checkNearby(token, target, range)

// Condiciones
MidiDAEEval.hasCondition(actor, "poisoned")      // ¿tiene la condición?
MidiDAEEval.checkIncapacitated(actor)            // ¿está incapacitado?

// Acciones por turno
MidiDAEEval.hasUsedReaction(actor)               // ¿usó reacción?
MidiDAEEval.hasUsedBonusAction(actor)            // ¿usó bonus action?
MidiDAEEval.setReactionUsed(actor)               // Marcar reacción usada
MidiDAEEval.setBonusActionUsed(actor)            // Marcar bonus action usada

// Combate
MidiDAEEval.computeCoverBonus(token, target)     // Bonificador por cobertura
MidiDAEEval.doConcentrationCheck(actor, damage)  // Chequeo de concentración
MidiDAEEval.contestedRoll(opts)                  // Tirada enfrentada
MidiDAEEval.isTargetable(token)                  // ¿es un target válido?

// Identidad
MidiDAEEval.humanoid(actor)                      // ¿es humanoide?
MidiDAEEval.raceOrType(actor)                    // raza o tipo
MidiDAEEval.typeOrRace(actor)                    // tipo o raza
```

## Activity Types

MidiQOL registra estos activity types en `globalThis.MidiQOL.activityTypes`:

| Type | Clase | Uso |
|---|---|---|
| `attack` | MidiAttackActivity | Ataques con roll de ataque |
| `damage` | MidiDamageActivity | Daño sin attack roll |
| `cast` | MidiCastActivity | Conjuración de hechizos |
| `save` | MidiSaveActivity | Salvaciones |
| `check` | MidiCheckActivity | Chequeos de ability |
| `enchant` | MidiEnchantActivity | Encantamiento |
| `heal` | MidiHealActivity | Curación |
| `summon` | MidiSummonActivity | Invocación |
| `transform` | MidiTransformActivity | Transformación (Wild Shape) |
| `utility` | MidiUtilityActivity | Utilidad (sin roll) |
| `forward` | MidiForwardActivity | Forward a otro activity |

## Config Settings

```js
MidiQOL.configSettings()  // Devuelve el objeto de configuración actual
// Propiedades clave:
// - autoCheckSaves: 'none' | 'all' | 'allNoRoll'
// - removeConcentration: boolean
// - autoTarget: 'none' | 'all' | 'combatants'
// - optionalRules: { flanking, cover, ... }
```

## Workflow Object

El workflow es el objeto central que pasa por todos los hooks:

```js
workflow.item          // Item usado
workflow.actor         // Actor que usa el item
workflow.token         // Token del actor
workflow.targets       // Set de tokens target
workflow.attackRoll    // Roll de ataque (si existe)
workflow.damageRoll    // Roll de daño
workflow.saves         // Set de targets que pasaron el save
workflow.failedSaves   // Set de targets que fallaron el save
workflow.hitTargets    // Set de targets acertados
workflow.isCritical    // ¿crítico?
workflow.isFumble      // ¿pifia?
workflow.damageList    // Lista de daño por target
workflow.itemCardUuid  // UUID del chat card
```

## Patrones de Uso Comunes

### 1. Macro que aplica condición al fallar save
```js
// Hook: midi-qol.postCheckSaves
const workflow = args[0];
for (const token of workflow.failedSaves) {
  await MidiQOL.addEffect({ actor: token.actor, effectName: "Stunned" });
}
```

### 2. Macro que modifica daño por condición
```js
// Hook: midi-qol.preDamageRoll
const workflow = args[0];
if (MidiDAEEval.hasCondition(workflow.actor, "rage")) {
  workflow.bonusDamage += 2; // Rage bonus
}
```

### 3. Reacción automática (Opportunity Attack)
```js
// Hook: midi-qol.RollComplete
const workflow = args[0];
if (workflow.item.system.actionType === "mwak") {
  // Verificar si es opportunity attack
  // Lógica de reacción...
}
```

## Dependencias

- Requiere: dnd5e system
- Recomendado: DAE, Times Up, Active Auras
- Opcional: Sequencer, Automated Animations, Dice So Nice
