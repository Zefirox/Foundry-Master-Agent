# Installation Guide

## Prerrequisitos

### Sistema operativo
- Ubuntu 22.04+ (o equivalente Linux)
- Node.js 20+ (recomendado 24)
- npm 10+
- OpenSSL (para generar secrets)

### FoundryVTT
- Versión V13 build 351 (verificada)
- D&D 5e system v5.3.2 instalado
- World creado y accesible

### PI Agent
- `@earendil-works/pi-coding-agent` instalado
- Directorio `~/.pi/agent/` existente

### Módulos recomendados
Instala estos módulos en Foundry antes de la instalación:

| Módulo | Versión | Función |
|---|---|---|
| MidiQOL | 13.0.61 | Automatización de combate |
| Sequencer | 4.0.1 | Framework de animaciones |
| JB2A DnD5e | 0.8.9 | Biblioteca de animaciones |
| DAE | 13.0.27 | Dynamic Active Effects |
| Active Auras | 0.12.7 | Efectos por proximidad |
| Times Up | 13.1.9 | Duración de efectos |
| Plutonium | 2.15.0 | Import desde 5etools |
| Tagger | 1.5.4 | Etiquetado de tokens |
| Automated Animations | 6.8.5 | Auto-play de animaciones |
| Chris's Premades | 1.5.27 | Items pre-automatizados |

## Instalación

### Opción A: Instalador automático

```bash
git clone https://github.com/tu-usuario/pi-foundry.git
cd pi-foundry
./scripts/install.sh --foundry-dir /root/foundryuserdata --world astralis-legacy
```

### Opción B: Instalación manual

#### 1. Generar secret HMAC

El secret HMAC-SHA256 es la clave compartida que autentica toda comunicación entre PI, el relay y el módulo de Foundry. **Los tres componentes deben usar el mismo secret.**

```bash
# Generar automáticamente (recomendado)
./scripts/generate-secret.sh
# → Crea .secret con 32 bytes hex aleatorios (permisos 600)

# O generar manualmente
openssl rand -hex 32 > .secret
chmod 600 .secret
```

El archivo `.secret` contiene una línea como:
```
a3f7b2c8e1d4f6a9b3c5e8d1f4a7b2c9e6d3f1a8b5c7e2d4f9a1b3c6e8d5f2a7
```

**¿Cómo se usa el secret en cada componente?**

| Componente | Cómo lee el secret |
|---|---|
| **PI Extension** | Lee `/root/pi-foundry/.secret` automáticamente, o usa la env var `PI_FOUNDRY_SECRET` |
| **Relay** | Lee `/root/pi-foundry/.secret` al arrancar (systemd service) |
| **Foundry Module** | Se configura en Foundry → Settings → PI Bridge → "Shared Secret" (ver paso 3 abajo) |

**Paso 3: Configurar el secret en Foundry**

Después de activar el módulo `pi-bridge` en Foundry:

1. Ve a **Foundry → Settings → Configure Settings → PI Bridge**
2. Pega el contenido de `.secret` en el campo **"Shared Secret"**
3. Configura **"Relay URL"** = `ws://127.0.0.1:7401/gm` (default)
4. Guarda y recarga la página (F5)

Alternativamente, puedes setear el secret via variable de entorno:

```bash
# Para PI (en ~/.pi/agent/settings.json o env)
export PI_FOUNDRY_SECRET="a3f7b2c8e1d4f6a9..."

# Para el relay (en el systemd service o env)
export PI_BRIDGE_SECRET="a3f7b2c8e1d4f6a9..."
```

> ⚠️ **Importante**: Si el secret no coincide en los tres componentes, la autenticación HMAC fallará y los comandos se rechazarán con error 401. Verifica con `foundry_ping`.

#### 2. Instalar dependencias

```bash
cd relay && npm install && cd ..
cd rag && npm install && cd ..
cd extension && npm install && cd ..
```

#### 3. Symlinkar módulo en Foundry

```bash
ln -s $(pwd)/module /path/to/foundryuserdata/Data/modules/pi-bridge
```

#### 4. Symlinkar extensión en PI

```bash
ln -s $(pwd)/extension ~/.pi/agent/extensions/pi-foundry
```

#### 5. Instalar skill en PI

```bash
ln -s $(pwd)/skill/foundry-encounter ~/.pi/agent/skills/foundry-encounter
```

#### 6. Instalar servicios systemd

```bash
sudo cp relay/pi-bridge-relay.service /etc/systemd/system/
sudo cp rag/pi-rag.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now pi-bridge-relay
sudo systemctl enable --now pi-rag
```

#### 7. Configurar Caddy (opcional)

```bash
sudo cp config/Caddyfile.example /etc/caddy/Caddyfile
sudo systemctl restart caddy
```

#### 8. Analizar módulos e ingestar knowledge

```bash
./scripts/ingest-knowledge.sh /path/to/foundryuserdata
```

## Post-instalación

1. **Abre FoundryVTT** en tu navegador
2. Ve a **Manage Modules** y activa `pi-bridge`
3. **Recarga la página** (F5)
4. Verifica la instalación:

```bash
./scripts/verify-install.sh
```

5. Prueba con PI:

```
foundry_ping
foundry_execute("plutonium_import", { creatures: [{ name: "Orc", source: "MM" }] })
```

## Troubleshooting

### El agente no puede conectar a Foundry
- **Síntoma**: `foundry_ping` timeout
- **Causa**: No hay navegador conectado a Foundry
- **Solución**: Abre Foundry en el navegador y activa el módulo pi-bridge

### RAG search no devuelve resultados
- **Síntoma**: `foundry_search_docs` devuelve "No results found"
- **Causa**: El índice LanceDB no está construido
- **Solución**: `./scripts/ingest-knowledge.sh /path/to/foundryuserdata`

### Versión incompatible
- **Síntoma**: install.sh aborta con "Versión incompatible"
- **Causa**: Foundry o dnd5e no coinciden con las versiones soportadas
- **Solución**: Instala las versiones correctas o usa `--force`

### Plutonium no encontrado
- **Síntoma**: `plutonium_import` falla con "Plutonium no está activo"
- **Causa**: Plutonium no está activado en el world
- **Solución**: Activa Plutonium en Manage Modules y recarga
