import fs from "node:fs";
import {spawn} from 'node:child_process';
const KOK='D:/GorselHafizaTeknikleriyleJSPS/scratchpad';const PORT=9495;const bekle=ms=>new Promise(r=>setTimeout(r,ms));
const ch=spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--disable-gpu','--no-first-run',`--remote-debugging-port=${PORT}`,`--user-data-dir=${KOK}/chrome-st2`,'about:blank'],{stdio:'ignore'});
async function hedef(){for(let i=0;i<40;i++){try{const t=await(await fetch(`http://127.0.0.1:${PORT}/json`)).json();const p=t.find(x=>x.type==='page');if(p?.webSocketDebuggerUrl)return p.webSocketDebuggerUrl;}catch{}await bekle(300);}throw new Error('yok');}
function cdp(w){const ws=new WebSocket(w);let id=0;const b=new Map();ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id&&b.has(m.id)){b.get(m.id)(m.result);b.delete(m.id);}});const hazir=new Promise(r=>ws.addEventListener('open',r));const g=(me,pa)=>new Promise(res=>{const i=++id;b.set(i,res);ws.send(JSON.stringify({id:i,method:me,params:pa}));});return{hazir,g};}
const evl=(c,e)=>c.g('Runtime.evaluate',{expression:e,returnByValue:true,awaitPromise:true}).then(r=>r?.result?.value);
try{const c=cdp(await hedef());await c.hazir;await c.g('Page.enable',{});await c.g('Runtime.enable',{});
await c.g('Emulation.setDeviceMetricsOverride',{width:400,height:880,deviceScaleFactor:2,mobile:true});
await c.g('Page.navigate',{url:`file:///${KOK}/canli-fix.html`});await bekle(2500);
await evl(c,"try{premiumAyarla(true)}catch(e){};try{localStorage.setItem('mevzu_premium','1')}catch(e){};1");await bekle(400);
await evl(c,"try{haritaAc('bosluk')}catch(e){}");await bekle(700);
await evl(c,"(function(){var d=document.querySelector('#tel .dugum');if(d)d.click()})()");await bekle(700);
await evl(c,"(function(){var d=document.querySelector('#tel .dugum');if(d)d.click()})()");await bekle(1100);
// cevap ver (yanlis sik)
await evl(c,"(function(){var b=document.querySelector('.cip');if(b)b.click();return 1})()");await bekle(700);
const r=await evl(c,`(function(){
  var g=document.querySelector('#govde');
  var pan=document.querySelector('#bSA');
  var cs=g?getComputedStyle(g):null;
  var r={};
  if(g){r.scrollH=g.scrollHeight;r.clientH=g.clientHeight;r.scrollTop=g.scrollTop;r.kaydirilirMi=g.scrollHeight>g.clientHeight;r.overflow=cs.overflowY;r.paddingBottom=cs.paddingBottom;}
  if(pan){var ps=getComputedStyle(pan);r.panelPos=ps.position;r.panelPointer=ps.pointerEvents;r.panelBoyEmpty=pan.textContent.length>0;}
  // has destegi
  try{r.hasDestek=CSS.supports('selector(:has(*))');}catch(e){r.hasDestek='?';}
  // dogru sik konumu
  var ok=document.querySelector('.cip.ok');
  if(ok){var rr=ok.getBoundingClientRect();r.dogruSikTop=Math.round(rr.top);r.dogruSikGorunur=rr.top>60&&rr.bottom<820;}
  return JSON.stringify(r);
})()`);
console.log(r);
const s=await c.g("Page.captureScreenshot",{format:"png"});if(s?.data)fs.writeFileSync(KOK+"/sticky-bosluk.png",Buffer.from(s.data,"base64"));}finally{ch.kill();}
