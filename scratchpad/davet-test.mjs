import {spawn} from 'node:child_process';
const KOK='D:/GorselHafizaTeknikleriyleJSPS/scratchpad';const PORT=9490;const bekle=ms=>new Promise(r=>setTimeout(r,ms));
const ch=spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--disable-gpu','--no-first-run',`--remote-debugging-port=${PORT}`,`--user-data-dir=${KOK}/chrome-dv`,'about:blank'],{stdio:'ignore'});
async function hedef(){for(let i=0;i<40;i++){try{const t=await(await fetch(`http://127.0.0.1:${PORT}/json`)).json();const p=t.find(x=>x.type==='page');if(p?.webSocketDebuggerUrl)return p.webSocketDebuggerUrl;}catch{}await bekle(300);}throw new Error('yok');}
function cdp(w){const ws=new WebSocket(w);let id=0;const b=new Map();ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id&&b.has(m.id)){b.get(m.id)(m.result);b.delete(m.id);}});const hazir=new Promise(r=>ws.addEventListener('open',r));const g=(me,pa)=>new Promise(res=>{const i=++id;b.set(i,res);ws.send(JSON.stringify({id:i,method:me,params:pa}));});return{hazir,g};}
const evl=(c,e)=>c.g('Runtime.evaluate',{expression:e,returnByValue:true,awaitPromise:true}).then(r=>r?.result?.value);
try{const c=cdp(await hedef());await c.hazir;await c.g('Runtime.enable',{});
await c.g('Page.enable',{});await c.g('Emulation.setDeviceMetricsOverride',{width:400,height:880,deviceScaleFactor:2,mobile:true});
await c.g('Page.navigate',{url:`file:///${KOK}/canli-son.html`});await bekle(2500);
await evl(c,"try{premiumAyarla(true)}catch(e){};try{localStorage.setItem('mevzu_premium','1')}catch(e){};1");await bekle(400);
// 1) Kod uret (Kim Yapar=esles bolum 0), 2) meydanKabul ile ac (RN inject simulasyonu), 3) sonucu oku
const r=await evl(c,`(function(){
  try{
    var kod=meydanKodla('esles',0,'testarkadas',2,5,null);
    var link='(aglanti obje metodu)';
    var oncesiOyun=(typeof acikOyun!=='undefined')?acikOyun:'yok';
    var sonuc=meydanKabul(kod);
    return JSON.stringify({
      kod:kod.slice(0,30)+'...', link:link,
      kabulSonuc:sonuc, acilanOyun:(typeof acikOyun!=='undefined')?acikOyun:'yok',
      meydanVar:(typeof meydan!=='undefined'&&meyd an)?{oyun:meydan.oyun,bolum:meydan.bolum,skor:meydan.skor}:null,
      dogruOyunAcildi: (typeof acikOyun!=='undefined'&&acikOyun==='esles')
    });
  }catch(e){return 'HATA: '+e.message;}
})()`.replace('meyd an','meydan'));
console.log(r);
}finally{ch.kill();}
