import fs from 'node:fs';
const env=Object.fromEntries(fs.readFileSync('.env','utf8').split(/\r?\n/).filter(s=>s.includes('=')&&!s.trim().startsWith('#')).map(s=>[s.slice(0,s.indexOf('=')).trim(),s.slice(s.indexOf('=')+1).trim()]));
async function sql(q){const r=await fetch('https://api.supabase.com/v1/projects/vwmjrvolkbiofpkzzwef/database/query',{method:'POST',headers:{Authorization:`Bearer ${env.SUPABASE_ACCESS_TOKEN}`,'Content-Type':'application/json'},body:JSON.stringify({query:q})});const t=await r.text();if(!r.ok)throw new Error(t.slice(0,400));return JSON.parse(t);}
const ID='3f29c3f6-9919-4432-9a42-5e26c761838f';
console.log('Kayıt/son giriş:', await sql(`select p.created_at::date kayit, u.last_sign_in_at::date son_giris, u.raw_app_meta_data->>'provider' giris_yolu from profiles p join auth.users u on u.id=p.id where p.id='${ID}'`));
console.log('Push adresi   :', await sql(`select token, platform, app_version, guncelleme::date from push_token where user_id='${ID}'`));
console.log('İçerik açma   :', await sql(`select count(*) n, max(created_at)::date son from icerik_erisim_log where user_id='${ID}'`).catch(()=>'log yok'));
console.log('Kişiye özel duyurusu:', await sql(`select count(*) n from duyurular where hedef_user_id='${ID}'`));
