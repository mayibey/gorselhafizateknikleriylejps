import fs from 'node:fs';
import { spawn } from 'node:child_process';
const KOK = 'D:/GorselHafizaTeknikleriyleJSPS/scratchpad';
const HEDEF = 'C:/Users/GIGABYTE/OneDrive/Desktop/mevzu-oyun-denetim';
const PORT = 9479;
const bekle = (ms) => new Promise((r) => setTimeout(r, ms));
const ch = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',
  ['--headless=new','--disable-gpu','--no-first-run',`--remote-debugging-port=${PORT}`,`--user-data-dir=${KOK}/chrome-yl`,'about:blank'],{stdio:'ignore'});
async function hedef(){for(let i=0;i<40;i++){try{const t=await(await fetch(`http://127.0.0.1:${PORT}/json`)).json();const p=t.find(x=>x.type==='page');if(p?.webSocketDebuggerUrl)return p.webSocketDebuggerUrl;}catch{}await bekle(300);}throw new Error('yok');}
function cdp(w){const ws=new WebSocket(w);let id=0;const b=new Map();ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id&&b.has(m.id)){b.get(m.id)(m.result);b.delete(m.id);}});const hazir=new Promise(r=>ws.addEventListener('open',r));const g=(me,pa)=>new Promise(res=>{const i=++id;b.set(i,res);ws.send(JSON.stringify({id:i,method:me,params:pa}));});return{hazir,g};}
const evl=(c,e)=>c.g('Runtime.evaluate',{expression:e,returnByValue:true,awaitPromise:true}).then(r=>r?.result?.value);
async function ss(c,path){const s=await c.g('Page.captureScreenshot',{format:'png'});if(s?.data)fs.writeFileSync(path,Buffer.from(s.data,'base64'));}
try{
  const c=cdp(await hedef());await c.hazir;await c.g('Page.enable',{});await c.g('Runtime.enable',{});
  await c.g('Emulation.setDeviceMetricsOverride',{width:400,height:880,deviceScaleFactor:2,mobile:true});
  await c.g('Page.navigate',{url:`file:///${KOK}/canli-fix.html`});await bekle(2600);
  await evl(c,"localStorage.setItem('mevzu_premium','1');localStorage.setItem('mevzu_test_modu','1');localStorage.setItem('mevzu_rumuz_soruldu','1');try{if(typeof testModuAyarla==='function')testModuAyarla(true)}catch(e){};1");await bekle(200);
  await evl(c,"try{acikOyun='yalan';temaUygula('yalan');haritaAc('yalan');bolumBasla(0);}catch(e){e.message}");await bekle(800);
  const tk=await evl(c,"(function(){var b=document.querySelector('.ymKart');if(b){b.click();return 1;}return 0;})()");await bekle(800);
  await ss(c,`${HEDEF}/12-YalanciMadde/cevap.png`);
  console.log('yalan cevap tik=',tk);
}catch(e){console.log('HATA',e);}finally{ch.kill();}
