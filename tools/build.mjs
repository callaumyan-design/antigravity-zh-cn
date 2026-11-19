// 用本机已安装的 Antigravity 生成汉化版 app.asar。
// 用法：node tools/build.mjs [原版 app.asar 路径] [输出 app.asar 路径]
//   默认输入：%LOCALAPPDATA%\Programs\antigravity\resources\app.asar.en-backup（没有则用 app.asar）
//   默认输出：out\app.asar
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execSync } from 'node:child_process';
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, '$1')), '..');
const W = p => path.join(root, p);
const readJson = p => JSON.parse(fs.readFileSync(p, 'utf8').replace(/^\uFEFF/, ''));

// 1. 词典：机器翻译主词典 + 人工校正（overrides*.json 优先）
const dict = readJson(W('dict/zh-CN.json'));
for (const f of fs.readdirSync(W('dict')).filter(f => /^overrides.*\.json$/.test(f)).sort())
  Object.assign(dict, readJson(W('dict/' + f)));

// 2. 规则：人工规则在前（优先匹配），过滤非法、空匹配或过短的规则
const rules = [], seen = new Set();
for (const f of [W('dict/rules.base.json'), W('dict/rules.json')]) {
  if (!fs.existsSync(f)) continue;
  for (const r of readJson(f)) {
    if (!Array.isArray(r) || r.length !== 2 || seen.has(r[0])) continue;
    try {
      const re = new RegExp('^' + r[0] + '$');
      if (re.test('') || r[0].replace(/\(.*?\)/g, '').replace(/\\./g, 'x').length < 4) continue;
    } catch { continue; }
    seen.add(r[0]); rules.push(r);
  }
}
console.log(`词典 ${Object.keys(dict).length} 条，规则 ${rules.length} 条`);

// 3. 定位原版 asar
const res = path.join(process.env.LOCALAPPDATA || '', 'Programs', 'antigravity', 'resources');
const src = process.argv[2] || [path.join(res, 'app.asar.en-backup'), path.join(res, 'app.asar')].find(p => fs.existsSync(p));
if (!src || !fs.existsSync(src)) throw new Error('找不到 Antigravity 的 app.asar，请把路径作为第一个参数传入');
const dest = path.resolve(process.argv[3] || W('out/app.asar'));
const MARK = '\n// ==== Antigravity 简体中文汉化注入';

// 4. 在临时目录解包（asar 需要旁边的 .unpacked 目录，一并复制）
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'agy-zh-'));
const srcCopy = path.join(tmp, 'app.asar');
fs.copyFileSync(src, srcCopy);
const unpacked = path.join(path.dirname(src), 'app.asar.unpacked');
if (fs.existsSync(unpacked)) fs.cpSync(unpacked, srcCopy + '.unpacked', { recursive: true });
const out = path.join(tmp, 'app');
const asar = 'npx.cmd -y @electron/asar';
execSync(`${asar} extract "${srcCopy}" "${out}"`, { stdio: 'inherit', shell: true });

const pre = path.join(out, 'dist', 'preload.js');
let s = fs.readFileSync(pre, 'utf8');
if (s.includes(MARK)) throw new Error(`输入文件已经是汉化版：${src}。请改用英文原版（app.asar.en-backup）`);
const tpl = fs.readFileSync(W('tools/injector.template.js'), 'utf8')
  .replace('/*__DICT__*/ {}', JSON.stringify(dict))
  .replace('/*__RULES__*/ []', JSON.stringify(rules));
fs.writeFileSync(pre, s + tpl);
execSync(`node "${W('tools/patch-main.mjs')}" "${path.join(out, 'dist')}"`, { stdio: 'inherit' });
execSync(`node --check "${pre}"`, { stdio: 'inherit' });

// 5. 打包（chrome-devtools-mcp 保持在 .unpacked 中，与原版一致）
fs.mkdirSync(path.dirname(dest), { recursive: true });
const packed = path.join(tmp, 'packed.asar');
execSync(`${asar} pack "${out}" "${packed}" --unpack-dir "node_modules/chrome-devtools-mcp"`, { stdio: 'inherit', shell: true });
fs.copyFileSync(packed, dest);
fs.rmSync(tmp, { recursive: true, force: true });
console.log(`已生成 ${dest}（${fs.statSync(dest).size} 字节）`);
