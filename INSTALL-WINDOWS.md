# Installation Guide — Windows 11

> **Nota**: Esta guía es para Windows 11. Para Linux/Ubuntu, ver [INSTALL.md](INSTALL.md).

## Prerrequisitos

### 1. Node.js 20+ (recomendado 24)

```powershell
# Descargar e instalar desde https://nodejs.org
# O via winget:
winget install OpenJS.NodeJS.LTS

# Verificar
node --version   # debe ser v20 o superior
npm --version
```

### 2. Git

```powershell
winget install Git.Git
git --version
```

### 3. PI Agent

```powershell
npm install -g @earendil-works/pi-coding-agent
pi --version

# Verificar que el directorio existe
dir %USERPROFILE%\.pi\agent\
```

PI necesita un modelo LLM configurado. Ver `config/pi-settings.json.example`.

### 4. FoundryVTT

| Componente | Versión requerida |
|---|---|
| FoundryVTT | **V13 build 351** |
| D&D 5e System | **5.3.2** (D&D 2024) |
| World | cualquiera creado |

> ⚠️ El agente está pre-entrenado para estas versiones. Otras pueden no funcionar.

### 5. Módulos de Foundry recomendados

Instala estos módulos en Foundry antes de continuar:

| Módulo | Versión | Función |
|---|---|---|
| MidiQOL | 13.0.61 | Automatización de combate |
| Sequencer | 4.0.1 | Framework de animaciones |
| JB2A DnD5e | 0.8.9 | 2104 animaciones .webm |
| DAE | 13.0.27 | Dynamic Active Effects |
| Active Auras | 0.12.7 | Efectos por proximidad |
| Times Up | 13.1.9 | Duración de efectos |
| Plutonium | 2.15.0 | Import desde 5etools |
| Tagger | 1.5.4 | Etiquetado de tokens |
| Automated Animations | 6.8.5 | Auto-play de animaciones |
| Chris's Premades | 1.5.27 | Items pre-automatizados |

---

## Instalación

### Paso 1: Clonar el repositorio

Abre **PowerShell** (no CMD) como usuario normal:

```powershell
cd $HOME
git clone https://github.com/Zefirox/Foundry-Master-Agent.git pi-foundry
cd pi-foundry
```

### Paso 2: Generar el secret HMAC

El secret HMAC-SHA256 autentica toda comunicación entre PI, el relay y Foundry. **Los tres deben usar el mismo secret.**

```powershell
# Generar 32 bytes hex aleatorios
$secret = -join ((1..32) | ForEach-Object { "{0:x2}" -f (Get-Random -Maximum 256) })
$secret | Out-File -FilePath "$HOME\pi-foundry\.secret" -Encoding ascii -NoNewline

# Verificar
cat $HOME\pi-foundry\.secret
# → a3f7b2c8e1d4f6a9b3c5e8d1f4a7b2c9e6d3f1a8b5c7e2d4f9a1b3c6e8d5f2a7
```

> ⚠️ Guarda este secret — lo necesitarás para configurar Foundry.

### Paso 3: Instalar dependencias npm

```powershell
cd $HOME\pi-foundry\relay
npm install
cd ..\rag
npm install
cd ..\extension
npm install
cd ..
```

### Paso 4: Symlinkar módulo en Foundry

En Windows, los symlinks requieren **PowerShell como Administrador** o tener **Developer Mode** activado (Settings → Privacy & Security → For developers → Developer Mode = ON).

```powershell
# Encontrar el directorio de datos de Foundry
# Por defecto suele estar en:
#   %LOCALAPPDATA%\FoundryVTT\Data\modules\
# O donde hayas instalado Foundry

# Crear el symlink (requiere Admin o Developer Mode)
$foundryModules = "$env:LOCALAPPDATA\FoundryVTT\Data\modules"
New-Item -ItemType SymbolicLink -Path "$foundryModules\pi-bridge" -Target "$HOME\pi-foundry\module"
```

> **Alternativa sin symlinks**: Si no puedes crear symlinks, copia la carpeta:
> ```powershell
> Copy-Item -Path "$HOME\pi-foundry\module" -Destination "$foundryModules\pi-bridge" -Recurse
> ```
> ⚠️ Si copias en vez de symlinkar, tendrás que repetir el copy cada vez que actualices el repositorio.

### Paso 5: Symlinkar extensión en PI

```powershell
$piExt = "$HOME\.pi\agent\extensions"
if (!(Test-Path $piExt)) { New-Item -ItemType Directory -Path $piExt }
New-Item -ItemType SymbolicLink -Path "$piExt\pi-foundry" -Target "$HOME\pi-foundry\extension"
```

### Paso 6: Instalar skill en PI

```powershell
$piSkills = "$HOME\.pi\agent\skills"
if (!(Test-Path $piSkills)) { New-Item -ItemType Directory -Path $piSkills }
New-Item -ItemType SymbolicLink -Path "$piSkills\foundry-encounter" -Target "$HOME\pi-foundry\skill\foundry-encounter"
```

### Paso 7: Configurar el secret en Foundry

1. **Abre FoundryVTT** en tu navegador
2. Ve a **Manage Modules** → activa `pi-bridge` → recarga (F5)
3. Ve a **Settings → Configure Settings → PI Bridge**
4. Pega el contenido de `.secret` en el campo **"Shared Secret"**
5. Configura **"Relay URL"** = `ws://127.0.0.1:7401/gm`
6. Guarda y recarga (F5)

> ⚠️ Si el secret no coincide en PI, relay y Foundry, los comandos se rechazan con error 401.

### Paso 8: Iniciar servicios

En Windows no usamos systemd. Los servicios se ejecutan en terminales PowerShell:

**Terminal 1 — Relay** (dejar abierto):
```powershell
cd $HOME\pi-foundry\relay
$env:PI_BRIDGE_SECRET = Get-Content $HOME\pi-foundry\.secret
node server.mjs
```

**Terminal 2 — RAG** (dejar abierto):
```powershell
cd $HOME\pi-foundry\rag
node server.mjs
```

> **Alternativa con PM2** (recomendado para uso prolongado):
> ```powershell
> npm install -g pm2
> pm2 start "$HOME\pi-foundry\relay\server.mjs" --name pi-bridge-relay
> pm2 start "$HOME\pi-foundry\rag\server.mjs" --name pi-rag
> pm2 save
> pm2 startup
> ```

### Paso 9: Analizar módulos e ingestar knowledge

```powershell
cd $HOME\pi-foundry
node scripts\analyze-modules.mjs --foundry-dir="$env:LOCALAPPDATA\FoundryVTT" --output="knowledge\analyzed"

# Disparar ingesta en RAG
curl -X POST http://127.0.0.1:7402/ingest -H "content-type: application/json" -d "{}"
```

---

## Post-instalación

1. **Foundry abierto** en el navegador con el módulo `pi-bridge` activo
2. **Relay corriendo** (Terminal 1 o PM2)
3. **RAG corriendo** (Terminal 2 o PM2)
4. **PI reiniciado** para que cargue la extensión

Verifica:

```powershell
# Health check relay
curl http://127.0.0.1:7401/health

# Health check RAG
curl http://127.0.0.1:7402/health
```

Prueba con PI:
```
foundry_ping
foundry_execute("plutonium_import", { creatures: [{ name: "Orc", source: "MM" }] })
```

---

## Configuración con variables de entorno (opcional)

Si prefieres no usar el archivo `.secret`, puedes setear variables de entorno:

**PowerShell (sesión actual):**
```powershell
$env:PI_FOUNDRY_SECRET = "tu-secret-aqui"
$env:PI_BRIDGE_SECRET = "tu-secret-aqui"
```

**Permanente (Windows):**
```powershell
[System.Environment]::SetEnvironmentVariable("PI_FOUNDRY_SECRET", "tu-secret-aqui", "User")
[System.Environment]::SetEnvironmentVariable("PI_BRIDGE_SECRET", "tu-secret-aqui", "User")
# Reiniciar PowerShell después
```

---

## Troubleshooting

### "New-Item: No se puede crear un enlace simbólico"
- **Causa**: Symlinks requieren Admin o Developer Mode
- **Solución**: Activa Developer Mode (Settings → For developers → Developer Mode = ON) o ejecuta PowerShell como Administrador
- **Alternativa**: Usa `Copy-Item` en vez de `New-Item -SymbolicLink`

### El agente no puede conectar a Foundry
- **Síntoma**: `foundry_ping` timeout
- **Causa**: No hay navegador conectado a Foundry
- **Solución**: Abre Foundry en el navegador y activa el módulo pi-bridge

### Error 401 en comandos
- **Causa**: El secret no coincide entre PI, relay y Foundry
- **Solución**: Verifica que los tres usen el mismo valor de `.secret`

### RAG search no devuelve resultados
- **Causa**: El índice LanceDB no está construido
- **Solución**: Ejecuta el Paso 9 (analizar + ingestar)

### "node" no reconocido
- **Causa**: Node.js no instalado o no en PATH
- **Solución**: `winget install OpenJS.NodeJS.LTS` y reiniciar PowerShell

### Plutonium no encontrado
- **Causa**: Plutonium no activado en el world
- **Solución**: Activa Plutonium en Manage Modules y recarga

### Los servicios se cierran al cerrar la terminal
- **Causa**: Node.js se ejecuta como proceso hijo de la terminal
- **Solución**: Usa PM2 (ver Paso 8) o ejecuta con `Start-Process`:
  ```powershell
  Start-Process -WindowStyle Minimized -FilePath "node" -ArgumentList "server.mjs" -WorkingDirectory "$HOME\pi-foundry\relay"
  ```
