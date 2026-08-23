/**
 * SORU DENETÇİSİ ("heyet") — `npm run soru:denetci`
 *
 * Başkan (23 Ağu 2026): "sanki soruları hazırlayan heyet gibi çalışan bir kontrolör olsun;
 * hazırlanan her soruyu buna ver, bizim formata uygun mu denetlesin. Ürettiğimiz soruları
 * konu bakımından ayırsın. Gerçek sınavların her birini ayrı ayrı analiz etsin, hangi
 * konudan kaç soru çıkmış; bizim genel denememiz bu standarda uyuyor mu kontrol edilsin."
 *
 * ÖLÇÜ: scripts/cikmis-referans.json (9 çıkmış kitapçık, 1.760 mevzuat sorusu).
 *
 * ÜÇ İŞ YAPAR
 *  1) BİÇİM DENETİMİ — her soruyu tek tek süzgeçten geçirir (soru-standart.mjs denetle()).
 *     Sert kurallar: madde numarası yok · 5 şık · "doğru mudur" yok · mevzuat adı var ·
 *     tarihçe/dayanak sorusu yok. İhlal varsa çıkış kodu 1 (yayın öncesi durdurur).
 *  2) KONU AYRIMI — bankadaki ve denemelerdeki her soru mevzuatına göre ayrılır.
 *  3) STANDARDA UYGUNLUK — her denememizin konu ve tip dağılımı çıkmış sınav ölçüsüyle
 *     karşılaştırılır; sapma "kaç soru fazla/eksik" olarak yazılır.
 *
 * Kullanım:
 *   node scripts/soru-denetci.mjs             → tam rapor
 *   node scripts/soru-denetci.mjs --kisa      → yalnız özet + karne
 *   node scripts/soru-denetci.mjs --deneme karma  → tek takımı incele
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { denetle, konuAnahtari, mevzuatBul, veriOku } from './soru-standart.mjs';
import { BOYUTLAR, soruProfili } from './soru-profil.mjs';

const kok = join(dirname(fileURLToPath(import.meta.url)), '..');
const bayrak = (a) => process.argv.includes(a);
const kisa = bayrak('--kisa');
const secilenDeneme = bayrak('--deneme') ? process.argv[process.argv.indexOf('--deneme') + 1] : null;

const REF = JSON.parse(readFileSync(join(kok, 'scripts/cikmis-referans.json'), 'utf8'));
const refKonu = new Map(REF.konuAgirlik.map((k) => [k.anahtar ?? konuAnahtari(k.ad), k.yuz]));
const refKonuAd = new Map(REF.konuAgirlik.map((k) => [k.anahtar ?? konuAnahtari(k.ad), k.ad]));
const refTip = new Map(REF.tipAgirlik.map((t) => [t.ad, t.yuz]));

const cizgi = (b = '─') => console.log(b.repeat(86));
const yuzde = (n, t) => (t ? (100 * n) / t : 0);

// ─────────────────────────────────────────────────────────────── 1) BİÇİM DENETİMİ
const banka = [];
for (const [law, liste] of Object.entries(veriOku('src/assets/kart-sorulari.ts', 'KART_SORULARI').veri)) {
  for (const q of liste) banka.push({ q, law: Number(law), nere: 'kart bankası' });
}
for (const q of veriOku('src/assets/duello-sorulari.ts', 'DUELLO_SORULARI').veri) {
  banka.push({ q, law: q.kanun ?? null, nere: 'düello bankası' });
}
const DENEME_TAKIM = [
  { anahtar: 'musterek', dosya: 'src/assets/genel-denemeler.ts', ad: 'GENEL_DENEMELER', baslik: 'Müşterek Konular' },
  { anahtar: 'brans', dosya: 'src/assets/genel-denemeler-brans.ts', ad: 'GENEL_DENEMELER_BRANS', baslik: 'Branş' },
  { anahtar: 'karma', dosya: 'src/assets/genel-denemeler-karma.ts', ad: 'GENEL_DENEMELER_KARMA', baslik: 'Genel (karma)' },
];
const denemeler = [];
for (const t of DENEME_TAKIM) {
  if (secilenDeneme && secilenDeneme !== t.anahtar) continue;
  for (const d of veriOku(t.dosya, t.ad).veri) {
    denemeler.push({ takim: t.baslik, no: d.no, sorular: d.sorular });
    for (const q of d.sorular) banka.push({ q, law: null, nere: `${t.baslik} Deneme ${d.no}` });
  }
}

const ihlal = new Map();
const ornek = new Map();
for (const { q, law, nere } of banka) {
  // Küratörlü denemelerde mevzuatı ele veren tek ipucu kart kimliği olabiliyor.
  const ipucu = `${q.kaynak ?? ''} ${q.kartId ?? ''}`.trim();
  const r = denetle({ ...q, kaynak: ipucu }, law);
  if (!r.at) continue;
  const anahtar = r.at;
  ihlal.set(anahtar, (ihlal.get(anahtar) ?? 0) + 1);
  if (!ornek.has(anahtar)) ornek.set(anahtar, `${nere}: ${String(q.soru).slice(0, 120)}`);
}

cizgi('═');
console.log('SORU DENETÇİSİ — ölçü: 9 çıkmış JSPS kitapçığı, ' + REF.mevzuatSorusu + ' mevzuat sorusu');
cizgi('═');
console.log(`\n1) BİÇİM DENETİMİ — ${banka.length} soru tarandı`);
if (!ihlal.size) {
  console.log('   ✓ TEMİZ — hiçbir soru biçim kurallarını çiğnemiyor.');
} else {
  for (const [sebep, n] of [...ihlal].sort((a, b) => b[1] - a[1])) {
    console.log(`   ✗ ${String(n).padStart(4)}  ${sebep}`);
    if (!kisa) console.log(`          örn: ${ornek.get(sebep)}`);
  }
}

// ─────────────────────────────────────────────────────────────── 2) KONU AYRIMI
function konuAdi(q, law) {
  const ad = mevzuatBul(String(q.soru), `${q.kaynak ?? ''} ${q.kartId ?? ''}`.trim(), law);
  return ad ? konuAnahtari(ad) : '(çözülemedi)';
}
const bankaKonu = new Map();
for (const { q, law } of banka) {
  const ad = konuAdi(q, law);
  bankaKonu.set(ad, (bankaKonu.get(ad) ?? 0) + 1);
}
console.log(`\n2) KONU AYRIMI — ${bankaKonu.size} ayrı mevzuat`);
if (!kisa) {
  for (const [ad, n] of [...bankaKonu].sort((a, b) => b[1] - a[1]).slice(0, 20)) {
    console.log(`   ${String(n).padStart(5)}  ${(refKonuAd.get(ad) ?? ad).slice(0, 70)}`);
  }
  console.log(`   … ve ${Math.max(0, bankaKonu.size - 20)} mevzuat daha`);
}

// ─────────────────────────────────────────── 3) ÇIKMIŞ SINAVLAR (kitapçık kitapçık)
if (!kisa) {
  console.log('\n3) ÇIKMIŞ SINAVLAR — kitapçık kitapçık konu dağılımı');
  for (const k of REF.kitapciklar) {
    if (k.rutbe === 'havuz') continue;
    console.log(`\n   ▸ ${k.ad} (${k.rutbe}) — ${k.soru} mevzuat sorusu · kök ${k.kokOrt} krk · şık ${k.sikOrt} krk`);
    console.log('     ' + k.konular.slice(0, 10).map(([a, n]) => `${a.replace(/ sayılı.*/, '').slice(0, 22)}:${n}`).join(' · '));
  }
}

// ─────────────────────────────────────────── 4) DENEMELERİMİZ STANDARDA UYUYOR MU?
console.log('\n4) DENEMELERİMİZ ÖLÇÜYE UYUYOR MU?');
let karne = 0;
let karneToplam = 0;
for (const d of denemeler) {
  const n = d.sorular.length;
  const tip = new Map();
  const konu = new Map();
  for (const q of d.sorular) {
    const t = soruProfili(q).bilgi;
    tip.set(t, (tip.get(t) ?? 0) + 1);
    const a = konuAdi(q, null);
    konu.set(a, (konu.get(a) ?? 0) + 1);
  }
  // BEŞ BOYUT SAPMASI (başkan: "tek boyutta düşünmeyelim"). Her boyutta
  // |bizim% − ölçü%| toplamının yarısı = o boyutta "kaç soruluk kayma".
  const boyutSapma = {};
  for (const b of BOYUTLAR) {
    const bizim = new Map();
    for (const q of d.sorular) {
      const p = soruProfili(q)[b];
      bizim.set(p, (bizim.get(p) ?? 0) + 1);
    }
    const ref = new Map((REF.boyutlar?.[b] ?? []).map((x) => [x.ad, x.yuz]));
    let s2 = 0;
    for (const a of new Set([...bizim.keys(), ...ref.keys()])) {
      s2 += Math.abs(yuzde(bizim.get(a) ?? 0, n) - (ref.get(a) ?? 0));
    }
    boyutSapma[b] = s2 / 2;
  }
  const tipSapma = (boyutSapma.yon + boyutSapma.bilgi + boyutSapma.bicim) / 3;
  // KONU SAPMASI: aynı hesap, ölçüdeki ağırlıklı konular üzerinden.
  let konuSapma = 0;
  for (const a of new Set([...konu.keys(), ...refKonu.keys()])) {
    konuSapma += Math.abs(yuzde(konu.get(a) ?? 0, n) - (refKonu.get(a) ?? 0));
  }
  konuSapma = konuSapma / 2;
  const kokOrt = Math.round(d.sorular.reduce((t, q) => t + q.soru.length, 0) / n);
  const isaret = (s, esik) => (s <= esik ? '✓' : s <= esik * 1.6 ? '~' : '✗');
  karneToplam++;
  // GEÇME ÖLÇÜSÜ: profil (yön+biçim+bilgi ortalaması) %8'i, konu sapması %55'i aşmamalı.
  // Konu eşiği daha gevşek: çıkmış sınavın %6,5'i bizde hiç sorusu olmayan konularda
  // (Anayasa, Pasaport Kanunu) — o pay kapanana kadar sıfır sapma mümkün değil.
  if (tipSapma <= 8 && konuSapma <= 55) karne++;
  console.log(
    `   ${isaret(tipSapma, 8)} ${d.takim} Deneme ${d.no} (${n} soru) — ` +
      `profil sapması %${tipSapma.toFixed(1)} · konu sapması %${konuSapma.toFixed(1)} · kök ${kokOrt} krk`,
  );
  console.log(
    '       boyutlar: ' +
      BOYUTLAR.map((b) => `${b} %${boyutSapma[b].toFixed(0)}`).join(' · '),
  );
  if (!kisa) {
    const eksik = [...refKonu]
      .map(([a, p]) => ({ a, fark: (p * n) / 100 - (konu.get(a) ?? 0) }))
      .filter((x) => x.fark >= 1)
      .sort((x, y) => y.fark - x.fark)
      .slice(0, 5);
    const fazla = [...konu]
      .map(([a, c]) => ({ a, fark: c - ((refKonu.get(a) ?? 0) * n) / 100 }))
      .filter((x) => x.fark >= 2)
      .sort((x, y) => y.fark - x.fark)
      .slice(0, 5);
    if (eksik.length) console.log('       eksik konu: ' + eksik.map((x) => `${(refKonuAd.get(x.a) ?? x.a).replace(/ sayılı.*/, '').slice(0, 24)} (-${x.fark.toFixed(1)})`).join(' · '));
    if (fazla.length) console.log('       fazla konu: ' + fazla.map((x) => `${(refKonuAd.get(x.a) ?? x.a).replace(/ sayılı.*/, '').slice(0, 24)} (+${x.fark.toFixed(1)})`).join(' · '));
  }
}

cizgi();
console.log(`KARNE: ${karne}/${karneToplam} deneme ölçüye uygun · biçim ihlali: ${[...ihlal.values()].reduce((a, b) => a + b, 0)}`);
cizgi();
if (ihlal.size) process.exit(1);
