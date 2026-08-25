/**
 * SINAV ANALİZİ REGRESYON DENETÇİSİ — "kendi kendini geliştiren ve boka sarmayan sistem".
 *
 * NEDEN (26 Ağu 2026, başkan): analiz kritik. Sınıflayıcıya her dokunuşta kalite sessizce
 * düşebilir. Bu betik ÖLÇER ve DÜŞÜŞÜ ENGELLER: her koşuda anahtar metrikleri hesaplar,
 * kayıtlı taban çizgisiyle karşılaştırır, geriye gidiş varsa ÇIKIŞ KODU 1 verir.
 *
 *   node scripts/sinav-analiz-denetle.mjs            → denetle (gerileme varsa kod 1)
 *   node scripts/sinav-analiz-denetle.mjs --kaydet   → mevcut hâli yeni taban çizgisi yap
 *
 * DENETLENEN METRİKLER
 *  1. kanunIsabet     — kanun atama isabeti (kanun adı SİLİNMİŞ metinle; sahadaki zorluk)
 *  2. kapsam          — 682 meslek sorusunun yüzde kaçına kanun atanabildi
 *  3. torbaOran       — KAPSAM/UNSUR (son çare kategori) payı; şişmesi sınıflamanın
 *                       çöktüğünün işaretidir
 *  4. olumsuzOran     — ÇAPRAZ DOĞRULAMA ÇAPASI: bağımsız kurulmuş cikmis-referans.json
 *                       "olumsuz %39,5" diyor. Bu boru hattı da ~aynı sayıyı vermeli;
 *                       sapması sınıflayıcının bozulduğunu gösterir.
 *  5. tanimliKanun    — kaç kanuna soru atanabildi (kapsama genişliği)
 *
 * TOLERANS: ölçüler küçük oynayabilir; yalnız BELİRGİN düşüş (>1,5 puan) gerileme sayılır.
 */
import fs from 'node:fs';
import { adaylar, korpus, siniflandir } from './sinav-madde-eslestir.mjs';
import { bilgiTuru, soruBicimi } from './soru-tipleri.mjs';
import { mevzuatBul, mufredataOtur } from './soru-standart.mjs';

const TABAN = 'scripts/veri/sinav-analiz-taban.json';
const GUVEN_ESIK = 0.65;
const TOLERANS = 1.5; // puan

// ---- 1) Kanun atama isabeti (adı silinmiş test) ----
// siniflandir() adı görürse kısa yoldan döner; ölçüm için adı silip SADECE benzerliği test et.
function adiSil(metin) {
  return String(metin)
    .replace(/\b\d{3,4}\s*[Ss]ayılı[^,.;)]{0,80}?(Kanunu?n?[ua]?|KHK|Kararname\w*)/g, ' ')
    .replace(/\b\d{3,4}\s*[Ss]ayılı/g, ' ')
    .replace(/[A-ZÇĞİÖŞÜ][\wçğıöşü]*(?:\s+[A-ZÇĞİÖŞÜ][\wçğıöşü]*){1,6}\s+Yönetmeliğ[iı]\w*/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

let testAdet = 0, isabet = 0;
for (const q of adaylar) {
  const ad = mevzuatBul(q.kok || '', '', null);
  const gercek = ad ? mufredataOtur(ad) : null;
  if (!gercek) continue;
  testAdet++;
  const r = siniflandir(adiSil(q.kok || ''), (q.siklar || []).map(adiSil));
  if (r.kanun === gercek) isabet++;
}

// ---- 2..5) Boru hattının kendisi ----
let kapsanan = 0;
const turler = new Map(), bicimler = new Map(), kanunKumesi = new Set();
for (const q of adaylar) {
  const r = siniflandir(q.kok, q.siklar);
  if (!r.kanun || (r.kaynak === 'benzerlik' && r.guven < GUVEN_ESIK)) continue;
  kapsanan++;
  kanunKumesi.add(r.kanun);
  const t = bilgiTuru(q.kok, q.siklar);
  turler.set(t, (turler.get(t) || 0) + 1);
  const b = soruBicimi(q.kok, q.siklar);
  bicimler.set(b, (bicimler.get(b) || 0) + 1);
}

const yuz = (a, b) => +(100 * a / (b || 1)).toFixed(1);
const olcum = {
  tarih: new Date().toISOString().slice(0, 10),
  meslekSorusu: adaylar.length,
  korpus: korpus.length,
  kanunIsabet: yuz(isabet, testAdet),
  kapsam: yuz(kapsanan, adaylar.length),
  torbaOran: yuz(turler.get('KAPSAM/UNSUR') || 0, kapsanan),
  olumsuzOran: yuz(bicimler.get('OLUMSUZ') || 0, kapsanan),
  tanimliKanun: kanunKumesi.size,
  turDagilimi: Object.fromEntries([...turler].sort((a, b) => b[1] - a[1])),
  bicimDagilimi: Object.fromEntries([...bicimler].sort((a, b) => b[1] - a[1])),
};

console.log('=== ÖLÇÜM ===');
console.log(`kanun atama isabeti : %${olcum.kanunIsabet}   (ad silinmiş, ${testAdet} soruluk test)`);
console.log(`kapsam              : %${olcum.kapsam}   (${kapsanan}/${adaylar.length} soru)`);
console.log(`torba kategori payı : %${olcum.torbaOran}   (KAPSAM/UNSUR — şişerse sınıflama çöküyor)`);
console.log(`olumsuz soru oranı  : %${olcum.olumsuzOran}   (çapraz doğrulama çapası ≈ %39,5)`);
console.log(`soru atanan kanun   : ${olcum.tanimliKanun}`);

if (process.argv.includes('--kaydet')) {
  fs.writeFileSync(TABAN, JSON.stringify(olcum, null, 1), 'utf8');
  console.log('\n✅ TABAN ÇİZGİSİ KAYDEDİLDİ →', TABAN);
  process.exit(0);
}

if (!fs.existsSync(TABAN)) {
  console.log('\n⚠️  Taban çizgisi yok. İlk kez kaydetmek için: --kaydet');
  process.exit(0);
}

const taban = JSON.parse(fs.readFileSync(TABAN, 'utf8'));
const kural = [
  { ad: 'kanun atama isabeti', anahtar: 'kanunIsabet', yon: 'yuksek' },
  { ad: 'kapsam', anahtar: 'kapsam', yon: 'yuksek' },
  { ad: 'torba kategori payı', anahtar: 'torbaOran', yon: 'dusuk' },
  { ad: 'soru atanan kanun', anahtar: 'tanimliKanun', yon: 'yuksek' },
];
console.log(`\n=== TABAN ÇİZGİSİYLE KARŞILAŞTIRMA (${taban.tarih}) ===`);
let gerileme = 0;
for (const k of kural) {
  const eski = taban[k.anahtar], yeni = olcum[k.anahtar];
  const fark = +(yeni - eski).toFixed(1);
  const kotu = k.yon === 'yuksek' ? fark < -TOLERANS : fark > TOLERANS;
  if (kotu) gerileme++;
  const isaret = kotu ? '❌ GERİLEME' : fark === 0 ? '=' : (k.yon === 'yuksek' ? (fark > 0 ? '✅ iyileşme' : 'küçük düşüş') : (fark < 0 ? '✅ iyileşme' : 'küçük artış'));
  console.log(`  ${k.ad.padEnd(22)} ${String(eski).padStart(6)} → ${String(yeni).padStart(6)}  (${fark > 0 ? '+' : ''}${fark})  ${isaret}`);
}
// Çapa: olumsuz oranı bağımsız referanstan çok saparsa sınıflayıcı bozulmuştur.
const capaSapma = Math.abs(olcum.olumsuzOran - 39.5);
console.log(`  ${'olumsuz çapa sapması'.padEnd(22)} ${capaSapma.toFixed(1)} puan  ${capaSapma > 8 ? '❌ ÇAPADAN KOPTU' : '✅ tutarlı'}`);
if (capaSapma > 8) gerileme++;

if (gerileme) {
  console.log(`\n❌ ${gerileme} metrikte GERİLEME var — değişikliği gözden geçir (kabul ediyorsan --kaydet).`);
  process.exit(1);
}
console.log('\n✅ Gerileme yok.');
