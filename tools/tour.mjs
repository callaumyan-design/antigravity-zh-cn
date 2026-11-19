// 依次点击主要入口，收集仍为英文的可见文本
import fs from 'node:fs';
const list = await (await fetch('http://127.0.0.1:9333/json')).json();
const t = list.find(x => x.type === 'page' && x.url.startsWith('https://127.0.0.1:'));
const ws = new WebSocket(t.webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);
let id = 0; const pend = new Map();
ws.onmessage = e => { const m = JSON.parse(e.data); pend.get(m.id)?.(m); };
const ev = x => new Promise(r => { const i = ++id; pend.set(i, m => r(m.result?.result?.value)); ws.send(JSON.stringify({ id: i, method: 'Runtime.evaluate', params: { expression: x, awaitPromise: true, returnByValue: true } })); });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const collect = fs.readFileSync(new URL('./collect-miss.js', import.meta.url), 'utf8');
const all = new Set();
const grab = async label => { const a = JSON.parse(await ev(collect) || '[]'); a.forEach(x => all.add(x)); console.error(label, a.length); };
const clickText = async (txt) => ev(`(()=>{const els=[...document.querySelectorAll('button,a,[role=button],[role=tab],[role=menuitem],[role=option],li,div')].filter(e=>e.offsetParent&&e.textContent.trim()===${JSON.stringify(txt)});const e=els[els.length-1];if(!e)return false;e.click();return true})()`);
const esc = () => ev(`document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));document.activeElement&&document.activeElement.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));1`);
await grab('home');
for (const nav of ['设置', 'Settings']) { if (await clickText(nav)) break; }
await sleep(1500); await grab('settings');
// 设置左侧的各个分区
const tabs = JSON.parse(await ev(`JSON.stringify([...document.querySelectorAll('nav button,nav a,[role=tab],aside button')].filter(e=>e.offsetParent).map(e=>e.textContent.trim()).filter(x=>x&&x.length<40))`) || '[]');
console.error('tabs', tabs);
for (const tb of tabs) { await clickText(tb); await sleep(900); await grab('tab:' + tb); }
await esc(); await sleep(500);
for (const nav of ['自动化', '自定义项']) { await clickText(nav); await sleep(1200); await grab(nav);
  const sub = JSON.parse(await ev(`JSON.stringify([...document.querySelectorAll('[role=tab]')].filter(e=>e.offsetParent).map(e=>e.textContent.trim()))`) || '[]');
  for (const s of sub) { await clickText(s); await sleep(800); await grab(nav + '/' + s); }
}
for (const nav of ['新对话']) { await clickText(nav); await sleep(1000); }
// 弹出下拉
for (const sel of ['[aria-label^="选择模型"]', '[aria-label^="智能体权限预设"]', '[aria-label^="选择项目"]', '[aria-label^="智能体运行位置"]']) {
  await ev(`(()=>{const e=document.querySelector('${sel}');e&&e.click();return 1})()`); await sleep(800); await grab(sel); await esc(); await sleep(400);
}
fs.writeFileSync('work/miss.json', JSON.stringify([...all].map(x => x.replace(/^[^|]+\|/, '')).filter(x => /[A-Za-z]{3}/.test(x) && !/[\u4e00-\u9fa5]/.test(x))));
console.log([...all].length); process.exit(0);
