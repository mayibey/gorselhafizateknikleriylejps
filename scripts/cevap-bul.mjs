/**
 * CEVAP BULUCU — çıkmış sınav sorusunun doğru şıkkını RESMÎ METİNDEN çıkarır. (26 Ağu 2026)
 *
 * Başkan: "kendin büyük bir titizlikle bul cevapları, gerekirse cevap anahtarına güvenme."
 *
 * FİKİR: Doğru şık, ilgili kanunun resmî metniyle DESTEKLENİR; çeldiriciler desteklenmez.
 *   • DÜZ soruda      → en çok desteklenen şık doğrudur.
 *   • OLUMSUZ soruda  → ("hangisi yanlıştır") en AZ desteklenen şık doğrudur.
 * Destek ölçüsü: şık metninin, o kanunun madde metinleri içinde bulduğu en iyi örtüşme
 * (nadir terim ağırlıklı; sık geçen kalıp kelimeler puan şişirmesin diye IDF kullanılır).
 *
 * ⛔ DÜRÜSTLÜK: yöntem 664 BİLİNEN cevapla sınanır (anahtar sayfası + kırmızı işaret).
 * Ölçülen isabet raporlanır; eşik altındaki tahminler "belirsiz" kalır, ZORLANMAZ.
 * Ayrıca yöntemin cevabı ile anahtarın cevabı ÇELİŞİYORSA o soru işaretlenir — anahtarın
 * kendisi de yanlış olabilir (başkanın uyarısı), çelişkiler elle bakılmak üzere listelenir.
 *
 *   node scripts/cevap-bul.mjs            → 664 bilinen cevapta İSABET ÖLÇÜMÜ
 *   node scripts/cevap-bul.mjs --uygula   → cevabı olmayanlara da uygula, dosyaya yaz
 */
import fs from 'node:fs';
import { korpus, siniflandir } from './sinav-madde-eslestir.mjs';
import { soruBicimi } from './soru-tipleri.mjs';

// ---------- terim uzayı: yalnız RESMÎ MADDE metinleri ----------
const maddeler = korpus.filter((k) => k.tur === 'madde');
const DURAK = new Set(('ve veya ile bu şu için gibi olan olarak ise her hangi göre üzere ancak ' +
  'ayrıca kadar sonra önce olur eder edilir yapılır ilgili hakkında dair sayılı fıkra bent madde ' +
  'kanun kanunu hüküm hükümleri esas usul yönetmelik bakımından halinde durumunda değildir dır dir').split(' '));

function terimler(metin) {
  const out = [];
  for (const w of String(metin).toLocaleLowerCase('tr').replace(/[^\p{L}\p{N}]+/gu, ' ').split(' ')) {
    if (w.length < 4 || DURAK.has(w)) continue;
    out.push(w.length > 7 ? w.slice(0, 7) : w);
  }
  return out;
}

const df = new Map();
const maddeVek = maddeler.map((m) => {
  const say = new Map();
  for (const t of terimler(m.metin)) say.set(t, (say.get(t) || 0) + 1);
  for (const t of say.keys()) df.set(t, (df.get(t) || 0) + 1);
  return say;
});
const N = maddeler.length;
const idf = (t) => Math.log((N + 1) / ((df.get(t) || 0) + 1)) + 1;

// kanun -> o kanunun madde indeksleri
const kanunMadde = new Map();
maddeler.forEach((m, i) => {
  if (!kanunMadde.has(m.kanun)) kanunMadde.set(m.kanun, []);
  kanunMadde.get(m.kanun).push(i);
});

/** Şıkkın, verilen kanunun metinlerince DESTEKLENME puanı (0..1) + en iyi madde. */
function destek(sikMetni, kanun) {
  const idx = kanunMadde.get(kanun);
  if (!idx || !idx.length) return { puan: 0, madde: null };
  const t = terimler(sikMetni);
  if (t.length < 3) return { puan: 0, madde: null };
  const agirlik = new Map();
  let toplam = 0;
  for (const x of t) {
    const w = idf(x);
    agirlik.set(x, (agirlik.get(x) || 0) + w);
    toplam += w;
  }
  if (!toplam) return { puan: 0, madde: null };
  let enIyi = 0;
  let enMadde = null;
  for (const i of idx) {
    const vek = maddeVek[i];
    let ortak = 0;
    for (const [x, w] of agirlik) if (vek.has(x)) ortak += w;
    const p = ortak / toplam; // şıkkın kaçta kaçı bu maddede geçiyor
    if (p > enIyi) { enIyi = p; enMadde = maddeler[i].maddeNo; }
  }
  return { puan: enIyi, madde: enMadde };
}

/** Bir soruyu cevapla. → {harf, guven, gerekce} ya da null */
export function cevapBul(kok, siklarNesne) {
  const harfler = Object.keys(siklarNesne || {}).sort();
  if (harfler.length < 4) return null;
  const r = siniflandir(kok, harfler.map((h) => siklarNesne[h]));
  if (!r.kanun || (r.kaynak === 'benzerlik' && r.guven < 0.55)) return null;

  const puanlar = harfler.map((h) => ({ h, ...destek(siklarNesne[h], r.kanun) }));
  const bicim = soruBicimi(kok, harfler.map((h) => siklarNesne[h]));
  const olumsuz = bicim === 'OLUMSUZ';

  const sirali = [...puanlar].sort((a, b) => (olumsuz ? a.puan - b.puan : b.puan - a.puan));
  const kazanan = sirali[0];
  const ikinci = sirali[1];
  // Güven = kazananla ikinci arasındaki AÇIK. Açık yoksa karar zorlanmaz.
  const acik = Math.abs(kazanan.puan - ikinci.puan);
  return {
    harf: kazanan.h,
    guven: acik,
    kanun: r.kanun,
    madde: kazanan.madde,
    olumsuz,
    puanlar: Object.fromEntries(puanlar.map((p) => [p.h, +p.puan.toFixed(3)])),
  };
}

// ---------- ÖLÇÜM ----------
const veri = JSON.parse(fs.readFileSync('scripts/veri/sinav-cevapli.json', 'utf8'));
const bilinen = veri.sorular.filter((q) => q.cevap && Object.keys(q.siklar || {}).length >= 4);

let denenen = 0, dogru = 0;
const kayit = [];
for (const q of bilinen) {
  const c = cevapBul(q.kok, q.siklar);
  if (!c) continue;
  denenen++;
  const isabet = c.harf === q.cevap;
  if (isabet) dogru++;
  kayit.push({ guven: c.guven, isabet, olumsuz: c.olumsuz, no: q.no, dosya: q.dosya, benim: c.harf, anahtar: q.cevap });
}
const yuz = (a, b) => (100 * a / (b || 1)).toFixed(1);
console.log('=== CEVAP BULUCU İSABETİ (664 bilinen cevaba karşı) ===');
console.log(`denenen: ${denenen} · isabet: ${dogru} · oran: %${yuz(dogru, denenen)}   (rastgele = %20)`);

const duz = kayit.filter((k) => !k.olumsuz), olm = kayit.filter((k) => k.olumsuz);
console.log(`  DÜZ sorular    : ${duz.length} soru · %${yuz(duz.filter((k) => k.isabet).length, duz.length)}`);
console.log(`  OLUMSUZ sorular: ${olm.length} soru · %${yuz(olm.filter((k) => k.isabet).length, olm.length)}`);

console.log('\nGÜVEN EŞİĞİ (kazananla ikinci arasındaki açık):');
console.log('  eşik    kalan   kapsam   isabet');
for (const e of [0, 0.05, 0.1, 0.15, 0.2, 0.3, 0.4]) {
  const alt = kayit.filter((k) => k.guven >= e);
  console.log(`  ${e.toFixed(2)}  ${String(alt.length).padStart(6)}  %${yuz(alt.length, kayit.length).padStart(5)}   %${yuz(alt.filter((k) => k.isabet).length, alt.length)}`);
}

fs.writeFileSync('scripts/veri/cevap-bul-olcum.json', JSON.stringify({
  denenen, dogru, oran: +yuz(dogru, denenen),
  duz: { n: duz.length, isabet: +yuz(duz.filter((k) => k.isabet).length, duz.length) },
  olumsuz: { n: olm.length, isabet: +yuz(olm.filter((k) => k.isabet).length, olm.length) },
}, null, 1), 'utf8');
