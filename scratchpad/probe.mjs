import { spawn } from 'node:child_process';
const KOK = 'D:/GorselHafizaTeknikleriyleJSPS/scratchpad';
const PORT = 9481;
const bekle = (ms) => new Promise((r) => setTimeout(r, ms));
const ch = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',
  ['--headless=new','--disable-gpu','--no-first-run',`--remote-debugging-port=${PORT}`,`--user-data-dir=${KOK}/chrome-pr`,'about:blank'],{stdio:'ignore'});
async function hedef(){for(let i=0;i<40;i++){try{const t=await(await fetch(`http://127.0.0.1:${PORT}/json`)).json();const p=t.find(x=>x.type==='page');if(p?.webSocketDebuggerUrl)return p.webSocketDebuggerUrl;}catch{}await bekle(300);}throw new Error('yok');}
function cdp(w){const ws=new WebSocket(w);let id=0;const b=new Map();ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id&&b.has(m.id)){b.get(m.id)(m.result);b.delete(m.id);}});const hazir=new Promise(r=>ws.addEventListener('open',r));const g=(me,pa)=>new Promise(res=>{const i=++id;b.set(i,res);ws.send(JSON.stringify({id:i,method:me,params:pa}));});return{hazir,g};}
const evl=(c,e)=>c.g('Runtime.evaluate',{expression:e,returnByValue:true,awaitPromise:true}).then(r=>r?.result?.value);
try{
  const c=cdp(await hedef());await c.hazir;await c.g('Runtime.enable',{});
  await c.g('Emulation.setDeviceMetricsOverride',{width:400,height:880,deviceScaleFactor:2,mobile:true});
  await c.g('Page.navigate',{url:`file:///${KOK}/canli-fix.html`});await bekle(2600);
  await evl(c,"localStorage.setItem('mevzu_premium','1');localStorage.setItem('mevzu_test_modu','1');localStorage.setItem('mevzu_rumuz_soruldu','1');try{if(typeof testModuAyarla==='function')testModuAyarla(true)}catch(e){};1");await bekle(200);
  // AYRIM
  await evl(c,"acikOyun='ayrim';temaUygula('ayrim');haritaAc('ayrim');1");await bekle(500);
  console.log('AYRIM BOLUM.length=', await evl(c,"BOLUM.length"));
  await evl(c,"bolumBasla(53);1");await bekle(400);
  console.log('AYRIM bolumBasla(53): aktifBolum=', await evl(c,"aktifBolum"), 'barBas=', JSON.stringify(await evl(c,"document.getElementById('barBas').innerText")), 'barBas.HTMLlen=', await evl(c,"document.getElementById('barBas').innerHTML.length"));
  console.log('  bar first-arg would be Bölüm', await evl(c,"aktifBolum+1"));
  // deri var mi?
  console.log('  body.className=', await evl(c,"document.body.className"));
  // HANGI karsilastir
  await evl(c,"acikOyun='hangi';temaUygula('hangi');haritaAc('hangi');1");await bekle(500);
  await evl(c,"bolumBasla(39);1");await bekle(400);
  console.log('HANGI bolumBasla(39): aktifBolum=', await evl(c,"aktifBolum"), 'barBas=', JSON.stringify(await evl(c,"document.getElementById('barBas').innerText")));
}catch(e){console.log('HATA',e);}finally{ch.kill();}
