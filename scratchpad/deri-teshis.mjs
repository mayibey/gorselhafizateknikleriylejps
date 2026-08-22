import { spawn } from 'node:child_process';
const KOK = 'D:/GorselHafizaTeknikleriyleJSPS/scratchpad';
const PORT = 9472;
const bekle = (ms) => new Promise((r) => setTimeout(r, ms));
const OY = [['cengel',"haritaAc('cengel')",1],['dy','dyKur()',0],['milyoner','acMilyoner()',0],['asmaca',"haritaAc('asmaca')",1],['ayrim',"haritaAc('ayrim')",1],['bosluk',"haritaAc('bosluk')",1],['terazi',"haritaAc('terazi')",1],['esles',"haritaAc('esles')",1],['sure',"haritaAc('sure')",1],['sira',"haritaAc('sira')",1],['hangi',"haritaAc('hangi')",1],['yalan',"haritaAc('yalan')",1],['kelime','acKelime()',0]];
const ch = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--disable-gpu','--no-first-run',`--remote-debugging-port=${PORT}`,`--user-data-dir=${KOK}/chrome-deri`,'about:blank'],{stdio:'ignore'});
async function hedef(){for(let i=0;i<40;i++){try{const t=await(await fetch(`http://127.0.0.1:${PORT}/json`)).json();const p=t.find(x=>x.type==='page');if(p?.webSocketDebuggerUrl)return p.webSocketDebuggerUrl;}catch{}await bekle(300);}throw new Error('yok');}
function cdp(w){const ws=new WebSocket(w);let id=0;const b=new Map();ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id&&b.has(m.id)){b.get(m.id)(m.result);b.delete(m.id);}});const hazir=new Promise(r=>ws.addEventListener('open',r));const g=(me,pa)=>new Promise(res=>{const i=++id;b.set(i,res);ws.send(JSON.stringify({id:i,method:me,params:pa}));});return{hazir,g};}
const evl=(c,e)=>c.g('Runtime.evaluate',{expression:e,returnByValue:true,awaitPromise:true}).then(r=>r?.result?.value);
try{
  const c=cdp(await hedef());await c.hazir;await c.g('Page.enable',{});await c.g('Runtime.enable',{});
  await c.g('Emulation.setDeviceMetricsOverride',{width:400,height:880,deviceScaleFactor:2,mobile:true});
  await c.g('Page.navigate',{url:`file:///${KOK}/canli-fix.html`});await bekle(2500);
  await evl(c,"try{premiumAyarla(true)}catch(e){};try{localStorage.setItem('mevzu_premium','1')}catch(e){};1");await bekle(300);
  for(const [id,ac,harita] of OY){
    await evl(c,`try{${ac}}catch(e){}`);await bekle(900);
    if(harita){await evl(c,"(function(){var d=document.querySelector('#tel .dugum');if(d)d.click()})()");await bekle(800);await evl(c,"(function(){var d=document.querySelector('#tel .dugum');if(d)d.click();var p=document.querySelector('.perde,.introDevam');if(p)p.click()})()");await bekle(1200);}
    const r=await evl(c,"(function(){var g=document.querySelector('#govde');var t=document.querySelector('#tel');var gs=g?getComputedStyle(g):null,ts=t?getComputedStyle(t):null;return JSON.stringify({deri:(document.body.className||'').replace(/geceMenu ?/,'').trim().slice(0,40), govdeBg:gs?gs.backgroundColor:'?', govdeImg:gs?(gs.backgroundImage||'none').slice(0,30):'?', telImg:ts?(ts.backgroundImage||'none').slice(0,30):'?'});})()");
    console.log(id.padEnd(9), r);
  }
}finally{ch.kill();}
