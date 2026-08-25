/** Üyelik denetçisini her gece 03:30 UTC'de çalıştıran pg_cron işi. */
import fs from 'node:fs';
const env=Object.fromEntries(fs.readFileSync('.env','utf8').split(/\r?\n/).filter(s=>s.includes('=')&&!s.trim().startsWith('#')).map(s=>[s.slice(0,s.indexOf('=')).trim(),s.slice(s.indexOf('=')+1).trim()]));
async function sql(q){const r=await fetch('https://api.supabase.com/v1/projects/vwmjrvolkbiofpkzzwef/database/query',{method:'POST',headers:{Authorization:`Bearer ${env.SUPABASE_ACCESS_TOKEN}`,'Content-Type':'application/json'},body:JSON.stringify({query:q})});const t=await r.text();if(!r.ok)throw new Error(t.slice(0,500));return JSON.parse(t);}
await sql('create extension if not exists pg_cron');
await sql('create extension if not exists pg_net');
await sql(`select cron.unschedule('uyelik-denetim') where exists (select 1 from cron.job where jobname='uyelik-denetim')`).catch(()=>{});
await sql(`select cron.schedule('uyelik-denetim', '30 3 * * *', $CRON$
  select net.http_post(
    url := 'https://vwmjrvolkbiofpkzzwef.supabase.co/functions/v1/uyelik-denetle',
    headers := '{"Content-Type":"application/json","x-denetim":"cWBy4u_b4flJMDCmh98OvTP4CcZpUWcV"}'::jsonb,
    body := '{}'::jsonb,
    timeout_milliseconds := 240000
  );
$CRON$)`);
console.log('KURULU İŞLER:');
console.table(await sql("select jobname, schedule, active from cron.job order by jobname"));
