import fs from 'node:fs';
const env=Object.fromEntries(fs.readFileSync('.env','utf8').split(/\r?\n/).filter(s=>s.includes('=')&&!s.trim().startsWith('#')).map(s=>[s.slice(0,s.indexOf('=')).trim(),s.slice(s.indexOf('=')+1).trim()]));
async function sql(q){const r=await fetch('https://api.supabase.com/v1/projects/vwmjrvolkbiofpkzzwef/database/query',{method:'POST',headers:{Authorization:`Bearer ${env.SUPABASE_ACCESS_TOKEN||env.SUPABASE_YONETIM_TOKEN}`,'Content-Type':'application/json'},body:JSON.stringify({query:q})});const j=await r.json();if(!r.ok)throw new Error(JSON.stringify(j));return j;}
console.table(await sql(`select platform, app_surum, count(*) kisi,
  count(*) filter (where guncelleme > now() - interval '7 days') son7g,
  max(guncelleme)::date en_son
 from istemci_surum group by 1,2 order by platform, kisi desc`));
