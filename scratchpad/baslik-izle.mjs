import { spawn } from 'node:child_process';
const KOK = 'D:/GorselHafizaTeknikleriyleJSPS/scratchpad';
const PORT = 9463;
const bekle = (ms) => new Promise((r) => setTimeout(r, ms));
const ch = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',
  ['--headless=new','--disable-gpu','--no-first-run',`--remote-debugging-port=${PORT}`,`--user-data-dir=${KOK}/chrome-bi`,'about:blank'],{stdio:'ignore'});
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
    var bb=document.getElementById('barBas'); if(!bb)return 'barBas yok';
    var kayit=[];
    var obs=new MutationObserver(function(){ kayit.push({mevzuVar:!!bb.querySelector('.cBas'), metin:(bb.textContent||'').slice(0,25)}); });
    obs.observe(bb,{childList:true,characterData:true,subtree:true});
    var tusar=[...document.querySelectorAll('#klavye .tus,.tus')].filter(t=>/^[A-ZÇĞİÖŞÜ]$/.test((t.dataset.t||t.textContent||'').trim()));
    for(var i=0;i<6 && i<tusar.length;i++){ tusar[i].click(); }
    return new Promise(function(res){ setTimeout(function(){ obs.disconnect();
      var mevzusuz=kayit.filter(k=>!k.mevzuVar);
      res(JSON.stringify({toplamMutasyon:kayit.length, mevzuSUZanlar:mevzusuz.length, ornek:kayit.slice(0,8), suanBaslik:bb.textContent.slice(0,25), suanMevzuVar:!!bb.querySelector('.cBas')},null,1)); },400); });
  })()`);
  console.log(r);
}finally{ch.kill();}
