/**
 * App Store Connect'i tarayıcıdan sür (CDP, port 9222).
 *   node scratchpad/asc-cdp.mjs shot           → ekran görüntüsü
 *   node scratchpad/asc-cdp.mjs url            → hangi sayfadayız
 *   node scratchpad/asc-cdp.mjs git <adres>    → adrese git
 *   node scratchpad/asc-cdp.mjs btn            → görünen düğme/bağlantı yazıları
 *   node scratchpad/asc-cdp.mjs tikla "yazı"   → o yazıyı içeren ögeye tıkla
 *   node scratchpad/asc-cdp.mjs metin          → sayfadaki görünür metin (ilk 3000)
 */
import fs from 'node:fs';

const PORT = 9222;
const bekle = (ms) => new Promise((r) => setTimeout(r, ms));

const hedefler = await (await fetch(`http://127.0.0.1:${PORT}/json`)).json();
const SUZ = process.env.SAYFA || 'appstoreconnect.apple.com';
const sayfa = hedefler.find((x) => x.type === 'page' && (x.url || '').includes(SUZ))
  || hedefler.find((x) => x.type === 'page' && !(x.url || '').startsWith('devtools'));
if (!sayfa) { console.log('Sayfa bulunamadı. Açık sekmeler:', hedefler.filter((x) => x.type === 'page').map((x) => x.url).slice(0, 8)); process.exit(1); }

const ws = new WebSocket(sayfa.webSocketDebuggerUrl);
let id = 0; const bekleyen = new Map();
ws.addEventListener('message', (e) => { const m = JSON.parse(e.data); if (m.id && bekleyen.has(m.id)) { bekleyen.get(m.id)(m); bekleyen.delete(m.id); } });
await new Promise((r) => ws.addEventListener('open', r));
const cagir = (metot, par) => new Promise((res, rej) => {
  const i = ++id; const zaman = setTimeout(() => { bekleyen.delete(i); rej(new Error('zaman aşımı ' + metot)); }, 30000);
  bekleyen.set(i, (m) => { clearTimeout(zaman); res(m.result); });
  ws.send(JSON.stringify({ id: i, method: metot, params: par }));
});
const calistir = async (kod) => (await cagir('Runtime.evaluate', { expression: kod, returnByValue: true, awaitPromise: true }))?.result?.value;

await cagir('Runtime.enable', {});
const komut = process.argv[2];

if (komut === 'git') {
  await cagir('Page.navigate', { url: process.argv[3] });
  await bekle(7000);
  console.log('adres:', await calistir('location.href'));
} else if (komut === 'url') {
  console.log(await calistir('location.href'));
} else if (komut === 'shot') {
  const s = await cagir('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync('scratchpad/asc-ekran.png', Buffer.from(s.data, 'base64'));
  console.log('scratchpad/asc-ekran.png ·', await calistir('location.href'));
} else if (komut === 'btn') {
  const v = await calistir(`JSON.stringify([...document.querySelectorAll('button,a,[role=button]')].filter(x=>x.offsetParent&&(x.innerText||'').trim()).map(x=>(x.innerText||'').trim().replace(/\\s+/g,' ').slice(0,60)).filter((v,i,a)=>a.indexOf(v)===i).slice(0,60))`);
  console.log(JSON.parse(v || '[]').join('\n'));
} else if (komut === 'metin') {
  const v = await calistir(`(document.body.innerText||'').replace(/\\n{2,}/g,'\\n').slice(0,3000)`);
  console.log(v);
} else if (komut === 'tikla') {
  const q = process.argv[3];
  const v = await calistir(`(function(){
    var hepsi=[...document.querySelectorAll('button,a,[role=button],span,div')].filter(function(x){return x.offsetParent;});
    var t=hepsi.filter(function(x){return (x.innerText||'').trim()===${JSON.stringify(q)};});
    if(!t.length) t=hepsi.filter(function(x){return (x.innerText||'').trim().indexOf(${JSON.stringify(q)})>=0 && (x.innerText||'').length<120;});
    t.sort(function(a,b){return (a.innerText||'').length-(b.innerText||'').length;});
    if(!t[0]) return 'YOK';
    t[0].scrollIntoView({block:'center'}); t[0].click();
    return t[0].tagName+' :: '+(t[0].innerText||'').trim().slice(0,50);
  })()`);
  await bekle(3500);
  console.log('tıklandı:', v, '| adres:', await calistir('location.href'));
}
process.exit(0);
