import {spawn} from 'node:child_process';
const KOK='D:/GorselHafizaTeknikleriyleJSPS/scratchpad';const PORT=9492;const bekle=ms=>new Promise(r=>setTimeout(r,ms));
const ch=spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--disable-gpu','--no-first-run',`--remote-debugging-port=${PORT}`,`--user-data-dir=${KOK}/chrome-ky`,'about:blank'],{stdio:'ignore'});
async function hedef(){for(let i=0;i<40;i++){try{const t=await(await fetch(`http://127.0.0.1:${PORT}/json`)).json();const p=t.find(x=>x.type==='page');if(p?.webSocketDebuggerUrl)return p.webSocketDebuggerUrl;}catch{}await bekle(300);}throw new Error('yok');}
function cdp(w){const ws=new WebSocket(w);let id=0;const b=new Map();ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id&&b.has(m.id)){b.get(m.id)(m.result);b.delete(m.id);}});const hazir=new Promise(r=>ws.addEventListener('open',r));const g=(me,pa)=>new Promise(res=>{const i=++id;b.set(i,res);ws.send(JSON.stringify({id:i,method:me,params:pa}));});return{hazir,g};}
const evl=(c,e)=>c.g('Runtime.evaluate',{expression:e,returnByValue:true,awaitPromise:true}).then(r=>r?.result?.value);
try{const c=cdp(await hedef());await c.hazir;await c.g('Runtime.enable',{});await c.g('Page.enable',{});
await c.g('Page.navigate',{url:`file:///${KOK}/canli-fix.html`});await bekle(2500);
await evl(c,"try{premiumAyarla(true)}catch(e){};try{localStorage.setItem('mevzu_premium','1')}catch(e){};1");await bekle(400);
const r=await evl(c,`(function(){
  var out={};
  out.oyunListesi = OYUNLAR.map(o=>({id:o.id,ad:o.ad,g:o.g}));
  out.haritalar = Object.keys(HARITALAR||{});
  out.haritasiz = (typeof HARITASIZ_MEYDAN!=='undefined')?Object.keys(HARITASIZ_MEYDAN):[];
  // her haritali oyunun bolum sayisi
  out.bolumSayilari={};
  Object.keys(HARITALAR||{}).forEach(function(id){try{HRT=HARITALAR[id];var b=bolumler();out.bolumSayilari[id]=b.length;}catch(e){out.bolumSayilari[id]='?';}});
  return JSON.stringify(out,null,1);
})()`);
console.log(r);
}finally{ch.kill();}
