import fs from 'node:fs';import {spawn} from 'node:child_process';
const KOK='D:/GorselHafizaTeknikleriyleJSPS/scratchpad';const PORT=9494;const bekle=ms=>new Promise(r=>setTimeout(r,ms));
const ch=spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',['--headless=new','--disable-gpu','--no-first-run',`--remote-debugging-port=${PORT}`,`--user-data-dir=${KOK}/chrome-sd`,'about:blank'],{stdio:'ignore'});
async function hedef(){for(let i=0;i<40;i++){try{const t=await(await fetch(`http://127.0.0.1:${PORT}/json`)).json();const p=t.find(x=>x.type==='page');if(p?.webSocketDebuggerUrl)return p.webSocketDebuggerUrl;}catch{}await bekle(300);}throw new Error('yok');}
function cdp(w){const ws=new WebSocket(w);let id=0;const b=new Map();ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id&&b.has(m.id)){b.get(m.id)(m.result);b.delete(m.id);}});const hazir=new Promise(r=>ws.addEventListener('open',r));const g=(me,pa)=>new Promise(res=>{const i=++id;b.set(i,res);ws.send(JSON.stringify({id:i,method:me,params:pa}));});return{hazir,g};}
const evl=(c,e)=>c.g('Runtime.evaluate',{expression:e,returnByValue:true,awaitPromise:true}).then(r=>r?.result?.value);
async function ss(c,ad){const s=await c.g('Page.captureScreenshot',{format:'png'});if(s?.data)fs.writeFileSync(`${KOK}/sd-${ad}.png`,Buffer.from(s.data,'base64'));}
try{const c=cdp(await hedef());await c.hazir;await c.g('Page.enable',{});await c.g('Runtime.enable',{});
await c.g('Emulation.setDeviceMetricsOverride',{width:400,height:880,deviceScaleFactor:2,mobile:true});
await c.g('Page.navigate',{url:`file:///${KOK}/canli-fix.html`});await bekle(2500);
await evl(c,"try{premiumAyarla(true)}catch(e){};try{localStorage.setItem('mevzu_premium','1')}catch(e){};1");await bekle(400);
// BUG#2: nasil oynanir modal (tanitimAc)
await evl(c,"try{haritaAc('cengel')}catch(e){}");await bekle(500);
await evl(c,"try{tanitimAc('cengel')}catch(e){}");await bekle(600);
const b2=await evl(c,"(function(){var t=document.querySelector('.tanitim .tAd');return t?JSON.stringify({metin:t.textContent,renk:getComputedStyle(t).color}):'yok'})()");
console.log('BUG#2 nasil oyun adi:', b2); await ss(c,'nasil');
// BUG#3: DY damga
await evl(c,"document.querySelectorAll('[aria-modal],#tanitimOrtu').forEach(m=>m.remove?m.remove():m.style.display='none')");
await evl(c,"try{acDY()}catch(e){try{dyKur()}catch(e2){}}");await bekle(800);
// yanlis cevap ver (DY: iki buton dogru/yanlis)
await evl(c,"(function(){var b=document.querySelector('#dTel .dBtn,[data-dy],.dyBtn,#dY,#dN');if(b)b.click();var any=[...document.querySelectorAll('button')].find(x=>/DOĞRU|YANLIŞ/i.test(x.textContent));if(any)any.click();return 1})()");await bekle(600);
const b3=await evl(c,"(function(){var d=document.querySelector('.dyDamga.gor,.dyDamga');return d?JSON.stringify({gor:d.className,top:getComputedStyle(d).top}):'yok'})()");
console.log('BUG#3 DY damga:', b3); await ss(c,'dy-damga');
console.log('sd-nasil.png, sd-dy-damga.png');
}finally{ch.kill();}
