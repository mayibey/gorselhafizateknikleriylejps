import { spawn } from 'node:child_process';
const KOK = 'D:/GorselHafizaTeknikleriyleJSPS/scratchpad';
const PORT = 9471;
const bekle = (ms) => new Promise((r) => setTimeout(r, ms));
const ch = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',
  ['--headless=new','--disable-gpu','--no-first-run',`--remote-debugging-port=${PORT}`,`--user-data-dir=${KOK}/chrome-dag`,'about:blank'],{stdio:'ignore'});
async function hedef(){for(let i=0;i<40;i++){try{const t=await(await fetch(`http://127.0.0.1:${PORT}/json`)).json();const p=t.find(x=>x.type==='page');if(p?.webSocketDebuggerUrl)return p.webSocketDebuggerUrl;}catch{}await bekle(300);}throw new Error('yok');}
function cdp(w){const ws=new WebSocket(w);let id=0;const b=new Map();ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id&&b.has(m.id)){b.get(m.id)(m.result);b.delete(m.id);}});const hazir=new Promise(r=>ws.addEventListener('open',r));const g=(me,pa)=>new Promise(res=>{const i=++id;b.set(i,res);ws.send(JSON.stringify({id:i,method:me,params:pa}));});return{hazir,g};}
const evl=(c,e)=>c.g('Runtime.evaluate',{expression:e,returnByValue:true,awaitPromise:true}).then(r=>r?.result?.value);
const ARA=`(function(){
  var out=[];
  document.querySelectorAll('#tel, #tel *').forEach(function(el){
    var cs=getComputedStyle(el); var bi=cs.backgroundImage;
    if(bi && bi!=='none' && bi.length>60){ var r=el.getBoundingClientRect();
      out.push({sel:el.tagName+(el.id?'#'+el.id:'')+'.'+String(el.className||'').slice(0,20), w:Math.round(r.width),h:Math.round(r.height), bi:bi.slice(0,45)}); }
  });
  document.querySelectorAll('#tel img').forEach(function(im){var r=im.getBoundingClientRect();out.push({img:im.src.slice(0,45),w:Math.round(r.width),h:Math.round(r.height)});});
  return JSON.stringify(out.slice(0,10));
})()`;
async function gir(c,ac,harita){
  await evl(c,`try{${ac}}catch(e){}`);await bekle(1000);
  if(harita){await evl(c,"(function(){var d=document.querySelector('#tel .dugum');if(d)d.click()})()");await bekle(900);
    await evl(c,"(function(){var d=document.querySelector('#tel .dugum');if(d)d.click();var p=document.querySelector('.perde,.introDevam');if(p)p.click()})()");await bekle(1300);}
}
try{
  const c=cdp(await hedef());await c.hazir;await c.g('Page.enable',{});await c.g('Runtime.enable',{});
  await c.g('Emulation.setDeviceMetricsOverride',{width:400,height:880,deviceScaleFactor:2,mobile:true});
  await c.g('Page.navigate',{url:`file:///${KOK}/canli-fix.html`});await bekle(2500);
  await evl(c,"try{premiumAyarla(true)}catch(e){};try{localStorage.setItem('mevzu_premium','1')}catch(e){};1");await bekle(300);
  await gir(c,'acMilyoner()',false);
  console.log('RUTBE (dagli):', await evl(c,ARA));
  await gir(c,"haritaAc('terazi')",true);
  console.log('TERAZI (duz):', await evl(c,ARA));
}finally{ch.kill();}
