import fs from 'node:fs';
const env=Object.fromEntries(fs.readFileSync('.env','utf8').split(/\r?\n/).filter(s=>s.includes('=')&&!s.trim().startsWith('#')).map(s=>[s.slice(0,s.indexOf('=')).trim(),s.slice(s.indexOf('=')+1).trim()]));
async function sql(q){const r=await fetch('https://api.supabase.com/v1/projects/vwmjrvolkbiofpkzzwef/database/query',{method:'POST',headers:{Authorization:`Bearer ${env.SUPABASE_ACCESS_TOKEN}`,'Content-Type':'application/json'},body:JSON.stringify({query:q})});const t=await r.text();if(!r.ok)throw new Error(t.slice(0,300));return JSON.parse(t);}
const ID='3f29c3f6-9919-4432-9a42-5e26c761838f';
console.log('cihaz_gecmisi kolonlari:', (await sql("select column_name from information_schema.columns where table_name='cihaz_gecmisi' order by ordinal_position")).map(r=>r.column_name).join(', '));
console.log('Ahmet cihaz kayitlari:', await sql(`select * from cihaz_gecmisi where user_id='${ID}' order by 1 desc limit 3`).catch(e=>String(e).slice(0,150)));
console.log('profiles cihaz alanlari:', await sql(`select aktif_oturum, cihaz_kilit, tanitim_gordu, brans, rutbe from profiles where id='${ID}'`));
