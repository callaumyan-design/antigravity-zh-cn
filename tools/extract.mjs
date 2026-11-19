// Extract candidate UI strings from minified React bundle.
import fs from 'node:fs';
const s = fs.readFileSync(process.argv[2], 'utf8');
const out = new Map();
const add = (str, kind) => {
  if (!str || /\\/.test(str)) return;
  const t = str.trim();
  if (t.length < 2 || t.length > 300) return;
  if (!/[A-Za-z]{2}/.test(t)) return;
  if (/^[a-z0-9_\-.:/]+$/.test(t) && !/ /.test(t)) return;          // identifiers / classnames / paths
  if (/^[a-z]+([A-Z][a-z0-9]*)+$/.test(t)) return;                   // camelCase
  if (/^[A-Z0-9_]+$/.test(t)) return;                                // CONSTANTS
  if (/[{}<>;=]|\\u|https?:|^\.|\(\)|=>|\$\{/.test(t)) return;
  if (/^(flex|grid|text-|bg-|w-|h-|p-|m-|border|rounded|items-|justify-|gap-)/.test(t)) return;
  if (/\b(flex|px-\d|py-\d|text-(xs|sm|lg)|rounded-|hover:|group-)/.test(t)) return;
  if (!out.has(t)) out.set(t, new Set());
  out.get(t).add(kind);
};
const lit = String.raw`"((?:[^"\\\n]|\\.){2,300})"`;
// createElement child literal(s): ,"Text") or ,"Text",
for (const m of s.matchAll(new RegExp(String.raw`createElement\([^()]{0,200}?\},` + lit, 'g'))) add(m[1], 'child');
for (const m of s.matchAll(new RegExp(String.raw`,null,` + lit, 'g'))) add(m[1], 'child');
for (const m of s.matchAll(new RegExp(String.raw`\)\s*,\s*` + lit + String.raw`\s*[,)]`, 'g'))) add(m[1], 'child2');
const props = ['placeholder', 'title', 'label', 'aria-label', '"aria-label"', 'tooltip', 'description', 'text', 'message', 'header', 'subtitle', 'heading', 'emptyText', 'confirmText', 'cancelText', 'buttonText', 'name', 'displayName', 'hint', 'helperText', 'content', 'body', 'caption', 'actionLabel', 'ariaLabel', 'tooltipText', 'confirmLabel', 'cancelLabel', 'shortLabel', 'detail', 'summary', 'emptyMessage', 'errorMessage', 'successMessage', 'toast'];
for (const p of props) {
  const re = new RegExp('(?:[,{]\\s*)' + p.replace(/[-"]/g, c => '\\' + c) + '\\s*:\\s*' + lit, 'g');
  for (const m of s.matchAll(re)) add(m[1], 'prop:' + p);
}
// template-free sentences anywhere: Capitalized with spaces
for (const m of s.matchAll(new RegExp(lit, 'g'))) {
  const v = m[1];
  if (/^[A-Z][a-z']+( [A-Za-z'â€?.!?\-]+)+[.!?â€¦]?$/.test(v) && v.split(' ').length >= 2) add(v, 'sentence');
}
const arr = [...out].map(([k, v]) => ({ s: k, k: [...v].join('|') }));
fs.writeFileSync(process.argv[3], JSON.stringify(arr, null, 0));
console.log(arr.length);
