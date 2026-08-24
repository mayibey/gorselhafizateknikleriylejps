import fs from 'node:fs';
const env=Object.fromEntries(fs.readFileSync('.env','utf8').split(/\r?\n/).filter(s=>s.includes('=')&&!s.trim().startsWith('#')).map(s=>[s.slice(0,s.indexOf('=')).trim(),s.slice(s.indexOf('=')+1).trim()]));
async function sql(q){const r=await fetch('https://api.supabase.com/v1/projects/vwmjrvolkbiofpkzzwef/database/query',{method:'POST',headers:{Authorization:`Bearer ${env.SUPABASE_ACCESS_TOKEN}`,'Content-Type':'application/json'},body:JSON.stringify({query:q})});const t=await r.text();if(!r.ok)throw new Error(t.slice(0,300));return JSON.parse(t);}
console.log('Sebep (duyurudan SONRA mı güncellemişler):', await sql(`select d.created_at duyuru, i.guncelleme surum_kaydi, i.platform
 from duyurular d join istemci_surum i on i.user_id=d.hedef_user_id
 where d.baslik='Yeni sürümü kaçırma' and i.app_surum='1.0.46'`));
await sql(`delete from duyurular d using istemci_surum i
 where i.user_id=d.hedef_user_id and d.baslik='Yeni sürümü kaçırma' and i.app_surum='1.0.46'`);
console.log('Temizlendi. Kalan güncel-sürüm alıcısı:', (await sql("select count(*) n from duyurular d join istemci_surum i on i.user_id=d.hedef_user_id where d.baslik='Yeni sürümü kaçırma' and i.app_surum='1.0.46'"))[0].n);
console.log('Duyuruyu alan TOPLAM:', (await sql("select count(*) n from duyurular where baslik='Yeni sürümü kaçırma'"))[0].n);
