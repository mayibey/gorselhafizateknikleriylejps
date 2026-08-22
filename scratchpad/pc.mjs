import fs from 'node:fs';
const PORT=9500;const bekle=ms=>new Promise(r=>setTimeout(r,ms));
const t=await(await fetch(`http://127.0.0.1:${PORT}/json`)).json();
const p=t.find(x=>x.type==='page'&&x.url.includes('play.google'))||t.find(x=>x.type==='page');
const ws=new WebSocket(p.webSocketDebuggerUrl);let id=0;const b=new Map();
ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id&&b.has(m.id)){b.get(m.id)(m.result);b.delete(m.id);}});
await new Promise(r=>ws.addEventListener('open',r));
const g=(me,pa)=>new Promise(res=>{const i=++id;b.set(i,res);ws.send(JSON.stringify({id:i,method:me,params:pa}));});
const evl=async(expr)=>{const r=await g('Runtime.evaluate',{expression:expr,returnByValue:true});return r?.result?.value;};
await g('Page.enable',{});await g('Runtime.enable',{});
const cmd=process.argv[2], arg=process.argv[3];
if(cmd==='shot'){const s=await g('Page.captureScreenshot',{format:'png'});fs.writeFileSync('scratchpad/pc.png',Buffer.from(s.data,'base64'));console.log('pc.png url:',await evl('location.href'));}
else if(cmd==='url'){console.log(await evl('location.href'));}
else if(cmd==='goto'){await g('Page.navigate',{url:arg});await bekle(6500);console.log('url:',await evl('location.href'));}
else if(cmd==='click'){const ok=await evl(`(function(){var q=${JSON.stringify(arg)};var els=[...document.querySelectorAll('a,button,span,div,td')];var el=els.find(x=>x.offsetParent&&(x.textContent||'').trim().includes(q));if(el){el.scrollIntoView({block:'center'});el.click();return el.tagName+':'+(el.textContent||'').trim().slice(0,30);}return 'YOK';})()`);await bekle(4500);console.log('click:',ok,'| url:',await evl('location.href'));}
else if(cmd==='type'){await evl(`(function(){var q=${JSON.stringify(arg)};var i=document.activeElement;if(i&&(i.tagName==='INPUT'||i.tagName==='TEXTAREA')){i.value=q;i.dispatchEvent(new Event('input',{bubbles:true}));return true;}return false;})()`);console.log('type ok');}
process.exit(0);
