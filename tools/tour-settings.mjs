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
const grab = async () => JSON.parse(await ev(collect) || '[]').forEach(x => all.add(x));
const click = txt => ev(`(()=>{const e=[...document.querySelectorAll('button,a,[role=button],[role=tab],div,span')].filter(e=>e.offsetParent&&e.children.length===0&&e.textContent.trim()===${JSON.stringify(txt)}).pop();if(!e)return false;(e.closest('button,a,[role=button],[role=tab]')||e).click();return true})()`);
for (const tab of ['常规', '应用程序', '外观', '快捷键', '通知', '模型', '浏览器', '对话', '提供反馈']) {
  const ok = await click(tab); await sleep(1200); await grab(); console.error(tab, ok, all.size);
  if (tab === '提供反馈') { await ev(`document.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}))`); }
}
fs.writeFileSync('work/miss-settings.json', JSON.stringify([...all].map(x => x.replace(/^[^|]+\|/, '')).filter(x => /[A-Za-z]{3}/.test(x) && !/[\u4e00-\u9fa5]/.test(x))));
process.exit(0);
