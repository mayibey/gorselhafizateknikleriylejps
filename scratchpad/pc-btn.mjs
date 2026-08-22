const PORT=9500;const bekle=ms=>new Promise(r=>setTimeout(r,ms));
const t=await(await fetch(`http://127.0.0.1:${PORT}/json`)).json();
const p=t.find(x=>x.type==='page'&&x.url.includes('play.google'))||t.find(x=>x.type==='page');
const ws=new WebSocket(p.webSocketDebuggerUrl);let id=0;const b=new Map();
ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id&&b.has(m.id)){b.get(m.id)(m.result);b.delete(m.id);}});
await new Promise(r=>ws.addEventListener('open',r));
const g=(me,pa)=>new Promise(res=>{const i=++id;b.set(i,res);ws.send(JSON.stringify({id:i,method:me,params:pa}));});
await g('Runtime.enable',{});
// modal icindeki aktif (disabled olmayan) submit/primary butonu bul, textini gorup tikla
const r=await g('Runtime.evaluate',{expression:`(function(){
  var btns=[...document.querySelectorAll('button')].filter(x=>x.offsetParent&&!x.disabled);
  var b=btns.find(x=>/olu/i.test((x.textContent||'').trim()));
  if(b){var r=b.getBoundingClientRect();return JSON.stringify({txt:b.textContent.trim(),x:Math.round(r.x+r.width/2),y:Math.round(r.y+r.height/2)});}
  return 'YOK';})()`,returnByValue:true});
console.log('buton:',r?.result?.result?.value);
const o=JSON.parse(r.result.result.value);
await g('Input.dispatchMouseEvent',{type:'mousePressed',x:o.x,y:o.y,button:'left',clickCount:1});
await g('Input.dispatchMouseEvent',{type:'mouseReleased',x:o.x,y:o.y,button:'left',clickCount:1});
await bekle(3000);
const u=await g('Runtime.evaluate',{expression:'location.href',returnByValue:true});
console.log('url:',u?.result?.result?.value);
process.exit(0);
