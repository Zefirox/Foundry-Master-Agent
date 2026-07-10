/**
 * Colocar Tokens en la escena actual o especificada.
 *
 * args: {
 *   tokens: Array<{
 *     actorId: string,
 *     x?: number,     // default: auto-grid
 *     y?: number,
 *     sceneId?: string,
 *     name?: string,
 *   }>,
 * }
 *
 * Returns: { tokenIds: string[], sceneId: string }
 */
export async function placeTokens({ tokens }) {
  // Resolver escena
  const scene = tokens[0]?.sceneId
    ? game.scenes.get(tokens[0].sceneId)
    : canvas.scene;

  if (!scene) {
    throw new Error("No hay escena activa. Especifica sceneId o ten una escena activa.");
  }

  // Construir datos de tokens
  const gridSize = scene.grid.size || 100;
  const tokenData = tokens.map((t, i) => {
    const actor = game.actors.get(t.actorId);
    if (!actor) throw new Error(`Actor no encontrado: ${t.actorId}`);

    // Posición: explícita o auto-layout en grid
    const x = t.x ?? 100 + (i % 5) * (gridSize * 2);
    const y = t.y ?? 100 + Math.floor(i / 5) * (gridSize * 2);

    return {
      name: t.name ?? actor.name,
      x,
      y,
      actorId: actor.id,
      actorLink: false,
    };
  });

  // Crear tokens como documentos embebidos de la escena
  const created = await scene.createEmbeddedDocuments("Token", tokenData);

  return {
    tokenIds: created.map((t) => t.id),
    sceneId: scene.id,
  };
}
