/**
 * BRANŞ DENEMELERİ ÜRETİCİ — Jandarma DIŞINDAKİ 14 branş için. (1 Eyl 2026)
 *
 * Başkan: "tüm branşlar için denemeler hazırlayacağız, öncelik MEBS; var olanları ekle,
 *          uygulamada görünsün."
 *
 * ⛔ YENİ SORU ÜRETİLMEZ. Uygulamanın KENDİ bankasındaki (kart-sorulari.ts) branş kanunu
 * soruları kullanılır — hepsi soru-standart denetiminden geçmiş ve bugünkü kök onarımlarını
 * almış kayıtlar. Fabrikadan tekrar okumak o düzeltmeleri kaybettirirdi.
 *
 * 📦 SORU METNİ KOPYALANMAZ, yalnız KİMLİK yazılır. Sorular zaten bankada duruyor; metni
 * ikinci kez yazmak uygulamayı ~4 MB şişirirdi. Çalışma anında bankadan çözülür.
 *
 * Kanun → branş bağı: seed-brans-diger.ts (bir kanun birden çok branşa bağlı olabilir).
 *
 *   node scripts/brans-deneme-uret.mjs         → rapor
 *   node scripts/brans-deneme-uret.mjs --yaz   → src/assets/genel-denemeler-brans-diger.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const kok = join(dirname(fileURLToPath(import.meta.url)), '..');
const YAZ = process.argv.includes('--yaz');
const SORU_ADEDI = 50;   // Jandarma branş denemesiyle aynı (soru başına 2 puan = 100)
const EN_COK_DENEME = 5; // Jandarma'da 5 deneme var; branşlar da 5'i geçmesin

const seedTs = readFileSync(join(kok, 'src/db/seed.ts'), 'utf8');
const branslar = new Map(
  [...seedTs.matchAll(/\{ id: (\d+), slug: '([a-z-]+)', ad: '([^']+)'/g)]
    .map((m) => [Number(m[1]), { slug: m[2], ad: m[3] }]),
);

const digerTs = readFileSync(join(kok, 'src/db/seed-brans-diger.ts'), 'utf8');
const bag = [...digerTs.matchAll(/\{ law_id: (\d+), branch_id: (\d+) \}/g)]
  .map((m) => ({ law: Number(m[1]), brans: Number(m[2]) }));

// EMİR SÜZGECİ: Ek-1'de her branş için sınava girebilecek MADDELER yazılı. Emir bir kanunun
// yalnız birkaç maddesini kapsıyorsa (örn. MEBS'te Harcama Belgeleri Yön. sadece 7 madde),
// diğer maddelerden soru o branşın denemesine GİRMEZ — aday sınavda karşılaşmayacağı
// maddeye çalışmasın. Kanun süzgeçte yoksa süzme yapılmaz (güvenli taraf).
const EMIR = JSON.parse(readFileSync(join(kok, 'scripts/_emir-madde-kapsam.json'), 'utf8')).kapsam;
function emirdeMi(slug, lawId, kaynak) {
  const izin = EMIR[slug]?.[String(lawId)];
  if (!izin) return true;                       // bu kanun için madde sınırı yok
  const m = /m\.\s*(\d{1,3})/.exec(kaynak ?? '');
  if (!m) return true;                          // madde bilgisi yoksa eleme
  return izin.includes(Number(m[1]));
}

const bankaTs = readFileSync(join(kok, 'src/assets/kart-sorulari.ts'), 'utf8');
const banka = new Map();
{
  let law = null;
  for (const satir of bankaTs.split(/\r?\n/)) {
    const b = satir.match(/^  (\d+): \[/);
    if (b) { law = Number(b[1]); banka.set(law, []); continue; }
    if (!law || !satir.includes('"soru"')) continue;
    try {
      const o = JSON.parse(satir.trim().replace(/,$/, ''));
      if (o?.id && o?.soru && Array.isArray(o.siklar) && typeof o.dogru === 'number') banka.get(law).push(o);
    } catch { /* atla */ }
  }
}

function karistir(dizi, tohum) {
  const a = [...dizi];
  let s = tohum;
  const rnd = () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296);
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const cikti = {};
const rapor = [];
for (const [bid, b] of branslar) {
  if (b.slug === 'jandarma') continue;
  const kanunlar = [...new Set(bag.filter((x) => x.brans === bid).map((x) => x.law))];
  const kuyruklar = [];   // her kanun kendi kuyruğu — deneme içinde dengeli dağılsın
  const gorulen = new Set();
  let elenen = 0;
  for (const l of kanunlar) {
    const kendi = [];
    for (const q of banka.get(l) ?? []) {
      if (gorulen.has(q.id)) continue;      // aynı soru iki kanuna bağlıysa bir kez
      gorulen.add(q.id);
      if (!emirdeMi(b.slug, l, q.kaynak)) { elenen += 1; continue; }
      kendi.push({ id: q.id, lawId: l });
    }
    if (kendi.length) kuyruklar.push(karistir(kendi, bid * 104729 + l));
  }
  // SIRAYLA TOPLA: kanunlar arasında dönerek al → tek bir mevzuat denemeyi ele geçirmesin
  // (eskiden düz karıştırma vardı; MEBS'te denemenin %30'u tek yönetmelikten geliyordu).
  kuyruklar.sort((x, y) => y.length - x.length);
  const havuz = [];
  for (let tur = 0; havuz.length < kuyruklar.reduce((a, k) => a + k.length, 0); tur += 1) {
    for (const k of kuyruklar) if (tur < k.length) havuz.push(k[tur]);
  }
  const mumkun = Math.floor(havuz.length / SORU_ADEDI);
  const adet = Math.min(mumkun, EN_COK_DENEME);
  rapor.push({ slug: b.slug, ad: b.ad, kanun: kanunlar.length, soru: havuz.length, elenen, mumkun, adet });
  if (adet < 1) continue;
  cikti[b.slug] = Array.from({ length: adet }, (_, i) => ({
    no: i + 1,
    baslik: `${b.ad} Branş Denemesi ${i + 1}`,
    idler: havuz.filter((_, j) => j % adet === i).slice(0, SORU_ADEDI).map((x) => x.id),
  }));
}

console.log('branş'.padEnd(13) + 'kanun'.padStart(6) + 'soru'.padStart(7) + 'emirdışı'.padStart(10)
  + 'mümkün'.padStart(8) + 'üretilen'.padStart(10));
for (const r of rapor.sort((a, b) => b.soru - a.soru)) {
  console.log(r.slug.padEnd(13) + String(r.kanun).padStart(6) + String(r.soru).padStart(7)
    + String(r.elenen).padStart(10) + String(r.mumkun).padStart(8) + String(r.adet).padStart(10)
    + (r.adet ? '' : '  ← 50 soru yok'));
}
const toplam = Object.values(cikti).reduce((a, v) => a + v.length, 0);
console.log(`\n${Object.keys(cikti).length} branş · ${toplam} deneme · ${toplam * SORU_ADEDI} soru (metin kopyalanmadı, kimlikle bağlandı)`);

if (!YAZ) { console.log('\n(DENEME — --yaz ile yaz)'); process.exit(0); }

const govde = Object.entries(cikti).map(([slug, liste]) => {
  const d = liste.map((x) =>
    `    { no: ${x.no}, baslik: ${JSON.stringify(x.baslik)}, idler: ${JSON.stringify(x.idler)} },`).join('\n');
  return `  ${JSON.stringify(slug)}: [\n${d}\n  ],`;
}).join('\n');

const out = `// OTOMATİK ÜRETİLDİ — elle düzenleme. \`npm run brans:deneme\` ile yenile.
// Jandarma DIŞINDAKİ branşların denemeleri (${toplam} deneme × ${SORU_ADEDI} soru).
//
// Sorular UYDURULMADI ve METNİ BURAYA KOPYALANMADI: yalnız soru KİMLİKLERİ tutulur,
// metin çalışma anında uygulamanın kendi bankasından (kart-sorulari.ts) çözülür.
// Metni ikinci kez yazmak uygulamayı ~4 MB şişirirdi.
export type BransDenemeRef = { no: number; baslik: string; idler: string[] };

export const GENEL_DENEMELER_BRANS_DIGER: Record<string, BransDenemeRef[]> = {
${govde}
};
`;
writeFileSync(join(kok, 'src/assets/genel-denemeler-brans-diger.ts'), out, 'utf8');
console.log('\nyazıldı → src/assets/genel-denemeler-brans-diger.ts');
