/**
 * Actualizar una escena.
 *
 * args: {
 *   sceneId?: string,  // default: escena activa
 *   data: object,      // datos de actualización (name, img, grid, etc.)
 * }
 *
 * Returns: { sceneId: string, updated: boolean }
 */
export async function updateScene({ sceneId, data }) {
  const scene = sceneId ? game.scenes.get(sceneId) : canvas.scene;
  if (!scene) {
    throw new Error("Escena no encontrada.");
  }

  const updated = await scene.update(data);

  return {
    sceneId: scene.id,
    updated: !!updated,
  };
}
