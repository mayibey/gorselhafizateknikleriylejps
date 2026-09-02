/**
 * KEŞİF: hangi branş kitabının soru havuzu yok ve NEDEN? (2 Eyl 2026, başkan sordu)
 * Üç ihtimali ayırt eder:
 *   (a) Kanun kaydı HİÇ YOK    → mehaz listesinden kanun olarak hiç açılmamış
 *   (b) Kanun var, soru YOK    → kanun açılmış ama üretim turunda atlanmış
 *   (c) Kanun var ama KAPSAMI farklı → kitap "Personel Hükümleri", havuz "Mali Hükümler"
 */
import fs from 'node:fs';

const KOK = 'D:/GorselHafizaTeknikleriyleJSPS/';
const env = Object.fromEntries(
  fs.readFileSync(KOK + '.env', 'utf8').split(/\r?\n/)
    .filter((s) => s.includes('=') && !s.trim().startsWith('#'))
    .map((s) => [s.slice(0, s.indexOf('=')).trim(), s.slice(s.indexOf('=') + 1).trim()]),
);
const sql = async (query) => {
  const r = await fetch('https://api.supabase.com/v1/projects/vwmjrvolkbiofpkzzwef/database/query', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  return r.json();
};

// TÜM kanun kayıtları (müşterek + branş + diğer branş)
const seedler = ['src/db/seed.ts', 'src/db/seed-brans-diger.ts'].map((p) => fs.readFileSync(KOK + p, 'utf8')).join('\n');
const kanunlar = [
  ...[...seedler.matchAll(/\{\s*id:\s*(\d+),\s*blok:\s*'([^']+)',\s*ad:\s*'([^']*)'/g)].map((m) => ({ id: +m[1], blok: m[2], ad: m[3] })),
  ...[...seedler.matchAll(/\{\s*id:\s*(\d+),\s*blok:\s*'([^']+)',\s*ad:\s*"([^"]*)"/g)].map((m) => ({ id: +m[1], blok: m[2], ad: m[3] })),
];
const soru = new Map([...fs.readFileSync(KOK + 'src/assets/kart-soru-sayilari.ts', 'utf8').matchAll(/(\d+):\s*(\d+)/g)].map((m) => [+m[1], +m[2]]));
const kucuk = (s) => String(s).replace(/İ/g, 'i').replace(/I/g, 'ı').toLocaleLowerCase('tr');

const kitaplar = await sql('select id, brans_slug, baslik, dosya_yolu from brans_kitaplari where law_id is null order by baslik, brans_slug');
const grup = new Map();
for (const k of kitaplar) {
  if (!grup.has(k.baslik)) grup.set(k.baslik, []);
  grup.get(k.baslik).push(k.brans_slug);
}
console.log(`SORU HAVUZU OLMAYAN KİTAP: ${kitaplar.length} satır · ${grup.size} ayrı konu\n`);

for (const [baslik, branslar] of grup) {
  // konunun anahtar kelimeleri ile TÜM kanun listesinde ara
  const anahtar = kucuk(baslik).replace(/[^a-zçğıöşü0-9\s]/g, ' ').split(/\s+/).filter((w) => w.length > 4).slice(0, 3);
  const adaylar = kanunlar.filter((c) => anahtar.some((w) => kucuk(c.ad).includes(w)));
  const numara = baslik.match(/\b\d{3,5}\b/g) ?? [];
  const numaraliAday = kanunlar.filter((c) => numara.some((n) => c.ad.includes(n)));
  const hepsi = [...new Map([...adaylar, ...numaraliAday].map((x) => [x.id, x])).values()];
  console.log(`• ${baslik}`);
  console.log(`   branşlar: ${branslar.join(', ')}`);
  if (hepsi.length === 0) {
    console.log('   → KANUN KAYDI YOK (mehazdan hiç açılmamış) ⇒ soru da hiç üretilmemiş');
  } else {
    for (const c of hepsi.slice(0, 4)) {
      console.log(`   → benzer kanun ${c.id} [${c.blok}] ${c.ad.slice(0, 62)} · ${soru.get(c.id) ?? 0} soru`);
    }
  }
  console.log('');
}
