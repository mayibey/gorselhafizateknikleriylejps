import fs from 'node:fs';
const PORT=9500;const bekle=ms=>new Promise(r=>setTimeout(r,ms));
const NOTES=`Yeni Oyun Merkezi: 14 oyunla mevzuati oynayarak ogren - Cengel Bulmaca, Bosluk Doldurma, Dogru mu Yanlis, Rutbe Merdiveni, Er Meydani (canli 1v1) ve daha fazlasi.
Patika yenilendi: bolum bolum ilerleyen, tamamladikca acilan harita.
Sesli anlatim her kart acilisinda otomatik basliyor.
Calisirken ekran kapanmiyor.
Cesitli iyilestirmeler ve hata duzeltmeleri.`;
const t=await(await fetch(`http://127.0.0.1:${PORT}/json`)).json();
const p=t.find(x=>x.type==='page'&&(x.url||'').includes('play.google.com/console'));
const ws=new WebSocket(p.webSocketDebuggerUrl);let id=0;const b=new Map();
ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id&&b.has(m.id)){b.get(m.id)(m);b.delete(m.id);}});
await new Promise(r=>ws.addEventListener('open',r));
const g=(me,pa)=>new Promise((res,rej)=>{const i=++id;const to=setTimeout(()=>rej(new Error('t '+me)),12000);b.set(i,m=>{clearTimeout(to);res(m.result);});ws.send(JSON.stringify({id:i,method:me,params:pa}));});
const evl=async e=>{const r=await g('Runtime.evaluate',{expression:e,returnByValue:true});return r?.result?.value;};
await g('Runtime.enable',{});
const val='<tr-TR>\n'+NOTES+'\n</tr-TR>';
const set=await evl(`(function(){var ta=document.querySelector('textarea');if(!ta)return 'YOK';var d=Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype,'value').set;d.call(ta,${JSON.stringify(val)});ta.dispatchEvent(new Event('input',{bubbles:true}));ta.dispatchEvent(new Event('change',{bubbles:true}));ta.blur();return ta.value.slice(0,40);})()`);
console.log('not set:',set);
await bekle(1500);
const clik=await evl(`(function(){var b=[...document.querySelectorAll('button')].find(x=>(x.textContent||'').trim()==='İleri');if(b){b.click();return 'tiklandi';}return 'İleri YOK';})()`);
console.log('İleri:',clik);
await bekle(5000);
const s=await g('Page.captureScreenshot',{format:'png'});fs.writeFileSync('scratchpad/play.png',Buffer.from(s.data,'base64'));
console.log('url:',await evl('location.href'));
process.exit(0);
