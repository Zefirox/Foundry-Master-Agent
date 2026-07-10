/**
 * Crear Actors — crea uno o más actors y opcionalmente los coloca en la escena.
 *
 * args: {
 *   actors: Array<{
 *     name: string,
 *     type: "character" | "npc",
 *     systemData?: object,  // datos del system (ej. dnd5e)
 *     img?: string,
 *   }>,
 *   folder?: string,  // nombre o ID del folder
 * }
 *
 * Returns: { actorIds: string[], actors: [{id, name, type}] }
 */
export async function createActors({ actors, folder: folderName }) {
  // Resolver folder si se especifica
  let folderId = null;
  if (folderName) {
    const folder = game.folders.find(
      (f) => f.type === "Actor" && (f.name === folderName || f.id === folderName)
    );
    if (folder) folderId = folder.id;
  }

  // Construir datos de creación
  const createData = actors.map((a) => {
    const data = {
      name: a.name,
      type: a.type,
      system: a.systemData ?? {},
    };
    if (folderId) data.folder = folderId;
    if (a.img) data.img = a.img;
    return data;
  });

  // Crear actors (V13 API)
  const created = await Actor.createDocuments(createData);

  return {
    actorIds: created.map((a) => a.id),
    actors: created.map((a) => ({ id: a.id, name: a.name, type: a.type })),
  };
}
