import fs from 'node:fs';
import { spawn } from 'node:child_process';
const KOK = 'D:/GorselHafizaTeknikleriyleJSPS/scratchpad';
const PORT = 9458;
const bekle = (ms) => new Promise((r) => setTimeout(r, ms));

// Düzeltme kuralını enjekte et → yerel dosya
let html = fs.readFileSync(`${KOK}/canli-son.html`, 'utf8');
const IM = 'SIRA-KART-TASMA-FIX-17AGU';
const kural = `\n<style>/* ${IM}: Sıraya Diz/Süre Şeridi kartları (.hk/.hs) flex-shrink:1 + sınırlı
  havuz yüksekliği yüzünden tek satıra (52px) sıkışıyordu; iki satırlık metin taşıp alttaki
  kartın üstüne biniyordu. flex-shrink:0 + height:auto → kart içeriğe göre tam boy alır. */
#tel .havuz .hk, #tel #hedef .hs, #tel .hk, #tel .hs{ flex-shrink:0 !important; height:auto !important; }</style>`;
const yer = html.lastIndexOf('</head>');
html = html.slice(0, yer) + kural + html.slice(yer);
fs.writeFileSync(`${KOK}/canli-fix.html`, html);

const ch = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',
  ['--headless=new','--disable-gpu','--no-first-run',`--remote-debugging-port=${PORT}`,`--user-data-dir=${KOK}/chrome-fix`,'about:blank'],{stdio:'ignore'});
async function hedef(){for(let i=0;i<40;i++){try{const t=await(await fetch(`http://127.0.0.1:${PORT}/json`)).json();const p=t.find(x=>x.type==='page');if(p?.webSocketDebuggerUrl)return p.webSocketDebuggerUrl;}catch{}await bekle(300);}throw new Error('yok');}
function cdp(w){const ws=new WebSocket(w);let id=0;const b=new Map();ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id&&b.has(m.id)){b.get(m.id)(m.result);b.delete(m.id);}});const hazir=new Promise(r=>ws.addEventListener('open',r));const g=(me,pa)=>new Promise(res=>{const i=++id;b.set(i,res);ws.send(JSON.stringify({id:i,method:me,params:pa}));});return{hazir,g};}
const evl=(c,e)=>c.g('Runtime.evaluate',{expression:e,returnByValue:true}).then(r=>r?.result?.value);
const OLCSIRA=`(function(){var hv=document.querySelector('.havuz');if(!hv)return 'yok';var ks=[...hv.querySelectorAll('.hk')];
  var r0=ks[0]?.getBoundingClientRect(),r1=ks[1]?.getBoundingClientRect();
  return JSON.stringify({sayi:ks.length,k0h:r0?Math.round(r0.height):0,k1h:r1?Math.round(r1.height):0,
    k0bot:r0?Math.round(r0.bottom):0,k1top:r1?Math.round(r1.top):0,binme:(r0&&r1)?(r1.top<r0.bottom):null});})()`;
try{
  const c=cdp(await hedef());await c.hazir;await c.g('Page.enable',{});await c.g('Runtime.enable',{});
  await c.g('Emulation.setDeviceMetricsOverride',{width:400,height:870,deviceScaleFactor:2,mobile:true});
  await c.g('Page.navigate',{url:`file:///${KOK}/canli-fix.html`});await bekle(2500);
  await evl(c,"try{premiumAyarla(true)}catch(e){};try{localStorage.setItem('mevzu_premium','1')}catch(e){};1");await bekle(300);
  // SIRA
  await evl(c,"try{haritaAc('sira')}catch(e){}");await bekle(900);
  await evl(c,"(function(){var d=document.querySelector('#tel .dugum');if(d)d.click()})()");await bekle(900);
  await evl(c,"(function(){var d=document.querySelector('#tel .dugum');if(d)d.click()})()");await bekle(1600);
  console.log('SIRA olcum:', await evl(c, OLCSIRA));
  let s=await c.g('Page.captureScreenshot',{format:'png'}); if(s?.data)fs.writeFileSync(`${KOK}/fix-sira.png`,Buffer.from(s.data,'base64'));
  // SURE (tepsi kapali gormek icin acilistan hemen screenshot)
  await evl(c,"try{haritaAc('sure')}catch(e){}");await bekle(900);
  await evl(c,"(function(){var d=document.querySelector('#tel .dugum');if(d)d.click()})()");await bekle(900);
  await evl(c,"(function(){var d=document.querySelector('#tel .dugum');if(d)d.click()})()");await bekle(1600);
  s=await c.g('Page.captureScreenshot',{format:'png'}); if(s?.data)fs.writeFileSync(`${KOK}/fix-sure.png`,Buffer.from(s.data,'base64'));
  console.log('screenshotlar: fix-sira.png, fix-sure.png');
}finally{ch.kill();}
