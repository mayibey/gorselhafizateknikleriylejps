import fs from 'node:fs';
const PORT=9500;
const bekle=ms=>new Promise(r=>setTimeout(r,ms));
const t=await(await fetch(`http://127.0.0.1:${PORT}/json`)).json();
const p=t.find(x=>x.type==='page'&&(x.url||'').includes('play.google.com/console'));
const ws=new WebSocket(p.webSocketDebuggerUrl);let id=0;const b=new Map();
ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id&&b.has(m.id)){b.get(m.id)(m);b.delete(m.id);}});
await new Promise(r=>ws.addEventListener('open',r));
const g=(me,pa)=>new Promise((res,rej)=>{const i=++id;const to=setTimeout(()=>{b.delete(i);rej(new Error('timeout '+me));},12000);b.set(i,m=>{clearTimeout(to);res(m.result);});ws.send(JSON.stringify({id:i,method:me,params:pa}));});
const cmd=process.argv[2];
async function scroll(y){ await g('Input.dispatchMouseEvent',{type:'mouseWheel',x:700,y:400,deltaX:0,deltaY:y}); await bekle(700);}
async function shot(){ const s=await g('Page.captureScreenshot',{format:'png'});fs.writeFileSync('scratchpad/play.png',Buffer.from(s.data,'base64'));}
if(cmd==='scrollshot'){ await scroll(parseInt(process.argv[3]||'600')); await shot(); console.log('ok');}
else if(cmd==='top'){ await scroll(-4000); await shot(); console.log('top');}
else if(cmd==='shot'){ await shot(); console.log('ok');}
process.exit(0);
