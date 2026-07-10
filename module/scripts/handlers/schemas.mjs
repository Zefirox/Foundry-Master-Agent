/**
 * Schemas de validación para cada comando.
 * Subconjunto de JSON Schema soportado por el mini validador en command-router.mjs
 */

export const SCHEMAS = {
  // ─── Ping (test) ─────────────────────────────────────────────
  ping: {
    type: "object",
    properties: {},
  },

  // ─── Listar módulos activos ──────────────────────────────────
  list_active_modules: {
    type: "object",
    properties: {},
  },

  // ─── Crear actors ────────────────────────────────────────────
  create_actors: {
    type: "object",
    required: ["actors"],
    properties: {
      actors: {
        type: "array",
        items: {
          type: "object",
          required: ["name", "type"],
          properties: {
            name: { type: "string" },
            type: { type: "string", enum: ["character", "npc"] },
            systemData: { type: "object" },
            img: { type: "string" },
          },
        },
      },
      folder: { type: "string" },
    },
  },

  // ─── Colocar tokens en la escena ─────────────────────────────
  place_tokens: {
    type: "object",
    required: ["tokens"],
    properties: {
      tokens: {
        type: "array",
        items: {
          type: "object",
          required: ["actorId"],
          properties: {
            actorId: { type: "string" },
            x: { type: "number" },
            y: { type: "number" },
            sceneId: { type: "string" },
            name: { type: "string" },
          },
        },
      },
    },
  },

  // ─── Crear entrada de diario ─────────────────────────────────
  create_journal: {
    type: "object",
    required: ["entries"],
    properties: {
      entries: {
        type: "array",
        items: {
          type: "object",
          required: ["name"],
          properties: {
            name: { type: "string" },
            content: { type: "string" },
            type: { type: "string", enum: ["base", "image", "pdf"] },
            folder: { type: "string" },
          },
        },
      },
    },
  },

  // ─── Ejecutar macro existente ────────────────────────────────
  run_macro: {
    type: "object",
    required: ["name"],
    properties: {
      name: { type: "string" },
      args: { type: "object" },
    },
  },

  // ─── Ejecutar batch de comandos (transacción) ────────────────
  execute_batch: {
    type: "object",
    required: ["commands"],
    properties: {
      commands: {
        type: "array",
        items: {
          type: "object",
          required: ["command"],
          properties: {
            command: { type: "string" },
            args: { type: "object" },
          },
        },
      },
    },
  },

  // ─── Actualizar scene ────────────────────────────────────────
  update_scene: {
    type: "object",
    properties: {
      sceneId: { type: "string" },
      data: { type: "object" },
    },
  },

  // ─── Importar desde Plutonium/5etools ──────────────────────
  plutonium_import: {
    type: "object",
    required: ["creatures"],
    properties: {
      creatures: {
        type: "array",
        items: {
          type: "object",
          required: ["name"],
          properties: {
            name: { type: "string" },
            source: { type: "string" },
          },
        },
      },
    },
  },

  // ─── Añadir items a actors ────────────────────────────────
  add_items: {
    type: "object",
    required: ["items"],
    properties: {
      items: {
        type: "array",
        items: {
          type: "object",
          required: ["actorId", "name", "type"],
          properties: {
            actorId: { type: "string" },
            name: { type: "string" },
            type: { type: "string", enum: ["weapon", "feat", "equipment", "consumable", "spell", "tool", "loot", "class", "background", "race", "subclass"] },
            systemData: { type: "object" },
            description: { type: "string" },
            img: { type: "string" },
          },
        },
      },
    },
  },

  // ─── Sync modules (auto-learning) ────────────────────────
  sync_modules: {
    type: "object",
    properties: {},
  },

  // ─── Analyze a specific module ────────────────────────────
  analyze_module: {
    type: "object",
    required: ["moduleId"],
    properties: {
      moduleId: { type: "string" },
    },
  },

  // ─── Index knowledge into RAG ─────────────────────────────
  index_knowledge: {
    type: "object",
    required: ["module", "content"],
    properties: {
      module: { type: "string" },
      content: { type: "string" },
      title: { type: "string" },
    },
  },

  // ─── Unsafe eval (escape hatch, deshabilitado por defecto) ───
  "unsafe.eval": {
    type: "object",
    required: ["code"],
    properties: {
      code: { type: "string" },
    },
  },
};
