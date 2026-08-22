import fs from 'node:fs';
const PORT = 9500;
const bekle = (ms) => new Promise((r) => setTimeout(r, ms));
const AD = process.argv[2]; // kare-1-menu ...
const HTML = `file:///D:/GorselHafizaTeknikleriyleJSPS/scratchpad/${AD}.html`;

const t = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json();
const p = t.find((x) => x.type === 'page');
const ws = new WebSocket(p.webSocketDebuggerUrl);
let idc = 0; const b = new Map();
ws.addEventListener('message', (e) => { const m = JSON.parse(e.data); if (m.id && b.has(m.id)) { b.get(m.id)(m.result); b.delete(m.id); } });
await new Promise((r) => ws.addEventListener('open', r));
const g = (me, pa) => new Promise((res, rej) => { const i = ++idc; const to = setTimeout(() => { b.delete(i); rej(new Error('timeout ' + me)); }, 15000); b.set(i, (v) => { clearTimeout(to); res(v); }); ws.send(JSON.stringify({ id: i, method: me, params: pa })); });

await g('Page.enable', {});
await g('Emulation.setDeviceMetricsOverride', { width: 1290, height: 2796, deviceScaleFactor: 1, mobile: false });
await g('Page.navigate', { url: HTML });
await bekle(2500);
const s = await g('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: 1290, height: 2796, scale: 1 } });
fs.writeFileSync(`scratchpad/${AD}.png`, Buffer.from(s.data, 'base64'));
console.log('render:', AD + '.png');
process.exit(0);
