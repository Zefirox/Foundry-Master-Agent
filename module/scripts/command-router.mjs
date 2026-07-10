/**
 * PI Bridge — Command Router
 * Valida y despacha comandos a sus handlers.
 * No usa eval(). Cada comando tiene un schema explícito y un handler tipado.
 */

import { handlers } from "./handlers/index.mjs";
import { SCHEMAS } from "./handlers/schemas.mjs";

// ─── Mini validador de schemas ─────────────────────────────────
// Soporta un subconjunto de JSON Schema suficiente para nuestros comandos.
function validateValue(value, schema, path) {
  if (schema.type === "string") {
    if (typeof value !== "string") return `${path}: expected string, got ${typeof value}`;
  } else if (schema.type === "number") {
    if (typeof value !== "number") return `${path}: expected number, got ${typeof value}`;
  } else if (schema.type === "boolean") {
    if (typeof value !== "boolean") return `${path}: expected boolean, got ${typeof value}`;
  } else if (schema.type === "array") {
    if (!Array.isArray(value)) return `${path}: expected array, got ${typeof value}`;
    for (let i = 0; i < value.length; i++) {
      const err = validateValue(value[i], schema.items, `${path}[${i}]`);
      if (err) return err;
    }
  } else if (schema.type === "object") {
    if (typeof value !== "object" || value === null || Array.isArray(value))
      return `${path}: expected object, got ${typeof value}`;
    if (schema.properties) {
      for (const [key, propSchema] of Object.entries(schema.properties)) {
        const isRequired = schema.required?.includes(key);
        if (value[key] === undefined) {
          if (isRequired) return `${path}.${key}: required field missing`;
          continue; // optional, skip
        }
        const err = validateValue(value[key], propSchema, `${path}.${key}`);
        if (err) return err;
      }
    }
  }
  // enum
  if (schema.enum && !schema.enum.includes(value)) {
    return `${path}: expected one of [${schema.enum.join(", ")}], got ${JSON.stringify(value)}`;
  }
  return null; // válido
}

function validateArgs(command, args) {
  const schema = SCHEMAS[command];
  if (!schema) return `Unknown command: ${command}`;
  return validateValue(args, schema, "args");
}

// ─── Router ────────────────────────────────────────────────────
export class CommandRouter {
  constructor({ allowUnsafe = false } = {}) {
    this.allowUnsafe = allowUnsafe;
  }

  async execute(cmd) {
    const { command, args = {}, id } = cmd;

    // Gate de seguridad para unsafe.eval
    if (command === "unsafe.eval" && !this.allowUnsafe) {
      throw new Error("unsafe.eval está deshabilitado. Habilita 'Allow unsafe.eval' en settings del módulo.");
    }

    // Validar contra schema
    const validationError = validateArgs(command, args);
    if (validationError) {
      throw new Error(`Schema validation failed: ${validationError}`);
    }

    // Buscar handler
    const fn = handlers[command];
    if (typeof fn !== "function") {
      throw new Error(`Handler no implementado para comando: ${command}`);
    }

    // Ejecutar en el contexto del GM
    return fn(args);
  }
}
