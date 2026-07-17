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

// JANDARMA BRANŞ kaynağı — BRANS/<klasor>/<klasor>_SORULAR.json (klasör adları TAM, sonek yok).
const KAYNAK_BRANS = 'D:/JSPS Fabrika/kaynaklar/astsubay/KANUN_MASTER_DOSYALARI/BRANS';
// BRANS klasör → branş law_id (src/db/seed.ts SEED_LAWS 26-66). 01_5237_TCK ATLANIR (müşterek law 1).
const BRANS_KLASOR_LAW = {
  '01_5237_TCK': 67, // Branş TCK (Jandarma) — müşterek TCK law 1'den AYRI, BRANS kaynağı
  '02_5271_CMK': 26, '03_1774_KIMLIK_BILDIRME': 27, '04_2911_TOPLANTI_GOSTERI': 28,
  '05_4915_KARA_AVCILIGI': 29, '06_1380_SU_URUNLERI': 30, '07_6458_YABANCILAR': 31,
  '08_6831_ORMAN': 32, '09_4342_MERA': 33, '10_2918_TRAFIK': 34, '11_5188_OZEL_GUVENLIK': 35,
  '12_5395_COCUK_KORUMA': 36, '13_2860_YARDIM_TOPLAMA': 37, '14_5199_HAYVANLARI_KORUMA': 38,
  '15_2872_CEVRE': 39, '16_2559_PVSK': 40, '17_5607_KACAKCILIK': 41, '18_3298_UYUSTURUCU': 42,
  '19_6222_SPORDA_SIDDET': 43, '20_2313_UYUSTURUCU_MURAKABE': 44, '21_6415_TERORIZM_FINANSMANI': 45,
  '22_2863_KULTUR_TABIAT': 46, '23_3091_ZILYETLIK': 47, '24_4207_TUTUN_ZARARLARI': 48,
  '25_4733_TUTUN_ALKOL_PIYASASI': 49, '26_YON_KIMLIK_BILDIRME': 50, '27_YON_SES_GAZ_FISEGI': 51,
  '28_YON_TRAFIK': 52, '29_YON_IKRAMIYE': 53, '30_YON_OZEL_GUVENLIK': 54, '31_YON_ADLI_KOLLUK': 55,
  '32_YON_ARAMALAR': 56, '33_YON_SUC_ESYASI': 57, '34_YON_YAKALAMA': 58, '35_YON_BEDEN_MUAYENESI': 59,
  '36_YON_COCUK_TEDBIR': 60, '37_YON_COCUK_USUL': 61, '38_YON_ISYERI_ACMA': 62, '39_YON_KUM_CAKIL': 63,
  '40_YON_TUTUN_SATIS': 64, '41_YON_VATANDASLIK': 65, '42_YON_ATESLI_SILAHLAR': 66,
};

// "A) ..." gibi şık önekini ayıkla → gösterimde temiz metin (doğru cevap index'le tutulur).
function sikTemizle(s) {
  return String(s).replace(/^\s*[A-E]\)\s*/, '').trim();
}

const registry = {}; // law_id -> KartSoru[]
const rapor = [];
let toplamSoru = 0;
let atlanan = 0;

// DİĞER BRANŞLAR kaynağı — BRANS_DIGER/<klasor>/<klasor>_SORULAR.json (law 68+).
// Klasör→law_id haritası brans-diger-seed-uret.mjs tarafından üretilir (tek kaynak).
const KAYNAK_DIGER = 'D:/JSPS Fabrika/kaynaklar/astsubay/KANUN_MASTER_DOSYALARI/BRANS_DIGER';
const DIGER_MAP_YOL = join(scriptDir, '_brans-diger-law-map.json');
const DIGER_KLASOR_LAW = existsSync(DIGER_MAP_YOL) ? JSON.parse(readFileSync(DIGER_MAP_YOL, 'utf8')) : {};

// Üç kaynak: MÜŞTEREK (1-25) + JANDARMA branş (26-67) + DİĞER 15 branş (68+). Aynı registry'ye.
const KAYNAKLAR = [
  { kok: KAYNAK, map: KLASOR_LAW, ad: 'MÜŞTEREK' },
  { kok: KAYNAK_BRANS, map: BRANS_KLASOR_LAW, ad: 'JANDARMA' },
  { kok: KAYNAK_DIGER, map: DIGER_KLASOR_LAW, ad: 'DİĞER' },
];

for (const { kok, map, ad } of KAYNAKLAR) {
  const tumKlasorler = existsSync(kok) ? readdirSync(kok) : [];
  for (const [klasor, lawId] of Object.entries(map)) {
    const gercekAd = tumKlasorler.find((d) => d === klasor || d.startsWith(klasor + ' '));
    const dir = gercekAd ? join(kok, gercekAd) : null;
    if (!dir || !existsSync(dir)) {
      rapor.push(`[${ad}] ${klasor.padEnd(28)} → law ${lawId}: KLASÖR YOK`);
      continue;
    }
    const dosya = readdirSync(dir).find((a) => /_SORULAR\.json$/i.test(a));
    if (!dosya) {
      rapor.push(`[${ad}] ${klasor.padEnd(28)} → law ${lawId}: SORULAR.json yok`);
      continue;
    }
    let veri;
    try {
      veri = JSON.parse(readFileSync(join(dir, dosya), 'utf8'));
    } catch (e) {
      rapor.push(`[${ad}] ${klasor.padEnd(28)} → law ${lawId}: JSON HATASI (${e.message})`);
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
      rapor.push(`[${ad}] ${klasor.padEnd(28)} → law ${lawId}: 0 geçerli soru`);
      continue;
    }
    registry[lawId] = sorular;
    toplamSoru += sorular.length;
    rapor.push(`[${ad}] ${klasor.padEnd(28)} → law ${String(lawId).padStart(2)}  ${sorular.length} soru`);
  }
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

// SAYI MANİFESTİ (küçük): law_id → deneme soru sayısı. Boot'ta soru bankası (KART_SORULARI ~5MB)
// YÜKLENMEDEN metadata (sinavVarMi/sinavSoruSayisi/testSayisi) bunu okur → açılış hafifler.
const sayilar = siraliLaw.map((id) => `  ${id}: ${registry[id].length},`).join('\n');
const sayiOut = `// OTOMATİK ÜRETİLDİ — \`npm run soru:uret\`. law_id → deneme soru sayısı.
// Boot'ta soru bankası yüklenmeden metadata için (bkz. lib/sinav.ts lazy bank).
export const KART_SORU_SAYILARI: Record<number, number> = {
${sayilar}
};
`;
writeFileSync(join(outDir, 'kart-soru-sayilari.ts'), sayiOut, 'utf8');

console.log('--- Kanun bazında entegre edilen soru sayısı ---');
for (const r of rapor) console.log(r);
console.log(`\nTOPLAM: ${siraliLaw.length} kanun · ${toplamSoru} soru → ${outFile}`);
if (atlanan) console.log(`ATLANAN (geçersiz) soru: ${atlanan}`);
