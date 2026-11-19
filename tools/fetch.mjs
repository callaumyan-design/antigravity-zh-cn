// usage: node fetch.mjs <path> <outfile>   (chunked)
import fs from 'node:fs';
const [,, p, out] = process.argv;
const list = await (await fetch('http://127.0.0.1:9333/json')).json();
const t = list.find(x => x.type === 'page' && x.url.startsWith('https://127.0.0.1:'));
const ws = new WebSocket(t.webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);
let id = 0; const pending = new Map();
ws.onmessage = ev => { const m = JSON.parse(ev.data); pending.get(m.id)?.(m); pending.delete(m.id); };
const ev = expr => new Promise(res => { const i = ++id; pending.set(i, m => res(m.result?.result?.value ?? m)); ws.send(JSON.stringify({ id: i, method: 'Runtime.evaluate', params: { expression: expr, awaitPromise: true, returnByValue: true } })); });
const len = await ev(`fetch(${JSON.stringify(p)}).then(r=>r.text()).then(t=>{window.__dl=t;return t.length})`);
if (typeof len !== 'number') { console.error(JSON.stringify(len).slice(0, 500)); process.exit(1); }
const CH = 2_000_000; let s = '';
for (let o = 0; o < len; o += CH) s += await ev(`window.__dl.slice(${o},${o + CH})`);
await ev('delete window.__dl;0');
fs.writeFileSync(out, s); console.log(out, len, s.length); process.exit(0);
