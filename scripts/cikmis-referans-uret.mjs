/**
 * ÇIKMIŞ SINAV REFERANSI ÜRETİCİ — `npm run referans:uret`
 *
 * Girdi : scripts/veri/cikmis-sinav-sorulari.json
 *         (9 çıkmış JSPS kitapçığından ayrıştırılmış 2.336 soru; sütunlu PDF metni
 *          sütunlara bölünüp "N." kökü + "A)..E)" şıkları toplanarak çıkarıldı.)
 * Çıktı : scripts/cikmis-referans.json
 *         Denetçinin ve deneme üreticinin ÖLÇÜ olarak kullandığı özet:
 *           · kitapçık kitapçık KONU dağılımı (hangi mevzuattan kaç soru)
 *           · birleşik konu ağırlıkları (bir 100 soruluk denemede kaç soru düşer)
 *           · soru TİPİ dağılımı
 *           · kök/şık uzunluk ölçüleri, rütbeye göre ayrım
 *
 * Konu adları BİZİM kanun sözlüğümüzle (soru-standart.mjs) eşleştirilir; yoksa
 * karşılaştırma tutmaz ("2803" ile "Jandarma Teşkilat Kanunu" ayrı sayılırdı).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { konuAnahtari, mevzuatBul, mufredataOtur, NO_ADI } from './soru-standart.mjs';
import { BOYUTLAR, profilAnahtari, soruProfili } from './soru-profil.mjs';

const kok = join(dirname(fileURLToPath(import.meta.url)), '..');

// Kitapçık adları. soru (1).pdf TEK DOSYA ama içinde 18 AYRI JSPS kitapçığı var
// (başkan: "o büyük havuz dediğin bir sürü çıkmış sınav sorusunun birleşimi, düzgün ayır").
// Ayrıştırıcı soru numarası geriye sıçradığında yeni kitapçık başlatıp k9-01…k9-18 diye
// etiketliyor. Rütbe, kitapçık sayfa başlığından okunuyor.
const DOSYA_AD = {
  k1: 'Astsubay kitapçığı (2)',
  k2: '2020 Gazi denemesi',
  k3: 'Astsubay kitapçığı (3)',
  k4: 'Subay Jandarma A',
  k5: 'Subay kitapçığı',
  k6: 'Astsubay 2019',
  k7: 'Astsubay 2020',
  k8: 'Mobil kitapçık',
};
const kitapcikAdi = (d) => DOSYA_AD[d] ?? (d.startsWith('k7-') ? 'Astsubay 2020' : `Toplu kitapçık ${d.replace('k9-', '#')}`);

const MEVZUAT = /\d{3,4}\s*sayılı|Yönetmeliğ|Yönetmelik|Kanunu|Kanun[’']|Yönerge|Tebliğ|Anayasa|Genelge/i;

/** Soru tipi — deneme üreticisiyle AYNI sınıflandırma (bkz. karma-deneme-uret.mjs). */
export function soruTipi(kok2) {
  const k = String(kok2);
  const son = k.split(/(?<=\?)\s+/).slice(-2).join(' ').toLocaleLowerCase('tr');
  const tam = k.toLocaleLowerCase('tr');
  if (/boş bırakılan|boşluğa|……|\.\.\.\.|getirilmelidir|yazılmalıdır/.test(tam)) return 'bosluk';
  if (/\bII\.\s/.test(k) && /yukarıdakiler|hangileri|verilenler/.test(tam)) return 'onculu';
  if (/yanlıştır|değildir|olamaz|yer almaz|söylenemez|gerekmez|biri değil/.test(son)) return 'olumsuz';
  if (/tanımlamaktadır|hangi kavram|ifade eder/.test(son)) return 'tanim';
  if (/ceza|cezalandırılır|disiplin cezası|yaptırım/.test(son)) return 'ceza';
  if (/kim|makam|merci|yetkili|tarafından|onayıyla|verilir|kaç gün|kaç ay|süre/.test(son)) return 'makam';
  if (/doğrudur|doğru olarak|tam ve doğru/.test(son)) return 'olumlu';
  return 'duz';
}

/** Konu adı: bizim sözlükten kanonik ad; bulunamazsa kanun numarası; o da yoksa null. */
function konuAdi(q) {
  let ad = mevzuatBul(q.kok, '', null);
  if (!ad) {
    const no = q.kok.match(/\b(\d{3,4})\s*[Ss]ayılı/);
    if (no) ad = NO_ADI.get(no[1]) ?? `${no[1]} sayılı Kanun`;
    else if (/Anayasa/.test(q.kok)) ad = 'Türkiye Cumhuriyeti Anayasası';
  }
  if (!ad) return null;
  // 2026 emrinde 67 mevzuat var. Eski kitapçıklar bugün müfredatta OLMAYAN mevzuattan da
  // soruyor (Anayasa, Pasaport, Seçim Kanunu…); ayrıştırmadaki kırık adlar da ayrı konu
  // gibi görünüyordu. Müfredata oturmayan soru ölçüye girmez, ayrı sayılır.
  const oturan = mufredataOtur(ad);
  return oturan ?? { disi: ad };
}

// Bu dosya hem KİTAPLIK (denetçi soruTipi'ni içeri alır) hem ÇALIŞTIRILABİLİR üreteç.
// Doğrudan çalıştırılmadıysa aşağısı ATLANIR.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
const ham = JSON.parse(readFileSync(join(kok, 'scripts/veri/cikmis-sinav-sorulari.json'), 'utf8'));
const mev = ham.filter((q) => MEVZUAT.test(q.kok));

const kitapciklar = [];
const birlesikKonu = new Map();
const konuAd = new Map(); // anahtar -> gösterilecek tam ad
const birlesikTip = new Map();
let konusuz = 0;
const mufredatDisi = new Map();
let disiToplam = 0;
const rutbeOlcu = new Map();

const DOSYALAR = [...new Set(ham.map((q) => q.dosya))].sort();
const rutbeBul = (liste) => {
  const c = new Map();
  for (const q of liste) if (q.rutbe) c.set(q.rutbe, (c.get(q.rutbe) ?? 0) + 1);
  return [...c].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'bilinmiyor';
};
for (const dosya of DOSYALAR) {
  const liste = mev.filter((q) => q.dosya === dosya);
  if (liste.length < 12) continue; // kırıntı blok
  const bilgi = { ad: kitapcikAdi(dosya), rutbe: rutbeBul(liste) };
  if (!liste.length) continue;
  const konu = new Map();
  for (const q of liste) {
    const ad = konuAdi(q);
    if (ad && typeof ad !== 'string') {
      mufredatDisi.set(ad.disi, (mufredatDisi.get(ad.disi) ?? 0) + 1);
      disiToplam++;
      continue;
    }
    if (!ad) {
      konusuz++;
      continue;
    }
    const anah = konuAnahtari(ad);
    konu.set(anah, (konu.get(anah) ?? 0) + 1);
    konuAd.set(anah, konuAd.get(anah) ?? ad);
    birlesikKonu.set(anah, (birlesikKonu.get(anah) ?? 0) + 1);
    const t = soruTipi(q.kok);
    birlesikTip.set(t, (birlesikTip.get(t) ?? 0) + 1);
  }
  const kokU = liste.map((q) => q.kok.length).sort((a, b) => a - b);
  const sikU = liste.flatMap((q) => q.siklar.map((s) => s.length)).sort((a, b) => a - b);
  const kayit = {
    dosya,
    ad: bilgi.ad,
    rutbe: bilgi.rutbe,
    soru: liste.length,
    kokOrt: Math.round(kokU.reduce((a, b) => a + b, 0) / kokU.length),
    sikOrt: Math.round(sikU.reduce((a, b) => a + b, 0) / sikU.length),
    konular: [...konu].map(([k, n]) => [konuAd.get(k) ?? k, n]).sort((a, b) => b[1] - a[1]),
    tipler: [...liste.reduce((m, q) => m.set(soruTipi(q.kok), (m.get(soruTipi(q.kok)) ?? 0) + 1), new Map())]
      .sort((a, b) => b[1] - a[1]),
  };
  kitapciklar.push(kayit);
  {
    if (!rutbeOlcu.has(bilgi.rutbe)) rutbeOlcu.set(bilgi.rutbe, { soru: 0, kok: 0, sik: 0, sikAdet: 0 });
    const r = rutbeOlcu.get(bilgi.rutbe);
    r.soru += liste.length;
    r.kok += kokU.reduce((a, b) => a + b, 0);
    r.sik += sikU.reduce((a, b) => a + b, 0);
    r.sikAdet += sikU.length;
  }
}

// --- birleşik konu ağırlığı: 100 soruluk denemede kaç soru düşer ---
const kitapcikToplam = [...birlesikKonu.values()].reduce((a, b) => a + b, 0);
const konuAgirlik = [...birlesikKonu]
  .map(([anah, n]) => ({ anahtar: anah, ad: konuAd.get(anah) ?? anah, adet: n, yuz: +((100 * n) / kitapcikToplam).toFixed(2) }))
  .sort((a, b) => b.adet - a.adet);
const tipToplam = [...birlesikTip.values()].reduce((a, b) => a + b, 0);
const tipAgirlik = [...birlesikTip]
  .map(([ad, n]) => ({ ad, adet: n, yuz: +((100 * n) / tipToplam).toFixed(2) }))
  .sort((a, b) => b.adet - a.adet);

// --- BEŞ BOYUTLU ÖLÇÜ (başkan: "tek boyutta düşünmeyelim") ---
const boyutSay = Object.fromEntries(BOYUTLAR.map((b) => [b, new Map()]));
const bilesikSay = new Map();
let boyutToplam = 0;
for (const dosya of DOSYALAR) {
  for (const q of mev.filter((x) => x.dosya === dosya)) {
    if (typeof konuAdi(q) !== 'string') continue; // müfredat dışı soru ölçüye girmez
    const pr = soruProfili({ soru: q.kok, siklar: q.siklar });
    boyutToplam++;
    for (const b of BOYUTLAR) boyutSay[b].set(pr[b], (boyutSay[b].get(pr[b]) ?? 0) + 1);
    const a2 = profilAnahtari(pr);
    bilesikSay.set(a2, (bilesikSay.get(a2) ?? 0) + 1);
  }
}
const boyutlar = Object.fromEntries(
  BOYUTLAR.map((b) => [
    b,
    [...boyutSay[b]].map(([ad, n]) => ({ ad, adet: n, yuz: +((100 * n) / boyutToplam).toFixed(2) }))
      .sort((x, y) => y.adet - x.adet),
  ]),
);
const bilesikAgirlik = [...bilesikSay]
  .map(([ad, n]) => ({ ad, adet: n, yuz: +((100 * n) / boyutToplam).toFixed(2) }))
  .sort((x, y) => y.adet - x.adet);

const cikti = {
  uretim: 'npm run referans:uret',
  kaynak: '9 çıkmış JSPS kitapçığı (scripts/veri/cikmis-sinav-sorulari.json)',
  toplamAyristirilan: ham.length,
  mevzuatSorusu: mev.length,
  konusuBulunamayan: konusuz,
  mufredatDisiSoru: disiToplam,
  mufredatDisi: [...mufredatDisi].sort((a, b) => b[1] - a[1]).map(([ad, adet]) => ({ ad, adet })),
  kitapciklar,
  konuAgirlik,
  tipAgirlik,
  boyutlar,
  bilesikAgirlik,
  rutbe: [...rutbeOlcu].map(([r, v]) => ({
    rutbe: r,
    soru: v.soru,
    kokOrt: Math.round(v.kok / v.soru),
    sikOrt: Math.round(v.sik / v.sikAdet),
  })),
};

writeFileSync(join(kok, 'scripts/cikmis-referans.json'), JSON.stringify(cikti, null, 1), 'utf8');
console.log('REFERANS ÜRETİLDİ — scripts/cikmis-referans.json');
console.log(`  kitapçık: ${kitapciklar.length} · ayrıştırılan mevzuat sorusu: ${mev.length}`);
console.log(`  MÜFREDAT İÇİ: ${kitapcikToplam} soru · müfredat DIŞI: ${disiToplam} (${mufredatDisi.size} ayrı mevzuat) · konusu çözülemeyen: ${konusuz}`);
console.log('  müfredat dışı ilk 8: ' + [...mufredatDisi].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([a2, n]) => `${a2.slice(0, 26)} (${n})`).join(' · '));
console.log('\n  EN AĞIR 15 KONU (kitapçıklarda, 100 soruda kaç soru):');
for (const k of konuAgirlik.slice(0, 15)) {
  console.log(`    ${String(k.yuz).padStart(5)}  ${k.ad.slice(0, 62)}`);
}
console.log('\n  TİP AĞIRLIĞI:');
for (const t of tipAgirlik) console.log(`    ${String(t.yuz).padStart(5)}  ${t.ad}`);
console.log('\n  RÜTBE ÖLÇÜSÜ:');
for (const r of cikti.rutbe) console.log(`    ${r.rutbe.padEnd(9)} ${r.soru} soru · kök ${r.kokOrt} krk · şık ${r.sikOrt} krk`);
}
