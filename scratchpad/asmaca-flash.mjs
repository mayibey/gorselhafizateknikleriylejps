import {spawn} from 'node:child_process';
const KOK='D:/GorselHafizaTeknikleriyleJSPS/scratchpad';const PORT=9482;const bekle=ms=>new Promise(r=>setTimeout(r,ms));
const ch=spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--disable-gpu','--no-first-run',`--remote-debugging-port=${PORT}`,`--user-data-dir=${KOK}/chrome-af`,'about:blank'],{stdio:'ignore'});
async function hedef(){for(let i=0;i<40;i++){try{const t=await(await fetch(`http://127.0.0.1:${PORT}/json`)).json();const p=t.find(x=>x.type==='page');if(p?.webSocketDebuggerUrl)return p.webSocketDebuggerUrl;}catch{}await bekle(300);}throw new Error('yok');}
function cdp(w){const ws=new WebSocket(w);let id=0;const b=new Map();ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id&&b.has(m.id)){b.get(m.id)(m.result);b.delete(m.id);}});const hazir=new Promise(r=>ws.addEventListener('open',r));const g=(me,pa)=>new Promise(res=>{const i=++id;b.set(i,res);ws.send(JSON.stringify({id:i,method:me,params:pa}));});return{hazir,g};}
const evl=(c,e)=>c.g('Runtime.evaluate',{expression:e,returnByValue:true,awaitPromise:true}).then(r=>r?.result?.value);
try{const c=cdp(await hedef());await c.hazir;await c.g('Page.enable',{});await c.g('Runtime.enable',{});
await c.g('Emulation.setDeviceMetricsOverride',{width:400,height:880,deviceScaleFactor:2,mobile:true});
await c.g('Page.navigate',{url:`file:///${KOK}/canli-fix.html`});await bekle(2500);
await evl(c,"try{premiumAyarla(true)}catch(e){};try{localStorage.setItem('mevzu_premium','1')}catch(e){};1");await bekle(300);
await evl(c,"try{haritaAc('asmaca')}catch(e){}");await bekle(900);
await evl(c,"(function(){var d=document.querySelector('#tel .dugum');if(d)d.click()})()");await bekle(800);
await evl(c,"(function(){var d=document.querySelector('#tel .dugum');if(d)d.click()})()");await bekle(1200);
const r=await evl(c,`(function(){
  var kl=document.querySelector('#asKlavye'); var G=document.querySelector('#govde');
  if(!kl)return 'asKlavye yok';
  var klSay=0, govSay=0;
  var o1=new MutationObserver(function(m){klSay+=m.length;}); o1.observe(kl,{childList:true});
  var o2=new MutationObserver(function(m){m.forEach(x=>{if([...x.addedNodes].some(n=>n.id==='asKlavye'||n.className&&String(n.className).includes('asUst')))govSay++;});}); o2.observe(G,{childList:true});
  var tusar=[...document.querySelectorAll('#asKlavye .tus:not([disabled])')];
  for(var i=0;i<4&&i<tusar.length;i++) tusar[i].click();
  o1.disconnect();o2.disconnect();
  return JSON.stringify({basildi:Math.min(4,tusar.length), klavyeYenidenKuruldu:klSay, govdeBuyukYenidenKurulum:govSay});
})()`);
console.log(r);
}finally{ch.kill();}
