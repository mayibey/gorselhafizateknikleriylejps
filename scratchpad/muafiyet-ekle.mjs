/**
 * Ekran görüntüsü muafiyetini başkan + Kemalettin'e tanımlar (sunucu tarafı).
 *   node scratchpad/muafiyet-ekle.mjs         → mevcut hâli gösterir
 *   node scratchpad/muafiyet-ekle.mjs --yaz   → kaydeder
 */
import fs from 'node:fs';

const BAYRAK = 'ekran-goruntusu-serbest';
const KISILER = {
  '98be2c62-4309-4960-9ef3-0a2e032d2f4a': 'Baki YILMAZ (başkan)',
  '90501c0f-34a9-4573-a92a-5df8f259239e': 'Kemalettin Cankurt',
};

const env = Object.fromEntries(fs.readFileSync('.env', 'utf8').split(/\r?\n/)
  .filter((s) => s.includes('=') && !s.trim().startsWith('#'))
  .map((s) => [s.slice(0, s.indexOf('=')).trim(), s.slice(s.indexOf('=') + 1).trim()]));

async function sql(query) {
  const r = await fetch('https://api.supabase.com/v1/projects/vwmjrvolkbiofpkzzwef/database/query', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  const t = await r.text();
  if (!r.ok) throw new Error(`HTTP ${r.status} ${t.slice(0, 300)}`);
  return JSON.parse(t);
}
const esc = (s) => s.replace(/'/g, "''");

const satir = await sql("select deger from uygulama_ayar where anahtar='ozellik_kisi'");
const harita = JSON.parse(satir[0]?.deger || '{}');

console.log('ŞU ANKİ DURUM:');
for (const [uid, ad] of Object.entries(KISILER)) {
  const liste = harita[uid] || [];
  console.log(`  ${ad}: ${liste.join(', ') || '(bayrak yok)'} ${liste.includes(BAYRAK) ? '← muafiyet VAR' : '← muafiyet YOK'}`);
}

for (const uid of Object.keys(KISILER)) {
  harita[uid] = [...new Set([...(harita[uid] || []), BAYRAK])];
}

if (!process.argv.includes('--yaz')) { console.log('\n(kuru prova — yazmak için --yaz)'); process.exit(0); }

await sql(`update uygulama_ayar set deger='${esc(JSON.stringify(harita))}' where anahtar='ozellik_kisi'`);
const k = JSON.parse((await sql("select deger from uygulama_ayar where anahtar='ozellik_kisi'"))[0].deger);
console.log('\n✅ YAZILDI — DOĞRULAMA:');
for (const [uid, ad] of Object.entries(KISILER)) {
  console.log(`  ${ad}: ${(k[uid] || []).join(', ')} ${(k[uid] || []).includes(BAYRAK) ? '✅' : '❌'}`);
}
const kacKisi = Object.values(k).filter((l) => l.includes(BAYRAK)).length;
console.log(`\nMuafiyeti olan toplam kişi: ${kacKisi} (2 olmalı — başkasına açılmadı)`);
