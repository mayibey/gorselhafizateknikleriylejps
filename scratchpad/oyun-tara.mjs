import fs from 'node:fs';
import { spawn } from 'node:child_process';

const KOK = 'D:/GorselHafizaTeknikleriyleJSPS/scratchpad';
const PORT = 9455;
const bekle = (ms) => new Promise((r) => setTimeout(r, ms));

// Oyunlar: [id, açma-ifadesi]. Çoğu haritaAc(id)+düğüme gir; milyoner/kelime doğrudan.
const OYUNLAR = [
  ['cengel', "haritaAc('cengel')"],
  ['dy', "haritaAc('dy')"],
  ['milyoner', 'acMilyoner()'],
  ['asmaca', "haritaAc('asmaca')"],
  ['ayrim', "haritaAc('ayrim')"],
  ['bosluk', "haritaAc('bosluk')"],
  ['terazi', "haritaAc('terazi')"],
  ['esles', "haritaAc('esles')"],
  ['sure', "haritaAc('sure')"],
  ['sira', "haritaAc('sira')"],
  ['hangi', "haritaAc('hangi')"],
  ['yalan', "haritaAc('yalan')"],
  ['kelime', 'acKelime()'],
];

const ch = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',
  ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
   `--remote-debugging-port=${PORT}`, `--user-data-dir=${KOK}/chrome-tara`, 'about:blank'],
  { stdio: 'ignore' });

async function hedef() {
  for (let i = 0; i < 40; i++) {
    try { const t = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json();
      const p = t.find((x) => x.type === 'page'); if (p?.webSocketDebuggerUrl) return p.webSocketDebuggerUrl; } catch {}
    await bekle(300);
  }
  throw new Error('CDP yok');
}
function cdp(wsUrl) {
  const ws = new WebSocket(wsUrl); let id = 0; const bek = new Map();
  ws.addEventListener('message', (ev) => { const m = JSON.parse(ev.data); if (m.id && bek.has(m.id)) { bek.get(m.id)(m.result); bek.delete(m.id); } });
  const hazir = new Promise((r) => ws.addEventListener('open', r));
  const g = (method, params) => new Promise((res) => { const i = ++id; bek.set(i, res); ws.send(JSON.stringify({ id: i, method, params })); });
  return { hazir, g };
}
const evl = (c, expr) => c.g('Runtime.evaluate', { expression: expr, returnByValue: true }).then((r) => r?.result?.value);

try {
  const c = cdp(await hedef());
  await c.hazir;
  await c.g('Page.enable', {}); await c.g('Runtime.enable', {});
  await c.g('Emulation.setDeviceMetricsOverride', { width: 400, height: 870, deviceScaleFactor: 2, mobile: true });
  await c.g('Page.navigate', { url: `file:///${KOK}/canli-son.html` });
  await bekle(2500);
  // premium + oyunlara erişim
  await evl(c, "try{premiumAyarla(true)}catch(e){}; try{localStorage.setItem('mevzu_premium','1')}catch(e){}; 1");
  await bekle(400);

  for (const [oid, acExpr] of OYUNLAR) {
    try {
      // menüye dön (varsa) sonra oyunu aç
      await evl(c, `try{${acExpr}}catch(e){e.message}`);
      await bekle(900);
      // harita düğümü varsa gir (bazı oyunlarda perde/intro → iki tık)
      const durum = await evl(c, `(function(){var d=document.querySelector('#tel .dugum');if(d){d.click();return 'dugum';}return 'direkt';})()`);
      await bekle(900);
      await evl(c, `(function(){var d=document.querySelector('#tel .dugum');if(d){d.click();}var p=document.querySelector('.perde,.introDevam,[data-devam]');if(p)p.click();return 1;})()`);
      await bekle(1300);
      const shot = await c.g('Page.captureScreenshot', { format: 'png' });
      if (shot?.data) fs.writeFileSync(`${KOK}/tara-${oid}.png`, Buffer.from(shot.data, 'base64'));
      console.log(`${oid}: ${durum} → tara-${oid}.png`);
    } catch (e) { console.log(`${oid}: HATA ${e.message}`); }
  }
} finally {
  ch.kill();
}
