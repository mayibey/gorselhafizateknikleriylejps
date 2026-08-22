import fs from 'node:fs';
import { spawn } from 'node:child_process';
const KOK = 'D:/GorselHafizaTeknikleriyleJSPS/scratchpad';
const PORT = 9456;
const bekle = (ms) => new Promise((r) => setTimeout(r, ms));
const OYUNLAR = [
  ['dy', 'dyKur()', false],
  ['sira', "haritaAc('sira')", true],
  ['sure', "haritaAc('sure')", true],
];
const ch = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',
  ['--headless=new','--disable-gpu','--no-first-run','--no-default-browser-check',`--remote-debugging-port=${PORT}`,`--user-data-dir=${KOK}/chrome-tara2`,'about:blank'],{stdio:'ignore'});
async function hedef(){for(let i=0;i<40;i++){try{const t=await(await fetch(`http://127.0.0.1:${PORT}/json`)).json();const p=t.find(x=>x.type==='page');if(p?.webSocketDebuggerUrl)return p.webSocketDebuggerUrl;}catch{}await bekle(300);}throw new Error('CDP yok');}
function cdp(w){const ws=new WebSocket(w);let id=0;const b=new Map();ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id&&b.has(m.id)){b.get(m.id)(m.result);b.delete(m.id);}});const hazir=new Promise(r=>ws.addEventListener('open',r));const g=(me,pa)=>new Promise(res=>{const i=++id;b.set(i,res);ws.send(JSON.stringify({id:i,method:me,params:pa}));});return{hazir,g};}
const evl=(c,e)=>c.g('Runtime.evaluate',{expression:e,returnByValue:true}).then(r=>r?.result?.value);
try{
  const c=cdp(await hedef());await c.hazir;
  await c.g('Page.enable',{});await c.g('Runtime.enable',{});
  await c.g('Emulation.setDeviceMetricsOverride',{width:400,height:870,deviceScaleFactor:2,mobile:true});
  await c.g('Page.navigate',{url:`file:///${KOK}/canli-son.html`});await bekle(2500);
  await evl(c,"try{premiumAyarla(true)}catch(e){};try{localStorage.setItem('mevzu_premium','1')}catch(e){};1");
  await bekle(400);
  for(const [oid,ac,harita] of OYUNLAR){
    try{
      await evl(c,`try{${ac}}catch(e){e.message}`);await bekle(1000);
      if(harita){await evl(c,`(function(){var d=document.querySelector('#tel .dugum');if(d)d.click();return 1})()`);await bekle(1000);
        await evl(c,`(function(){var d=document.querySelector('#tel .dugum');if(d)d.click();var p=document.querySelector('.perde,.introDevam');if(p)p.click();return 1})()`);await bekle(2200);}
      else await bekle(1500);
      const s=await c.g('Page.captureScreenshot',{format:'png'});
      if(s?.data)fs.writeFileSync(`${KOK}/tara2-${oid}.png`,Buffer.from(s.data,'base64'));
      console.log(`${oid} → tara2-${oid}.png`);
    }catch(e){console.log(`${oid}: HATA ${e.message}`);}
  }
}finally{ch.kill();}
