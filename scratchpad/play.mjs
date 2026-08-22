import fs from 'node:fs';
const PORT=9500;
const bekle=ms=>new Promise(r=>setTimeout(r,ms));
const t=await(await fetch(`http://127.0.0.1:${PORT}/json`)).json();
const p=t.find(x=>x.type==='page'&&(x.url||'').includes('play.google.com/console'));
const ws=new WebSocket(p.webSocketDebuggerUrl);let id=0;const b=new Map();
ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id&&b.has(m.id)){b.get(m.id)(m);b.delete(m.id);}});
await new Promise(r=>ws.addEventListener('open',r));
const g=(me,pa)=>new Promise((res,rej)=>{const i=++id;const to=setTimeout(()=>{b.delete(i);rej(new Error('timeout '+me));},20000);b.set(i,m=>{clearTimeout(to);res(m.result);});ws.send(JSON.stringify({id:i,method:me,params:pa}));});
const evl=async e=>{const r=await g('Runtime.evaluate',{expression:e,returnByValue:true});return r?.result?.value;};
await g('Page.enable',{});await g('Runtime.enable',{});await g('DOM.enable',{});
const cmd=process.argv[2];
if(cmd==='shot'){const s=await g('Page.captureScreenshot',{format:'png'});fs.writeFileSync('scratchpad/play.png',Buffer.from(s.data,'base64'));console.log('url:',await evl('location.href'));}
else if(cmd==='btns'){const v=await evl(`[...document.querySelectorAll('button,a')].filter(x=>x.offsetParent&&(x.textContent||'').trim()).map(x=>(x.textContent||'').trim().slice(0,40)).slice(0,40)`);console.log(JSON.stringify(v,null,1));}
else if(cmd==='click'){const q=process.argv[3];const ok=await evl(`(function(){var els=[...document.querySelectorAll('button,a,span,div')];var c=els.filter(x=>x.offsetParent&&(x.textContent||'').trim()===${JSON.stringify(q)});if(!c.length)c=els.filter(x=>x.offsetParent&&(x.textContent||'').trim().indexOf(${JSON.stringify(q)})>=0);c.sort((a,b)=>(a.textContent||'').length-(b.textContent||'').length);if(c[0]){c[0].click();return c[0].tagName+':'+(c[0].textContent||'').trim().slice(0,30);}return 'YOK';})()`);await bekle(2500);console.log('click:',ok);}
process.exit(0);
