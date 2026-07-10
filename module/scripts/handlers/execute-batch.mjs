/**
 * Ejecutar un batch de comandos como una secuencia serial.
 * Esto reduce round-trips: PI envía un plan completo y el puente lo ejecuta todo.
 *
 * args: {
 *   commands: Array<{ command: string, args: object }>,
 * }
 *
 * Returns: { results: Array<{ ok: boolean, data?: any, error?: string }> }
 */
export async function executeBatch({ commands }) {
  // Import dinámico para evitar dependencia circular con el router
  const { CommandRouter } = await import("../command-router.mjs");
  const router = new CommandRouter({
    allowUnsafe: game.settings.get("pi-bridge", "allowUnsafe"),
  });

  const results = [];

  for (const cmd of commands) {
    try {
      const data = await router.execute({
        id: `batch-${results.length}`,
        command: cmd.command,
        args: cmd.args ?? {},
      });
      results.push({ ok: true, data });
    } catch (err) {
      results.push({ ok: false, error: err.message });
      // Continúa con el siguiente comando (no aborta todo el batch)
    }
  }

  return { results };
}
