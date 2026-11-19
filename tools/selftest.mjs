// 在 node 里加载注入器的 lookup 逻辑做自测
import fs from 'node:fs';
// 用法：node tools/selftest.mjs <已汉化的 preload.js（可用 npx @electron/asar extract out/app.asar 解包得到）>
const pre = fs.readFileSync(process.argv[2], 'utf8');
const dict = JSON.parse(pre.match(/const DICT = (\{.*?\});\n/s)[1]);
const RULES = JSON.parse(pre.match(/const RULES = (\[.*?\]);\n/s)[1]);
const rules = RULES.map(([p, r]) => [new RegExp('^' + p + '$'), r]);
const has = k => Object.prototype.hasOwnProperty.call(dict, k);
const applyRule = (t, re, r) => { const m = re.exec(t); return r.replace(/\$(T?)(\d)/g, (_, tr, n) => { const g = m[+n] ?? ''; if (!tr) return g; if (has(g)) return dict[g]; for (const [re2, r2] of rules) if (re2 !== re && re2.test(g)) return applyRule(g, re2, r2); return g; }); };
const lookup = t => { if (has(t)) return dict[t]; for (const [re, r] of rules) if (re.test(t)) return applyRule(t, re, r); return null; };
const cases = ['Welcome back, test. Where should we pick up?', 'Select project, current: No Project', 'Where the agent runs, current: This Computer',
  'Shortcut Ctrl+N for New Conversation', 'Install Stripe', 'See 19 more', '20m ago', 'Thought for 3s', 'Worked for 2m 5s',
  'You have used some of your 5-hour limit, it will fully refresh in 4 hours, 39 minutes.', 'Gemini 4 Argon Weekly Limit', 'Send feedback as test@callaum.com',
  'Settings', 'Cancel', 'New conversation', 'Ran command: `ls -la`'];
for (const c of cases) console.log(JSON.stringify(c), '=>', JSON.stringify(lookup(c)));
// 规则问题：替换后仍有大量英文 / 未解析的 $n
let bad = [];
for (const [p, r] of RULES) { if (/[A-Za-z]{4,}/.test(r.replace(/\$T?\d|Antigravity|Gemini|Google|GitHub|MCP|URL|SSH|WSL|API|Swarm|Turbo|Ultra|Pro|Live|PR|IDE|Chrome|CLI/g, '')) ) bad.push([p, r]); }
console.log('rules with residual English:', bad.length); bad.slice(0, 40).forEach(x => console.log('  ', x[0], ' => ', x[1]));
// 过于宽泛的规则（会吞掉普通词典词条）
const greedy = RULES.filter(([p]) => { const re = new RegExp('^' + p + '$'); let n = 0; for (const k of Object.keys(dict)) if (re.test(k)) n++; return n > 3; });
console.log('greedy rules:', greedy.length); greedy.forEach(x => console.log('  ', x[0]));
