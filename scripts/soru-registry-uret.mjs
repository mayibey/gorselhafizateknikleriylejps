// Deneme sınavı soru registry üreticisi (görsel/ses/madde-metni registry'lerinin analoğu).
// Fabrikadaki küratörlü SORULAR.json dosyalarını okuyup law_id'ye anahtarlı,
// tip-güvenli src/assets/kart-sorulari.ts dosyasını OTOMATİK yazar.
// Çalıştır: npm run soru:uret
//
// Kaynak: D:/JSPS Fabrika .../MUSTEREK/<klasor>/<klasor>_SORULAR.json (25 müşterek kanun).
// Klasör adları " TAMAM" gibi sonek alabildiği için ÖNEK eşleştirilir (madde-metni-uret.mjs deseni).
// JSON'daki `klasor` alanı tutarsız (bazen "07", "10" gibi kırpık) → ona GÜVENİLMEZ;
// kanun eşlemesi klasör adı ÖNEKİNDEN yapılır.
//
// DB'ye GİRMEZ — quiz salt ölçümdür (SRS'e dokunmaz). 4-dosya senkron TETİKLENMEZ.

import { existsSync, readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const root = join(scriptDir, '..');
const KAYNAK = 'D:/JSPS Fabrika/kaynaklar/astsubay/KANUN_MASTER_DOSYALARI/MUSTEREK';
const outFile = join(root, 'src', 'assets', 'kart-sorulari.ts');
const outDir = dirname(outFile);

// MUSTEREK klasör öneki → uygulama law_id (src/db/seed.ts SEED_LAWS + KANUN_BILGI ile birebir).
const KLASOR_LAW = {
  '01_5237_TCK': 1,
  '02_5326_KABAHATLER': 6,
  '03_5442_ILIDARESI': 5,
  '04_3713_TERORLE_MUCADELE': 7,
  '05_7068_DISIPLIN': 12,
  '06_2803_JANDARMA': 2,
  '07_7201_TEBLIGAT': 4,
  '08_6698_KVKK': 3,
  '09_2935_OHAL': 8,
  '10_5816_ATATURK_ALEYHINE': 9,
  '11_2893_TURK_BAYRAGI': 11,
  '12_6284_AILENIN_KORUNMASI': 10,
  '13_5070_EIMZA': 14,
  '14_4678_SOZLESMELI_SB_ASB': 13,
  '15_RESMI_YAZISMA': 15,
  '16_KVK_SILME_ANONIM': 18,
  '17_BILGI_EDINME_YON': 19,
  '18_6136_ATESLI_SILAHLAR': 25,
  '19_2521_TUFEKLER_YON': 20,
  '20_SOZLESMELI_SBASB_YON': 16,
  '21_6284_UYGULAMA_YON': 21,
  '22_JGK_IZIN_YON': 24,
  '23_HIZMET_ESASLARI_YON': 23,
  '24_PERSONEL_YON': 22,
  '25_JANDARMA_TESKILAT_YON': 17,
};

// "A) ..." gibi şık önekini ayıkla → gösterimde temiz metin (doğru cevap index'le tutulur).
function sikTemizle(s) {
  return String(s).replace(/^\s*[A-E]\)\s*/, '').trim();
}

const TUM_KLASORLER = existsSync(KAYNAK) ? readdirSync(KAYNAK) : [];
const registry = {}; // law_id -> KartSoru[]
const rapor = [];
let toplamSoru = 0;
let atlanan = 0;

for (const [klasor, lawId] of Object.entries(KLASOR_LAW)) {
  const gercekAd = TUM_KLASORLER.find((d) => d === klasor || d.startsWith(klasor + ' '));
  const dir = gercekAd ? join(KAYNAK, gercekAd) : null;
  if (!dir || !existsSync(dir)) {
    rapor.push(`${klasor.padEnd(28)} → law ${lawId}: KLASÖR YOK`);
    continue;
  }
  const dosya = readdirSync(dir).find((a) => /_SORULAR\.json$/i.test(a));
  if (!dosya) {
    rapor.push(`${klasor.padEnd(28)} → law ${lawId}: SORULAR.json yok`);
    continue;
  }
  let veri;
  try {
    veri = JSON.parse(readFileSync(join(dir, dosya), 'utf8'));
  } catch (e) {
    rapor.push(`${klasor.padEnd(28)} → law ${lawId}: JSON HATASI (${e.message})`);
    continue;
  }
  const ham = Array.isArray(veri.sorular) ? veri.sorular : [];
  const sorular = [];
  for (const s of ham) {
    const siklar = Array.isArray(s.siklar) ? s.siklar : [];
    const dogruIdx = typeof s.dogru === 'string' ? s.dogru.trim().toUpperCase().charCodeAt(0) - 65 : -1;
    // Geçersiz veri (şık yok / doğru harf şık aralığı dışında / soru metni yok) → atla.
    if (!s.soru || siklar.length < 2 || dogruIdx < 0 || dogruIdx >= siklar.length) {
      atlanan++;
      continue;
    }
    sorular.push({
      id: String(s.soru_id ?? ''),
      soru: String(s.soru).trim(),
      siklar: siklar.map(sikTemizle),
      dogru: dogruIdx,
      aciklama: String(s.aciklama ?? '').trim(),
      kaynak: String(s.kaynak_madde ?? '').trim(),
      zorluk: String(s.zorluk ?? '').trim(),
    });
  }
  if (sorular.length === 0) {
    rapor.push(`${klasor.padEnd(28)} → law ${lawId}: 0 geçerli soru`);
    continue;
  }
  registry[lawId] = sorular;
  toplamSoru += sorular.length;
  rapor.push(`${klasor.padEnd(28)} → law ${String(lawId).padStart(2)}  ${sorular.length} soru`);
}

// law_id artan sırada yaz (okunaklı, deterministik çıktı).
const siraliLaw = Object.keys(registry)
  .map(Number)
  .sort((a, b) => a - b);

const govde = siraliLaw
  .map((lawId) => {
    const satirlar = registry[lawId]
      .map((q) => `    ${JSON.stringify(q)},`)
      .join('\n');
    return `  ${lawId}: [\n${satirlar}\n  ],`;
  })
  .join('\n');

const out = `// OTOMATİK ÜRETİLDİ — elle düzenleme. \`npm run soru:uret\` ile yenile.
// Kaynak: D:\\JSPS Fabrika ... KANUN_MASTER_DOSYALARI/MUSTEREK/*/​*_SORULAR.json (küratörlü deneme soruları).
// Anahtar = law_id (src/db/seed.ts SEED_LAWS). \`dogru\` 0-tabanlı şık index'i (A=0..E=4).
// Şık metinleri "A) " önekinden ayıklanmıştır; sıra KORUNUR (açıklama bazen harfe atıf yapar).

/** Tek bir küratörlü deneme sorusu (registry kaydı). */
export type KartSoru = {
  /** Kaynak soru kimliği (örn. "5237-S-001"). */
  id: string;
  /** Soru metni. */
  soru: string;
  /** Şıklar (önekleri ayıklanmış; 2 (doğru/yanlış) veya 5 olabilir). */
  siklar: string[];
  /** Doğru şıkkın 0-tabanlı index'i. */
  dogru: number;
  /** Doğru cevabın açıklaması (cevaptan sonra gösterilir). */
  aciklama: string;
  /** Kaynak madde (örn. "5237 m.1/1"). */
  kaynak: string;
  /** Zorluk etiketi (kolay/orta/zor). */
  zorluk: string;
};

export const KART_SORULARI: Record<number, KartSoru[]> = {
${govde}
};
`;

if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
writeFileSync(outFile, out, 'utf8');

console.log('--- Kanun bazında entegre edilen soru sayısı ---');
for (const r of rapor) console.log(r);
console.log(`\nTOPLAM: ${siraliLaw.length} kanun · ${toplamSoru} soru → ${outFile}`);
if (atlanan) console.log(`ATLANAN (geçersiz) soru: ${atlanan}`);
