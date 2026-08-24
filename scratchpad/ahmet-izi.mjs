import fs from 'node:fs';
const env=Object.fromEntries(fs.readFileSync('.env','utf8').split(/\r?\n/).filter(s=>s.includes('=')&&!s.trim().startsWith('#')).map(s=>[s.slice(0,s.indexOf('=')).trim(),s.slice(s.indexOf('=')+1).trim()]));
async function sql(q){const r=await fetch('https://api.supabase.com/v1/projects/vwmjrvolkbiofpkzzwef/database/query',{method:'POST',headers:{Authorization:`Bearer ${env.SUPABASE_ACCESS_TOKEN}`,'Content-Type':'application/json'},body:JSON.stringify({query:q})});const t=await r.text();if(!r.ok)throw new Error(t.slice(0,300));return JSON.parse(t);}
const ID='3f29c3f6-9919-4432-9a42-5e26c761838f';
console.log('Hesap      :', await sql(`select created_at::date kayit, last_sign_in_at son_giris, updated_at son_hareket from auth.users where id='${ID}'`));
console.log('İçerik açma:', await sql(`select count(*) n, max(zaman) son from icerik_erisim_log where user_id='${ID}'`));
console.log('İlerleme   :', await sql(`select count(*) n, max(guncelleme) son from kullanici_ilerleme where user_id='${ID}'`).catch(e=>'tablo/kolon yok'));
console.log('Sürüm kaydı:', await sql(`select * from istemci_surum where user_id='${ID}'`));
console.log('Push adresi:', await sql(`select count(*) n from push_token where user_id='${ID}'`));
