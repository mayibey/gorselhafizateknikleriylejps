import fs from 'node:fs';
const env=Object.fromEntries(fs.readFileSync('.env','utf8').split(/\r?\n/).filter(s=>s.includes('=')&&!s.trim().startsWith('#')).map(s=>[s.slice(0,s.indexOf('=')).trim(),s.slice(s.indexOf('=')+1).trim()]));
async function sql(q){const r=await fetch('https://api.supabase.com/v1/projects/vwmjrvolkbiofpkzzwef/database/query',{method:'POST',headers:{Authorization:`Bearer ${env.SUPABASE_ACCESS_TOKEN}`,'Content-Type':'application/json'},body:JSON.stringify({query:q})});const t=await r.text();if(!r.ok)throw new Error(t.slice(0,400));return JSON.parse(t);}
console.table(await sql(`select p.id, p.ad, p.soyad, p.email, i.app_surum, i.platform, i.guncelleme::date son_gorulme,
   (select count(*) from push_token t where t.user_id=p.id and t.token like 'ExponentPushToken%') adres
 from profiles p left join istemci_surum i on i.user_id=p.id
 where p.ad ilike '%ahmet%' and p.soyad ilike '%gezer%'`));
