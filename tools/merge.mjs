// 维护用：把 work/ 下各批机器翻译结果合并成 dict/zh-CN.json 与 dict/rules.json。
// 构建与安装不需要运行它，只读取 dict/ 下已提交的文件。
import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, '$1')), '..');
const W = p => path.join(root, p);
const todo = new Set(JSON.parse(fs.readFileSync(W('work/todo.json'), 'utf8')));
for (const extra of ['work/miss.json', 'work/miss1.json', 'work/lits2.json'])
  if (fs.existsSync(W(extra))) for (const x of JSON.parse(fs.readFileSync(W(extra), 'utf8'))) todo.add(x);
const dict = {};
let bad = 0, total = 0;
for (const f of fs.readdirSync(W('work')).filter(f => /^zh\d?_?\d+\.json$/.test(f)).sort()) {
  for (const [k, v] of Object.entries(JSON.parse(fs.readFileSync(W('work/' + f), 'utf8')))) {
    total++;
    if (!todo.has(k) || typeof v !== 'string' || !v.trim() || v === k) { bad++; continue; }
    dict[k] = v;
  }
}
fs.writeFileSync(W('dict/zh-CN.json'), JSON.stringify(Object.fromEntries(Object.entries(dict).sort()), null, 1));
const rules = [];
for (const f of fs.readdirSync(W('work')).filter(f => /^rules_\d+\.json$/.test(f)).sort())
  for (const r of JSON.parse(fs.readFileSync(W('work/' + f), 'utf8'))) if (Array.isArray(r) && r.length === 2) rules.push(r);
fs.writeFileSync(W('dict/rules.json'), JSON.stringify(rules, null, 1));
console.log(`dict ${Object.keys(dict).length} (from ${total}, dropped ${bad}); rules ${rules.length}`);
