# Active Auras v0.12.7 — Efectos por Proximidad

## Concepto

Aplica/remueve Active Effects automáticamente cuando un token entra/sale
del rango de un aura. Se recalcula en cada movimiento de token.

## Configuración

Para crear un aura, añade un Active Effect al item/actor y marca
los flags de Active Auras:

```js
const auraEffect = {
  name: "Aura of Protection",
  changes: [
    {
      key: "system.abilities.cha.bonuses.save",
      mode: 2,
      value: "@abilities.cha.mod"
    }
  ],
  flags: {
    "ActiveAuras": {
      isAura: true,
      aura: "Allies",
      radius: 10,
      alignment: "friend"
    }
  }
};
```

## Flags de Active Auras

| Flag | Valores | Descripción |
|---|---|---|
| `isAura` | `true` | Marca el efecto como aura |
| `aura` | `"Allies"`, `"Enemies"`, `"All"` | Quién se ve afectado |
| `radius` | número (ft) | Radio del aura |
| `alignment` | `"friend"`, `"enemy"`, `"neutral"` | Alineación del afectado |
| `isToken` | `true` | Aura centrada en token (no en item) |

## Funcionamiento Interno

1. `CollateAuras(sceneID, checkAuras, removeAuras)` — recopila todas las auras activas
2. Compara posiciones de tokens en cada cambio de escena o movimiento
3. Aplica efectos a tokens dentro del radio
4. Remueve efectos cuando el token sale del radio

## Ejemplos de Auras Comunes

### Aura of Protection (Paladin)
- Radio: 10 ft
- Afecta: Aliados
- Efecto: +CHA mod a saves

### Aura of Courage (Paladin)
- Radio: 10 ft
- Afecta: Aliados
- Efecto: Inmunidad a Frightened

### Aura de Haste (Bardo)
- Radio: 30 ft
- Afecta: Aliados
- Efecto: +2 AC, advantage en dex saves

## Dependencias

- Requiere: DAE
- Recomendado: MidiQOL
- Recomendado: Times Up
