/**
 * JSDoc Chunker — parsea bloques JSDoc de un archivo JS/MJS
 * y produce chunks listos para embedding.
 *
 * Cada chunk = un símbolo documentado (clase, método, propiedad, typedef).
 */

const FOUNDRY_VERSION = "13.351";

/**
 * Extrae bloques JSDoc (/** ... *\/) de un source string.
 * Retorna array de { comment, code, line }
 */
function extractJSDocBlocks(source) {
  const blocks = [];
  const lines = source.split("\n");
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];
    // Detectar inicio de JSDoc: línea que contiene /**
    if (line.includes("/**")) {
      const startLine = i;
      const commentLines = [];
      // Recoger hasta el cierre */
      while (i < lines.length && !lines[i].includes("*/")) {
        commentLines.push(lines[i]);
        i++;
      }
      if (i < lines.length) {
        commentLines.push(lines[i]); // línea con */
        i++;
      }
      // Recoger la siguiente línea de código (skip comentarios de separación)
      let codeLine = "";
      while (i < lines.length) {
        const cl = lines[i].trim();
        if (cl === "" || cl.startsWith("/*") || cl.startsWith("//") || cl.startsWith("*")) {
          i++;
          continue;
        }
        codeLine = lines[i];
        break;
      }
      const comment = commentLines.join("\n");
      blocks.push({ comment, code: codeLine, line: startLine });
    } else {
      i++;
    }
  }
  return blocks;
}

/**
 * Parsea un bloque JSDoc y extrae sus componentes.
 */
function parseJSDoc(comment) {
  const result = {
    description: "",
    params: [],
    returns: null,
    type: null,
    see: [],
    examples: [],
    tags: {},
  };

  // Limpiar delimitadores
  const clean = comment
    .replace(/\/\*\*/, "")
    .replace(/\*\//, "")
    .split("\n")
    .map((l) => l.replace(/^\s*\*\s?/, "").trim())
    .filter((l) => l !== "");

  let currentTag = null;
  let descriptionLines = [];

  for (const line of clean) {
    const tagMatch = line.match(/^@(\w+)\s*(.*)/);

    if (tagMatch) {
      const [, tag, rest] = tagMatch;
      currentTag = tag;

      switch (tag) {
        case "param": {
          // @param {Type} name  Description
          const m = rest.match(/^\{([^}]+)\}\s*(\S+)\s*(.*)/);
          if (m) {
            result.params.push({ type: m[1], name: m[2], description: m[3] });
          } else {
            result.params.push({ type: "", name: rest, description: "" });
          }
          break;
        }
        case "returns":
        case "return": {
          const m = rest.match(/^\{([^}]+)\}\s*(.*)/);
          result.returns = { type: m?.[1] ?? "", description: m?.[2] ?? rest };
          break;
        }
        case "type": {
          const m = rest.match(/^\{([^}]+)\}/);
          result.type = m?.[1] ?? rest;
          break;
        }
        case "see": {
          result.see.push(rest);
          break;
        }
        case "example": {
          result.examples.push(rest);
          break;
        }
        default:
          result.tags[tag] = rest;
      }
    } else if (currentTag === "example") {
      result.examples[result.examples.length - 1] += "\n" + line;
    } else if (!currentTag) {
      descriptionLines.push(line);
    }
  }

  result.description = descriptionLines.join(" ").trim();
  return result;
}

/**
 * Extrae el nombre del símbolo de la línea de código siguiente al JSDoc.
 */
function extractSymbol(codeLine, context) {
  if (!codeLine) return { name: null, kind: "unknown", parent: null };

  const code = codeLine.trim();

  // class Foo extends Bar
  let m = code.match(/^class\s+(\w+)/);
  if (m) return { name: m[1], kind: "class", parent: null };

  // static methodName(args) {
  m = code.match(/^static\s+(\w+)\s*\(/);
  if (m) return { name: m[1], kind: "static-method", parent: context?.currentClass };

  // async methodName(args) {
  m = code.match(/^async\s+(\w+)\s*\(/);
  if (m) return { name: m[1], kind: "async-method", parent: context?.currentClass };

  // methodName(args) {
  m = code.match(/^(\w+)\s*\(/);
  if (m) return { name: m[1], kind: "method", parent: context?.currentClass };

  // get propertyName() {
  m = code.match(/^get\s+(\w+)/);
  if (m) return { name: m[1], kind: "getter", parent: context?.currentClass };

  // set propertyName(val) {
  m = code.match(/^set\s+(\w+)/);
  if (m) return { name: m[1], kind: "setter", parent: context?.currentClass };

  // propertyName = value  (class field)
  m = code.match(/^(\w+)\s*=/);
  if (m) return { name: m[1], kind: "field", parent: context?.currentClass };

  // const/var/let Foo = ...
  m = code.match(/^(?:const|let|var)\s+(\w+)/);
  if (m) return { name: m[1], kind: "constant", parent: null };

  return { name: null, kind: "unknown", parent: context?.currentClass };
}

/**
 * Construye el texto para embedding a partir de un símbolo parseado.
 */
function buildEmbeddingText(symbol, parsed, code) {
  const parts = [];

  // Fully qualified name
  const fqn = symbol.parent ? `${symbol.parent}.${symbol.name}` : symbol.name;
  if (fqn) parts.push(fqn);

  // Kind
  parts.push(`[${symbol.kind}]`);

  // Description
  if (parsed.description) parts.push(parsed.description);

  // Params
  for (const p of parsed.params) {
    parts.push(`@param ${p.name}: ${p.type} ${p.description}`);
  }

  // Returns
  if (parsed.returns) {
    parts.push(`@returns ${parsed.returns.type} ${parsed.returns.description}`);
  }

  // Type
  if (parsed.type) parts.push(`@type {${parsed.type}}`);

  // See
  for (const s of parsed.see) parts.push(`@see ${s}`);

  // Code signature (first line only, cleaned)
  if (code) parts.push(code.trim().slice(0, 200));

  return parts.join("\n");
}

/**
 * Chunka un archivo source JS/MJS.
 * @returns {Array<{id, text, symbol, kind, parent, description, params, returns, line, source, foundry_version, module}>}
 */
export function chunkSource(source, { module = "core", sourceFile = "", filePath = "" } = {}) {
  const blocks = extractJSDocBlocks(source);
  const chunks = [];
  const context = { currentClass: null };

  for (const block of blocks) {
    // Track current class
    const classMatch = block.code?.match(/^class\s+(\w+)/);
    if (classMatch) {
      context.currentClass = classMatch[1];
    }

    const parsed = parseJSDoc(block.comment);
    const symbol = extractSymbol(block.code, context);

    // Skip blocks sin nombre o sin descripción
    if (!symbol.name && !parsed.description) continue;
    if (!parsed.description && symbol.kind === "unknown") continue;

    const fqn = symbol.parent ? `${symbol.parent}.${symbol.name}` : symbol.name;
    const text = buildEmbeddingText(symbol, parsed, block.code);

    chunks.push({
      id: `${module}:${filePath}:${block.line}`,
      text,
      symbol: fqn || symbol.name || "",
      kind: symbol.kind,
      parent: symbol.parent || "",
      description: parsed.description,
      params: parsed.params,
      returns: parsed.returns,
      line: block.line,
      source: sourceFile || filePath,
      foundry_version: FOUNDRY_VERSION,
      module,
    });
  }

  return chunks;
}
