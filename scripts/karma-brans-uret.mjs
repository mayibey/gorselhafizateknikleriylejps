/**
 * BRANŞA GÖRE KARMA DENEME ÜRETİCİ (26 Eyl 2026)
 *
 * Başkan: "karma denemeler branş + müşterekten gerçek sınav tadında olacak; herkes kendi
 * branşındaki denemeleri görecek." Eski karma (genel-denemeler-karma.ts) herkese aynıydı ve
 * branş sorularının çoğu BAŞKA branşlardandı (Jandarma adayına ikmal/maliye soruları).
 *
 * Yapı (gerçek sınav gibi): önce MÜŞTEREK blok, sonra BRANŞ blok.
 *   - Varsayılan 40 + 40; MEBS 50 + 30 (sınavda MEBS'te müşterek 70. soruya kadar sürüyor).
 *   - Jandarma uzman erbaş/uzman jandarma ayrı anahtar ('jandarma-uzm'): müşterekte 4678 (law 13)
 *     ve Sözleşmeli Sb/Asb Yön. (law 16) YOK — onların sınavında bu iki mevzuat çıkmıyor.
 *
 * ⛔ YENİ SORU ÜRETİLMEZ; uygulamanın kendi bankası (kart-sorulari.ts) kullanılır.
 * 📦 Metin kopyalanmaz, yalnız soru KİMLİĞİ yazılır (çalışma anında bankadan çözülür).
 * Emir (Ek-1) madde süzgeci uygulanır; mevcut müşterek/branş denemelerindeki sorular DIŞARIDA
 * (karma onların tekrarı olmasın). Tohumlu → her çalıştırmada aynı sonuç.
 *
 *   node scripts/karma-brans-uret.mjs         → rapor
 *   node scripts/karma-brans-uret.mjs --yaz   → src/assets/genel-denemeler-karma-brans.ts
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const kok = join(dirname(fileURLToPath(import.meta.url)), '..');
const YAZ = process.argv.includes('--yaz');
const EN_COK_DENEME = 5;
const UZM_DISI = new Set([13, 16]); // uzmj/uzmerb sınavında olmayan müşterek mevzuat

const seedTs = readFileSync(join(kok, 'src/db/seed.ts'), 'utf8');
const branslar = new Map(
  [...seedTs.matchAll(/\{ id: (\d+), slug: '([a-z-]+)', ad: '([^']+)'/g)].map((m) => [Number(m[1]), { slug: m[2], ad: m[3] }]),
);
const blok = new Map([...seedTs.matchAll(/\{ id: (\d+), blok: '([^']+)'/g)].map((m) => [Number(m[1]), m[2]]));
const musterekKanunlar = [...blok].filter(([, b]) => b === 'müşterek').map(([id]) => id);

const digerTs = readFileSync(join(kok, 'src/db/seed-brans-diger.ts'), 'utf8');
const bag = [...digerTs.matchAll(/\{ law_id: (\d+), branch_id: (\d+) \}/g)].map((m) => ({ law: Number(m[1]), brans: Number(m[2]) }));
for (let l = 26; l <= 67; l++) bag.push({ law: l, brans: 1 }); // Jandarma (seed.ts: 26-67 → branch 1)

const EMIR = JSON.parse(readFileSync(join(kok, 'scripts/_emir-madde-kapsam.json'), 'utf8')).kapsam;
function emirdeMi(slug, lawId, kaynak) {
  const izin = EMIR[slug]?.[String(lawId)] ?? EMIR['müşterek']?.[String(lawId)];
  if (!izin) return true;
  const m = /m\.\s*(\d{1,3})/.exec(kaynak ?? '');
  if (!m) return true;
  return izin.includes(Number(m[1]));
}

// --- banka (kart-sorulari.ts) ---
const banka = new Map();
{
  let law = null;
  for (const satir of readFileSync(join(kok, 'src/assets/kart-sorulari.ts'), 'utf8').split(/\r?\n/)) {
    const b = satir.match(/^  (\d+): \[/);
    if (b) { law = Number(b[1]); banka.set(law, []); continue; }
    if (!law || !satir.includes('"soru"')) continue;
    try {
      const o = JSON.parse(satir.trim().replace(/,$/, ''));
      if (o?.id && o?.soru && Array.isArray(o.siklar) && o.siklar.length >= 4 && typeof o.dogru === 'number') banka.get(law).push(o);
    } catch { /* atla */ }
  }
}

// --- mevcut denemelerde kullanılanlar (karma onların tekrarı olmasın) ---
const kullanilan = new Set();
for (const f of ['src/assets/genel-denemeler.ts', 'src/assets/genel-denemeler-brans.ts', 'src/assets/genel-denemeler-brans-diger.ts']) {
  for (const m of readFileSync(join(kok, f), 'utf8').matchAll(/"id":"([^"]+)"|"([A-Z0-9][A-Za-z0-9-]*-[SDO]+-\d+[A-Z-]*)"/g)) {
    const id = m[1] ?? m[2];
    kullanilan.add(id); kullanilan.add(id.replace(/-Y$/, ''));
  }
}

// Kendi başına anlaşılmayan kökler (hangi mevzuat belli değil) alınmaz — eski karma üreteciyle aynı kural.
const BELIRSIZ = [/^["']?m\.\s?\d/i, /^madde\s?\d/i, /^yönetmeliğe göre/i, /^kanun'?a göre/i, /^bu (kanun|yönetmelik|tebliğ)/i, /^anılan /i, /^söz konusu /i];

function karistir(dizi, tohum) {
  const a = [...dizi];
  let s = tohum >>> 0;
  const rnd = () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296);
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

/**
 * MÜŞTEREK AĞIRLIK (40 soruluk blok) — 19 Eyl 2026 uzman erbaş sınavının 21-60. soruları ve
 * subay/astsubay müşterek bloklarından: TCK en ağır, küçük mevzuat 1'er soru.
 * Uzm (13/16 yok) ile sb/asb (13 ve 16'dan 1'er) ayrı; MEBS 50'lik blokta +10 en ağırlara.
 */
const AGIRLIK_UZM = { 1: 6, 2: 2, 3: 2, 4: 1, 5: 2, 6: 2, 7: 2, 8: 1, 9: 1, 10: 1, 11: 1, 12: 3, 14: 1, 15: 3, 17: 3, 18: 1, 19: 1, 20: 1, 21: 1, 22: 2, 23: 1, 24: 1, 25: 1 };
const AGIRLIK_SB = { ...AGIRLIK_UZM, 1: 5, 12: 2, 13: 1, 16: 1 };
const AGIRLIK_MEBS = { ...AGIRLIK_SB, 1: 7, 2: 3, 5: 3, 6: 3, 7: 3, 12: 3, 15: 4, 17: 4, 22: 3 };

/** Kanun başına soru kuyruğu: önce HİÇ kullanılmamışlar, (tekrarIzin ise) arkasına mevcut denemelerde geçenler. */
function kuyruklar(slug, kanunlar, tohum, gorulen, tekrarIzin) {
  const out = new Map();
  for (const l of kanunlar) {
    const yeni = [], eski = [];
    for (const q of banka.get(l) ?? []) {
      if (gorulen.has(q.id)) continue;
      if (BELIRSIZ.some((r) => r.test(String(q.soru).trim()))) continue;
      if (!emirdeMi(slug, l, q.kaynak)) continue;
      if (kullanilan.has(q.id)) { if (tekrarIzin) eski.push(q.id); else continue; } else yeni.push(q.id);
      gorulen.add(q.id);
    }
    const k = [...karistir(yeni, tohum + l * 7919), ...karistir(eski, tohum + l * 7919 + 1)];
    if (k.length) out.set(l, k);
  }
  return out;
}
const kalan = (kq) => [...kq.values()].reduce((a, k) => a + k.length, 0);

/** Ağırlıklı blok: kanun başına kota; kotası tutmayan kanunun eksiği diğerlerinden sırayla. */
function agirlikliBlok(kq, agirlik, adet) {
  const al = [];
  for (const [l, n] of Object.entries(agirlik)) {
    const k = kq.get(Number(l)); if (!k) continue;
    for (let x = 0; x < n && k.length && al.length < adet; x++) al.push(k.shift());
  }
  return doldur(kq, al, adet, 0);
}
/** Dengeli blok: kanunlar arasında sırayla, her denemede başlangıç kanunu kayar (hepsi kapsansın). */
function doldur(kq, al, adet, kayma) {
  const ks = [...kq.keys()].sort((a, b) => a - b);
  let bos = 0;
  for (let t = 0; al.length < adet && bos < ks.length; t++) {
    const k = kq.get(ks[(t + kayma) % ks.length]);
    if (k.length) { al.push(k.shift()); bos = 0; } else bos++;
  }
  return al;
}

const cikti = {};
const rapor = [];
const anahtarlar = [...[...branslar.values()].map((b) => ({ ...b, anahtar: b.slug, uzm: false })),
  { slug: 'jandarma', ad: 'Jandarma', anahtar: 'jandarma-uzm', uzm: true }];
for (const b of anahtarlar) {
  const bid = [...branslar].find(([, v]) => v.slug === b.slug)?.[0];
  const mebs = b.slug === 'mebs';
  const [mAdet, bAdet] = mebs ? [50, 30] : [40, 40];
  const agirlik = b.uzm ? AGIRLIK_UZM : mebs ? AGIRLIK_MEBS : AGIRLIK_SB;
  const bransKanun = [...new Set(bag.filter((x) => x.brans === bid).map((x) => x.law))];
  const musKanun = musterekKanunlar.filter((l) => !(b.uzm && UZM_DISI.has(l)));
  const tohum = 20260926 + (bid ?? 0) * 104729 + (b.uzm ? 17 : 0);
  const gorulen = new Set(); // müşterek ve branş blokları aynı soruyu iki kez almasın (TCK 1 ↔ 67)
  const mq = kuyruklar(b.slug, musKanun, tohum, gorulen, false);
  const bq = kuyruklar(b.slug, bransKanun, tohum + 1, gorulen, true);
  const musToplam = kalan(mq), brToplam = kalan(bq);
  const liste = [];
  for (let i = 0; i < EN_COK_DENEME; i++) {
    if (kalan(mq) < mAdet || kalan(bq) < bAdet) break;
    const m = agirlikliBlok(mq, agirlik, mAdet);
    const br = doldur(bq, [], bAdet, i * Math.max(1, Math.floor(bq.size / EN_COK_DENEME)));
    if (m.length < mAdet || br.length < bAdet) break;
    liste.push({ no: i + 1, baslik: `Karma Deneme ${i + 1}`, idler: [...karistir(m, tohum + i), ...karistir(br, tohum + 100 + i)] });
  }
  rapor.push({ anahtar: b.anahtar, mus: musToplam, br: brToplam, kanun: bransKanun.length, adet: liste.length, dagilim: `${mAdet}+${bAdet}` });
  if (liste.length) cikti[b.anahtar] = liste;
}

// MÜŞTEREK DENEMELER (genel-denemeler.ts) × UZMAN RÜTBE: bu denemelerdeki 4678 / Sözleşmeli Yön.
// soruları uzmj/uzmerb'de yerine konacak YEDEK soruyla değiştirilir (deneme yine 50 soru kalır).
// Yedekler müşterek denemelerde ve karmalarda KULLANILMAMIŞ, personel/hizmet konulu mevzuattan.
const uzmYedek = {};
{
  const yedekKanun = [22, 23, 24, 17, 12, 15];
  const kullanilmis = kullanilan; // karmalarla örtüşme sorun değil; müşterek denemelerdekiler hariç
  const kq = new Map(yedekKanun.map((l) => [l, karistir((banka.get(l) ?? []).filter((q) =>
    !kullanilmis.has(q.id) && !BELIRSIZ.some((r) => r.test(String(q.soru).trim())) && emirdeMi('müşterek', l, q.kaynak)).map((q) => q.id), 20260927 + l)]));
  const mt = readFileSync(join(kok, 'src/assets/genel-denemeler.ts'), 'utf8');
  let t = 0;
  for (const m of mt.matchAll(/\{"id":"([^"]+)","lawId":(\d+)/g)) {
    if (!UZM_DISI.has(Number(m[2]))) continue;
    for (let d = 0; d < yedekKanun.length; d++) {
      const k = kq.get(yedekKanun[(t + d) % yedekKanun.length]);
      if (k?.length) { uzmYedek[m[1]] = k.shift(); break; }
    }
    t++;
  }
  console.log('müşterek denemeler uzm yedeği:', Object.keys(uzmYedek).length, 'soru', JSON.stringify(uzmYedek));
}

console.log('anahtar'.padEnd(14) + 'düzen'.padStart(7) + 'müş.havuz'.padStart(11) + 'branş.havuz'.padStart(13) + 'kanun'.padStart(7) + 'deneme'.padStart(8));
for (const r of rapor) console.log(r.anahtar.padEnd(14) + r.dagilim.padStart(7) + String(r.mus).padStart(11) + String(r.br).padStart(13) + String(r.kanun).padStart(7) + String(r.adet).padStart(8) + (r.adet ? '' : '  ← yetersiz'));
// doğrulama: deneme içinde tekrar yok, uzm'de 13/16 yok
let hata = 0;
const lawOf = new Map(); for (const [l, liste] of banka) for (const q of liste) lawOf.set(q.id, l);
for (const [k, liste] of Object.entries(cikti)) for (const d of liste) {
  if (new Set(d.idler).size !== d.idler.length) { hata++; console.log('TEKRAR', k, d.no); }
  if (k === 'jandarma-uzm' && d.idler.some((id) => UZM_DISI.has(lawOf.get(id)))) { hata++; console.log('UZM 13/16', d.no); }
}
const toplam = Object.values(cikti).reduce((a, v) => a + v.length, 0);
console.log(`\n${Object.keys(cikti).length} anahtar · ${toplam} deneme · doğrulama hatası: ${hata}`);
if (hata) process.exit(1);
if (!YAZ) { console.log('(rapor — --yaz ile yazılır)'); process.exit(0); }

const govde = Object.entries(cikti).map(([k, liste]) =>
  `  ${JSON.stringify(k)}: [\n${liste.map((x) => `    { no: ${x.no}, baslik: ${JSON.stringify(x.baslik)}, idler: ${JSON.stringify(x.idler)} },`).join('\n')}\n  ],`).join('\n');
writeFileSync(join(kok, 'src/assets/genel-denemeler-karma-brans.ts'),
`// OTOMATİK ÜRETİLDİ — elle düzenleme. \`node scripts/karma-brans-uret.mjs --yaz\` ile yenile.
// BRANŞA GÖRE KARMA denemeler: önce müşterek blok, sonra o branşın blok (40+40; MEBS 50+30).
// 'jandarma-uzm' = uzman erbaş/uzman jandarma (müşterekte 4678 ve Sözleşmeli Yön. yok).
// Metin KOPYALANMADI: yalnız soru kimlikleri; metin çalışma anında kart-sorulari.ts'ten çözülür.
export type KarmaBransRef = { no: number; baslik: string; idler: string[] };

export const GENEL_DENEMELER_KARMA_BRANS: Record<string, KarmaBransRef[]> = {
${govde}
};

// Müşterek denemelerde (genel-denemeler.ts) uzman erbaş/uzman jandarma için: 4678 / Sözleşmeli Yön.
// sorusu → yerine konacak soru kimliği (onların sınavında bu iki mevzuat yok).
export const MUSTEREK_UZM_YEDEK: Record<string, string> = ${JSON.stringify(uzmYedek)};
`, 'utf8');
console.log('yazıldı → src/assets/genel-denemeler-karma-brans.ts');
