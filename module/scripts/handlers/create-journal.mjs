/**
 * Crear entradas de diario.
 *
 * args: {
 *   entries: Array<{
 *     name: string,
 *     content?: string,  // HTML
 *     type?: "base" | "image" | "pdf",  // default: "base"
 *     folder?: string,
 *   }>,
 * }
 *
 * Returns: { journalIds: string[], journals: [{id, name}] }
 */
export async function createJournal({ entries }) {
  const createData = entries.map((e) => {
    const data = {
      name: e.name,
      type: e.type ?? "base",
      pages: e.content
        ? [{ name: e.name, type: "text", text: { content: e.content, format: 1 } }]
        : [],
    };

    if (e.folder) {
      const folder = game.folders.find(
        (f) => f.type === "JournalEntry" && (f.name === e.folder || f.id === e.folder)
      );
      if (folder) data.folder = folder.id;
    }

    return data;
  });

  const created = await JournalEntry.createDocuments(createData);

  return {
    journalIds: created.map((j) => j.id),
    journals: created.map((j) => ({ id: j.id, name: j.name })),
  };
}
