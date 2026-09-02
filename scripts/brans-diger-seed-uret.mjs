// DİĞER BRANŞLAR (Jandarma dışı 15) talim kanunları → seed üreticisi.
// BRANS_DIGER'daki 68 mevzuat (SORULAR.json olan) her biri bir KANUN (blok='branş', id 68+).
// _META.json.branslar → law_branches (bir mevzuat ÇOK branşta olabilir → çoklu bağ).
// Çıktı: src/db/seed-brans-diger.ts (SEED_LAWS_DIGER + SEED_LAW_BRANCHES_DIGER)
//        + scripts/_brans-diger-law-map.json (klasör→law_id, soru-registry için).
// Çalıştır: npm run diger:seed
import { readdirSync, readFileSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const root = join(scriptDir, '..');
const KOK = 'D:/JSPS Fabrika/kaynaklar/astsubay/KANUN_MASTER_DOSYALARI/BRANS_DIGER';
const ILK_LAW_ID = 68; // 1-25 müşterek, 26-66 jandarma branş, 67 branş TCK → 68'den başla

// _META.json branş adı → branch_id (src/db/seed.ts SEED_BRANCHES ile birebir; jandarma=1 hariç).
const BRANCH_ID = {
  'MEBS': 2, 'HAVACILIK': 3, 'PERSONEL': 4, 'MALİYE': 5, 'İSTİHKAM': 6, 'IKMAL': 7,
  'BAKIM': 8, 'BANDO': 9, 'TABIP': 10, 'DİŞ TABİBİ': 11, 'ECZACI': 12, 'SAĞLIK': 13,
  'KİMYAGER': 14, 'VETERİNER': 15, 'MÜHENDİS': 16,
};

// SORULAR.json olan mevzuat klasörleri (deterministik: ada göre sıralı → law_id sabit kalır).
const klasorler = readdirSync(KOK)
  .filter((d) => /^\d+_/.test(d))
  .filter((d) => { try { return statSync(join(KOK, d)).isDirectory(); } catch { return false; } })
  .filter((d) => readdirSync(join(KOK, d)).some((f) => /_SORULAR\.json$/i.test(f)))
  .sort();

const laws = [];
const lawBranches = [];
const klasorLaw = {};
const bilinmeyenBrans = new Set();

// KİMLİK ÇİVİLEME (2 Eyl 2026): law_id'ler eskiden klasör SIRASINA göre veriliyordu; araya
// yeni bir klasör girince TÜM sonraki kimlikler kayıyordu. Kimlik kullanıcı verisine (deneme
// skoru) ve sunucudaki kitap-kanun bağına gömülü → kayması sessiz veri bozulmasıdır.
// Artık: daha önce verilmiş kimlik AYNEN korunur, yeni klasöre en büyük kimlikten sonrası verilir.
const ESKI_MAP_YOL = join(scriptDir, '_brans-diger-law-map.json');
const eskiMap = existsSync(ESKI_MAP_YOL) ? JSON.parse(readFileSync(ESKI_MAP_YOL, 'utf8')) : {};
let sonrakiYeniId = Math.max(ILK_LAW_ID - 1, ...Object.values(eskiMap).map(Number)) + 1;
const yeniler = [];

for (const klasor of klasorler) {
  const dir = join(KOK, klasor);
  const soruDosya = readdirSync(dir).find((f) => /_SORULAR\.json$/i.test(f));
  let ad = klasor, branslar = [];
  try {
    const s = JSON.parse(readFileSync(join(dir, soruDosya), 'utf8'));
    if (s.kanun) ad = String(s.kanun).trim();
  } catch { /* ad klasörden kalır */ }
  const metaYol = join(dir, '_META.json');
  if (existsSync(metaYol)) {
    try {
      const m = JSON.parse(readFileSync(metaYol, 'utf8'));
      if (!ad || ad === klasor) ad = String(m.ad ?? klasor).trim();
      branslar = Array.isArray(m.branslar) ? m.branslar : [];
    } catch { /* branslar boş kalır */ }
  }
  const branchIds = [...new Set(branslar.map((b) => {
    const id = BRANCH_ID[String(b).trim()];
    if (!id) bilinmeyenBrans.add(String(b).trim());
    return id;
  }).filter(Boolean))];
  if (branchIds.length === 0) {
    console.log(`!! ${klasor}: branş bağı YOK (branslar: ${branslar.join(',')||'boş'}) — ATLANDI`);
    continue;
  }
  const id = eskiMap[klasor] ?? sonrakiYeniId++;
  if (!eskiMap[klasor]) yeniler.push(`${klasor} → ${id}`);
  laws.push({ id, blok: 'branş', ad });
  for (const bid of branchIds) lawBranches.push({ law_id: id, branch_id: bid });
  klasorLaw[klasor] = id;
}
laws.sort((a, b) => a.id - b.id);
lawBranches.sort((a, b) => a.law_id - b.law_id || a.branch_id - b.branch_id);

// TS seed dosyası.
const lawsSatir = laws.map((l) => `  { id: ${l.id}, blok: 'branş', ad: ${JSON.stringify(l.ad)} },`).join('\n');
const lbSatir = lawBranches.map((x) => `  { law_id: ${x.law_id}, branch_id: ${x.branch_id} },`).join('\n');
const ts = `// OTOMATİK ÜRETİLDİ — \`npm run diger:seed\` ile yenile. ELLE DÜZENLEME.
// Diğer branşlar (Jandarma dışı 15) talim kanunları. blok='branş', id 68+. Çoklu branş bağı
// (_META.json.branslar). Bunlar KART İÇERMEZ (yalnız talim deneme soruları — Tatbikat'ta görünür).
import type { Law, LawBranch } from '@/db/schema';

export const SEED_LAWS_DIGER: Law[] = [
${lawsSatir}
];

export const SEED_LAW_BRANCHES_DIGER: LawBranch[] = [
${lbSatir}
];
`;
writeFileSync(join(root, 'src', 'db', 'seed-brans-diger.ts'), ts, 'utf8');
writeFileSync(join(root, 'scripts', '_brans-diger-law-map.json'), JSON.stringify(klasorLaw, null, 1), 'utf8');

console.log(`${laws.length} kanun (id ${laws[0]?.id}-${laws[laws.length - 1]?.id}) · ${lawBranches.length} branş bağı`);
if (yeniler.length) console.log('YENİ KİMLİK:', yeniler.join(' · '));
else console.log('yeni kimlik yok (hepsi çivili)');
if (bilinmeyenBrans.size) console.log('BİLİNMEYEN BRANŞ:', [...bilinmeyenBrans].join(', '));
// Branş başına kanun sayısı raporu
const say = {};
for (const x of lawBranches) say[x.branch_id] = (say[x.branch_id] ?? 0) + 1;
console.log('Branş(id)→kanun:', Object.entries(say).map(([k, v]) => k + ':' + v).join(' '));
