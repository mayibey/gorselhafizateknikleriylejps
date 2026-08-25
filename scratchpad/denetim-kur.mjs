/** Denetim log tablosu + gizli anahtar üretimi. */
import fs from 'node:fs';
import crypto from 'node:crypto';
const env=Object.fromEntries(fs.readFileSync('.env','utf8').split(/\r?\n/).filter(s=>s.includes('=')&&!s.trim().startsWith('#')).map(s=>[s.slice(0,s.indexOf('=')).trim(),s.slice(s.indexOf('=')+1).trim()]));
async function sql(q){const r=await fetch('https://api.supabase.com/v1/projects/vwmjrvolkbiofpkzzwef/database/query',{method:'POST',headers:{Authorization:`Bearer ${env.SUPABASE_ACCESS_TOKEN}`,'Content-Type':'application/json'},body:JSON.stringify({query:q})});const t=await r.text();if(!r.ok)throw new Error(t.slice(0,400));return JSON.parse(t);}
await sql(`create table if not exists uyelik_denetim_log (
  id bigserial primary key,
  ozet jsonb not null,
  created_at timestamptz not null default now()
)`);
await sql(`alter table uyelik_denetim_log enable row level security`);
console.log('log tablosu hazır');
console.log('DENETIM_ANAHTARI =', crypto.randomBytes(24).toString('base64url'));
