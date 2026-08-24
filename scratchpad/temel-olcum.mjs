import fs from 'node:fs';
const env=Object.fromEntries(fs.readFileSync('.env','utf8').split(/\r?\n/).filter(s=>s.includes('=')&&!s.trim().startsWith('#')).map(s=>[s.slice(0,s.indexOf('=')).trim(),s.slice(s.indexOf('=')+1).trim()]));
async function sql(q){const r=await fetch('https://api.supabase.com/v1/projects/vwmjrvolkbiofpkzzwef/database/query',{method:'POST',headers:{Authorization:`Bearer ${env.SUPABASE_ACCESS_TOKEN}`,'Content-Type':'application/json'},body:JSON.stringify({query:q})});const t=await r.text();if(!r.ok)throw new Error(t.slice(0,300));return JSON.parse(t);}
console.log('1.0.43 cihazlarin CALISTIRDIGI paketler:');
console.table(await sql("select paket, count(*) n, min(guncelleme)::date ilk, max(guncelleme) son from istemci_surum where app_surum='1.0.43' group by 1 order by n desc limit 5"));
console.log('SON 1 SAATTE acilan 1.0.43 cihazi:', (await sql("select count(*) n from istemci_surum where app_surum='1.0.43' and guncelleme > now() - interval '1 hour'"))[0].n);
console.log('SON 6 SAATTE                     :', (await sql("select count(*) n from istemci_surum where app_surum='1.0.43' and guncelleme > now() - interval '6 hours'"))[0].n);
console.log('SON 24 SAATTE                    :', (await sql("select count(*) n from istemci_surum where app_surum='1.0.43' and guncelleme > now() - interval '24 hours'"))[0].n);
