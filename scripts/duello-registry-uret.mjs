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
import { SORU_KARA_LISTE } from './soru-kara-liste.mjs';
import { denetle } from './soru-standart.mjs';

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
const standartDisi = new Map();
let standartDuzeltilen = 0;
const seen = new Set();
for (const s of ham) {
  const siklar = Array.isArray(s.siklar) ? s.siklar : [];
  const dogruIdx = typeof s.dogru === 'string' ? s.dogru.trim().toUpperCase().charCodeAt(0) - 65 : -1;
  if (!s.soru || siklar.length < 2 || dogruIdx < 0 || dogruIdx >= siklar.length) {
    atlanan++;
    continue;
  }
  const id = String(s.soru_id ?? '');
  // Kara liste (salakça/mülga soruları) → atla. [[soru-kara-liste]]
  if (SORU_KARA_LISTE.has(id)) { atlanan++; continue; }
  if (id && seen.has(id)) {
    atlanan++;
    continue;
  }
  if (id) seen.add(id);
  const kanun = ONEK_LAW[id.slice(0, 2)] ?? 0;
  const kayit = {
    id,
    kanun,
    soru: String(s.soru).trim(),
    siklar: siklar.map(sikTemizle),
    dogru: dogruIdx,
    aciklama: String(s.aciklama ?? '').trim(),
    kaynak: String(s.kaynak_madde ?? '').trim(),
    celdirici: String(s.celdirici_mantigi ?? '').trim(),
    zorluk: String(s.zorluk ?? '').trim(),
  };
  // ÇIKMIŞ SINAV STANDARDI (bkz. scripts/soru-standart.mjs): künye kanonikleştirilir,
  // standarda girmeyen soru (doğru/yanlış, madde atfı sökülemeyen) bankaya ALINMAZ.
  // Branş yarısı zaten kart-sorulari.ts'ten geliyor; orası üretimde süzülmüş durumda.
  const std = denetle(kayit, kanun);
  if (std.at) { standartDisi.set(std.at, (standartDisi.get(std.at) ?? 0) + 1); atlanan++; continue; }
  if (std.degisti) { kayit.soru = std.soru; standartDuzeltilen++; }
  sorular.push(kayit);
}

// ── BRANŞ SORULARI ──────────────────────────────────────────────────────────
// Fabrika'da branş DÜELLO kaynağı YOK (yalnız müşterekte). Branş soruları Tatbikat bankasında:
// src/assets/kart-sorulari.ts (KART_SORULARI: Record<law_id, KartSoru[]>, law_id 26-135 = branş).
// Oradaki law_id anahtarları KANONİK (seed.ts ile birebir) -> kategorizasyon GARANTİ doğru (law_id ile,
// numarayla DEĞİL: TCK 5237 müşterek=id1 / branş=id67 ayrı). Düello formatına çevirip ekliyoruz.
function kartSorulariOku() {
  const t = readFileSync(join(root, 'src', 'assets', 'kart-sorulari.ts'), 'utf8');
  const b0 = t.indexOf('{', t.indexOf('=', t.indexOf('KART_SORULARI')));
  const b1 = t.lastIndexOf('}');
  const obj = t.slice(b0, b1 + 1).replace(/^(\s*)(\d+)(\s*):/gm, '$1"$2"$3:').replace(/,(\s*[}\]])/g, '$1');
  return JSON.parse(obj);
}
const KART = kartSorulariOku();
let bransEklenen = 0;
for (const [lawIdStr, arr] of Object.entries(KART)) {
  const lawId = Number(lawIdStr);
  if (lawId < 26 || !Array.isArray(arr)) continue; // YALNIZ branş (müşterek düellosu ayrı özel setten gelir)
  for (const s of arr) {
    const siklar = Array.isArray(s.siklar) ? s.siklar : [];
    const dogruIdx = typeof s.dogru === 'number' ? s.dogru : -1;
    if (!s.soru || siklar.length < 2 || dogruIdx < 0 || dogruIdx >= siklar.length) { atlanan++; continue; }
    const id = String(s.id ?? '');
    if (SORU_KARA_LISTE.has(id)) { atlanan++; continue; }
    if (id && seen.has(id)) { atlanan++; continue; }
    if (id) seen.add(id);
    sorular.push({
      id,
      kanun: lawId, // KANONİK law_id -> maç filtresi (getErMeydaniSorulari) bununla eşler
      soru: String(s.soru).trim(),
      siklar: siklar.map(sikTemizle),
      dogru: dogruIdx,
      aciklama: String(s.aciklama ?? '').trim(),
      kaynak: String(s.kaynak ?? '').trim(),
      celdirici: '', // Tatbikat sorusunda çeldirici mantığı alanı yok
      zorluk: String(s.zorluk ?? '').trim(),
    });
    bransEklenen++;
  }
}
console.log(`STANDART: ${standartDuzeltilen} müşterek düello sorusunun künyesi düzeltildi`);
for (const [sebep, n] of [...standartDisi].sort((x, y) => y[1] - x[1])) console.log(`  kenara: ${String(n).padStart(4)}  ${sebep}`);
console.log(`Branş soruları eklendi (Tatbikat law_id>=26): ${bransEklenen}`);

// ── KANUN META (id -> {ad, blok, branslar}) — seed.ts + seed-brans-diger.ts'ten (oda seçici gruplaması). ──
function lawMeta() {
  const meta = {};
  const re = /\{\s*id:\s*(\d+),\s*blok:\s*'([^']+)'[^}]*?ad:\s*["']([^"']+)["']/g;
  for (const src of ['seed.ts', 'seed-brans-diger.ts']) {
    const s = readFileSync(join(root, 'src', 'db', src), 'utf8');
    for (const m of s.matchAll(re)) meta[+m[1]] = { ad: m[3], blok: m[2], branslar: [] };
  }
  for (let id = 26; id <= 67; id++) if (meta[id]) meta[id].branslar = [1]; // 26-67 -> Jandarma (branch_id 1)
  const diger = readFileSync(join(root, 'src', 'db', 'seed-brans-diger.ts'), 'utf8');
  for (const m of diger.matchAll(/law_id:\s*(\d+),\s*branch_id:\s*(\d+)/g)) {
    if (meta[+m[1]] && !meta[+m[1]].branslar.includes(+m[2])) meta[+m[1]].branslar.push(+m[2]);
  }
  return meta;
}
const META = lawMeta();

// Bankada bulunan kanunlar (id + ad + blok + branslar) — oda/hızlı-eşleş seçici gruplaması için.
const kanunlarVar = [...new Set(sorular.map((q) => q.kanun))].filter((k) => k > 0).sort((a, b) => a - b);
const duelloKanunlar = kanunlarVar.map((id) => ({
  id,
  ad: KISA_AD[id] ?? META[id]?.ad ?? `Kanun ${id}`,
  blok: META[id]?.blok ?? (id <= 25 ? 'müşterek' : 'branş'),
  branslar: META[id]?.branslar ?? [],
}));

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
`;

// DUELLO_KANUNLAR (25 giriş) AYRI dosyada — küçük (id+ad). Ana ekran bunu import eder; 1.5MB
// DUELLO_SORULARI boot'ta yüklenmez (PERF denetim #5). Düello sorusu yalnız maç açılınca yüklenir.
const kanunOut = `// OTOMATİK ÜRETİLDİ — \`npm run soru:duello\`. Düello bankasındaki kanunlar (id + kısa ad).
// Küçük liste → ana ekranda soru bankası yüklenmeden kullanılır.
export const DUELLO_KANUNLAR: { id: number; ad: string; blok: string; branslar: number[] }[] = ${JSON.stringify(duelloKanunlar)};
`;

if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
writeFileSync(outFile, out, 'utf8');
writeFileSync(join(outDir, 'duello-kanunlar.ts'), kanunOut, 'utf8');
console.log(`Düello bankası: ${sorular.length} soru → ${outFile} (+ duello-kanunlar.ts)`);
if (atlanan) console.log(`ATLANAN (geçersiz/tekrar): ${atlanan}`);
