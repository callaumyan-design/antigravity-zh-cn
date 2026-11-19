// usage: node cdp.mjs <expr-file> [targetUrlSubstring]
import fs from 'node:fs';
const expr = fs.readFileSync(process.argv[2], 'utf8');
const match = process.argv[3] || 'https://127.0.0.1:';
const list = await (await fetch('http://127.0.0.1:9333/json')).json();
const t = list.find(x => x.type === 'page' && x.url.includes(match));
if (!t) { console.error('no target'); process.exit(2); }
const ws = new WebSocket(t.webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);
ws.onmessage = ev => {
  const m = JSON.parse(ev.data);
  if (m.id === 1) {
    const r = m.result?.result;
    if (m.result?.exceptionDetails) console.error(JSON.stringify(m.result.exceptionDetails).slice(0, 2000));
    process.stdout.write(typeof r?.value === 'string' ? r.value : JSON.stringify(r?.value ?? m));
    ws.close(); process.exit(0);
  }
};
ws.send(JSON.stringify({ id: 1, method: 'Runtime.evaluate', params: { expression: expr, awaitPromise: true, returnByValue: true } }));
