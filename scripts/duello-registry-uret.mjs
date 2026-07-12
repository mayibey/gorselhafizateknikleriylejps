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
  sorular.push({
    id,
    soru: String(s.soru).trim(),
    siklar: siklar.map(sikTemizle),
    dogru: dogruIdx,
    aciklama: String(s.aciklama ?? '').trim(),
    kaynak: String(s.kaynak_madde ?? '').trim(),
    celdirici: String(s.celdirici_mantigi ?? '').trim(),
    zorluk: String(s.zorluk ?? '').trim(),
  });
}

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
`;

if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
writeFileSync(outFile, out, 'utf8');
console.log(`Düello bankası: ${sorular.length} soru → ${outFile}`);
if (atlanan) console.log(`ATLANAN (geçersiz/tekrar): ${atlanan}`);
