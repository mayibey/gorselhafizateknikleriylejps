import fs from 'node:fs';
import { spawn } from 'node:child_process';

const KOK = 'D:/GorselHafizaTeknikleriyleJSPS/scratchpad';
const CHROME = '/c/Program Files/Google/Chrome/Application/chrome.exe';

// 1) Düzeltmesiz (canlı) + düzeltmeli iki dosya hazırla
const orj = fs.readFileSync(`${KOK}/canli-oyun.html`, 'utf8');
const kural = `<style>#tel #cengel td.ac.vurgu:not(.dogru):not(.yanlis) .hf,
#cengel td.ac.vurgu:not(.dogru):not(.yanlis) .hf{ color:#241B00 !important; text-shadow:none !important; }</style>`;
const yer = orj.lastIndexOf('</head>');
const fix = orj.slice(0, yer) + kural + orj.slice(yer);
fs.writeFileSync(`${KOK}/olc-orj.html`, orj);
fs.writeFileSync(`${KOK}/olc-fix.html`, fix);

// 2) Chrome headless başlat
const PORT = 9333;
const udir = `${KOK}/chrome-prof`;
const ch = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',
  ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
   `--remote-debugging-port=${PORT}`, `--user-data-dir=${udir}`, 'about:blank'],
  { stdio: 'ignore' });

const bekle = (ms) => new Promise((r) => setTimeout(r, ms));

async function cdpHedef() {
  for (let i = 0; i < 30; i++) {
    try {
      const r = await fetch(`http://127.0.0.1:${PORT}/json`);
      const t = await r.json();
      const p = t.find((x) => x.type === 'page');
      if (p?.webSocketDebuggerUrl) return p.webSocketDebuggerUrl;
    } catch {}
    await bekle(300);
  }
  throw new Error('CDP hedefi bulunamadı');
}

// Basit CDP istemcisi
function cdp(wsUrl) {
  const ws = new WebSocket(wsUrl);
  let id = 0; const bekleyen = new Map();
  ws.addEventListener('message', (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && bekleyen.has(m.id)) { bekleyen.get(m.id)(m); bekleyen.delete(m.id); }
  });
  const hazir = new Promise((r) => ws.addEventListener('open', r));
  const gonder = (method, params) => new Promise((res) => {
    const i = ++id; bekleyen.set(i, res);
    ws.send(JSON.stringify({ id: i, method, params }));
  });
  return { hazir, gonder, kapat: () => ws.close() };
}

const OLCUM = `(function(){
  var tel=document.querySelector('#tel')||document.body;
  var eski=document.getElementById('olcT'); if(eski)eski.remove();
  var t=document.createElement('table'); t.id='cengel'; t.innerHTML=
    '<tbody><tr>'+
    '<td class="ac vurgu" data-r="0" data-c="0"><span class="hf">A</span></td>'+
    '<td class="ac" data-r="0" data-c="1"><span class="hf">B</span></td>'+
    '<td class="ac imlec" data-r="0" data-c="2"><span class="hf">C</span></td>'+
    '</tr></tbody>';
  var kap=document.createElement('div'); kap.id='olcT'; kap.appendChild(t); tel.appendChild(kap);
  function oku(sel){var e=document.querySelector(sel); if(!e)return 'YOK';
    var td=e.closest('td'); var cs=getComputedStyle(e); var ts=getComputedStyle(td);
    return {harf:cs.color, zemin:ts.backgroundColor};}
  return JSON.stringify({
    vurgu: oku('#olcT td.vurgu .hf'),
    normal: oku('#olcT td.ac:not(.vurgu):not(.imlec) .hf'),
    imlec: oku('#olcT td.imlec .hf'),
  });
})()`;

async function olc(client, dosya) {
  await client.gonder('Page.enable', {});
  await client.gonder('Page.navigate', { url: `file:///${KOK}/${dosya}` });
  await bekle(1500);
  const r = await client.gonder('Runtime.evaluate', { expression: OLCUM, returnByValue: true });
  return r.result?.result?.value;
}

try {
  const wsUrl = await cdpHedef();
  const client = cdp(wsUrl);
  await client.hazir;
  await client.gonder('Runtime.enable', {});
  console.log('DÜZELTMESİZ (canlı):', await olc(client, 'olc-orj.html'));
  console.log('DÜZELTMELİ        :', await olc(client, 'olc-fix.html'));
  client.kapat();
} finally {
  ch.kill();
}
