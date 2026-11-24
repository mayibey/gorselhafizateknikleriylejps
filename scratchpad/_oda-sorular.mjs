import fs from 'node:fs';
const satir = fs.readFileSync('src/assets/duello-sorulari.ts','utf8').split('\n').filter(l=>l.trim().startsWith('{"id"'));
const BANKA = satir.map(l=>JSON.parse(l.trim().replace(/,$/,'')));
function rng(seed){let a=seed>>>0;return()=>{a|=0;a=(a+0x6d2b79f5)|0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return((t^(t>>>14))>>>0)/4294967296;};}
function kar(d,r){const a=[...d];for(let i=a.length-1;i>0;i--){const j=Math.floor(r()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
const odalar = JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
console.log('banka', BANKA.length);
for (const o of odalar){
  let h=BANKA; if(o.kanunlar?.length){const s=new Set(o.kanunlar);const f=h.filter(q=>s.has(q.kanun)); if(f.length) h=f;}
  const sor = kar(h, rng(Number(o.seed))).slice(0,o.soru_sayisi);
  console.log(`\n## Oda ${o.kod} · ${o.saat} · ${o.durum} · ${o.oyuncular??'oyuncu kaydı silinmiş'}`);
  sor.forEach((q,i)=>console.log(`${i+1}. [${q.id}] ${q.soru.slice(0,110)} → ${q.siklar[q.dogru]}`));
}
