/** Ping — handler de test. */
export async function ping() {
  return {
    pong: true,
    foundryVersion: game.version,
    world: game.world.id,
    system: game.system.id,
  };
}
