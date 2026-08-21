/**
 * YAYIN MÜSAİT Mİ? — `npm run yayin:musait`
 *
 * Başkan (21 Ağu 2026): "yayınlamadan önce bakarız, 5 dakikadır kart açan yoksa salarız zehiri."
 *
 * Anlık güncelleme kullanıcının ekranını yeniler. Kimse içerik açmıyorsa kimsenin işi
 * bölünmez. `icerik_erisim_log` her kart görseli/sesi isteğini saniyesiyle yazıyor
 * (7 Tem'den beri ~97 bin kayıt) → "şu an kim çalışıyor" sorusunun cevabı orada.
 *
 *   node scripts/yayin-musait-mi.mjs        → son 5 dakikaya bakar
 *   node scripts/yayin-musait-mi.mjs 15     → son 15 dakikaya bakar
 *
 * Çıkış kodu 0 = sessiz, yayınla · 1 = birileri çalışıyor, bekle.
 */
import fs from 'node:fs';

const DAKIKA = Number(process.argv[2] || 5);

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

const [ozet] = await sql(`
  select count(*) istek,
         count(distinct user_id) kisi,
         max(zaman at time zone 'Europe/Istanbul') son
  from icerik_erisim_log
  where zaman > now() - interval '${DAKIKA} minutes'`);

const [gecmis] = await sql(`
  select max(zaman at time zone 'Europe/Istanbul') son_erisim,
         round(extract(epoch from (now() - max(zaman)))/60) dakika_once
  from icerik_erisim_log`);

console.log(`YAYIN MÜSAİT Mİ? (son ${DAKIKA} dakika)\n`);
console.log(`  içerik isteği : ${ozet.istek}`);
console.log(`  çalışan kişi  : ${ozet.kisi}`);
console.log(`  en son erişim : ${gecmis.son_erisim} (${gecmis.dakika_once} dk önce)`);

if (Number(ozet.istek) === 0) {
  console.log('\n✅ SESSİZ — kimse kart açmıyor, yayınlanabilir.');
  process.exit(0);
}

const kimler = await sql(`
  select coalesce(p.ad || ' ' || p.soyad, p.email) kisi, count(*) istek,
         max(l.zaman at time zone 'Europe/Istanbul') son
  from icerik_erisim_log l left join profiles p on p.id = l.user_id
  where l.zaman > now() - interval '${DAKIKA} minutes'
  group by 1 order by 2 desc limit 10`);
console.log('\n⛔ ŞU AN ÇALIŞANLAR VAR — beklemek daha iyi:');
for (const k of kimler) console.log(`   ${(k.kisi || '(bilinmiyor)').padEnd(28)} ${String(k.istek).padStart(4)} istek · son ${k.son}`);
console.log('\n(Yine de yayınlamak istiyorsan sorun değil: anlık güncelleme, kullanıcı');
console.log(' sesli anlatım dinliyorsa veya sınavdaysa zaten bekliyor.)');
process.exit(1);
