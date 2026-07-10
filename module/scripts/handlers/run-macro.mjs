/**
 * Ejecutar una macro existente por nombre.
 *
 * args: {
 *   name: string,   // nombre de la macro
 *   args?: object,  // argumentos opcionales (pasados como `args` al scope de la macro)
 * }
 *
 * Returns: { macroId: string, result: any }
 */
export async function runMacro({ name, args }) {
  const macro = game.macros.find((m) => m.name === name);
  if (!macro) {
    throw new Error(`Macro no encontrada: ${name}`);
  }

  const result = await macro.execute({ args });

  return {
    macroId: macro.id,
    result: result ?? null,
  };
}
