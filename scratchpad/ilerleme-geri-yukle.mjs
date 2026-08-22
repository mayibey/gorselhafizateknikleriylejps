// Başkan bulut ilerlemesini GERİ YÜKLE — test bitince çalıştır.
// Not: geri gelmesi için başkan temiz (yeni kurulmuş) cihazda giriş yapmalı; yerel BOŞken
// bulut TAM yüklenir (senkronYukle → yerelBosMu=true → ilerlemeIceAktar tamYukle).
import fs from 'node:fs';
const KOK = 'D:/GorselHafizaTeknikleriyleJSPS';
const env = Object.fromEntries(
  fs.readFileSync(`${KOK}/.env`, 'utf8').split(/\r?\n/)
    .filter((s) => s.includes('=') && !s.trim().startsWith('#'))
    .map((s) => [s.slice(0, s.indexOf('=')).trim(), s.slice(s.indexOf('=') + 1).trim()]),
);
const U = env.EXPO_PUBLIC_SUPABASE_URL, K = env.SUPABASE_SERVICE_KEY;
const H = { apikey: K, Authorization: `Bearer ${K}`, 'Content-Type': 'application/json' };
const yedek = JSON.parse(fs.readFileSync(`${KOK}/scratchpad/ilerleme-yedek-baskan.json`, 'utf8'));
if (!yedek.length) { console.log('Yedek boş — geri yüklenecek satır yok.'); process.exit(0); }
const r = await fetch(`${U}/rest/v1/kullanici_ilerleme`, {
  method: 'POST',
  headers: { ...H, Prefer: 'resolution=merge-duplicates,return=representation' },
  body: JSON.stringify(yedek),
});
console.log('GERİ YÜKLEME:', r.status, '| satır:', (await r.json()).length);
console.log('Başkan TEMİZ kurulumda giriş yapınca ilerleme geri gelir.');
