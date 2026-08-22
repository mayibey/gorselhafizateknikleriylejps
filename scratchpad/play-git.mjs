import fs from 'node:fs';
const PORT=9500;const bekle=ms=>new Promise(r=>setTimeout(r,ms));
async function ilkSekme(){const t=await(await fetch(`http://127.0.0.1:${PORT}/json`)).json();return t.find(x=>x.type==='page');}
function cdp(w){const ws=new WebSocket(w);let id=0;const b=new Map();ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id&&b.has(m.id)){b.get(m.id)(m.result);b.delete(m.id);}});const hazir=new Promise(r=>ws.addEventListener('open',r));const g=(me,pa)=>new Promise(res=>{const i=++id;b.set(i,res);ws.send(JSON.stringify({id:i,method:me,params:pa}));});return{hazir,g};}
const p=await ilkSekme();
const c=cdp(p.webSocketDebuggerUrl);await c.hazir;
await c.g('Page.enable',{});await c.g('Runtime.enable',{});
await c.g('Page.navigate',{url:'https://play.google.com/console'});await bekle(7000);
const info=await c.g('Runtime.evaluate',{expression:'JSON.stringify({url:location.href,title:document.title,hesap:(document.querySelector("[aria-label*=\\"Google Account\\"],[aria-label*=\\"Hesap\\"]")||{}).getAttribute?.("aria-label")||"?"})',returnByValue:true});
console.log(info?.result?.result?.value);
const s=await c.g('Page.captureScreenshot',{format:'png'});
if(s?.result?.data)fs.writeFileSync('scratchpad/play-durum.png',Buffer.from(s.result.data,'base64'));
console.log('play-durum.png');
