// ER MEYDANI düello soru bankası registry üreticisi (soru-registry-uret.mjs analoğu).
// Fabrikadaki BİRLEŞİK düello bankasını (00_TUM_DUELLO_SORULAR.json) okuyup tip-güvenli
// DÜZ dizi src/assets/duello-sorulari.ts dosyasını OTOMATİK yazar. Çalıştır: npm run soru:duello
//
// Kaynak: D:/JSPS Fabrika .../MUSTEREK/_DUELLO_SORULARI/00_TUM_DUELLO_SORULAR.json (~1992 soru).
// dogru harf ("A") → 0-tabanlı index; şık "A) " öneki ayıklanır. açıklama+çeldirici+zorluk korunur.
// DB'ye GİRMEZ. Er Meydanı oyun modu bu bankadan RASTGELE (tohumlu) soru seçer.

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const root = join(scriptDir, '..');
const KAYNAK =
  'D:/JSPS Fabrika/kaynaklar/astsubay/KANUN_MASTER_DOSYALARI/MUSTEREK/_DUELLO_SORULARI/00_TUM_DUELLO_SORULAR.json';
const outFile = join(root, 'src', 'assets', 'duello-sorulari.ts');
const outDir = dirname(outFile);

function sikTemizle(s) {
  return String(s).replace(/^\s*[A-E]\)\s*/, '').trim();
}

// soru_id öneki (01-25) → uygulama law_id (soru-registry-uret.mjs KLASOR_LAW ile birebir).
const ONEK_LAW = {
  '01': 1, '02': 6, '03': 5, '04': 7, '05': 12, '06': 2, '07': 4, '08': 3, '09': 8,
  '10': 9, '11': 11, '12': 10, '13': 14, '14': 13, '15': 15, '16': 18, '17': 19,
  '18': 25, '19': 20, '20': 16, '21': 21, '22': 24, '23': 23, '24': 22, '25': 17,
};
// law_id → kısa ad (oda seçici + zayıf-kanun gösterimi; SEED_LAWS'in kısaltılmışı).
const KISA_AD = {
  1: 'TCK', 2: 'Jandarma Teşkilat K.', 3: 'KVKK', 4: 'Tebligat K.', 5: 'İl İdaresi K.',
  6: 'Kabahatler K.', 7: 'Terörle Mücadele K.', 8: 'OHAL K.', 9: 'Atatürk Aleyhine Suçlar',
  10: '6284 (Ailenin Korunması)', 11: 'Türk Bayrağı K.', 12: 'Disiplin (7068)',
  13: 'Sözleşmeli Sb/Asb K.', 14: 'E-İmza K.', 15: 'Resmî Yazışma Yön.',
  16: 'Sözleşmeli Sb/Asb Yön.', 17: 'Jandarma Teşkilat Yön.', 18: 'KVK Silme/İmha Yön.',
  19: 'Bilgi Edinme Yön.', 20: 'Tüfekler Yön. (2521)', 21: '6284 Uygulama Yön.',
  22: 'Personel Yön.', 23: 'Hizmet Esasları Yön.', 24: 'İzin Yön.', 25: '6136 Ateşli Silahlar',
};

if (!existsSync(KAYNAK)) {
  console.error('KAYNAK YOK:', KAYNAK);
  process.exit(1);
}

const veri = JSON.parse(readFileSync(KAYNAK, 'utf8'));
// Kök dizi ya da ilk dizi-değerli alan (sorular/questions/data ...).
const ham = Array.isArray(veri)
  ? veri
  : veri.sorular ?? veri.questions ?? veri.data ?? Object.values(veri).find((v) => Array.isArray(v)) ?? [];

const sorular = [];
let atlanan = 0;
const seen = new Set();
for (const s of ham) {
  const siklar = Array.isArray(s.siklar) ? s.siklar : [];
  const dogruIdx = typeof s.dogru === 'string' ? s.dogru.trim().toUpperCase().charCodeAt(0) - 65 : -1;
  if (!s.soru || siklar.length < 2 || dogruIdx < 0 || dogruIdx >= siklar.length) {
    atlanan++;
    continue;
  }
  const id = String(s.soru_id ?? '');
  if (id && seen.has(id)) {
    atlanan++;
    continue;
  }
  if (id) seen.add(id);
  const kanun = ONEK_LAW[id.slice(0, 2)] ?? 0;
  sorular.push({
    id,
    kanun,
    soru: String(s.soru).trim(),
    siklar: siklar.map(sikTemizle),
    dogru: dogruIdx,
    aciklama: String(s.aciklama ?? '').trim(),
    kaynak: String(s.kaynak_madde ?? '').trim(),
    celdirici: String(s.celdirici_mantigi ?? '').trim(),
    zorluk: String(s.zorluk ?? '').trim(),
  });
}

// Bankada bulunan kanunlar (id + kısa ad) — oda seçici + zayıf-kanun gösterimi için.
const kanunlarVar = [...new Set(sorular.map((q) => q.kanun))].filter((k) => k > 0).sort((a, b) => a - b);
const duelloKanunlar = kanunlarVar.map((id) => ({ id, ad: KISA_AD[id] ?? `Kanun ${id}` }));

// id'ye göre deterministik sıra (tohumlu karıştırma için stabil taban).
sorular.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));

const govde = sorular.map((q) => `  ${JSON.stringify(q)},`).join('\n');

const out = `// OTOMATİK ÜRETİLDİ — elle düzenleme. \`npm run soru:duello\` ile yenile.
// Kaynak: D:\\JSPS Fabrika ... MUSTEREK/_DUELLO_SORULARI/00_TUM_DUELLO_SORULAR.json (birleşik düello bankası).
// Er Meydanı oyun modu bu bankadan RASTGELE (tohumlu) soru seçer. \`dogru\` 0-tabanlı index (A=0..E=4).
// Şık metinleri "A) " önekinden ayıklanmıştır; sıra KORUNUR (açıklama harfe atıf yapabilir).

/** Er Meydanı düello sorusu (banka kaydı). */
export type DuelloSoru = {
  /** Kaynak soru kimliği (örn. "01-D-001"). */
  id: string;
  /** Ait olduğu kanun (uygulama law_id; oda konu seçimi + zayıf-kanun için). */
  kanun: number;
  /** Soru metni. */
  soru: string;
  /** Şıklar (önekleri ayıklanmış). */
  siklar: string[];
  /** Doğru şıkkın 0-tabanlı index'i. */
  dogru: number;
  /** Doğru cevabın açıklaması (maç SONU inceleme ekranında gösterilir). */
  aciklama: string;
  /** Kaynak madde (örn. "5237 m.1/1"). */
  kaynak: string;
  /** Çeldirici mantığı — yanlış şıklar neden yanlış (inceleme ekranı, opsiyonel). */
  celdirici: string;
  /** Zorluk (kolay/orta/zor). */
  zorluk: string;
};

export const DUELLO_SORULARI: DuelloSoru[] = [
${govde}
];

/** Bankada bulunan kanunlar (id + kısa ad) — oda konu seçici + zayıf-kanun gösterimi. */
export const DUELLO_KANUNLAR: { id: number; ad: string }[] = ${JSON.stringify(duelloKanunlar)};
`;

if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
writeFileSync(outFile, out, 'utf8');
console.log(`Düello bankası: ${sorular.length} soru → ${outFile}`);
if (atlanan) console.log(`ATLANAN (geçersiz/tekrar): ${atlanan}`);
