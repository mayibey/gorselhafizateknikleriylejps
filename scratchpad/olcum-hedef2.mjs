import fs from 'node:fs';
const env=Object.fromEntries(fs.readFileSync('.env','utf8').split(/\r?\n/).filter(s=>s.includes('=')&&!s.trim().startsWith('#')).map(s=>[s.slice(0,s.indexOf('=')).trim(),s.slice(s.indexOf('=')+1).trim()]));
async function sql(q){const r=await fetch('https://api.supabase.com/v1/projects/vwmjrvolkbiofpkzzwef/database/query',{method:'POST',headers:{Authorization:`Bearer ${env.SUPABASE_ACCESS_TOKEN}`,'Content-Type':'application/json'},body:JSON.stringify({query:q})});const t=await r.text();if(!r.ok)throw new Error(t.slice(0,300));return JSON.parse(t);}
const q=(s)=>sql(s).then(r=>r[0].n);
console.log('A) Kaydı ESKİ olan kişi           :', await q("select count(*) n from istemci_surum where app_surum <> '1.0.46'"));
console.log('B) Kaydı GÜNCEL (1.0.46) kişi     :', await q("select count(*) n from istemci_surum where app_surum = '1.0.46'"));
console.log('C) Toplam push adresi             :', await q("select count(*) n from push_token where token like 'ExponentPushToken%'"));
console.log('D) Güncel OLDUĞU BİLİNMEYEN adres :', await q(`select count(*) n from push_token p where p.token like 'ExponentPushToken%'
  and not exists (select 1 from istemci_surum i where i.user_id=p.user_id and i.app_surum='1.0.46')`));
console.log('E) Kayıtsız kullanıcının adresi   :', await q(`select count(*) n from push_token p where p.token like 'ExponentPushToken%'
  and not exists (select 1 from istemci_surum i where i.user_id=p.user_id)`));
