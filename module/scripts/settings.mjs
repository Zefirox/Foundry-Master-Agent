/**
 * PI Bridge — Settings
 * Registra las settings del módulo en FoundryVTT.
 */

export function registerSettings() {
  game.settings.register("pi-bridge", "relayUrl", {
    name: "Relay WebSocket URL",
    hint: "URL del relay. Dejar vacío para auto-detectar (usa el hostname del servidor + /pi-bridge/gm vía el proxy de Caddy). Ej manual: ws://10.0.0.18/pi-bridge/gm",
    scope: "world",
    config: true,
    type: String,
    default: "",
  });

  game.settings.register("pi-bridge", "authToken", {
    name: "Auth Token (HMAC Secret)",
    hint: "Secret compartido con el relay. Debe coincidir con /root/pi-foundry/.secret",
    scope: "world",
    config: true,
    type: String,
    default: "",
  });

  game.settings.register("pi-bridge", "allowUnsafe", {
    name: "Permitir unsafe.eval",
    hint: "PELIGROSO: permite ejecutar JS arbitrario. Solo para desarrollo.",
    scope: "world",
    config: true,
    type: Boolean,
    default: false,
  });
}
