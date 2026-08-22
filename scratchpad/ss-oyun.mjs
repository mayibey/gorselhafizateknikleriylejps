import fs from 'node:fs';
const PORT = 9500;
const bekle = (ms) => new Promise((r) => setTimeout(r, ms));
const HTML = 'file:///D:/GorselHafizaTeknikleriyleJSPS/scratchpad/canli-0836grid.html';

const t = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json();
const p = t.find((x) => x.type === 'page' && (x.url || '').includes('canli-0836grid')) || t.find((x) => x.type === 'page');
console.log('sekme:', p.url.slice(0, 60));
const ws = new WebSocket(p.webSocketDebuggerUrl);
let id = 0; const b = new Map();
ws.addEventListener('message', (e) => { const m = JSON.parse(e.data); if (m.id && b.has(m.id)) { b.get(m.id)(m.result); b.delete(m.id); } });
ws.addEventListener('close', () => console.log('WS KAPANDI'));
await new Promise((r) => ws.addEventListener('open', r));
const g = (me, pa) => new Promise((res, rej) => { const i = ++id; const to = setTimeout(() => { b.delete(i); rej(new Error('timeout ' + me)); }, 12000); b.set(i, (v) => { clearTimeout(to); res(v); }); ws.send(JSON.stringify({ id: i, method: me, params: pa })); });
const evl = async (expr) => { const r = await g('Runtime.evaluate', { expression: expr, returnByValue: true }); return r?.result?.value; };

await g('Page.enable', {}); await g('Runtime.enable', {});
await g('Emulation.setDeviceMetricsOverride', { width: 430, height: 932, deviceScaleFactor: 3, mobile: true });
await g('Page.addScriptToEvaluateOnNewDocument', {
  source: "try{localStorage.setItem('mevzu_test_modu','1');localStorage.setItem('mevzu_premium','1');window.__MEVZU_KAYIT={mevzu_premium:'1'};}catch(e){}",
});
await g('Page.navigate', { url: HTML });
await bekle(5000);

async function shot(ad) {
  const s = await g('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(`scratchpad/${ad}.png`, Buffer.from(s.data, 'base64'));
  console.log('cektim:', ad, '| bar:', (await evl('(document.querySelector("#barBas")||{}).textContent') || '').slice(0, 24));
}
// Karsilama katmanini kapat (Simdilik atla butonu)
await evl("(function(){var b=[...document.querySelectorAll('button')].find(function(x){return (x.textContent||'').trim().indexOf('imdilik')>=0});if(b)b.click();return b?'atlandi':'buton yok';})()");
await bekle(1200);

// 1) MENU
await shot('ss-1-menu');

// 2) Cengel -> harita
console.log('oyunAc cengel:', await evl("(typeof oyunAc==='function')?(oyunAc('cengel'),'ok'):'yok'"));
await bekle(1800); await shot('ss-2-cengel-harita');

// 3) Bolum 1 -> oyun
console.log('bolumBasla:', await evl("(typeof bolumBasla==='function')?(bolumBasla(0),'ok'):'yok'"));
await bekle(1800); await shot('ss-3-cengel-oyun');

// menu'ye don
await evl("(typeof menu==='function')?menu():0"); await bekle(1200);

// 4) Rutbe Merdiveni (milyoner)
console.log('milyoner:', await evl("(typeof oyunAc==='function')?(oyunAc('milyoner'),'ok'):'yok'"));
await bekle(1800); await shot('ss-4-rutbe');

// menu'ye don
await evl("(typeof menu==='function')?menu():0"); await bekle(1000);

// 5) Adam Asmaca -> harita
console.log('asmaca:', await evl("(typeof oyunAc==='function')?(oyunAc('asmaca'),'ok'):'yok'"));
await bekle(1800); await shot('ss-5-asmaca');

process.exit(0);
