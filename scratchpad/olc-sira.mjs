import { spawn } from 'node:child_process';
const KOK = 'D:/GorselHafizaTeknikleriyleJSPS/scratchpad';
const PORT = 9457;
const bekle = (ms) => new Promise((r) => setTimeout(r, ms));
const ch = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',
  ['--headless=new','--disable-gpu','--no-first-run',`--remote-debugging-port=${PORT}`,`--user-data-dir=${KOK}/chrome-olc`,'about:blank'],{stdio:'ignore'});
async function hedef(){for(let i=0;i<40;i++){try{const t=await(await fetch(`http://127.0.0.1:${PORT}/json`)).json();const p=t.find(x=>x.type==='page');if(p?.webSocketDebuggerUrl)return p.webSocketDebuggerUrl;}catch{}await bekle(300);}throw new Error('yok');}
function cdp(w){const ws=new WebSocket(w);let id=0;const b=new Map();ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id&&b.has(m.id)){b.get(m.id)(m.result);b.delete(m.id);}});const hazir=new Promise(r=>ws.addEventListener('open',r));const g=(me,pa)=>new Promise(res=>{const i=++id;b.set(i,res);ws.send(JSON.stringify({id:i,method:me,params:pa}));});return{hazir,g};}
const evl=(c,e)=>c.g('Runtime.evaluate',{expression:e,returnByValue:true}).then(r=>r?.result?.value);
const OLC=`(function(){
  var hv=document.querySelector('.havuz'); if(!hv)return 'havuz YOK';
  var G=hv.parentElement;
  var ks=[...hv.querySelectorAll('.hk')];
  function bilg(el){var r=el.getBoundingClientRect(),cs=getComputedStyle(el);
    return {top:Math.round(r.top),bot:Math.round(r.bottom),h:Math.round(r.height),
      pos:cs.position,minH:cs.minHeight,flexShrink:cs.flexShrink,ws:cs.whiteSpace,ovf:cs.overflow};}
  return JSON.stringify({
    havuz:{...bilg(hv),display:getComputedStyle(hv).display,dir:getComputedStyle(hv).flexDirection,gap:getComputedStyle(hv).gap,ovf:getComputedStyle(hv).overflow},
    parent:{tag:G.tagName,id:G.id,h:Math.round(G.getBoundingClientRect().height),display:getComputedStyle(G).display,ovf:getComputedStyle(G).overflow,flex:getComputedStyle(G).flex},
    kartSayisi:ks.length,
    kart0:ks[0]?bilg(ks[0]):null,
    kart1:ks[1]?bilg(ks[1]):null,
    binme: ks[0]&&ks[1] ? (ks[1].getBoundingClientRect().top < ks[0].getBoundingClientRect().bottom) : null,
  },null,1);
})()`;
try{
  const c=cdp(await hedef());await c.hazir;
  await c.g('Page.enable',{});await c.g('Runtime.enable',{});
  await c.g('Emulation.setDeviceMetricsOverride',{width:400,height:870,deviceScaleFactor:2,mobile:true});
  await c.g('Page.navigate',{url:`file:///${KOK}/canli-son.html`});await bekle(2500);
  await evl(c,"try{premiumAyarla(true)}catch(e){};try{localStorage.setItem('mevzu_premium','1')}catch(e){};1");
  await bekle(300);
  await evl(c,"try{haritaAc('sira')}catch(e){e.message}");await bekle(900);
  await evl(c,"(function(){var d=document.querySelector('#tel .dugum');if(d)d.click();return 1})()");await bekle(1000);
  await evl(c,"(function(){var d=document.querySelector('#tel .dugum');if(d)d.click();return 1})()");await bekle(1800);
  console.log(await evl(c, OLC));
}finally{ch.kill();}
