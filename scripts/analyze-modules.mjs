#!/usr/bin/env node
/**
 * analyze-modules.mjs — Análisis estático de módulos de FoundryVTT.
 *
 * Escanea el directorio de módulos, extrae API surface de cada bundle JS,
 * y genera archivos knowledge/analyzed/<module-id>.md.
 *
 * Uso:
 *   node analyze-modules.mjs --foundry-dir /root/foundryuserdata --output ./knowledge/analyzed
 *
 * También compara versiones con knowledge curado (./knowledge/*.md).
 */

import { readdir, readFile, writeFile, mkdir, stat } from "node:fs/promises";
import { join, basename, dirname } from "node:path";
import { existsSync } from "node:fs";

// ─── Args ─────────────────────────────────────────────────────
const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.split("=");
    return [k.replace(/^--/, ""), v];
  })
);

const FOUNDRY_DIR = args["foundry-dir"] ?? "/root/foundryuserdata";
const MODULES_DIR = join(FOUNDRY_DIR, "Data/modules");
const SYSTEMS_DIR = join(FOUNDRY_DIR, "Data/systems");
const OUTPUT_DIR = args["output"] ?? "./knowledge/analyzed";
const CURATED_DIR = args["curated"] ?? "./knowledge";

// ─── Curated knowledge map (module-id → version) ──────────────
const CURATED_VERSIONS = {
  "midi-qol": "13.0.61",
  "sequencer": "4.0.1",
  "JB2A_DnD5e": "0.8.9",
  "dae": "13.0.27",
  "ActiveAuras": "0.12.7",
  "times-up": "13.1.9",
  "plutonium": "2.15.0",
  "tagger": "1.5.4",
  "autoanimations": "6.8.5",
  "chris-premades": "1.5.27",
};

// ─── Static analysis helpers ──────────────────────────────────

/** Extract globalThis assignments from JS bundle */
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

/** Extract Hooks.on registrations */
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

/** Extract class definitions */
function extractClasses(code) {
  const classes = new Set();
  const p = /\bclass\s+(\w+)/g;
  let m;
  while ((m = p.exec(code)) !== null) classes.add(m[1]);
  return [...classes].sort();
}

/** Extract game.modules.get().api assignments */
function extractApiExports(code) {
  const apis = new Set();
  const p = /game\.modules\.get\(\s*["'`]([^"'`]+)["'`]\s*\)\.api\s*=/g;
  let m;
  while ((m = p.exec(code)) !== null) apis.add(m[1]);
  return [...apis];
}

/** Extract static async methods (public API) */
function extractPublicMethods(code) {
  const methods = new Set();
  const p = /static\s+async\s+(?:api_|p)(\w+)\s*\(/g;
  let m;
  while ((m = p.exec(code)) !== null) methods.add(`api_${m[1]}`);
  return [...methods].sort();
}

// ─── Module analysis ──────────────────────────────────────────

async function analyzeModule(moduleDir) {
  const moduleJsonPath = join(moduleDir, "module.json");
  if (!existsSync(moduleJsonPath)) return null;

  let moduleJson;
  try {
    moduleJson = JSON.parse(await readFile(moduleJsonPath, "utf8"));
  } catch {
    return null;
  }

  const id = moduleJson.id ?? basename(moduleDir);
  const title = moduleJson.title ?? id;
  const version = moduleJson.version ?? "unknown";
  const compat = moduleJson.compatibility ?? {};

  // Find main JS files (esmodules + scripts)
  const jsFiles = [
    ...(moduleJson.esmodules ?? []),
    ...(moduleJson.scripts ?? []),
  ].map((f) => join(moduleDir, f));

  // Also check for common bundle names
  for (const name of ["js/Bundle.js", "js/bundle.js", "main.js", "module.js"]) {
    const p = join(moduleDir, name);
    if (existsSync(p) && !jsFiles.includes(p)) jsFiles.push(p);
  }

  // Read and analyze JS files
  let allCode = "";
  for (const f of jsFiles) {
    try {
      allCode += "\n" + (await readFile(f, "utf8"));
    } catch { /* skip */ }
  }

  // Also check dist/ directory
  const distDir = join(moduleDir, "dist");
  if (existsSync(distDir)) {
    try {
      for (const f of await readdir(distDir)) {
        if (f.endsWith(".js")) {
          try {
            allCode += "\n" + (await readFile(join(distDir, f), "utf8"));
          } catch { /* skip */ }
        }
      }
    } catch { /* skip */ }
  }

  // Extract API surface
  const globals = extractGlobals(allCode);
  const hooks = extractHooks(allCode);
  const classes = extractClasses(allCode);
  const apiExports = extractApiExports(allCode);
  const publicMethods = extractPublicMethods(allCode);

  // Read README if exists
  let readme = null;
  for (const name of ["README.md", "readme.md"]) {
    const p = join(moduleDir, name);
    if (existsSync(p)) {
      try {
        readme = (await readFile(p, "utf8")).slice(0, 5000); // first 5KB
      } catch { /* skip */ }
      break;
    }
  }

  // Check version vs curated
  const curatedVersion = CURATED_VERSIONS[id];
  let versionStatus = "unknown";
  if (curatedVersion) {
    if (version === curatedVersion) versionStatus = "match";
    else versionStatus = "diff";
  } else {
    versionStatus = "no-curated";
  }

  return {
    id,
    title,
    version,
    compat,
    globals,
    hooks,
    classes,
    apiExports,
    publicMethods,
    readme,
    curatedVersion,
    versionStatus,
    dependencies: moduleJson.dependencies ?? [],
    jsFileCount: jsFiles.length,
  };
}

// ─── Generate markdown ────────────────────────────────────────

function generateMarkdown(result) {
  const lines = [];
  lines.push(`# ${result.title} (${result.id}) — v${result.version}`);
  lines.push("");
  lines.push("> Generado automáticamente por `analyze-modules.mjs`");
  lines.push("");

  // Version check
  if (result.versionStatus === "match") {
    lines.push("✅ **Versión coincide con conocimiento curado**");
  } else if (result.versionStatus === "diff") {
    lines.push(`⚠️ **Versión difiere del curado**: instalado ${result.version} vs curado ${result.curatedVersion}`);
  } else if (result.versionStatus === "no-curated") {
    lines.push("ℹ️ **Módulo no encontrado en conocimiento curado** — conocimiento auto-generado únicamente");
  }
  lines.push("");

  // Compatibility
  if (result.compat?.minimum) {
    lines.push(`**Compatibilidad**: Foundry ${result.compat.minimum}–${result.compat.maximum ?? "∞"} (verificado: ${result.compat.verified ?? "?"})`);
    lines.push("");
  }

  // Dependencies
  if (result.dependencies.length > 0) {
    lines.push("## Dependencias");
    for (const d of result.dependencies) {
      lines.push(`- ${d.id ?? d.name ?? d} (${d.reason ?? "required"})`);
    }
    lines.push("");
  }

  // API Surface
  if (result.globals.length > 0 || result.apiExports.length > 0) {
    lines.push("## API Surface");
    if (result.globals.length > 0) {
      lines.push("### Globals");
      for (const g of result.globals) lines.push(`- \`globalThis.${g}\` / \`game.${g}\``);
    }
    if (result.apiExports.length > 0) {
      lines.push("### Module API");
      for (const a of result.apiExports) lines.push(`- \`game.modules.get("${a}").api\``);
    }
    lines.push("");
  }

  // Public methods
  if (result.publicMethods.length > 0) {
    lines.push("## Public Methods");
    for (const m of result.publicMethods.slice(0, 30)) lines.push(`- \`${m}()\``);
    if (result.publicMethods.length > 30) lines.push(`- ... y ${result.publicMethods.length - 30} más`);
    lines.push("");
  }

  // Hooks
  if (result.hooks.length > 0) {
    lines.push(`## Hooks (${result.hooks.length} encontrados)`);
    for (const h of result.hooks.slice(0, 50)) lines.push(`- \`${h}\``);
    if (result.hooks.length > 50) lines.push(`- ... y ${result.hooks.length - 50} más`);
    lines.push("");
  }

  // Classes
  if (result.classes.length > 0) {
    lines.push(`## Classes (${result.classes.length} encontradas)`);
    for (const c of result.classes.slice(0, 30)) lines.push(`- \`${c}\``);
    if (result.classes.length > 30) lines.push(`- ... y ${result.classes.length - 30} más`);
    lines.push("");
  }

  // README excerpt
  if (result.readme) {
    lines.push("## README (excerpt)");
    lines.push("```markdown");
    lines.push(result.readme.slice(0, 3000));
    lines.push("```");
    lines.push("");
  }

  return lines.join("\n");
}

// ─── Main ─────────────────────────────────────────────────────

async function main() {
  console.log("[analyze] Escaneando módulos en:", MODULES_DIR);
  await mkdir(OUTPUT_DIR, { recursive: true });

  const entries = await readdir(MODULES_DIR, { withFileTypes: true });
  const moduleDirs = entries.filter((e) => e.isDirectory()).map((e) => join(MODULES_DIR, e.name));

  const results = [];
  const summary = { total: 0, analyzed: 0, match: 0, diff: 0, noCurated: 0, errors: 0 };

  for (const dir of moduleDirs) {
    summary.total++;
    try {
      const result = await analyzeModule(dir);
      if (!result) continue;

      summary.analyzed++;
      if (result.versionStatus === "match") summary.match++;
      else if (result.versionStatus === "diff") summary.diff++;
      else if (result.versionStatus === "no-curated") summary.noCurated++;

      const md = generateMarkdown(result);
      const outPath = join(OUTPUT_DIR, `${result.id}.md`);
      await writeFile(outPath, md, "utf8");
      console.log(`[analyze] ✓ ${result.id} v${result.version} → ${outPath}`);

      results.push(result);
    } catch (err) {
      summary.errors++;
      console.error(`[analyze] ✗ ${basename(dir)}: ${err.message}`);
    }
  }

  // Also analyze systems
  const systemEntries = await readdir(SYSTEMS_DIR, { withFileTypes: true }).catch(() => []);
  for (const e of systemEntries) {
    if (!e.isDirectory()) continue;
    const dir = join(SYSTEMS_DIR, e.name);
    try {
      const result = await analyzeModule(dir);
      if (!result) continue;
      const md = generateMarkdown(result);
      const outPath = join(OUTPUT_DIR, `system-${result.id}.md`);
      await writeFile(outPath, md, "utf8");
      console.log(`[analyze] ✓ system:${result.id} v${result.version} → ${outPath}`);
    } catch { /* skip */ }
  }

  // Summary
  console.log("\n[analyze] === Resumen ===");
  console.log(`  Total escaneados: ${summary.total}`);
  console.log(`  Analizados: ${summary.analyzed}`);
  console.log(`  Versión coincide: ${summary.match}`);
  console.log(`  Versión difiere: ${summary.diff}`);
  console.log(`  Sin conocimiento curado: ${summary.noCurated}`);
  console.log(`  Errores: ${summary.errors}`);

  // Write summary JSON
  const summaryPath = join(OUTPUT_DIR, "_summary.json");
  await writeFile(summaryPath, JSON.stringify(summary, null, 2), "utf8");
  console.log(`\n[analyze] Resumen escrito en ${summaryPath}`);
}

main().catch((err) => {
  console.error("[analyze] Error fatal:", err);
  process.exit(1);
});
