import { spawn } from 'node:child_process';
const KOK = 'D:/GorselHafizaTeknikleriyleJSPS/scratchpad';
const PORT = 9462;
const bekle = (ms) => new Promise((r) => setTimeout(r, ms));
const ch = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',
  ['--headless=new','--disable-gpu','--no-first-run',`--remote-debugging-port=${PORT}`,`--user-data-dir=${KOK}/chrome-io`,'about:blank'],{stdio:'ignore'});
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
    // "MEVZU ÇENGEL" iceren en dar element
    var hep=[...document.querySelectorAll('#tel *')].filter(e=>/ÇENGEL|MEVZU/.test(e.textContent||''));
    var isim=hep.sort((a,b)=>a.textContent.length-b.textContent.length)[0];
    if(!isim)return 'isim YOK';
    var yol=isim.tagName+(isim.id?'#'+isim.id:'')+'.'+String(isim.className||'').replace(/\\s+/g,'.');
    var cs=getComputedStyle(isim), pcs=getComputedStyle(isim.parentElement);
    var r1=isim.getBoundingClientRect();
    var bs=document.querySelector('#barSag'), bsCs=bs?getComputedStyle(bs):null;
    // harf bas
    var tus=[...document.querySelectorAll('#klavye .tus,.tus')].find(t=>/^[A-ZÇĞİÖŞÜ]$/.test((t.dataset.t||t.textContent||'').trim()));
    if(tus)tus.click();
    return new Promise(function(res){ requestAnimationFrame(function(){ requestAnimationFrame(function(){
      var r2=isim.getBoundingClientRect();
      res(JSON.stringify({
        isim:yol.slice(0,60), metin:isim.textContent.slice(0,30),
        animasyon:cs.animationName, transition:cs.transition.slice(0,40),
        parentDisplay:pcs.display, parentAnim:pcs.animationName,
        rectReflow: (r1.x!==r2.x||r1.y!==r2.y||r1.width!==r2.width),
        r1:{x:Math.round(r1.x),w:Math.round(r1.width)}, r2:{x:Math.round(r2.x),w:Math.round(r2.width)},
        barSagGorunur: bsCs?bsCs.display:'yok', barSagParentOrtak: bs&&isim.parentElement&&bs.parentElement===isim.parentElement
      },null,1)); }); }); });
  })()`);
  console.log(r);
}finally{ch.kill();}
