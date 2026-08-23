/**
 * DENEME ÜRETİCİ (13 deneme) — `npm run deneme:uret`
 *
 * Başkan (23 Ağu 2026): "eski konu ve branş bazlı denemelerimizi de güncelleyelim."
 * Karma denemeler çıkmış sınav ölçüsüne oturmuştu; müşterek ve branş denemeleri hâlâ
 * eski küratörlü içerikti ve ölçüyü tutturamıyordu (konu sapması %51-67). Artık ÜÇÜ DE
 * aynı motordan çıkıyor:
 *
 *   Müşterek Konular Deneme 1-3   50 soru   yalnız müşterek mevzuat (25 kanun)
 *   Branş Deneme 1-5              50 soru   yalnız Jandarma branş mevzuatı (law 26-67)
 *   Genel Deneme 1-5             100 soru   yarı müşterek + yarı branş
 *
 * ÖLÇÜ (scripts/cikmis-referans.json — 25 çıkmış kitapçık, 1.264 müfredat içi soru):
 *   · bileşik profil kotası  → yön (doğru/yanlış istiyor) + neyi sorduğu
 *   · konu ağırlığı          → hangi mevzuattan kaç soru (o takımın mevzuatına göre
 *                              kısıtlanıp yeniden yüzdelenir)
 *   · şık ve biçim dengesi   → uzun şıklı (tam fıkra) soru oranı tutsun diye
 *
 * YENİ SORU UYDURULMAZ; hepsi doğrulanmış bankadan gelir. 13 denemede AYNI SORU İKİ KEZ
 * ÇIKMAZ (ortak "kullanıldı" kümesi). Tohumlu karıştırma → her çalıştırmada aynı sonuç.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SORU_KARA_LISTE } from './soru-kara-liste.mjs';
import { konuAnahtari, mevzuatBul, veriOku } from './soru-standart.mjs';
import { profilAnahtari, soruProfili } from './soru-profil.mjs';

const kok = join(dirname(fileURLToPath(import.meta.url)), '..');
const REF = JSON.parse(readFileSync(join(kok, 'scripts/cikmis-referans.json'), 'utf8'));
const REF_BILESIK = REF.bilesikAgirlik ?? [];
const REF_SIK = new Map((REF.boyutlar?.sik ?? []).map((x) => [x.ad, x.yuz]));
const REF_BICIM = new Map((REF.boyutlar?.bicim ?? []).map((x) => [x.ad, x.yuz]));

// --- kanun → blok ---
const seed = readFileSync(join(kok, 'src/db/seed.ts'), 'utf8');
const blokMap = new Map();
for (const m of seed.matchAll(/\{ id: (\d+), blok: '([^']+)'/g)) blokMap.set(Number(m[1]), m[2]);

const musterekMi = (law) => blokMap.get(law) === 'müşterek';
// Branş denemeleri YALNIZ Jandarma'ya gösteriliyor → havuz da Jandarma branş mevzuatı
// (seed law 26-67). Sağlık/mali gibi diğer branşların mevzuatı buraya girmez.
const jandarmaBransMi = (law) => law >= 26 && law <= 67;

// --- havuz ---
const KART = veriOku('src/assets/kart-sorulari.ts', 'KART_SORULARI').veri;
const DUELLO = veriOku('src/assets/duello-sorulari.ts', 'DUELLO_SORULARI').veri;
const karaListe = new Set(SORU_KARA_LISTE ?? []);
const sadeMetin = (s) => String(s).toLocaleLowerCase('tr').replace(/[^\p{L}\p{N}]+/gu, ' ').replace(/\s+/g, ' ').trim();

/** Soru metninden mevzuatı anlaşılmayanlar denemeye giremez (künye artık gizli). */
const BELIRSIZ = [
  /^["']?m\.\s?\d/i, /^madde\s?\d/i, /^yönetmeliğe göre/i, /^yönetmelik m\./i,
  /^kanun'?a göre/i, /^bu (kanun|yönetmelik|tebliğ)/i, /^tebliğe göre/i,
];

const havuz = [];
const gorulenMetin = new Set();
const gorulenId = new Set(); // aynı soru hem kart hem düello bankasında olabilir
function ekle(law, s) {
  if (!s || !s.id || !Array.isArray(s.siklar) || s.siklar.length < 4) return;
  if (karaListe.has(s.id) || gorulenId.has(s.id)) return;
  gorulenId.add(s.id);
  if (typeof s.dogru !== 'number' || s.dogru < 0 || s.dogru >= s.siklar.length) return;
  if (BELIRSIZ.some((r) => r.test(String(s.soru).trim()))) return;
  const anahtar = sadeMetin(s.soru);
  if (anahtar.length < 25 || gorulenMetin.has(anahtar)) return;
  gorulenMetin.add(anahtar);
  const ad = mevzuatBul(s.soru, s.kaynak, law);
  havuz.push({
    law,
    konu: ad ? konuAnahtari(ad) : null,
    profil: profilAnahtari(soruProfili(s)),
    sik: soruProfili(s).sik,
    bicim: soruProfili(s).bicim,
    alindi: false,
    q: { id: s.id, soru: s.soru, siklar: s.siklar, dogru: s.dogru, aciklama: s.aciklama ?? '', kaynak: s.kaynak ?? '', zorluk: s.zorluk ?? 'orta', kartId: '' },
  });
}
for (const [law, liste] of Object.entries(KART)) for (const s of liste) ekle(Number(law), s);
for (const s of DUELLO) if (s.kanun != null) ekle(Number(s.kanun), s);

// --- tohumlu karıştırma ---
let tohum = 20260824;
const rast = () => { tohum = (tohum * 1103515245 + 12345) & 0x7fffffff; return tohum / 0x7fffffff; };
const karistir = (a) => { const d = [...a]; for (let i = d.length - 1; i > 0; i--) { const j = Math.floor(rast() * (i + 1)); [d[i], d[j]] = [d[j], d[i]]; } return d; };
const havuzKarisik = karistir(havuz);

console.log('HAVUZ:', havuz.length, 'soru ·',
  'müşterek', havuz.filter((h) => musterekMi(h.law)).length, '·',
  'jandarma branş', havuz.filter((h) => jandarmaBransMi(h.law)).length);

/** Bir takım için konu ağırlıkları: o takımın mevzuatına kısıtla + yeniden yüzdele. */
function konuAgirlik(uygunMu) {
  const kabul = new Set(havuz.filter((h) => uygunMu(h.law) && h.konu).map((h) => h.konu));
  const liste = REF.konuAgirlik.filter((k) => kabul.has(k.anahtar ?? konuAnahtari(k.ad)));
  const toplam = liste.reduce((t, k) => t + k.yuz, 0) || 1;
  return liste.map((k) => ({ anahtar: k.anahtar ?? konuAnahtari(k.ad), yuz: (100 * k.yuz) / toplam }));
}

/**
 * Bir deneme kurar. Dış halka bileşik profil kotası, iç halka konu ağırlığı;
 * her ikisinin içinde şık/biçim açığı kapatılır.
 */
function denemeKur(adet, uygunMu) {
  const secilen = [];
  const konular = konuAgirlik(uygunMu);
  const sikHedef = new Map([...REF_SIK].map(([a, y]) => [a, Math.round((y * adet) / 100)]));
  const bicimHedef = new Map([...REF_BICIM].map(([a, y]) => [a, Math.round((y * adet) / 100)]));
  const sikSay = new Map();
  const bicimSay = new Map();
  const acik = (hedef, say, ad) => (hedef.get(ad) ?? 0) - (say.get(ad) ?? 0);
  const al = (h) => {
    h.alindi = true;
    sikSay.set(h.sik, (sikSay.get(h.sik) ?? 0) + 1);
    bicimSay.set(h.bicim, (bicimSay.get(h.bicim) ?? 0) + 1);
    secilen.push(h);
  };

  function cek(adetIstenen, sart) {
    let n = 0;
    for (const h of havuzKarisik) {
      if (n >= adetIstenen) break;
      if (h.alindi || !uygunMu(h.law)) continue;
      if (!sart(h)) continue;
      al(h);
      n++;
    }
    return n;
  }

  for (const bk of REF_BILESIK) {
    let kalan = Math.round((bk.yuz * adet) / 100);
    if (kalan < 1) continue;
    // 1) açığı en büyük şık türünü tercih ederek, konu ağırlığı sırasıyla
    for (const gecis of [1, 2, 3]) {
      if (kalan <= 0) break;
      for (const k of konular) {
        if (kalan <= 0) break;
        const pay = Math.max(1, Math.round((k.yuz * kalan) / 100));
        // Uzun şıklı (tam fıkra) soru bankada KIT: çıkmış sınavda %37, bizde ~%8.
        // Açığı varsa her zaman ONA öncelik ver; yoksa açığı en büyük türe.
        const enAcik = acik(sikHedef, sikSay, 'uzun') > 0
          ? 'uzun'
          : [...sikHedef.keys()].sort((x, y) => acik(sikHedef, sikSay, y) - acik(sikHedef, sikSay, x))[0];
        kalan -= cek(Math.min(pay, kalan), (h) => {
          if (h.konu !== k.anahtar || h.profil !== bk.ad) return false;
          if (gecis === 1) return h.sik === enAcik && acik(bicimHedef, bicimSay, h.bicim) > 0;
          if (gecis === 2) return acik(sikHedef, sikSay, h.sik) > 0 && acik(bicimHedef, bicimSay, h.bicim) > 0;
          return true;
        });
      }
    }
    // 2) o profilde konu havuzu yetmediyse: takımın tamamından
    if (kalan > 0) kalan -= cek(kalan, (h) => h.profil === bk.ad);
  }
  // 3) yuvarlamadan artan boşluk
  if (secilen.length < adet) cek(adet - secilen.length, () => true);
  return karistir(secilen).map((h) => h.q);
}

// --- takımlar ---
const TAKIMLAR = [
  {
    dosya: 'src/assets/genel-denemeler.ts',
    degisken: 'GENEL_DENEMELER',
    tip: 'GenelDeneme',
    baslik: (n) => `Müşterek Konular Deneme ${n}`,
    adet: 50,
    sayi: 3,
    uygunMu: musterekMi,
    aciklama: 'Yalnız müşterek mevzuat (25 kanun).',
    tipSatiri: true,
  },
  {
    dosya: 'src/assets/genel-denemeler-brans.ts',
    degisken: 'GENEL_DENEMELER_BRANS',
    tip: 'GenelDeneme',
    baslik: (n) => `Branş Deneme ${n}`,
    adet: 50,
    sayi: 5,
    uygunMu: jandarmaBransMi,
    aciklama: 'Yalnız Jandarma branş mevzuatı (seed law 26-67).',
  },
  {
    dosya: 'src/assets/genel-denemeler-karma.ts',
    degisken: 'GENEL_DENEMELER_KARMA',
    tip: 'GenelDeneme',
    baslik: (n) => `Genel Deneme ${n}`,
    adet: 100,
    sayi: 5,
    uygunMu: () => true,
    aciklama: 'Müşterek + branş karışık, gerçek sınav uzunluğu (100 soru).',
  },
];

const tumId = new Set();
for (const t of TAKIMLAR) {
  const denemeler = [];
  for (let no = 1; no <= t.sayi; no++) {
    const sorular = denemeKur(t.adet, t.uygunMu);
    denemeler.push({ no, baslik: t.baslik(no), sorular });
    for (const s of sorular) {
      if (tumId.has(s.id)) console.log('  ⚠ ÇAKIŞMA:', s.id);
      tumId.add(s.id);
    }
    const p = sorular.map((s) => soruProfili(s));
    const olumsuz = p.filter((x) => x.yon === 'olumsuz').length;
    const uzun = p.filter((x) => x.sik === 'uzun').length;
    console.log(`  ${t.baslik(no)}: ${sorular.length} soru · olumsuz %${Math.round((100 * olumsuz) / sorular.length)} · uzun şık %${Math.round((100 * uzun) / sorular.length)}`);
  }
  const govde = denemeler
    .map((d) => `  {\n    no: ${d.no},\n    baslik: ${JSON.stringify(d.baslik)},\n    sorular: [\n${d.sorular.map((s) => '      ' + JSON.stringify(s)).join(',\n')}\n    ],\n  }`)
    .join(',\n');
  const tipTanim = t.tipSatiri
    ? `
/** Genel deneme sorusu (kart-sorulari KartSoru + kartId yönlendirme). */
export type GenelSoru = {
  id: string;
  soru: string;
  siklar: string[];
  dogru: number;
  aciklama: string;
  kaynak: string;
  zorluk: string;
  /** Yanlış cevapta yönlendirilecek kart anahtarı (kullanılmıyor, uyumluluk için). */
  kartId: string;
};

export type GenelDeneme = {
  /** Deneme numarası. */
  no: number;
  /** Görünen başlık. */
  baslik: string;
  sorular: GenelSoru[];
};
`
    : `import type { GenelDeneme } from './genel-denemeler';\n`;
  const out = `// OTOMATİK ÜRETİLDİ — ELLE DÜZENLEME. \`npm run deneme:uret\` ile yenile.
// ${t.aciklama}
// Sorular UYDURULMADI; doğrulanmış bankadan, çıkmış sınav ölçüsüne göre seçildi
// (bileşik profil kotası + konu ağırlığı + şık/biçim dengesi — scripts/deneme-uret.mjs).
/* eslint-disable */
${tipTanim}
export const ${t.degisken}: GenelDeneme[] = [
${govde},
];
`;
  writeFileSync(join(kok, t.dosya), out, 'utf8');
  console.log('yazıldı:', t.dosya);
}
console.log('\nTOPLAM', tumId.size, 'tekil soru ·', TAKIMLAR.reduce((a, t) => a + t.sayi, 0), 'deneme');
