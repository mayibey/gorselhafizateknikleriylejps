import fs from 'node:fs';
const PORT=9500; const AAB='D:/easbuild-tmp/mevzu-1045-clean.aab';
const bekle=ms=>new Promise(r=>setTimeout(r,ms));
const t=await(await fetch(`http://127.0.0.1:${PORT}/json`)).json();
const p=t.find(x=>x.type==='page'&&(x.url||'').includes('play.google.com/console'));
const ws=new WebSocket(p.webSocketDebuggerUrl);let id=0;const b=new Map();
ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id&&b.has(m.id)){b.get(m.id)(m);b.delete(m.id);}});
await new Promise(r=>ws.addEventListener('open',r));
const g=(me,pa)=>new Promise((res,rej)=>{const i=++id;const to=setTimeout(()=>{b.delete(i);rej(new Error('timeout '+me));},20000);b.set(i,m=>{clearTimeout(to);res(m.result);});ws.send(JSON.stringify({id:i,method:me,params:pa}));});
const evl=async e=>{const r=await g('Runtime.evaluate',{expression:e,returnByValue:true});return r?.result?.value;};
await g('DOM.enable',{});await g('Runtime.enable',{});
const n=await evl("document.querySelectorAll('input[type=file]').length");
console.log('file input sayisi:',n);
const doc=await g('DOM.getDocument',{depth:-1});
const q=await g('DOM.querySelector',{nodeId:doc.root.nodeId,selector:'input[type=file]'});
console.log('input nodeId:',q.nodeId);
if(!q.nodeId){console.log('DOSYA GIRISI YOK'); process.exit(1);}
await g('DOM.setFileInputFiles',{nodeId:q.nodeId,files:[AAB]});
console.log('AAB set edildi:',AAB);
// yukleme/isleme icin bekle + durum
for(let i=0;i<20;i++){
  await bekle(6000);
  const durum=await evl(`(function(){var t=document.body.innerText;var m=t.match(/(Y[üu]kleniyor|i[şs]leniyor|% *[0-9]+|1\.0\.45|62 *\(1\.0\.45\)|Ba[şs]ar[ıi]|tamamland|hata|Hata)/i);return m?m[0]:'(bekliyor)';})()`);
  console.log(`[${i}] durum:`, durum);
  if(/1\.0\.45|62|ba[şs]ar|tamamland/i.test(durum||'')) break;
}
const s=await g('Page.captureScreenshot',{format:'png'});fs.writeFileSync('scratchpad/play.png',Buffer.from(s.data,'base64'));
console.log('screenshot alindi');
process.exit(0);
