import fs from 'node:fs';
const PORT=9500; const AAB='D:/easbuild-tmp/mevzu-1045-clean.aab';
const bekle=ms=>new Promise(r=>setTimeout(r,ms));
const t=await(await fetch(`http://127.0.0.1:${PORT}/json`)).json();
const p=t.find(x=>x.type==='page'&&(x.url||'').includes('play.google.com/console'));
const ws=new WebSocket(p.webSocketDebuggerUrl);let id=0;const b=new Map();
ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id&&b.has(m.id)){b.get(m.id)(m);b.delete(m.id);}});
await new Promise(r=>ws.addEventListener('open',r));
const g=(me,pa)=>new Promise((res,rej)=>{const i=++id;const to=setTimeout(()=>{b.delete(i);rej(new Error('timeout '+me));},15000);b.set(i,m=>{clearTimeout(to);res(m.result);});ws.send(JSON.stringify({id:i,method:me,params:pa}));});
await g('DOM.enable',{});
const doc=await g('DOM.getDocument',{depth:-1});
// tum input[type=file] nodeId'leri (querySelectorAll)
const all=await g('DOM.querySelectorAll',{nodeId:doc.root.nodeId,selector:'input[type=file]'});
console.log('file input sayisi:', all.nodeIds.length);
for(const nid of all.nodeIds){
  try{ await g('DOM.setFileInputFiles',{nodeId:nid,files:[AAB]}); console.log('  set ->',nid); }
  catch(e){ console.log('  set HATA',nid,e.message); }
}
console.log('bekleniyor (upload+isleme)...');
process.exit(0);
