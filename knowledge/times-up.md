# Times Up v13.1.9 — Gestión de Duración de Efectos

## Concepto

Maneja la expiración automática de Active Effects según diferentes criterios.
Integrado con MidiQOL para remoción automática de efectos.

## Tipos de Duración

| Tipo | Configuración | Descripción |
|---|---|---|
| Rounds | `duration: { rounds: 10 }` | Expira después de N rondas de combate |
| Turns | `duration: { turns: 1 }` | Expira después de N turnos |
| Seconds | `duration: { seconds: 60 }` | Expira después de N segundos (tiempo real) |
| Combat | `flags.times-up.combat: true` | Expira al final del combate |

## Condiciones de Expiración Especiales

```js
// Expira al recibir daño
const effect = {
  name: "Concentrating",
  flags: {
    "times-up": {
      expireOnDamage: true
    }
  }
};

// Expira al inicio del próximo turno
const effect = {
  name: "Stunned",
  flags: {
    "times-up": {
      expireOnTurnEnd: true
    }
  }
};
```

## Integración con MidiQOL

Times Up escucha los hooks de MidiQOL para:
- Remover concentración al recibir daño (con concentration check)
- Actualizar duración en cada ronda de combate
- Limpiar efectos al final del combate

## Dependencias

- Requiere: DAE
- Recomendado: MidiQOL
- Recomendado: Active Auras
