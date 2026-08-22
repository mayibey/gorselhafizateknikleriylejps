// Başkan + Kemalettin premium (tam erişim) GERİ YÜKLE — free test bitince çalıştır.
// Kullanım: node scratchpad/premium-geri-yukle.mjs
import fs from 'node:fs';
const KOK = 'D:/GorselHafizaTeknikleriyleJSPS';
const env = Object.fromEntries(
  fs.readFileSync(`${KOK}/.env`, 'utf8').split(/\r?\n/)
    .filter((s) => s.includes('=') && !s.trim().startsWith('#'))
    .map((s) => [s.slice(0, s.indexOf('=')).trim(), s.slice(s.indexOf('=') + 1).trim()]),
);
const U = env.EXPO_PUBLIC_SUPABASE_URL, K = env.SUPABASE_SERVICE_KEY;
const H = { apikey: K, Authorization: `Bearer ${K}`, 'Content-Type': 'application/json' };
const yedek = JSON.parse(fs.readFileSync(`${KOK}/scratchpad/premium-yedek-baskan-kemal.json`, 'utf8'));
const r = await fetch(`${U}/rest/v1/uyelik_haklari`, {
  method: 'POST',
  headers: { ...H, Prefer: 'resolution=merge-duplicates,return=representation' },
  body: JSON.stringify(yedek),
});
console.log('GERİ YÜKLEME durum:', r.status);
console.log('yüklenen:', (await r.json()).length, 'satır');
console.log('Başkan + Kemalettin premium geri geldi. Uygulamayı tam kapat-aç.');
