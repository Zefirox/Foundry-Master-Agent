/**
 * PI Bridge — Cliente WebSocket del relay.
 * Se ejecuta en el browser del GM. Se conecta al relay por WS,
 * recibe comandos, los despacha al CommandRouter, y envía los resultados.
 */

export class BridgeClient {
  /** @type {WebSocket|null} */
  #ws = null;
  #queue = [];
  #running = false;
  #reconnectDelay = 2000;
  #maxReconnectDelay = 30000;

  constructor(cfg, router) {
    this.cfg = cfg;
    this.router = router;
  }

  async connect() {
    const url = this.cfg.relayUrl;
    console.log(`[pi-bridge] Conectando a relay: ${url}`);

    try {
      this.#ws = new WebSocket(url);
    } catch (err) {
      console.error("[pi-bridge] Error creando WebSocket:", err);
      this.#scheduleReconnect();
      return;
    }

    this.#ws.onopen = () => {
      console.log("[pi-bridge] Conectado al relay.");
      this.#reconnectDelay = 2000; // reset backoff
      // Enviar hello con token para autenticar la conexión WS
      this.#send({
        type: "hello",
        world: game.world.id,
        foundryVersion: game.version,
        system: game.system.id,
        token: this.cfg.authToken,
      });
      ui.notifications?.info("PI Bridge conectado al relay.", { console: false });
    };

    this.#ws.onmessage = (ev) => {
      let msg;
      try {
        msg = JSON.parse(ev.data);
      } catch {
        console.error("[pi-bridge] Mensaje inválido del relay:", ev.data);
        return;
      }

      // Ignorar hello_ack
      if (msg.type === "hello_ack") {
        console.log("[pi-bridge] Relay confirmó conexión.");
        return;
      }

      // Comando a ejecutar
      if (msg.command && msg.id) {
        this.#enqueue(msg);
      }
    };

    this.#ws.onerror = (err) => {
      console.error("[pi-bridge] WS error:", err);
    };

    this.#ws.onclose = (ev) => {
      console.log(`[pi-bridge] Desconectado del relay (code: ${ev.code}, reason: ${ev.reason}).`);
      ui.notifications?.warn(`PI Bridge desconectado (code: ${ev.code}). Reintentando...`, { console: false });
      this.#ws = null;
      this.#scheduleReconnect();
    };
  }

  #scheduleReconnect() {
    const delay = this.#reconnectDelay;
    this.#reconnectDelay = Math.min(this.#reconnectDelay * 1.5, this.#maxReconnectDelay);
    setTimeout(() => this.connect(), delay);
  }

  #enqueue(cmd) {
    this.#queue.push(cmd);
    this.#drain();
  }

  async #drain() {
    if (this.#running || this.#queue.length === 0) return;
    this.#running = true;

    const cmd = this.#queue.shift();
    console.log(`[pi-bridge] Ejecutando comando: ${cmd.command} (id: ${cmd.id})`);

    try {
      const data = await this.router.execute(cmd);
      this.#send({ type: "result", id: cmd.id, ok: true, data });
    } catch (err) {
      console.error(`[pi-bridge] Error en comando ${cmd.command}:`, err);
      this.#send({
        type: "result",
        id: cmd.id,
        ok: false,
        error: err.message,
        stack: err.stack,
      });
    } finally {
      this.#running = false;
      this.#drain(); // siguiente comando en la cola
    }
  }

  #send(obj) {
    if (this.#ws && this.#ws.readyState === 1) {
      this.#ws.send(JSON.stringify(obj));
    }
  }

  /** Desconexión manual */
  disconnect() {
    if (this.#ws) {
      this.#ws.onclose = null; // prevenir reconnect
      this.#ws.close();
      this.#ws = null;
    }
  }
}
