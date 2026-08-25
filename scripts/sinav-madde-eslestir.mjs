/**
 * ÇIKMIŞ SINAV SORUSU → RESMÎ MADDE EŞLEŞTİRİCİ (içerik benzerliği, TF-IDF)
 *
 * NEDEN (26 Ağu 2026, başkan): "gerçek sınav sorularına göre kanunlarla eşgüdümlü bak,
 * en çok karıştırılan görev/makam/yetki/süre konularını çıkar — bu benim için çok kritik."
 *
 * SORUN: çıkmış sınav sorularının çoğu kanunun ADINI yazmıyor ("…kaç gün içinde bildirilir?").
 * Ad arayan eşleştirme 1.760 mevzuat sorusunun yalnız 412'sini yakalıyordu (%23) → o veriyle
 * istatistik yapılmaz.
 *
 * YÖNTEM: 1.041 resmî madde metnini (KART_MADDE_METINLERI) terim uzayına koy, IDF ağırlıklandır,
 * her sınav sorusunu (kök + şıklar) bu uzayda en yakın maddeye eşle. Eşleşme HEM kanunu HEM
 * maddeyi verir → doğru değer, tahmin değil, resmî metinden okunur.
 *
 * ⛔ DÜRÜSTLÜK: yöntem kendi hata payını ÖLÇER. Kanun adını açıkça yazan sorular "altın küme"dir
 * (doğru cevabı biliyoruz); sınıflandırıcı o kümede test edilir, isabet oranı raporlanır.
 * Eşik, ölçülen isabete göre seçilir. Eşiğin altındaki soru "eşleşmedi" sayılır, ZORLANMAZ.
 *
 * ÇIKTI: scripts/veri/sinav-madde-eslesme.json
 */
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';
import { DUELLO_ADI, KANUN_ADI, mevzuatBul, mufredataOtur } from './soru-standart.mjs';

// ---------- 1) RESMÎ MADDE KORPUSU ----------
const maddeTs = fs.readFileSync('src/assets/kart-madde-metinleri.ts', 'utf8');
const MADDE_DESEN = new RegExp('^  "([^"]+)": ("(?:[^"\\\\]|\\\\.)*"),$', 'gm');
const maddeler = [];
for (const m of maddeTs.matchAll(MADDE_DESEN)) {
  maddeler.push({ anahtar: m[1], metin: JSON.parse(m[2]) });
}

// etiket -> law adı (seed.ts KANUN_BILGI + SEED_LAWS)
const seed = fs.readFileSync('src/db/seed.ts', 'utf8');
const etiketLaw = new Map();
for (const m of seed.matchAll(/^\s{2}[a-z0-9_]+: \{ lawId: (\d+), etiket: ['"]([^'"]+)['"]/gm)) {
  const ad = KANUN_ADI.get(Number(m[1]));
  if (ad) etiketLaw.set(m[2], ad);
}
for (const m of maddeler) {
  const i = m.anahtar.lastIndexOf(' m.');
  m.etiket = i > 0 ? m.anahtar.slice(0, i) : m.anahtar;
  m.maddeNo = i > 0 ? m.anahtar.slice(i + 3) : '';
  m.kanun = etiketLaw.get(m.etiket) ?? null;
}
const korpus = maddeler.filter((m) => m.kanun).map((m) => ({ ...m, tur: 'madde' }));

// KENDİ DOĞRULANMIŞ BANKAMIZ da korpusa girer: bir sınav sorusu, aynı maddeyi soran BAŞKA bir
// soruya, ham madde metninden çok daha çok benzer (k-NN sinyali). 5.384 soru, hepsi law_id'li.
const bankaTs = fs.readFileSync('src/assets/kart-sorulari.ts', 'utf8');
{
  let aktifLaw = null;
  for (const satir of bankaTs.split(/\r?\n/)) {
    const bas = satir.match(/^\s{2}(\d+): \[/);
    if (bas) { aktifLaw = Number(bas[1]); continue; }
    if (!aktifLaw || !satir.includes('"soru"')) continue;
    try {
      const o = JSON.parse(satir.trim().replace(/,$/, ''));
      // Banka law_id uzayı müfredattan geniş (68+ = düello/branş numaraları) → müfredata oturt.
      const kanun = KANUN_ADI.get(aktifLaw) ?? mufredataOtur(DUELLO_ADI.get(aktifLaw) ?? '');
      if (!kanun || !o.soru) continue;
      korpus.push({
        anahtar: o.id || `law${aktifLaw}`,
        metin: `${o.soru} ${(o.siklar || []).join(' ')} ${o.aciklama || ''}`,
        etiket: o.kaynak || '',
        maddeNo: (String(o.kaynak || '').match(/m\.\s*([\w/]+)/) || [])[1] || '',
        kanun,
        tur: 'banka',
      });
    } catch { /* tek satır bozuksa atla */ }
  }
}

// ---------- 2) TERİM UZAYI ----------
const DURAK = new Set(('ve veya ile bu şu o bir birinci ikinci için gibi olan olarak ise da de ki mi mı mu mü ' +
  'her hangi aşağıdakilerden aşağıdaki değildir dır dir tır tir kanun kanunu kanunun madde maddesi maddesinde ' +
  'göre üzere ancak ayrıca dahi kadar sonra önce olur olmak eder edilir yapılır ilgili hakkında dair tarihli ' +
  'sayılı fıkra bent hüküm hükümleri esas usul yönetmelik yönetmeliği bakımından halinde durumunda').split(' '));

/** Türkçe için kaba gövdeleme: küçült, noktalama at, uzun kelimeyi 7 harfe kırp. */
function terimler(metin) {
  const kelime = String(metin).toLocaleLowerCase('tr').replace(/[^\p{L}\p{N}]+/gu, ' ').split(' ');
  const out = [];
  for (const k of kelime) {
    if (k.length < 4 || DURAK.has(k)) continue;
    out.push(k.length > 7 ? k.slice(0, 7) : k);
  }
  // sayılar ayrıca ağırlıklı (süre/eşik sorularında ayırt edici)
  for (const s of String(metin).matchAll(/\b(\d{1,4})\s*(gün|ay|yıl|saat|hafta)\b/gi)) out.push(`#${s[1]}${s[2].toLocaleLowerCase('tr')}`);
  return out;
}

const df = new Map();
const korpusVek = [];
for (const m of korpus) {
  const t = terimler(m.metin);
  const say = new Map();
  for (const x of t) say.set(x, (say.get(x) || 0) + 1);
  for (const x of say.keys()) df.set(x, (df.get(x) || 0) + 1);
  korpusVek.push(say);
}
const N = korpus.length;
const idf = (t) => Math.log((N + 1) / ((df.get(t) || 0) + 1)) + 1;

// vektörleri IDF ağırlıklı ve normalize et
const korpusNorm = korpusVek.map((say) => {
  const v = new Map();
  let kare = 0;
  for (const [t, c] of say) {
    const w = (1 + Math.log(c)) * idf(t);
    v.set(t, w);
    kare += w * w;
  }
  const n = Math.sqrt(kare) || 1;
  for (const [t, w] of v) v.set(t, w / n);
  return v;
});

function benzerlikler(metin) {
  const t = terimler(metin);
  const say = new Map();
  for (const x of t) say.set(x, (say.get(x) || 0) + 1);
  const v = new Map();
  let kare = 0;
  for (const [x, c] of say) {
    const w = (1 + Math.log(c)) * idf(x);
    v.set(x, w);
    kare += w * w;
  }
  const n = Math.sqrt(kare) || 1;
  const skorlar = new Array(korpus.length).fill(0);
  for (const [x, w] of v) {
    const wn = w / n;
    for (let i = 0; i < korpusNorm.length; i++) {
      const kw = korpusNorm[i].get(x);
      if (kw) skorlar[i] += wn * kw;
    }
  }
  return skorlar;
}

/**
 * k-EN YAKIN KOMŞU (k=5, skor ağırlıklı oy). Tek komşu gürültülü: bir sınav sorusu yanlışlıkla
 * başka kanunun benzer bir maddesine en yakın düşebilir. 5 komşunun ağırlıklı oyu bunu bastırır.
 */
const K = 5;
function enIyi(metin) {
  const s = benzerlikler(metin);
  const sira = [];
  for (let i = 0; i < s.length; i++) {
    if (s[i] <= 0) continue;
    if (sira.length < K) { sira.push([i, s[i]]); sira.sort((a, b) => b[1] - a[1]); }
    else if (s[i] > sira[K - 1][1]) { sira[K - 1] = [i, s[i]]; sira.sort((a, b) => b[1] - a[1]); }
  }
  if (!sira.length) return { indeks: -1, kanun: null, skor: 0, guven: 0, madde: null };
  const oy = new Map();
  for (const [i, sk] of sira) {
    const k = korpus[i].kanun;
    oy.set(k, (oy.get(k) || 0) + sk);
  }
  const sirali = [...oy].sort((a, b) => b[1] - a[1]);
  const toplam = sirali.reduce((a, x) => a + x[1], 0) || 1;
  const kazanan = sirali[0][0];
  // Kazanan kanuna ait EN YAKIN komşunun maddesi
  const enYakin = sira.find(([i]) => korpus[i].kanun === kazanan);
  return {
    indeks: enYakin ? enYakin[0] : sira[0][0],
    kanun: kazanan,
    skor: sira[0][1],
    guven: sirali[0][1] / toplam, // oyun ne kadarı kazanana gitti (0..1)
    madde: enYakin ? korpus[enYakin[0]].maddeNo : null,
  };
}

// ---------- 3) SINAV SORULARI ----------
const ham = JSON.parse(fs.readFileSync('scripts/veri/cikmis-sinav-sorulari.json', 'utf8'));
// ÖLÇÜM DÜZELTMESİ (26 Ağu): kitapçıklarda 2.336 sorunun yalnız 682'si MESLEK (mevzuat);
// 1.654'ü genel kültür (Türkçe/matematik/tarih). Eski "1.760 mevzuat sorusu" sayımı, kökünde
// 'kanun' geçen genel soruları da sayıyordu. Ölçü artık bolum='meslek'.
const adaylar = ham.filter((q) => q.bolum === 'meslek');

function adiSil(metin) {
  return String(metin)
    .replace(/\d{3,4}\s*[Ss]ayılı[^,.;)]{0,80}?(Kanunu?n?[ua]?|KHK|Kararname\w*)/g, ' ')
    .replace(/\d{3,4}\s*[Ss]ayılı/g, ' ')
    .replace(/[A-ZÇĞİÖŞÜ][\wçğıöşü]*(?:\s+[A-ZÇĞİÖŞÜ][\wçğıöşü]*){1,6}\s+Yönetmeliğ[iı]\w*/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
}


// ---------- DIŞARIYA AÇILAN ----------
export { korpus, enIyi, adaylar };
export function siniflandir(kok, siklar) {
  // 1) Kanun adı yazılıysa KESİN bilgi — sınıflandırıcıya gerek yok.
  const ad = mevzuatBul(kok || '', '', null);
  const oturan = ad ? mufredataOtur(ad) : null;
  if (oturan) return { kanun: oturan, kaynak: 'ad', guven: 1, madde: null };
  // 2) Değilse içerik benzerliği (ölçülen isabet: güven≥0.65 → %86).
  const r = enIyi(adiSil(`${kok} ${(siklar || []).join(' ')}`));
  return { kanun: r.kanun, kaynak: 'benzerlik', guven: r.guven, madde: r.madde };
}

// ---------- 4) DÜRÜST ÖLÇÜM ----------
/**
 * ⛔ ÖLÇÜM TUZAĞI (ve çözümü): "altın küme" = kanun ADINI yazan sorular. Ama biz sınıflandırıcıyı
 * adını YAZMAYAN sorularda kullanacağız. Adı duran metinle ölçersek, model adı okur, isabet
 * şişer — dağıtılan nüfusla ölçülen nüfus AYNI DEĞİL. Bu yüzden ölçümde kanun adı/numarası
 * METİNDEN SİLİNİR: model tam da sahada göreceği zorlukta test edilir.
 */

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
const altin = [];
for (const q of adaylar) {
  const ad = mevzuatBul(q.kok || '', '', null);
  const oturan = ad ? mufredataOtur(ad) : null;
  if (oturan) altin.push({ q, gercek: oturan });
}

let dogru = 0, yanlis = 0;
const olcum = [];
for (const a of altin) {
  const metin = adiSil(`${a.q.kok} ${(a.q.siklar || []).join(' ')}`);
  const r = enIyi(metin);
  const isabet = r.kanun === a.gercek;
  if (isabet) dogru++; else yanlis++;
  olcum.push({ guven: r.guven, skor: r.skor, isabet });
}
const oran = (d) => (100 * d).toFixed(1) + '%';
console.log('=== DÜRÜST DOĞRULUK (kanun adı silinmiş — sahadaki zorluk) ===');
console.log('test kümesi:', altin.length, '| isabet:', dogru, '| ıska:', yanlis, '| ham isabet:', oran(dogru / (dogru + yanlis || 1)));

console.log('\nGÜVEN EŞİĞİ TARAMASI (oy payı ≥ e):');
console.log('  eşik   kalan    kapsam   isabet');
const esikler = [0, 0.35, 0.45, 0.55, 0.65, 0.75, 0.85, 0.95, 1.0];
const tablo = [];
for (const e of esikler) {
  const alt = olcum.filter((x) => x.guven >= e);
  const d = alt.filter((x) => x.isabet).length;
  const kapsam = alt.length / (olcum.length || 1);
  tablo.push({ esik: e, kalan: alt.length, kapsam, isabet: alt.length ? d / alt.length : null });
  console.log(`  ${e.toFixed(2)}   ${String(alt.length).padStart(5)}    ${oran(kapsam).padStart(6)}   ${alt.length ? oran(d / alt.length) : '—'}`);
}

fs.writeFileSync('scripts/veri/sinav-madde-eslesme-olcum.json', JSON.stringify({
  yontem: 'TF-IDF + k-NN(5) · kanun adı silinerek ölçüldü',
  korpus: { toplam: korpus.length, madde: korpus.filter((k) => k.tur === 'madde').length, banka: korpus.filter((k) => k.tur === 'banka').length },
  meslekSorusu: adaylar.length,
  testKumesi: altin.length,
  hamIsabet: dogru / (dogru + yanlis || 1),
  esikler: tablo,
}, null, 1), 'utf8');
console.log('\nkorpus:', korpus.length, '(', korpus.filter((k) => k.tur === 'madde').length, 'madde +', korpus.filter((k) => k.tur === 'banka').length, 'banka soru ) ·', new Set(korpus.map((m) => m.kanun)).size, 'kanun');
console.log('meslek sorusu:', adaylar.length, '| adı yazan (altın):', altin.length, '| adı yazmayan:', adaylar.length - altin.length);
}
