import fs from 'node:fs';
import crypto from 'node:crypto';
const PAKET='app.mevzujsps.android';
const SA_YOL='D:/mazzzza üstü/vızzz/mevzu-jsps-0857dbdd570f.json';
const env=Object.fromEntries(fs.readFileSync('.env','utf8').split(/\r?\n/).filter(s=>s.includes('=')&&!s.trim().startsWith('#')).map(s=>[s.slice(0,s.indexOf('=')).trim(),s.slice(s.indexOf('=')+1).trim()]));
async function sql(q){const r=await fetch('https://api.supabase.com/v1/projects/vwmjrvolkbiofpkzzwef/database/query',{method:'POST',headers:{Authorization:`Bearer ${env.SUPABASE_ACCESS_TOKEN}`,'Content-Type':'application/json'},body:JSON.stringify({query:q})});return JSON.parse(await r.text());}
const b64u=(x)=>Buffer.from(x).toString('base64url');
const sa=JSON.parse(fs.readFileSync(SA_YOL,'utf8'));
const now=Math.floor(Date.now()/1000);
const h=b64u(JSON.stringify({alg:'RS256',typ:'JWT'}));
const p=b64u(JSON.stringify({iss:sa.client_email,scope:'https://www.googleapis.com/auth/androidpublisher',aud:'https://oauth2.googleapis.com/token',iat:now,exp:now+3500}));
const sig=crypto.sign('RSA-SHA256',Buffer.from(h+'.'+p),sa.private_key).toString('base64url');
const tok=(await (await fetch('https://oauth2.googleapis.com/token',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:new URLSearchParams({grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',assertion:`${h}.${p}.${sig}`})})).json()).access_token;

const r = await sql(`select h.user_id, h.urun, h.satin_alma_token, h.baslangic::date, p.ad, p.soyad
 from uyelik_haklari h left join profiles p on p.id=h.user_id
 where h.platform='android' and h.tip='omurboyu' order by h.baslangic desc`);
const SKULAR=['musterek_omurboyu','musterek_omurboyu_i20','musterek_omurboyu_i30','musterek_omurboyu_yukseltme','paket_omurboyu','brans_omurboyu'];
let bozuk=0;
for (const s of r) {
  const u=`https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${PAKET}/purchases/products/${s.urun}/tokens/${encodeURIComponent(s.satin_alma_token)}`;
  const res=await fetch(u,{headers:{Authorization:`Bearer ${tok}`}});
  if (res.ok) continue;
  bozuk++;
  const kim=[s.ad,s.soyad].filter(Boolean).join(' ')||s.user_id.slice(0,8);
  let bulundu='—';
  for (const sku of SKULAR) {
    if (sku===s.urun) continue;
    const u2=`https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${PAKET}/purchases/products/${sku}/tokens/${encodeURIComponent(s.satin_alma_token)}`;
    const r2=await fetch(u2,{headers:{Authorization:`Bearer ${tok}`}});
    if (r2.ok) { const j=await r2.json(); bulundu=`${sku} (state=${j.purchaseState})`; break; }
  }
  console.log(`${kim.padEnd(24)} kayit=${s.urun.padEnd(20)} tarih=${s.baslangic}  HTTP${res.status}  gercek: ${bulundu}`);
}
console.log('\nHTTP hatasi veren:', bozuk, '/', r.length);
