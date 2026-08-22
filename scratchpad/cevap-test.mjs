import fs from 'node:fs';import {spawn} from 'node:child_process';
const KOK='D:/GorselHafizaTeknikleriyleJSPS/scratchpad';const PORT=9480;const bekle=ms=>new Promise(r=>setTimeout(r,ms));
const ch=spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--disable-gpu','--no-first-run',`--remote-debugging-port=${PORT}`,`--user-data-dir=${KOK}/chrome-cv`,'about:blank'],{stdio:'ignore'});
async function hedef(){for(let i=0;i<40;i++){try{const t=await(await fetch(`http://127.0.0.1:${PORT}/json`)).json();const p=t.find(x=>x.type==='page');if(p?.webSocketDebuggerUrl)return p.webSocketDebuggerUrl;}catch{}await bekle(300);}throw new Error('yok');}
function cdp(w){const ws=new WebSocket(w);let id=0;const b=new Map();ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id&&b.has(m.id)){b.get(m.id)(m.result);b.delete(m.id);}});const hazir=new Promise(r=>ws.addEventListener('open',r));const g=(me,pa)=>new Promise(res=>{const i=++id;b.set(i,res);ws.send(JSON.stringify({id:i,method:me,params:pa}));});return{hazir,g};}
const evl=(c,e)=>c.g('Runtime.evaluate',{expression:e,returnByValue:true,awaitPromise:true}).then(r=>r?.result?.value);
async function gir(c,ac){await evl(c,`try{${ac}}catch(e){}`);await bekle(900);await evl(c,"(function(){var d=document.querySelector('#tel .dugum');if(d)d.click()})()");await bekle(800);await evl(c,"(function(){var d=document.querySelector('#tel .dugum');if(d)d.click();var p=document.querySelector('.perde,.introDevam');if(p)p.click()})()");await bekle(1200);}
try{const c=cdp(await hedef());await c.hazir;await c.g('Page.enable',{});await c.g('Runtime.enable',{});
await c.g('Emulation.setDeviceMetricsOverride',{width:400,height:880,deviceScaleFactor:2,mobile:true});
await c.g('Page.navigate',{url:`file:///${KOK}/canli-fix.html`});await bekle(2500);
await evl(c,"try{premiumAyarla(true)}catch(e){};try{localStorage.setItem('mevzu_premium','1')}catch(e){};1");await bekle(300);
// HANGI KANUN - yanlis cevap
await gir(c,"haritaAc('hangi')");
await evl(c,"(function(){var d=hL[hi].c;var y=[...document.querySelectorAll('.sik')].find(b=>b.dataset.v!==d);if(y)y.click();return 1})()");
await bekle(500);let s=await c.g('Page.captureScreenshot',{format:'png'});if(s?.data)fs.writeFileSync(`${KOK}/cv-hangi.png`,Buffer.from(s.data,'base64'));
// BOSLUK - cevap ver
await gir(c,"haritaAc('bosluk')");
await evl(c,"(function(){var b=document.querySelector('.sik,[data-v],[data-sik],button.opsiyon,.bSik');if(b)b.click();return 1})()");
await bekle(500);s=await c.g('Page.captureScreenshot',{format:'png'});if(s?.data)fs.writeFileSync(`${KOK}/cv-bosluk.png`,Buffer.from(s.data,'base64'));
console.log('cv-hangi.png, cv-bosluk.png');
}finally{ch.kill();}
