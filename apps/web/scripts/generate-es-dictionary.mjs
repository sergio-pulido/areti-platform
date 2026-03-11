#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(scriptDirectory, "..", "src");
const OUTPUT = path.resolve(ROOT, "lib/i18n/es-dictionary.json");
const CONCURRENCY = 12;

const ALLOWED_JSX_ATTRS = new Set(["aria-label", "placeholder", "title", "alt", "label", "value"]);
const CSS_PREFIX_RE =
  /^(bg|text|border|rounded|px|py|pt|pr|pb|pl|mx|my|mt|mr|mb|ml|max|min|w|h|grid|flex|items|justify|gap|focus|hover|shadow|animate|absolute|relative|inline|block|hidden|z|top|left|right|bottom|ring|tracking|font|leading|whitespace|overflow|cursor|transition|duration|ease)-/;

function normalize(text) {
  return text.replace(/\s+/g, " ").trim();
}

function looksLikeCssToken(token) {
  return /^[a-z0-9_[\]().%:/#-]+$/.test(token) && (token.includes("-") || token.includes("/"));
}

function shouldInclude(text) {
  if (text.length < 2 || text.length > 220) return false;
  if (!/[A-Za-z]/.test(text)) return false;
  if (/^(use client|use server)$/.test(text)) return false;

  if (text.startsWith("/") || text.startsWith("&") || text.startsWith("?")) return false;
  if (/^https?:\/\//.test(text)) return false;
  if (/^https?:/.test(text)) return false;
  if (/^\/?[a-z0-9_\-/]+$/i.test(text) && (text.includes("/") || text.startsWith("."))) return false;

  if (/^[A-Z0-9_]+$/.test(text)) return false;
  if (/^#[0-9A-Fa-f]{3,8}$/.test(text)) return false;
  if (/^[a-z0-9:_-]+$/.test(text) && (text.includes("_") || text.includes(":") || /\d/.test(text))) return false;

  if (/[{};$]|=>/.test(text)) return false;
  if (/\b(function|const|return|import|export|await|Promise<|parse|schema|token|payload|cookie|session|tsconfig)\b/i.test(text)) return false;
  if (/[\[\]]/.test(text)) return false;

  const tokens = text.split(" ").filter(Boolean);

  if (tokens.length >= 2 && tokens.every((token) => looksLikeCssToken(token) || CSS_PREFIX_RE.test(token))) {
    return false;
  }

  if (tokens.length === 1) {
    const token = tokens[0];
    if (CSS_PREFIX_RE.test(token) || looksLikeCssToken(token)) return false;
    if (/^[a-z]+$/.test(token) && token.length <= 20 && token[0] === token[0].toLowerCase()) return false;
  }

  if (/^[a-z0-9\-:()[\]/.%#]+$/i.test(text) && !/\s/.test(text) && text.toLowerCase() === text) return false;

  return true;
}

function shouldSkipByParent(node) {
  const parent = node.parent;
  if (!parent) return false;

  if (
    ts.isImportDeclaration(parent) ||
    ts.isExportDeclaration(parent) ||
    ts.isImportSpecifier(parent) ||
    ts.isNamespaceImport(parent) ||
    ts.isImportClause(parent) ||
    ts.isLiteralTypeNode(parent)
  ) {
    return true;
  }

  if (ts.isJsxAttribute(parent)) {
    const name = parent.name.getText();
    if (!ALLOWED_JSX_ATTRS.has(name)) {
      return true;
    }
  }

  if (ts.isPropertyAssignment(parent)) {
    const key = parent.name.getText().replace(/['"]/g, "");
    if (["href", "src", "id", "name", "method", "action", "type", "key", "icon"].includes(key)) {
      return true;
    }
  }

  return false;
}

async function collectFiles(dir, bucket = []) {
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const full = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      if (entry.name === ".next" || entry.name === "node_modules") continue;
      await collectFiles(full, bucket);
      continue;
    }

    if (/\.(ts|tsx)$/.test(entry.name)) {
      bucket.push(full);
    }
  }

  return bucket;
}

async function collectPhrases() {
  const files = await collectFiles(ROOT);
  const phrases = new Set();

  for (const file of files) {
    const content = await fs.readFile(file, "utf8");
    const source = ts.createSourceFile(
      file,
      content,
      ts.ScriptTarget.Latest,
      true,
      file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
    );

    const visit = (node) => {
      if (!shouldSkipByParent(node)) {
        if (ts.isStringLiteralLike(node)) {
          const text = normalize(node.text || "");
          if (shouldInclude(text)) {
            phrases.add(text);
          }
        } else if (ts.isJsxText(node)) {
          const text = normalize(node.getText(source));
          if (shouldInclude(text)) {
            phrases.add(text);
          }
        }
      }

      ts.forEachChild(node, visit);
    };

    visit(source);
  }

  return [...phrases].sort((a, b) => a.localeCompare(b));
}

async function translate(text) {
  const query = encodeURIComponent(text);
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=es&dt=t&q=${query}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`Translation API failed (${response.status}) for: ${text}`);
  }

  const data = await response.json();
  const translated = Array.isArray(data?.[0]) ? data[0].map((chunk) => chunk?.[0] ?? "").join("") : "";
  return (translated && translated.trim()) || text;
}

async function mapConcurrent(items, worker, concurrency) {
  const queue = [...items];
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (queue.length > 0) {
      const item = queue.shift();
      if (!item) continue;
      await worker(item);
    }
  });

  await Promise.all(workers);
}

async function main() {
  const phrases = await collectPhrases();
  const useFreshDictionary = process.argv.includes("--fresh");
  const existing = useFreshDictionary
    ? {}
    : await fs
        .readFile(OUTPUT, "utf8")
        .then((raw) => JSON.parse(raw))
        .catch(() => ({}));

  const dictionary = { ...existing };
  const pending = phrases.filter((phrase) => !dictionary[phrase]);

  console.log(`Phrases: ${phrases.length}`);
  console.log(`Pending: ${pending.length}`);

  let completed = 0;

  await mapConcurrent(
    pending,
    async (phrase) => {
      try {
        dictionary[phrase] = await translate(phrase);
      } catch {
        dictionary[phrase] = phrase;
      }

      completed += 1;

      if (completed % 100 === 0 || completed === pending.length) {
        await fs.mkdir(path.dirname(OUTPUT), { recursive: true });
        await fs.writeFile(OUTPUT, `${JSON.stringify(dictionary, null, 2)}\n`, "utf8");
        console.log(`Progress: ${completed}/${pending.length}`);
      }
    },
    CONCURRENCY,
  );

  await fs.mkdir(path.dirname(OUTPUT), { recursive: true });
  await fs.writeFile(OUTPUT, `${JSON.stringify(dictionary, null, 2)}\n`, "utf8");
  console.log(`Written: ${Object.keys(dictionary).length}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
