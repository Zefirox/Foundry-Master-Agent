# DAE v13.0.27 — Dynamic Active Effects

## API Global

```js
globalThis.DAE
game.modules.get("dae").api  // = globalThis.DAE
```

## Concepto

DAE permite definir efectos dinámicos en items/conditions que modifican
stats del actor. Los efectos se aplican automáticamente cuando el item
está equipado/activo y se remueven cuando se desactiva.

## Campos DAE (sintaxis en Active Effects)

### Modificar ability scores
```
system.abilities.str.bonuses.check   +1d4    // Bonificador a checks de STR
system.abilities.dex.bonuses.save     +2      // Bonificador a saves de DEX
system.abilities.con.value            +2      // Aumentar CON
```

### Modificar AC
```
system.attributes.ac.bonus            +1      // +1 a AC
system.attributes.ac.value            18      // AC fija
```

### Modificar velocidad
```
system.attributes.movement.walk       +10     // +10 ft walk speed
system.attributes.movement.fly        30      // Fly speed 30
```

### Modificar tiradas de daño
```
system.bonuses.weapon.damage          +1d4    // +1d4 a weapon damage
system.bonuses.spell.damage           +2      // +2 a spell damage
```

### Modificar ataques
```
system.bonuses.weapon.attack          +1      // +1 a weapon attacks
system.bonuses.spell.attack           +1      // +1 a spell attacks
```

### Proficiencias
```
system.traits.weaponProf.value        martial // Add martial weapon prof
system.traits.skills.val.value        +2      // +2 a skill prof
```

### Macros DAE
```
@Call[macroName,1]    // Llamar macro al aplicar efecto
@Call[macroName,0]    // Llamar macro al remover efecto
```

## Ejemplo: Effect de Bless

```js
// Crear un Active Effect en un item
const effect = {
  name: "Blessed",
  icon: "icons/magic/light/auras-glowing-yellow.webp",
  duration: { rounds: 10 },
  changes: [
    {
      key: "system.bonuses.weapon.attack",
      mode: 2,  // ADD
      value: "1d4"
    },
    {
      key: "system.bonuses.spell.attack",
      mode: 2,
      value: "1d4"
    },
    {
      key: "system.bonuses.abilities.save",
      mode: 2,
      value: "1d4"
    }
  ]
};
```

## Modes de Active Effect

| Mode | Valor | Descripción |
|---|---|---|
| `0` | CUSTOM | Valor custom |
| `1` | MULTIPLY | Multiplicar base |
| `2` | ADD | Sumar al base |
| `3` | DOWNGRADE | Reducir si base es mayor |
| `4` | UPGRADE | Aumentar si base es menor |
| `5` | OVERRIDE | Sobreescribir |

## Hooks DAE

```js
Hooks.on("dae.ready", (api) => { ... })        // DAE listo
Hooks.on("dae.setupComplete", () => { ... })    // Setup completo
```

## Dependencias

- Requiere: dnd5e system
- Recomendado: MidiQOL (para macros @Call)
- Recomendado: Times Up (para duración)
