import fs from 'node:fs';
const PORT=9500;const bekle=ms=>new Promise(r=>setTimeout(r,ms));
const t=await(await fetch(`http://127.0.0.1:${PORT}/json`)).json();
const p=t.find(x=>x.type==='page'&&x.url.includes('play.google'))||t.find(x=>x.type==='page');
const ws=new WebSocket(p.webSocketDebuggerUrl);let id=0;const b=new Map();
ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id&&b.has(m.id)){b.get(m.id)(m.result);b.delete(m.id);}});
await new Promise(r=>ws.addEventListener('open',r));
const g=(me,pa)=>new Promise(res=>{const i=++id;b.set(i,res);ws.send(JSON.stringify({id:i,method:me,params:pa}));});
const tik=async(x,y)=>{await g('Input.dispatchMouseEvent',{type:'mouseMoved',x,y});await bekle(120);await g('Input.dispatchMouseEvent',{type:'mousePressed',x,y,button:'left',clickCount:1});await bekle(100);await g('Input.dispatchMouseEvent',{type:'mouseReleased',x,y,button:'left',clickCount:1});await bekle(500);};
const yaz=async(txt)=>{await g('Input.insertText',{text:txt});await bekle(400);};
// plan kimligi
await tik(925,216); await yaz('aylik');
// otomatik yenileme radio
await tik(635,367); await bekle(800);
const s=await g('Page.captureScreenshot',{format:'png'});fs.writeFileSync('scratchpad/pc.png',Buffer.from(s.data,'base64'));
console.log('pc.png');
process.exit(0);
