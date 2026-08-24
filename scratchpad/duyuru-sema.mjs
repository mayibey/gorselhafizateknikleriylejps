import fs from 'node:fs';
const env=Object.fromEntries(fs.readFileSync('.env','utf8').split(/\r?\n/).filter(s=>s.includes('=')&&!s.trim().startsWith('#')).map(s=>[s.slice(0,s.indexOf('=')).trim(),s.slice(s.indexOf('=')+1).trim()]));
async function sql(q){const r=await fetch('https://api.supabase.com/v1/projects/vwmjrvolkbiofpkzzwef/database/query',{method:'POST',headers:{Authorization:`Bearer ${env.SUPABASE_ACCESS_TOKEN}`,'Content-Type':'application/json'},body:JSON.stringify({query:q})});const t=await r.text();if(!r.ok)throw new Error(t.slice(0,300));return JSON.parse(t);}
console.log('duyurular:', (await sql("select column_name from information_schema.columns where table_name='duyurular' order by ordinal_position")).map(r=>r.column_name).join(', '));
console.log('push_token:', (await sql("select column_name from information_schema.columns where table_name='push_token' order by ordinal_position")).map(r=>r.column_name).join(', '));
console.log('RLS:', await sql("select policyname, cmd, qual from pg_policies where tablename='duyurular'"));
