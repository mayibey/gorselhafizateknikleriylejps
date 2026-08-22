import { spawn } from 'node:child_process';
const KOK = 'D:/GorselHafizaTeknikleriyleJSPS/scratchpad';
const PORT = 9461;
const bekle = (ms) => new Promise((r) => setTimeout(r, ms));
const ch = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',
  ['--headless=new','--disable-gpu','--no-first-run',`--remote-debugging-port=${PORT}`,`--user-data-dir=${KOK}/chrome-cf2`,'about:blank'],{stdio:'ignore'});
async function hedef(){for(let i=0;i<40;i++){try{const t=await(await fetch(`http://127.0.0.1:${PORT}/json`)).json();const p=t.find(x=>x.type==='page');if(p?.webSocketDebuggerUrl)return p.webSocketDebuggerUrl;}catch{}await bekle(300);}throw new Error('yok');}
function cdp(w){const ws=new WebSocket(w);let id=0;const b=new Map();ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id&&b.has(m.id)){b.get(m.id)(m.result);b.delete(m.id);}});const hazir=new Promise(r=>ws.addEventListener('open',r));const g=(me,pa)=>new Promise(res=>{const i=++id;b.set(i,res);ws.send(JSON.stringify({id:i,method:me,params:pa}));});return{hazir,g};}
const evl=(c,e)=>c.g('Runtime.evaluate',{expression:e,returnByValue:true,awaitPromise:true}).then(r=>r?.result?.value);
try{
  const c=cdp(await hedef());await c.hazir;await c.g('Page.enable',{});await c.g('Runtime.enable',{});
  await c.g('Emulation.setDeviceMetricsOverride',{width:400,height:870,deviceScaleFactor:2,mobile:true});
  await c.g('Page.navigate',{url:`file:///${KOK}/canli-fix.html`});await bekle(2500);
  await evl(c,"try{premiumAyarla(true)}catch(e){};try{localStorage.setItem('mevzu_premium','1')}catch(e){};1");await bekle(300);
  await evl(c,"try{haritaAc('cengel')}catch(e){}");await bekle(900);
  await evl(c,"(function(){var d=document.querySelector('#tel .dugum');if(d)d.click()})()");await bekle(900);
  await evl(c,"(function(){var d=document.querySelector('#tel .dugum');if(d)d.click()})()");await bekle(1400);
  const r=await evl(c,`(function(){
    function et(n){ if(!n)return 'null'; if(n.nodeType===3)return 'TEXT("'+(n.textContent||'').slice(0,20)+'")';
      return n.tagName+(n.id?'#'+n.id:'')+(n.className&&n.className.baseVal===undefined?'.'+String(n.className).replace(/\\s+/g,'.').slice(0,30):''); }
    var kayit=[];
    var obs=new MutationObserver(function(ms){ms.forEach(function(m){
      kayit.push({tip:m.type, hedef:et(m.target), eklenen:[...m.addedNodes].map(et).slice(0,3)});});});
    obs.observe(document.querySelector('#tel')||document.body,{childList:true,characterData:true,subtree:true,attributes:true,attributeFilter:['class','style']});
    // bir harf tusuna bas (Cengel klavyesi .tus[data-t])
    var tus=[...document.querySelectorAll('#klavye .tus, .tus')].find(t=>/^[A-ZÇĞİÖŞÜ]$/.test((t.dataset.t||t.textContent||'').trim()));
    var basildi=tus?(tus.click(),true):false;
    return new Promise(function(res){ setTimeout(function(){ obs.disconnect();
      res(JSON.stringify({basildi:basildi, tus:tus?tus.dataset.t:null, mutasyonSayisi:kayit.length, ornekler:kayit.slice(0,14)},null,1)); }, 300); });
  })()`);
  console.log(r);
}finally{ch.kill();}
