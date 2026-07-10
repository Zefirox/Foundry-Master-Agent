/**
 * Añadir Items a actors existentes.
 * Crea embedded documents de tipo Item en actors.
 *
 * args: {
 *   items: Array<{
 *     actorId: string,
 *     name: string,
 *     type: string,         // "weapon", "feat", "equipment", "consumable", "spell", "tool", "loot"
 *     systemData?: object,  // datos del system (dnd5e)
 *     description?: string, // descripción (HTML)
 *     img?: string,
 *   }>,
 * }
 *
 * Returns: { results: Array<{ actorId, itemId, name, type }> }
 */
export async function addItems({ items }) {
  // Agrupar items por actorId para crear en batch
  const byActor = new Map();
  for (const item of items) {
    if (!byActor.has(item.actorId)) byActor.set(item.actorId, []);
    byActor.get(item.actorId).push(item);
  }

  const results = [];

  for (const [actorId, actorItems] of byActor) {
    const actor = game.actors.get(actorId);
    if (!actor) {
      throw new Error(`Actor no encontrado: ${actorId}`);
    }

    const createData = actorItems.map((item) => {
      const data = {
        name: item.name,
        type: item.type,
        system: item.systemData ?? {},
      };

      if (item.description) {
        data.system.description = { value: item.description, chat: "" };
      }
      if (item.img) data.img = item.img;

      return data;
    });

    const created = await actor.createEmbeddedDocuments("Item", createData);

    for (const item of created) {
      results.push({
        actorId,
        itemId: item.id,
        name: item.name,
        type: item.type,
      });
    }
  }

  return { results };
}
