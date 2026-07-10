# Automated Animations v6.8.5 — Auto-play de Animaciones

## Concepto

Detecta cuando se usa un item y reproduce automáticamente la animación
JB2A correspondiente sin necesidad de macros manuales.

## Configuración

Cada item puede tener una configuración de animación en sus flags:

```js
// En un item (ej: Fireball)
item.flags.autoanimations = {
  killAnim: false,
  animType: "t2",
  animation: "fireball",
  color: "orange",
  enableInterrupt: true,
  interruptAnim: "impact",
  ctFirst: false,
  delay: 0,
  scale: 1,
  radius: 5,
  range: 120,
};
```

## Mapeos Comunes (pre-construidos)

| Item | Animación JB2A |
|---|---|
| Fireball | `jb2a.fireball.01` |
| Lightning Bolt | `jb2a.lightning_bolt.01` |
| Cure Wounds | `jb2a.cure_wounds.01` |
| Magic Missile | `jb2a.magic_missile.01` |
| Sword (melee) | `jb2a.melee.sword.01` |
| Mace (melee) | `jb2a.melee.mace.01` |
| Shield | `jb2a.shield.01` |
| Bless | `jb2a.bless.01` |

## Cómo Funciona

1. Hook en `dnd5e.useItem` (o equivalente)
2. Lee `item.flags.autoanimations`
3. Busca el archivo JB2A correspondiente
4. Reproduce via Sequencer
5. Maneja timing (delay, wait, interrupt)

## Integración

- **Sequencer**: Usa Sequencer para reproducir
- **JB2A**: Provee los assets
- **MidiQOL**: Se integra con el workflow para timing correcto
- **Tagger**: Puede filtrar animaciones por tag

## Dependencias

- Requiere: Sequencer
- Requiere: JB2A (o otra biblioteca de assets)
- Recomendado: MidiQOL
