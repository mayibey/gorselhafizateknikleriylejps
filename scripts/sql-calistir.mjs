// SQL dosyasını Supabase Management API ile çalıştırır: node scripts/sql-calistir.mjs supabase/sql/x.sql
import fs from 'node:fs';
const url = process.env.EXPO_PUBLIC_SUPABASE_URL, token = process.env.SUPABASE_ACCESS_TOKEN;
const ref = new URL(url).hostname.split('.')[0];
const query = fs.readFileSync(process.argv[2], 'utf8');
const r = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, { method: 'POST', headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }, body: JSON.stringify({ query }) });
console.log(r.status, (await r.text()).slice(0, 400));
