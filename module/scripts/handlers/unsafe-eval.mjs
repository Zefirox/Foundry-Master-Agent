/**
 * UNSAFE: Ejecuta código JS arbitrario en el contexto del GM.
 *
 * DESHABILITADO por defecto. Solo se habilita con el setting allowUnsafe=true.
 * Esto es un escape hatch para operaciones que no tienen un handler tipado.
 *
 * args: {
 *   code: string,  // código JS a ejecutar
 * }
 *
 * El código se ejecuta con `game`, `canvas`, `ui`, `Hooks`, etc. en scope.
 * NO usa eval() directamente — usa Function() que es ligeramente más seguro
 * (no hereda el scope local), pero sigue siendo peligroso.
 *
 * Returns: { result: any }
 */
export async function unsafeEval({ code }) {
  // Doble check — el router ya debería haber bloqueado esto
  if (!game.settings.get("pi-bridge", "allowUnsafe")) {
    throw new Error("unsafe.eval deshabilitado por configuración.");
  }

  console.warn("[pi-bridge] Ejecutando unsafe.eval:", code.slice(0, 200));

  // Function() crea una función en el scope global (no local).
  // game, canvas, ui, Hooks, etc. son globales en Foundry.
  const fn = new Function("game", "canvas", "ui", "Hooks", "foundry", `return (async () => { ${code} })();`);
  const result = await fn(game, canvas, ui, Hooks, foundry);

  return { result: result ?? null };
}
