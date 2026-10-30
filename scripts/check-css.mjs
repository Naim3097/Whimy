#!/usr/bin/env node
/**
 * Guards the DESIGN.md removal list in every stylesheet under src/:
 * no @keyframes (motion is transitions between states, never a reveal recipe),
 * no backdrop-filter, gradients, dashed borders or outlines, and no box-shadow
 * except the focus keyline on photos. Capitals are allowed: both reference
 * sites set their buttons and labels in caps.
 * Prints file:line for each hit and exits 1 if there are any.
 *
 *   node scripts/check-css.mjs
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const srcDir = join(root, 'src');

const ALLOWED_SHADOWS = new Set(['none', 'inset 0 0 0 2px var(--paper)']);

const rules = [
  { name: '@keyframes', pattern: /@(?:-webkit-)?keyframes\b/g },
  { name: 'backdrop-filter', pattern: /(?:-webkit-)?backdrop-filter\s*:/g },
  { name: 'gradient', pattern: /\b(?:repeating-)?(?:linear|radial|conic)-gradient(?=\s*\()/g },
  { name: 'dashed border or outline', pattern: /\b(?:border|outline)(?:-[a-z-]+)?\s*:[^;{}]*\bdashed\b/g },
  {
    name: 'box-shadow',
    pattern: /(?:-webkit-)?box-shadow\s*:\s*([^;{}]*)/g,
    allow: (match) => ALLOWED_SHADOWS.has(match[1].replace(/!important/, '').replace(/\s+/g, ' ').trim()),
  },
];

/** Blank out comments but keep their newlines, so offsets still map to lines. */
function stripComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, (comment) => comment.replace(/[^\n]/g, ' '));
}

function lineOf(text, index) {
  let line = 1;
  for (let i = 0; i < index; i++) if (text.charCodeAt(i) === 10) line++;
  return line;
}

const files = readdirSync(srcDir, { recursive: true })
  .map(String)
  .filter((file) => file.endsWith('.css'))
  .sort();

const hits = [];
for (const file of files) {
  const path = join(srcDir, file);
  const shown = relative(root, path).split(sep).join('/');
  const css = stripComments(readFileSync(path, 'utf8'));
  const found = [];
  for (const rule of rules) {
    for (const match of css.matchAll(rule.pattern)) {
      if (rule.allow?.(match)) continue;
      found.push({ line: lineOf(css, match.index), rule: rule.name, text: match[0].replace(/\s+/g, ' ').trim() });
    }
  }
  found.sort((a, b) => a.line - b.line);
  for (const { line, rule, text } of found) hits.push(`${shown}:${line}  ${rule === text ? text : `${rule} (${text})`}`);
}

if (hits.length) {
  console.error(`check-css: ${hits.length} forbidden declaration${hits.length === 1 ? '' : 's'} (DESIGN.md, Removal list)`);
  for (const hit of hits) console.error(`  ${hit}`);
  process.exit(1);
}

console.log(`check-css: ${files.length} stylesheets clean`);
