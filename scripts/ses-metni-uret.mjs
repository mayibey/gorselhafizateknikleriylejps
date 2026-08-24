/**
 * KART SES METİNLERİ ÜRETECİ — `src/assets/kart-ses-metinleri.ts`'i fabrika raporundan üretir.
 *
 * NEDEN (25 Ağu 2026): bu registry ARAMA'nın metin kaynağı. 16 Haziran'dan kalmaydı:
 * 1.511 kartın yalnız 522'sinin metni vardı ve onların 396'sı bayattı (ses 27 Haziran'da
 * YENİ metinlerden üretilmişti) → kullanıcı "şu maddeyi ara" dediğinde kartı bulamıyordu.
 * Artık TÜM kartların metni burada.
 *
 * Kaynak: scripts/_icerik_rapor.json (icerik-yerlestir.py üretir; her kanun için `ses` haritası).
 * ⛔ Rapor yenilemek için icerik-yerlestir.py çalıştırırsan ARKASINDAN png-webp.mjs ÇALIŞTIR —
 *    o betik hedefteki .webp'i silip .png bırakır (24 Ağu'da 565 dosya böyle silindi).
 *
 * Çalıştır: node scripts/ses-metni-uret.mjs        (kuru prova)
 *           node scripts/ses-metni-uret.mjs --yaz
 */
import { readFileSync, writeFileSync } from 'node:fs';

const RAPOR = 'scripts/_icerik_rapor.json';
const HEDEF = 'src/assets/kart-ses-metinleri.ts';
const GORSEL = 'src/assets/kart-gorselleri.ts';

const rapor = JSON.parse(readFileSync(RAPOR, 'utf8'));

// Yalnız GERÇEKTEN kartı olan anahtarlar yazılır (görsel registry = kartların tek kaynağı).
const kartAnahtarlari = new Set(
  [...readFileSync(GORSEL, 'utf8').matchAll(/"([a-z0-9_]+)":\s*"/g)].map((m) => m[1]),
);

const metinler = new Map();
for (const kanun of Object.values(rapor)) {
  for (const [key, metin] of Object.entries(kanun.ses || {})) {
    if (!kartAnahtarlari.has(key)) continue; // kartı olmayan ses metni yazılmaz
    if (typeof metin !== 'string' || metin.trim().length < 20) continue;
    metinler.set(key, metin.trim());
  }
}

const anahtarlar = [...metinler.keys()].sort();
const eksik = [...kartAnahtarlari].filter((k) => !metinler.has(k));

const govde = anahtarlar.map((k) => `  ${JSON.stringify(k)}: ${JSON.stringify(metinler.get(k))},`).join('\n');
const cikti = `// OTOMATİK ÜRETİLDİ — elle düzenleme. \`npm run sesmetni:uret\` ile yenile.
// Kaynak: fabrika ses_metinleri/*.txt → scripts/_icerik_rapor.json
// Anahtar = kart görsel anahtarı (gorsel_yolu). ARAMA'nın metin kaynağı; sesi olmayan
// kartta expo-speech ile okunur (şu an sesi olmayan kart YOK).
// Yükleme: doğrudan import ETME — \`@/lib/ses-metni\` üzerinden tembel al (1,7 MB).

export const KART_SES_METINLERI: Record<string, string> = {
${govde}
};
`;

console.log('kart (görsel registry):', kartAnahtarlari.size);
console.log('metni olan            :', anahtarlar.length);
console.log('metni OLMAYAN         :', eksik.length, eksik.slice(0, 8).join(', '));
console.log('dosya boyutu          :', (Buffer.byteLength(cikti) / 1024 / 1024).toFixed(2), 'MB');

if (!process.argv.includes('--yaz')) {
  console.log('\n(KURU PROVA — yazmak için --yaz)');
  process.exit(0);
}
writeFileSync(HEDEF, cikti, 'utf8');
console.log('YAZILDI →', HEDEF);
