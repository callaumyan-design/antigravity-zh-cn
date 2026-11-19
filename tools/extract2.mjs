// 第二轮：1) 未收录的所有类 UI 字面量  2) 含 ${} 的模板字符串 -> 规则候选
import fs from 'node:fs';
const s = fs.readFileSync('src/main.js', 'utf8');
const have = new Set(Object.keys(JSON.parse(fs.readFileSync('dict/zh-CN.json', 'utf8'))));
const seen = new Set(JSON.parse(fs.readFileSync('work/todo.json', 'utf8')));
const lits = new Map();
for (const m of s.matchAll(/"((?:[^"\\\n]|\\.){2,200})"|'((?:[^'\\\n]|\\.){2,200})'/g)) {
  const v = m[1] ?? m[2];
  if (/\\/.test(v)) continue;
  // UI 样式：首字母大写单词开头，由字母/空格/常见标点组成
  if (!/^[A-Z][a-zA-Z'’]+([ \-][A-Za-z0-9'’()&/,.:;!?…-]+)*[.!?…:]?$/.test(v)) continue;
  if (/^[A-Z][a-z]+[A-Z]/.test(v) && !/ /.test(v)) continue;      // PascalCase 标识符
  if (/^[A-Z][A-Za-z]+$/.test(v) && v.length > 14) continue;
  if (have.has(v) || seen.has(v)) continue;
  lits.set(v, (lits.get(v) || 0) + 1);
}
const junk = /\b(colou?r|Supplement|Extended|Ideographs|Syllables|Forms|Italic|Layout|simplex|Iterator|prototype|Descriptor|Proto|undefined|Invalid (array|typed)|Webkit|Moz|Microsoft|Segoe|Helvetica|Arial)\b/;
const cand = [...lits.keys()].filter(v => !junk.test(v));
// 模板字符串
const tpls = new Set();
for (const m of s.matchAll(/`([^`\\]{0,240}?\$\{[^`]{0,240}?)`/g)) {
  const t = m[1];
  const plain = t.replace(/\$\{[^}]*\}/g, '');
  if (!/[A-Z][a-z]+ [a-z]+/.test(plain) && !/\b[a-z]+ [a-z]+ [a-z]+\b/.test(plain)) continue;
  if (/[<>{};=]|https?:|--|^\s*\.|class|px|rgb|var\(|\bms\b/.test(plain)) continue;
  tpls.add(t);
}
fs.writeFileSync('work/lits2.json', JSON.stringify(cand));
fs.writeFileSync('work/tpls.json', JSON.stringify([...tpls]));
console.log('lits', cand.length, 'tpls', tpls.size);
const N = 6, per = Math.ceil(cand.length / N);
for (let i = 0; i < N; i++) fs.writeFileSync(`work/l2_${i}.json`, JSON.stringify(cand.slice(i * per, (i + 1) * per)));
const T = [...tpls], M = 3, tp = Math.ceil(T.length / M);
for (let i = 0; i < M; i++) fs.writeFileSync(`work/t_${i}.json`, JSON.stringify(T.slice(i * tp, (i + 1) * tp)));
