import { spawn } from 'node:child_process'; import fs from 'node:fs'; import WebSocket from 'ws';
const P=9422, C='C:/Users/GIGABYTE/AppData/Local/Temp/claude/D--GorselHafizaTeknikleriyleJSPS/e2ced947-bc7d-4ba1-a9aa-d1037ac0c270/scratchpad';
const w=(ms)=>new Promise(c=>setTimeout(c,ms));
const t=spawn('C:/Program Files/BraveSoftware/Brave-Browser/Application/brave.exe',['--headless=new',`--remote-debugging-port=${P}`,'--user-data-dir=C:/Users/GIGABYTE/AppData/Local/Temp/claude/brave-hm','--no-first-run','--disable-gpu','about:blank'],{detached:true,stdio:'ignore'});
let h=null; for(let i=0;i<40&&!h;i++){await w(500); try{h=(await (await fetch(`http://127.0.0.1:${P}/json/list`)).json()).find(x=>x.type==='page')}catch{}}
const ws=new WebSocket(h.webSocketDebuggerUrl,{maxPayload:256*1024*1024}); await new Promise(c=>ws.on('open',c));
let n=0; const b=new Map(); ws.on('message',m=>{const d=JSON.parse(m); if(d.id&&b.has(d.id)){b.get(d.id)(d); b.delete(d.id)}});
const cdp=(M,Pm={})=>new Promise(c=>{const id=++n;b.set(id,c);ws.send(JSON.stringify({id,method:M,params:Pm}))});
const ev=async e=>(await cdp('Runtime.evaluate',{expression:e,returnByValue:true,awaitPromise:true})).result?.result?.value;
await cdp('Page.enable'); await cdp('Runtime.enable');
await cdp('Emulation.setDeviceMetricsOverride',{width:430,height:860,deviceScaleFactor:2,mobile:true});
await cdp('Page.navigate',{url:`file:///${C}/${process.argv[2]}`}); await w(4800);
await ev("localStorage.setItem('mevzu_rumuz_soruldu','1'); premiumAyarla(true); localStorage.setItem('mevzu_premium','1'); menu(); 'ok'"); await w(600);
await ev("acikOyun='esles'; AC['esles']();"); await w(1500);
console.log('body :has(#esle) esliyor mu:', await ev("document.body.matches(':has(#esle)')"),
 '| #esle sayisi:', await ev("document.querySelectorAll('#esle').length"),
 '| satir kabi:', await ev("(function(){var d=document.querySelector('#tel .satir'); return d? d.parentElement.className+' | '+getComputedStyle(d.parentElement).flexDirection : 'yok';})()"));
console.log(process.argv[2], '→ dugum sirasi:', await ev(`(function(){
  var d=[].slice.call(document.querySelectorAll('#tel .dugum')).slice(0,6);
  return d.map(function(e){ var n=e.querySelector('.no'); return (n?n.textContent.trim():'?')+'@y'+Math.round(e.getBoundingClientRect().top); }).join('  ');})()`),
 '| kap yonu:', await ev("(function(){var d=document.querySelector('#tel .dugum'); return d? getComputedStyle(d.parentElement).flexDirection+' / '+d.parentElement.className : 'yok';})()"));
ws.close(); try{process.kill(-t.pid)}catch{t.kill()} process.exit(0);
