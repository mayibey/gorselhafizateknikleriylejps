import fs from 'node:fs';
const env = Object.fromEntries(fs.readFileSync('D:/Mevzu/JSPS/uygulama/.env','utf8').split('\n').filter(l=>l.includes('=')&&!l.trim().startsWith('#')).map(l=>{const i=l.indexOf('=');return [l.slice(0,i).trim(), l.slice(i+1).trim().replace(/^["']|["']$/g,'')]}));
const T = env.SUPABASE_ACCESS_TOKEN, REF = 'vwmjrvolkbiofpkzzwef';
const [sql, bas, bit] = process.argv.slice(2);
const u = `https://api.supabase.com/v1/projects/${REF}/analytics/endpoints/logs?sql=${encodeURIComponent(sql)}&iso_timestamp_start=${encodeURIComponent(bas)}&iso_timestamp_end=${encodeURIComponent(bit)}`;
const r = await fetch(u, { headers: { Authorization: 'Bearer ' + T } });
const j = await r.json(); if (process.env.HAM) console.log(r.status, JSON.stringify(j).slice(0,800));
if (j.error) { console.log('HATA', JSON.stringify(j.error).slice(0,600)); process.exit(0); }
console.log('satir', (j.result||[]).length);
for (const s of (j.result||[])) console.log(JSON.stringify(s));
