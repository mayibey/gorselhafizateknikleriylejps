import fs from 'node:fs';
const env=Object.fromEntries(fs.readFileSync('.env','utf8').split(/\r?\n/).filter(s=>s.includes('=')&&!s.trim().startsWith('#')).map(s=>[s.slice(0,s.indexOf('=')).trim(),s.slice(s.indexOf('=')+1).trim()]));
async function sql(q){const r=await fetch('https://api.supabase.com/v1/projects/vwmjrvolkbiofpkzzwef/database/query',{method:'POST',headers:{Authorization:`Bearer ${env.SUPABASE_ACCESS_TOKEN}`,'Content-Type':'application/json'},body:JSON.stringify({query:q})});const t=await r.text();if(!r.ok)throw new Error(t.slice(0,300));return JSON.parse(t);}
console.log('=== ÜYELİK HAKLARI ===');
console.table(await sql(`select tip, platform, count(*) adet,
   count(*) filter (where bitis is null) suresiz,
   count(*) filter (where bitis is not null and bitis > now()) aktif_abonelik,
   count(*) filter (where bitis is not null and bitis <= now()) suresi_dolmus
 from uyelik_haklari group by 1,2 order by adet desc`));
console.log('=== SÜRESİ DOLMUŞ ABONELİKLER (premium düşmüş olanlar) ===');
console.table(await sql(`select p.ad, p.soyad, h.urun, h.platform, h.bitis::date, h.son_dogrulama::date
 from uyelik_haklari h left join profiles p on p.id=h.user_id
 where h.bitis is not null and h.bitis <= now() order by h.bitis desc limit 10`));
console.log('=== SON DOĞRULAMA NE ZAMAN (yeniden doğrulama oluyor mu) ===');
console.table(await sql(`select date_trunc('day',son_dogrulama)::date gun, count(*) n from uyelik_haklari group by 1 order by 1 desc limit 8`));
