/** Düzeltilen 9 kart görselini "bayat" listesine yazar → indirmiş cihazlar tazeler. */
import fs from 'node:fs';
const YOLLAR = [
  'jandteskyon/jandteskyon_m1_1.webp',
  'jandteskyon/jandteskyon_m19_1.webp',
  'jandteskyon/jandteskyon_m48_1.webp',
  'jandteskyon/jandteskyon_ayirt_m8.webp',
  'bilgiedinme/bilgiedinme_m2_1.webp',
  'bilgiedinme/bilgiedinme_m4_1.webp',
  'tebligat/tebligat_m21_1.webp',
  'kvkk/kvkk_m28_1.webp',
  'izinyon/izinyon_m20_1.webp',
];
const DAMGA = '2026-08-24-1';
const env=Object.fromEntries(fs.readFileSync('.env','utf8').split(/\r?\n/).filter(s=>s.includes('=')&&!s.trim().startsWith('#')).map(s=>[s.slice(0,s.indexOf('=')).trim(),s.slice(s.indexOf('=')+1).trim()]));
async function sql(q){const r=await fetch('https://api.supabase.com/v1/projects/vwmjrvolkbiofpkzzwef/database/query',{method:'POST',headers:{Authorization:`Bearer ${env.SUPABASE_ACCESS_TOKEN}`,'Content-Type':'application/json'},body:JSON.stringify({query:q})});const t=await r.text();if(!r.ok)throw new Error(t.slice(0,400));return JSON.parse(t);}
const esc=(s)=>s.replace(/'/g,"''");
await sql(`insert into uygulama_ayar (anahtar, deger) values
  ('bayat_icerik','${esc(JSON.stringify(YOLLAR))}'),
  ('bayat_icerik_damga','${DAMGA}')
 on conflict (anahtar) do update set deger = excluded.deger`);
console.log('SUNUCUDA:', await sql("select anahtar, deger from uygulama_ayar where anahtar like 'bayat_icerik%'"));
