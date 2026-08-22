import fs from 'node:fs';
import { spawn } from 'node:child_process';
const KOK = 'D:/GorselHafizaTeknikleriyleJSPS/scratchpad';
const PORT = 9459;
const bekle = (ms) => new Promise((r) => setTimeout(r, ms));
const ch = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',
  ['--headless=new','--disable-gpu','--no-first-run',`--remote-debugging-port=${PORT}`,`--user-data-dir=${KOK}/chrome-rut`,'about:blank'],{stdio:'ignore'});
async function hedef(){for(let i=0;i<40;i++){try{const t=await(await fetch(`http://127.0.0.1:${PORT}/json`)).json();const p=t.find(x=>x.type==='page');if(p?.webSocketDebuggerUrl)return p.webSocketDebuggerUrl;}catch{}await bekle(300);}throw new Error('yok');}
function cdp(w){const ws=new WebSocket(w);let id=0;const b=new Map();ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id&&b.has(m.id)){b.get(m.id)(m.result);b.delete(m.id);}});const hazir=new Promise(r=>ws.addEventListener('open',r));const g=(me,pa)=>new Promise(res=>{const i=++id;b.set(i,res);ws.send(JSON.stringify({id:i,method:me,params:pa}));});return{hazir,g};}
const evl=(c,e)=>c.g('Runtime.evaluate',{expression:e,returnByValue:true}).then(r=>r?.result?.value);
try{
  const c=cdp(await hedef());await c.hazir;await c.g('Page.enable',{});await c.g('Runtime.enable',{});
  await c.g('Emulation.setDeviceMetricsOverride',{width:400,height:870,deviceScaleFactor:2,mobile:true});
  await c.g('Page.navigate',{url:`file:///${KOK}/canli-fix.html`});await bekle(2500);
  await evl(c,"try{premiumAyarla(true)}catch(e){};try{localStorage.setItem('mevzu_premium','1')}catch(e){};1");await bekle(300);
  await evl(c,"try{acMilyoner()}catch(e){e.message}");await bekle(1500);
  const bilgi=await evl(c,"(function(){var d=MILYONER[mi].d;var y=(d+1)%5;var b=document.querySelector('.sik[data-j=\"'+y+'\"]');if(b){b.click();return {dogru:d,tiklanan:y};}return 'sik yok';})()");
  console.log('tiklama:', JSON.stringify(bilgi));
  await bekle(700);  // panel HENUZ acilmamali (1.9sn gecikme) → sikler net gorunmeli
  let s=await c.g('Page.captureScreenshot',{format:'png'});if(s?.data)fs.writeFileSync(`${KOK}/rutbe-1net.png`,Buffer.from(s.data,'base64'));
  await bekle(1600);  // toplam ~2.3sn → panel acilmis olmali
  s=await c.g('Page.captureScreenshot',{format:'png'});if(s?.data)fs.writeFileSync(`${KOK}/rutbe-2panel.png`,Buffer.from(s.data,'base64'));
  // sik ve panel durumu
  const durum=await evl(c,"(function(){var ok=document.querySelector('.sik.ok'),ht=document.querySelector('.sik.hata'),sa=document.querySelector('#mSA');function cs(el){if(!el)return null;var s=getComputedStyle(el);return {bg:s.backgroundColor,bc:s.borderColor,col:s.color};}return JSON.stringify({dogruSik:cs(ok),yanlisSik:cs(ht),panelVar:!!sa&&sa.innerHTML.length>0,panelMetin:sa?sa.textContent.slice(0,120):''});})()");
  console.log('durum:', durum);
}finally{ch.kill();}
