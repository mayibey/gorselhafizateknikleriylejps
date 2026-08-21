/**
 * BAYRAK DENETİMİ — `npm run bayrak:denetle`
 *
 * NEDEN VAR: 1.0.45'te tasarımın büyük kısmı kişiye özel bayrak arkasında kalmıştı;
 * yayın listesine eklenmesi UNUTULDU ve kullanıcı güncelleyince yeni tasarımı görmedi.
 * Bu betik, kodda kullanılan HER bayrağı bulur ve yayın listesinde olup olmadığını söyler.
 * Kasten kapalı tutulanlar KASITLI_KAPALI'ya yazılır; gerisi UYARI verir.
 *
 * Çıkış kodu 1 = listede olmayan (unutulmuş olabilecek) bayrak var.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const kok = join(dirname(fileURLToPath(import.meta.url)), '..');

// Bilerek herkese AÇILMAYAN bayraklar — sebebiyle birlikte.
const KASITLI_KAPALI = {
  'anlik-guncelleme': '1. KADEME (deneme) — başkan + Kemalettin; 30 sn\'de bir kendiliğinden yeniler. Herkese açmak için bu bayrak DEĞİL, sunucu şalteri kullanılır: uygulama_ayar.anlik_guncelleme_herkes = 1 (nazik kip).',
  'patika-yolculuk': 'Sinematik 3B yolculuk motoru YARIM (ağaç görselleri/doku/ses eksik) — iş durduruldu, bitmeden açılmaz.',
  'ekran-goruntusu-serbest': 'EKRAN GÖRÜNTÜSÜ YASAĞI MUAFİYETİ — sadece başkan + Kemalettin. Herkese açılırsa telifli kart görsellerinin koruması TAMAMEN biter. ASLA yayın listesine ekleme.',
};

function dosyalar(dir) {
  const out = [];
  for (const ad of readdirSync(dir)) {
    const tam = join(dir, ad);
    if (statSync(tam).isDirectory()) out.push(...dosyalar(tam));
    else if (/\.tsx?$/.test(ad)) out.push(tam);
  }
  return out;
}

// Yayın listesini kaynaktan oku (tek doğruluk kaynağı: ozellik.ts)
const ozellik = readFileSync(join(kok, 'src/lib/ozellik.ts'), 'utf8');
const blok = ozellik.slice(ozellik.indexOf('const YAYIN_BAYRAKLARI'), ozellik.indexOf(']);', ozellik.indexOf('const YAYIN_BAYRAKLARI')));
const yayinda = new Set([...blok.matchAll(/'([a-z0-9-]+)'/g)].map((m) => m[1]));

// Kodda kullanılan bayraklar
const kullanim = new Map(); // bayrak -> kaç yerde
for (const f of dosyalar(join(kok, 'src'))) {
  if (f.endsWith(`lib${process.platform === 'win32' ? '\\' : '/'}ozellik.ts`)) continue;
  const s = readFileSync(f, 'utf8');
  for (const m of s.matchAll(/useKisiselOzellik\('([a-z0-9-]+)'\)|kisiselOzellikAcikMi\('([a-z0-9-]+)'\)/g)) {
    const ad = m[1] || m[2];
    kullanim.set(ad, (kullanim.get(ad) || 0) + 1);
  }
}

console.log('BAYRAK DENETİMİ\n');
let unutulan = 0;
for (const [ad, adet] of [...kullanim].sort((a, b) => b[1] - a[1])) {
  if (yayinda.has(ad)) { console.log(`  ✅ ${ad.padEnd(20)} herkese açık        (${adet} yerde)`); continue; }
  if (KASITLI_KAPALI[ad]) { console.log(`  ⏸️  ${ad.padEnd(20)} bilerek kapalı      (${adet} yerde) — ${KASITLI_KAPALI[ad]}`); continue; }
  console.log(`  ⚠️  ${ad.padEnd(20)} YAYIN LİSTESİNDE YOK (${adet} yerde) — kullanıcı bunu GÖRMÜYOR!`);
  unutulan++;
}
console.log(`\nKullanılan bayrak: ${kullanim.size} · yayında: ${[...kullanim.keys()].filter((a) => yayinda.has(a)).length} · unutulmuş olabilecek: ${unutulan}`);
if (unutulan) {
  console.log('\nUnutulan bayrak varsa: ya src/lib/ozellik.ts YAYIN_BAYRAKLARI listesine ekle,');
  console.log('ya da bilerek kapalıysa scripts/bayrak-denetle.mjs KASITLI_KAPALI listesine sebebiyle yaz.');
  process.exit(1);
}
