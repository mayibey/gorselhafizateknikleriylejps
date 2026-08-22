import fs from 'node:fs';
const PORT = 9500;
const bekle = (ms) => new Promise((r) => setTimeout(r, ms));
const HTML = 'file:///D:/GorselHafizaTeknikleriyleJSPS/scratchpad/canli-0836grid.html';
const OYUN = process.argv[2];              // oyun id
const AD = process.argv[3] || ('ss-' + (OYUN || 'menu'));
const BOLUM = process.argv[4];             // 'h' => harita oyununda bolumBasla(0) ile oynanisa gir

const t = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json();
const p = t.find((x) => x.type === 'page' && (x.url || '').includes('canli-0836grid')) || t.find((x) => x.type === 'page');
const ws = new WebSocket(p.webSocketDebuggerUrl);
let idc = 0; const b = new Map();
ws.addEventListener('message', (e) => { const m = JSON.parse(e.data); if (m.id && b.has(m.id)) { b.get(m.id)(m.result); b.delete(m.id); } });
await new Promise((r) => ws.addEventListener('open', r));
const g = (me, pa) => new Promise((res, rej) => { const i = ++idc; const to = setTimeout(() => { b.delete(i); rej(new Error('timeout ' + me)); }, 15000); b.set(i, (v) => { clearTimeout(to); res(v); }); ws.send(JSON.stringify({ id: i, method: me, params: pa })); });
const evl = async (expr) => { const r = await g('Runtime.evaluate', { expression: expr, returnByValue: true }); return r?.result?.value; };

await g('Page.enable', {}); await g('Runtime.enable', {});
await g('Emulation.setDeviceMetricsOverride', { width: 430, height: 932, deviceScaleFactor: 3, mobile: true });

const tanitJson = JSON.stringify({ cengel: 1, dy: 1, milyoner: 1, asmaca: 1, ayrim: 1, bosluk: 1, terazi: 1, esles: 1, sure: 1, sira: 1, hangi: 1, yalan: 1, kelime: 1, kusatma: 1, bayrak: 1 });
const gir = BOLUM === 'h' ? "setTimeout(function(){try{if(typeof bolumBasla==='function')bolumBasla(0);}catch(e){}},1100);" : '';
const acKod = OYUN ? `setTimeout(function(){try{if(typeof oyunAc==='function')oyunAc('${OYUN}');}catch(e){}${gir}},1500);` : '';
await g('Page.addScriptToEvaluateOnNewDocument', {
  source:
    "try{localStorage.setItem('mevzu_test_modu','1');localStorage.setItem('mevzu_premium','1');localStorage.setItem('mevzu_tanitim_gorulen'," + JSON.stringify(tanitJson) + ");window.__MEVZU_KAYIT={mevzu_premium:'1'};}catch(e){}" +
    // agir parcacik/konfeti animasyonlarini sustur (ana thread'i kilitleyip screenshot'i asiyordu)
    "window.addEventListener('load',function(){try{['zerreKur','zerreCiz','konfetiKur','konfetiCiz','parlaKur','yildizKur','izgaraArka'].forEach(function(f){try{window[f]=function(){};}catch(e){}});}catch(e){}" +
    "setTimeout(function(){try{var x=[...document.querySelectorAll('button')].find(function(y){return (y.textContent||'').indexOf('imdilik')>=0});if(x)x.click();}catch(e){}" + acKod + "},800);});",
});
await g('Page.navigate', { url: HTML });
await bekle(BOLUM === 'h' ? 6500 : 5500);

// ANIMASYONLARI SABITLE — solgun/yarim kalmasin: tum animasyon/gecis bitmis + tam opak.
await evl("(function(){var s=document.createElement('style');s.textContent='*{animation:none!important;transition:none!important;} #govde,#govde *{opacity:1!important;} .gir,[style*=opacity]{opacity:1!important;}';document.head.appendChild(s);return 1;})()");
await bekle(700);

const s = await g('Page.captureScreenshot', { format: 'png' });
fs.writeFileSync(`scratchpad/${AD}.png`, Buffer.from(s.data, 'base64'));
console.log('cektim:', AD, '| bar:', (await evl('(document.querySelector("#barBas")||{}).textContent') || '').slice(0, 30));
process.exit(0);
