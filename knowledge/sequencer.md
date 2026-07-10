# Sequencer v4.0.1 — Framework de Animaciones

## API Global

```js
Sequencer  // global, disponible después de Sequencer.ready()
```

## Patrón Principal (Fluent Builder)

```js
new Sequence()
  .effect()
    .file("jb2a.fireball...")
    .atLocation(token)
    .stretchTo(target)
  .sound()
    .file("path/to/sound.ogg")
  .play()
```

## Secciones

| Método | Descripción |
|---|---|
| `.effect()` | Crea una sección de efecto visual |
| `.sound()` | Crea una sección de sonido |
| `.animation()` | Crea una sección de animación de token |
| `.scrollText()` | Crea texto flotante |

## EffectSection — Métodos Chainable

### Posición
```js
.atLocation(token)           // Posicionar en un token/coordenada
.stretchTo(token)            // Estirar desde source hasta target
.stretchTo(token, { attachTo: true })  // Estirar y seguir al target
.attachTo(token)             // Pegar al token (sigue su movimiento)
.reachDistance(type)         // Estirar hasta distancia del arma (melee/ranged)
.moveTowards(token)          // Mover hacia target
```

### Archivo
```js
.file("jb2a.fireball.01")    // Archivo .webm o entrada de DB
.file("jb2a.melee.sword.01", { randomOffset: true })  // Con variación aleatoria
```

### Apariencia
```js
.scale(1.5)                  // Escala (o { startX, endX } para animar)
.tint("#ff0000")             // Color de tinte
.opacity(0.8)                // Opacidad
.mirror("x" | "y" | "xy")    // Espejar
.spriteRotation(90)          // Rotación en grados
.filter("Glow", { strength: 2 })  // Filtros PIXI
```

### Timing
```js
.delay(500)                  // Delay antes de empezar (ms)
.duration(2000)              // Duración total (ms)
.fadeIn(500)                 // Fade in (ms o { duration, delay })
.fadeOut(500)                // Fade out
.wait(1000)                  // Esperar antes de la siguiente sección
.startTime(200)              // Empezar en frame específico del video
```

### Capas (Z-order)
```js
.zIndex(10)                  // Z-index explícito
.belowTokens()               // Renderizar debajo de tokens
.aboveInterface()            // Renderizar sobre UI
.belowTiles()                // Debajo de tiles
```

### Persistencia
```js
.persist()                   // Efecto persistente (no se borra solo)
.persist(true, { name: "my-effect" })  // Con nombre para referencia
.forUsers(userIds)           // Solo visible para ciertos usuarios
```

### Callbacks
```js
.then(() => { ... })         // Ejecutar al terminar
.addOverride(async (effect, data) => { ... })  // Override custom
```

## SoundSection — Métodos

```js
new Sequence()
  .sound()
    .file("path/to/sound.ogg")
    .volume(0.5)
    .fadeIn(200)
    .fadeOut(200)
    .delay(100)
```

## AnimationSection — Métodos

```js
new Sequence()
  .animation()
    .on(token)
    .fadeIn(500)              // Animar aparición del token
    .fadeOut(500)             // Animar desaparición
    .opacity(0, 1)            // Animar de 0 a 1
    .scale(0.5, 1)            // Animar escala
```

## ScrollTextSection — Métodos

```js
new Sequence()
  .scrollText()
    .atLocation(token)
    .text("¡Daño!")
    .textColor("#ff0000")
    .fontSize(32)
    .duration(2000)
```

## Database (Sequencer.Database)

```js
Sequencer.Database.entryExists("jb2a.fireball")  // ¿existe?
Sequencer.Database.getEntry("jb2a.fireball")     // obtener entrada
Sequencer.Database.publicFlattenedSimpleEntries   // todas las entradas
```

## EffectManager

```js
Sequencer.EffectManager.getEffects({ name: "my-effect" })  // buscar efectos
Sequencer.EffectManager.endEffects({ name: "my-effect" })  // terminar efectos
Sequencer.EffectManager.endAllEffects({ object: token })   // terminar todos en token
```

## Ejemplos Completos

### 1. Fireball de token A a token B
```js
new Sequence()
  .effect()
    .file("jb2a.fireball.01.400x400")
    .atLocation(tokenA)
    .stretchTo(tokenB)
    .waitUntilFinished()
  .effect()
    .file("jb2a.explosion.fire.01")
    .atLocation(tokenB)
    .scale(2)
  .play()
```

### 2. Curación persistente en token
```js
new Sequence()
  .effect()
    .file("jb2a.healing.generic.01.green")
    .attachTo(token)
    .scale(0.8)
    .persist(true, { name: `heal-${token.id}` })
    .fadeIn(300)
    .fadeOut(300)
  .play()
```

### 3. Ataque melee con sonido
```js
new Sequence()
  .effect()
    .file("jb2a.melee.sword.01")
    .atLocation(attacker)
    .stretchTo(target)
    .waitUntilFinished(-200)
  .sound()
    .file("sounds/sword_hit.ogg")
    .atLocation(target)
  .effect()
    .file("jb2a.impact.01")
    .atLocation(target)
    .scale(0.7)
  .play()
```

## Dependencias

- Ninguna (módulo standalone)
- Integración con JB2A para assets
- Integración con Automated Animations para auto-play
