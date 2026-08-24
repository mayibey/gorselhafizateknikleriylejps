import fs from 'node:fs';
const env=Object.fromEntries(fs.readFileSync('.env','utf8').split(/\r?\n/).filter(s=>s.includes('=')&&!s.trim().startsWith('#')).map(s=>[s.slice(0,s.indexOf('=')).trim(),s.slice(s.indexOf('=')+1).trim()]));
async function sql(q){const r=await fetch('https://api.supabase.com/v1/projects/vwmjrvolkbiofpkzzwef/database/query',{method:'POST',headers:{Authorization:`Bearer ${env.SUPABASE_ACCESS_TOKEN}`,'Content-Type':'application/json'},body:JSON.stringify({query:q})});const t=await r.text();if(!r.ok)throw new Error(t.slice(0,300));return JSON.parse(t);}
console.log('push_token sürüm dağılımı:');
console.table(await sql("select coalesce(app_version,'(yok)') s, platform, count(*) n from push_token where token like 'ExponentPushToken%' group by 1,2 order by n desc"));
console.log('ESKİ SÜRÜMDE kişi (istemci_surum):', (await sql("select count(*) n from istemci_surum where app_surum <> '1.0.46'"))[0].n);
console.log('ESKİ + push adresi olan:', (await sql(`select count(distinct p.token) n from push_token p join istemci_surum i on i.user_id=p.user_id where i.app_surum <> '1.0.46' and p.token like 'ExponentPushToken%'`))[0].n);
