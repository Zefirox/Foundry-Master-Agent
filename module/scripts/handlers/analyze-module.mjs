/**
 * analyze_module — Extrae API surface de un módulo específico.
 *
 * args: { moduleId: string }
 *
 * Returns: {
 *   id, title, version,
 *   globals: string[],
 *   hooks: string[],
 *   classes: string[],
 *   apiExports: string[],
 *   publicMethods: string[],
 *   readme: string | null,
 *   dependencies: object[],
 * }
 */

export async function analyzeModule({ moduleId }) {
  const mod = game.modules.get(moduleId);
  if (!mod) throw new Error(`Módulo "${moduleId}" no encontrado.`);
  if (!mod.active) throw new Error(`Módulo "${moduleId}" no está activo.`);

  // Leer module.json via fetch
  const url = `${window.location.origin}/modules/${moduleId}/module.json`;
  let moduleJson;
  try {
    moduleJson = await (await fetch(url)).json();
  } catch {
    moduleJson = { id: mod.id, title: mod.title, version: mod.version };
  }

  // Identificar archivos JS principales
  const jsFiles = [
    ...(moduleJson.esmodules ?? []),
    ...(moduleJson.scripts ?? []),
  ];

  // También intentar nombres comunes
  const commonNames = ["js/Bundle.js", "js/bundle.js", "main.js", "module.js"];
  for (const name of commonNames) jsFiles.push(name);

  // Leer y concatenar JS
  let allCode = "";
  for (const f of jsFiles) {
    try {
      const fileUrl = `${window.location.origin}/modules/${moduleId}/${f}`;
      const res = await fetch(fileUrl);
      if (res.ok) allCode += "\n" + (await res.text());
    } catch { /* skip */ }
  }

  // También intentar dist/
  try {
    const distUrl = `${window.location.origin}/modules/${moduleId}/dist/`;
    // No podemos listar directorios via HTTP, intentar nombres comunes
    for (const name of ["sequencer.js", "bundle.js", "main.js", "index.js"]) {
      try {
        const res = await fetch(`${distUrl}${name}`);
        if (res.ok) allCode += "\n" + (await res.text());
      } catch { /* skip */ }
    }
  } catch { /* skip */ }

  // Extraer API surface
  const globals = extractGlobals(allCode);
  const hooks = extractHooks(allCode);
  const classes = extractClasses(allCode);
  const apiExports = extractApiExports(allCode);
  const publicMethods = extractPublicMethods(allCode);

  // Leer README si existe
  let readme = null;
  try {
    const res = await fetch(`${window.location.origin}/modules/${moduleId}/README.md`);
    if (res.ok) readme = (await res.text()).slice(0, 10000);
  } catch { /* skip */ }

  return {
    id: mod.id,
    title: mod.title,
    version: mod.version,
    globals,
    hooks,
    classes: classes.slice(0, 50),
    apiExports,
    publicMethods: publicMethods.slice(0, 50),
    readme,
    dependencies: moduleJson.dependencies ?? [],
    jsSize: allCode.length,
  };
}

// ─── Extraction helpers (mismos que analyze-modules.mjs) ──────

function extractGlobals(code) {
  const globals = new Set();
  const patterns = [
    /globalThis\.(\w+)\s*=/g,
    /window\.(\w+)\s*=/g,
    /game\.(\w+)\s*=\s*[^;]+(?:Api|API|api)/g,
  ];
  for (const p of patterns) {
    let m;
    while ((m = p.exec(code)) !== null) globals.add(m[1]);
  }
  return [...globals];
}

function extractHooks(code) {
  const hooks = new Set();
  const patterns = [
    /Hooks\.on\(\s*["'`]([^"'`]+)["'`]/g,
    /Hooks\.call(?:All)?\(\s*["'`]([^"'`]+)["'`]/g,
    /Hooks\.once\(\s*["'`]([^"'`]+)["'`]/g,
  ];
  for (const p of patterns) {
    let m;
    while ((m = p.exec(code)) !== null) hooks.add(m[1]);
  }
  return [...hooks].sort();
}

function extractClasses(code) {
  const classes = new Set();
  const p = /\bclass\s+(\w+)/g;
  let m;
  while ((m = p.exec(code)) !== null) classes.add(m[1]);
  return [...classes].sort();
}

function extractApiExports(code) {
  const apis = new Set();
  const p = /game\.modules\.get\(\s*["'`]([^"'`]+)["'`]\s*\)\.api\s*=/g;
  let m;
  while ((m = p.exec(code)) !== null) apis.add(m[1]);
  return [...apis];
}

function extractPublicMethods(code) {
  const methods = new Set();
  const p = /static\s+async\s+(?:api_|p)(\w+)\s*\(/g;
  let m;
  while ((m = p.exec(code)) !== null) methods.add(`api_${m[1]}`);
  return [...methods].sort();
}
