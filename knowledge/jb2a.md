# JB2A DnD5e v0.8.9 — Biblioteca de Animaciones

## Resumen

2,104 archivos .webm de animaciones profesionales gratuitas.
Se usan con Sequencer via rutas de archivo o entradas de Database.

## Estructura de Directorios

```
modules/JB2A_DnD5e/Library/
├── Cantrip/
├── 1st_Level/
├── 2nd_Level/
├── 3rd_Level/
├── 4th_Level/
├── 5th_Level/
├── 6th_Level/
├── 7th_Level/
└── Generic/
```

## Spells por Nivel

### Cantrips
| Spell | Ruta |
|---|---|
| Sacred Flame | `Library/Cantrip/Sacred_Flame/` |
| Fire Bolt | `Library/Cantrip/Fire_Bolt/` |
| Ray of Frost | `Library/Cantrip/Ray_Of_Frost/` |
| Toll the Dead | `Library/Cantrip/Toll_The_Dead/` |
| Eldritch Blast | `Library/Cantrip/Eldritch_Blast/` |
| Dancing Lights | `Library/Cantrip/Dancing_Lights/` |

### 1st Level
| Spell | Ruta |
|---|---|
| Bless | `Library/1st_Level/Bless/` |
| Burning Hands | `Library/1st_Level/Burning_Hands/` |
| Cure Wounds | `Library/1st_Level/Cure_Wounds/` |
| Detect Magic | `Library/1st_Level/Detect_Magic/` |
| Entangle | `Library/1st_Level/Entangle/` |
| Fog Cloud | `Library/1st_Level/Fog_Cloud/` |
| Grease | `Library/1st_Level/Grease/` |
| Guiding Bolt | `Library/1st_Level/Guiding_Bolt/` |
| Hunter's Mark | `Library/1st_Level/Hunters_Mark/` |
| Magic Missile | `Library/1st_Level/Magic_Missile/` |
| Shield | `Library/1st_Level/Shield/` |
| Sleep | `Library/1st_Level/Sleep/` |
| Sneak Attack | `Library/1st_Level/Sneak_Attack/` |
| Thunderwave | `Library/1st_Level/Thunderwave/` |
| Witch Bolt | `Library/1st_Level/Witch_Bolt/` |
| Arms of Hadar | `Library/1st_Level/Arms_Of_Hadar/` |
| Bardic Inspiration | `Library/1st_Level/Bardic_Inspiration/` |

### 3rd Level
| Spell | Ruta |
|---|---|
| Call Lightning | `Library/3rd_Level/Call_Lightning/` |
| Fireball | `Library/3rd_Level/Fireball/` |
| Lightning Bolt | `Library/3rd_Level/Lightning_Bolt/` |
| Sleet Storm | `Library/3rd_Level/Sleet_Storm/` |
| Spirit Guardians | `Library/3rd_Level/Spirit_Guardians/` |
| Wind Wall | `Library/3rd_Level/Wind_Wall/` |

## Categorías Generic

| Categoría | Contenido | Ruta |
|---|---|---|
| Weapon_Attacks | Melee (Sword, Mace, Rapier, Spear, Glaive, etc.) | `Generic/Weapon_Attacks/Melee/` |
| Conditions | Curse, Bless, Poisoned, etc. | `Generic/Conditions/` |
| Healing | Múltiples variantes y colores | `Generic/Healing/` |
| Lightning | ElectricArc, LightningBall, LightningStrike | `Generic/Lightning/` |
| Fire | Fireball, Explosion, Breath | `Generic/Fire/` |
| Ice | IceShard, Frost, Blizzard | `Generic/Ice/` |
| Energy | EnergyBeam, EnergyField | `Generic/Energy/` |
| Explosion | Múltiples tipos y colores | `Generic/Explosion/` |
| Impact | Impact effects | `Generic/Impact/` |
| Portals | Portal open/close | `Generic/Portals/` |
| Smoke | Smoke puffs, columns | `Generic/Smoke/` |
| Fog | Fog clouds | `Generic/Fog/` |
| Lava | Lava bubbles, splash | `Generic/Lava/` |
| Particles | Particle effects | `Generic/Particles/` |
| Template | Cone, Line, Circle para área | `Generic/Template/` |
| Traps | Trap triggers | `Generic/Traps/` |
| Unarmed_Attacks | Punch, Kick | `Generic/Unarmed_Attacks/` |
| Marker | Location markers | `Generic/Marker/` |
| On_Token | Effects on token | `Generic/On_Token/` |
| Token_Border | Border effects | `Generic/Token_Border/` |
| Screen_Overlay | Full screen effects | `Generic/Screen_Overlay/` |
| Muzzle_Flash | Firearm muzzle flash | `Generic/Muzzle_Flash/` |
| Nature | Leaves, water, etc. | `Generic/Nature/` |
| Wind | Wind effects | `Generic/Wind/` |
| Eyes | Eye effects | `Generic/Eyes/` |
| Butterflies | Animated butterflies | `Generic/Butterflies/` |
| Fireflies | Animated fireflies | `Generic/Fireflies/` |
| Fireworks | Firework explosions | `Generic/Fireworks/` |
| Celestial_Bodies | Sun, moon, stars | `Generic/Celestial_Bodies/` |
| Twinkling_Stars | Star effects | `Generic/Twinkling_Stars/` |
| Liquid | Liquid splashes | `Generic/Liquid/` |
| Zoning | Zone effects | `Generic/Zoning/` |
| Creature | Creature effects | `Generic/Creature/` |
| FootPrint | Footprint effects | `Generic/FootPrint/` |
| Magic_Signs | Magic circles, runes | `Generic/Magic_Signs/` |
| Music_Notation | Musical notes | `Generic/Music_Notation/` |
| Item | Item effects | `Generic/Item/` |
| UI | UI effects | `Generic/UI/` |

## Variantes de Color

Muchas animaciones tienen variantes de color en el nombre del archivo:
- `Blue`, `Green`, `Yellow`, `Orange`, `Red`, `Purple`, `Pink`
- `BluePurple`, `OrangeRed`, `BlueYellow`, `GreenOrange`

## Uso con Sequencer

```js
// Ruta directa
new Sequence()
  .effect()
    .file("modules/JB2A_DnD5e/Library/Generic/Weapon_Attacks/Melee/Sword01_01_Regular_White_800x600.webm")
    .atLocation(token)
    .stretchTo(target)
  .play()

// Via Sequencer Database (si JB2A está registrado)
new Sequence()
  .effect()
    .file("jb2a.sword.melee.01")
    .atLocation(token)
  .play()
```

## Dependencias

- Ninguna (solo assets)
- Se usa con: Sequencer, Automated Animations
