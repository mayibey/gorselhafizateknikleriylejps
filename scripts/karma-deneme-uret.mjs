/**
 * KARMA GENEL DENEME ÜRETİCİ — `npm run karma:uret`
 *
 * Başkan (23 Ağu 2026): "hem müşterek hem branş konulardan oluşan 5 deneme, her biri
 * 100 soru; sorular birbirinin benzeri olabilir ama AYNISI olmasın."
 *
 * YENİ SORU UYDURULMAZ. Elimizde doğrulanmış ~14.500 soru var (kart soruları + düello
 * havuzu); karma denemeler BUNLARDAN kurulur. Sebebi: kanun sorusunda uydurma cevap
 * felakettir (22 Ağu'da bot 7068 m.8'i yanlış cevaplamıştı). Havuzdaki sorular fabrika
 * hattından geçmiş, kaynağı yazılı sorular.
 *
 * AYNISI OLMASIN KURALI (üç katman):
 *  1. Mevcut denemelerde (müşterek 3×50 + branş 5×50) kullanılan sorular DIŞARIDA.
 *  2. Kara listedeki sorular DIŞARIDA.
 *  3. Soru metni normalize edilip (küçük harf, noktalama/boşluk sadeleştirme) TEKİLLEŞTİRİLİR —
 *     aynı soru iki havuzda farklı id ile duruyorsa bir kez alınır.
 *
 * DENGE: her deneme 50 müşterek + 50 branş. Kanunlar arasında sırayla dağıtılır (round-robin),
 * yani bir deneme tek kanuna yığılmaz. Tohumlu karıştırma → her çalıştırmada AYNI sonuç.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SORU_KARA_LISTE } from './soru-kara-liste.mjs';
import { konuAnahtari, mevzuatBul } from './soru-standart.mjs';
import { profilAnahtari, soruProfili } from './soru-profil.mjs';

const kok = join(dirname(fileURLToPath(import.meta.url)), '..');
const DENEME_SAYISI = 5;
const SORU_SAYISI = 100;

/** TS veri dosyasındaki nesneyi/diziyi okur (saf veri; eval güvenli). */
function veriOku(dosya, degisken) {
  const s = readFileSync(join(kok, dosya), 'utf8');
  // DİKKAT: sadece değişken adını aramak TİP TANIMINA düşüyordu ("export type KartSoru = {").
  // "export const <AD>" ile çıpalanır, sonra ilk [ veya { alınır (tip notu atlanır).
  const i = s.indexOf('export const ' + degisken);
  if (i < 0) throw new Error(degisken + ' bulunamadı: ' + dosya);
  const esit = s.indexOf('=', i);
  const a = s.indexOf('[', esit), b = s.indexOf('{', esit);
  const bas = a < 0 ? b : b < 0 ? a : Math.min(a, b);
  const son = s.lastIndexOf(s[bas] === '[' ? ']' : '}');
  // eslint-disable-next-line no-new-func
  return new Function('return ' + s.slice(bas, son + 1))();
}

// ÇIKMIŞ SINAV ÖLÇÜSÜ — hangi mevzuattan 100 soruda kaç soru çıkıyor (scripts/cikmis-referans.json).
// Başkan (23 Ağu): "gerçek sınavların her birini analiz etsin, hangi konudan kaç soru çıkmış;
// bizim deneme bu standarda uyuyor mu; soru dağılımları ona göre ayarlansın."
let REFERANS_KONU = [];
let REFERANS_BILESIK = [];
let REFERANS_SIK = new Map();
let REFERANS_BICIM = new Map();
try {
  const _r = JSON.parse(readFileSync(join(kok, 'scripts/cikmis-referans.json'), 'utf8'));
  REFERANS_KONU = _r.konuAgirlik;
  REFERANS_BILESIK = _r.bilesikAgirlik ?? [];
  REFERANS_SIK = new Map((_r.boyutlar?.sik ?? []).map((x) => [x.ad, x.yuz]));
  REFERANS_BICIM = new Map((_r.boyutlar?.bicim ?? []).map((x) => [x.ad, x.yuz]));
} catch {
  console.log('UYARI: cikmis-referans.json yok — konu kotası uygulanmayacak (npm run referans:uret).');
}

const KART_SORULARI = veriOku('src/assets/kart-sorulari.ts', 'KART_SORULARI');
const DUELLO = veriOku('src/assets/duello-sorulari.ts', 'DUELLO_SORULARI');
const MUSTEREK_DENEME = veriOku('src/assets/genel-denemeler.ts', 'GENEL_DENEMELER');
const BRANS_DENEME = veriOku('src/assets/genel-denemeler-brans.ts', 'GENEL_DENEMELER_BRANS');

// --- kanun → blok (müşterek / branş) ---
const seed = readFileSync(join(kok, 'src/db/seed.ts'), 'utf8');
const blokMap = new Map();
for (const m of seed.matchAll(/\{ id: (\d+), blok: '([^']+)'/g)) blokMap.set(Number(m[1]), m[2]);

// --- kullanılmışlar + kara liste ---
const kullanilan = new Set();
// Küratörlü denemelerdeki yedek sorular '-Y' ekiyle duruyor; TABAN kimlik de dışarıda
// kalmalı yoksa aynı soru karma denemeye ikinci kez giriyor.
for (const d of [...MUSTEREK_DENEME, ...BRANS_DENEME]) for (const s of d.sorular) {
  kullanilan.add(s.id);
  kullanilan.add(String(s.id).replace(/-Y$/, ''));
}
const karaListe = new Set(SORU_KARA_LISTE ?? []);

const sadeMetin = (s) => String(s).toLocaleLowerCase('tr')
  .replace(/[^\p{L}\p{N}]+/gu, ' ').replace(/\s+/g, ' ').trim();

// --- havuz: kanun bazında topla ---
/** law_id → soru[] (tekilleştirilmiş) */
const havuz = new Map();
const gorulenMetin = new Set();
/**
 * ELENEN SORU DESENLERİ (başkan, 23 Ağu):
 *  - "genel denemede doğru/yanlış soruları olmaz" → 4'ten az şıklı soru alınmaz.
 *  - "m.4'e göre diyor ama hangi kanunun 4'ü yazmıyor" → hangi mevzuattan söz ettiği
 *    kendi metninden anlaşılmayan sorular alınmaz. Kaynak künyesi artık sınav sırasında
 *    gösterilmediği için soru KENDİ BAŞINA anlaşılır olmak zorunda.
 */
const BELIRSIZ_BASLANGIC = [
  /^["']?m\.\s?\d/i,
  /^madde\s?\d/i,
  /^yönetmeliğe göre/i,
  /^yönetmelik m\./i,
  /^yönetmeliğin m\./i,
  /^kanun'?a göre/i,
  /^bu (kanun|yönetmelik|tebliğ)/i,
  /^anılan (kanun|yönetmelik)/i,
  /^söz konusu (kanun|yönetmelik)/i,
  /^ilgili mevzuata göre/i,
  /^tebliğe göre/i,
];

function ekle(lawId, s) {
  if (!s || !s.id || !Array.isArray(s.siklar) || s.siklar.length < 4) return;
  if (BELIRSIZ_BASLANGIC.some((r) => r.test(String(s.soru).trim()))) return;
  if (kullanilan.has(s.id) || karaListe.has(s.id)) return;
  if (typeof s.dogru !== 'number' || s.dogru < 0 || s.dogru >= s.siklar.length) return;
  const anahtar = sadeMetin(s.soru);
  if (anahtar.length < 25 || gorulenMetin.has(anahtar)) return;
  gorulenMetin.add(anahtar);
  if (!havuz.has(lawId)) havuz.set(lawId, []);
  havuz.get(lawId).push({
    __law: lawId, // konu/blok sayımı için (çıktıya YAZILMAZ)
    id: s.id, soru: s.soru, siklar: s.siklar, dogru: s.dogru,
    aciklama: s.aciklama ?? '', kaynak: s.kaynak ?? '', zorluk: s.zorluk ?? 'orta',
    kartId: s.kartId ?? '',
  });
}
for (const [lawId, liste] of Object.entries(KART_SORULARI)) for (const s of liste) ekle(Number(lawId), s);
for (const s of DUELLO) if (s.kanun != null) ekle(Number(s.kanun), s);

// --- tohumlu karıştırma (her çalıştırmada aynı sonuç) ---
let tohum = 20260823;
const rast = () => { tohum = (tohum * 1103515245 + 12345) & 0x7fffffff; return tohum / 0x7fffffff; };
const karistir = (a) => { const d = [...a]; for (let i = d.length - 1; i > 0; i--) { const j = Math.floor(rast() * (i + 1)); [d[i], d[j]] = [d[j], d[i]]; } return d; };

const musterekKanunlar = [...havuz.keys()].filter((k) => blokMap.get(k) === 'müşterek');
const bransKanunlar = [...havuz.keys()].filter((k) => blokMap.get(k) !== 'müşterek');
for (const k of havuz.keys()) havuz.set(k, karistir(havuz.get(k)));

const sayim = (ks) => ks.reduce((t, k) => t + havuz.get(k).length, 0);
console.log('HAVUZ (kullanılmış/kara liste/tekrar çıkarılmış)');
console.log('  müşterek:', musterekKanunlar.length, 'kanun ·', sayim(musterekKanunlar), 'soru');
console.log('  branş   :', bransKanunlar.length, 'kanun ·', sayim(bransKanunlar), 'soru');

/**
 * SORU TİPİ — denemeyi çıkmış sınavdaki tip dağılımına oturtmak için.
 * Ölçüm (23 Ağu 2026, 9 kitapçık / 1.760 mevzuat sorusu): olumsuz %38 · yetkili makam-süre %15 ·
 * düz bilgi %14 · ceza/yaptırım %12 · boşluk doldurma %6 · olumlu %4 · öncüllü %3 · tanım %2.
 * Bizim havuzda "hangisi yanlıştır" tipi yalnız %7,6 — denemeye alırken KOTA ile dengelenir.
 */
function soruTipi(q) {
  const k = String(q.soru);
  const son = k.split(/(?<=\?)\s+/).slice(-2).join(' ').toLocaleLowerCase('tr');
  const tam = k.toLocaleLowerCase('tr');
  if (/boş bırakılan|boşluğa|……|\.\.\.\.|getirilmelidir/.test(tam)) return 'bosluk';
  if (/\bII\.\s/.test(k) && /yukarıdakiler|hangileri|verilenler/.test(tam)) return 'onculu';
  if (/yanlıştır|değildir|olamaz|yer almaz|söylenemez|gerekmez|biri değil/.test(son)) return 'olumsuz';
  if (/tanımlamaktadır|hangi kavram|ifade eder/.test(son)) return 'tanim';
  if (/ceza|cezalandırılır|disiplin cezası|yaptırım/.test(son)) return 'ceza';
  if (/kim|makam|merci|yetkili|tarafından|onayıyla|verilir|kaç gün|kaç ay|süre/.test(son)) return 'makam';
  if (/doğrudur|doğru olarak|tam ve doğru/.test(son)) return 'olumlu';
  return 'duz';
}

// Yarım denemedeki (50 soru) tip kotaları — gerçek sınav oranlarının yarısı.
const KOTA = [
  ['olumsuz', 19], ['makam', 8], ['duz', 7], ['ceza', 6],
  ['bosluk', 3], ['olumlu', 2], ['onculu', 2], ['tanim', 1],
];

/** Kanunlar arasında SIRAYLA çekerek n soru al (tek kanuna yığılmasın). tip verilirse o tipten. */
function dagit(kanunlar, adet, imlec, tip) {
  const secilen = [];
  let bos = 0;
  while (secilen.length < adet && bos < kanunlar.length) {
    bos = 0;
    for (const k of kanunlar) {
      if (secilen.length >= adet) break;
      const liste = havuz.get(k);
      let i = imlec.get(k) ?? 0;
      while (i < liste.length && (liste[i].alindi || (tip && soruTipi(liste[i]) !== tip))) i++;
      if (i >= liste.length) { bos++; continue; }
      liste[i].alindi = true;
      secilen.push(liste[i]);
      // İmleç yalnız tip süzgeci YOKKEN ilerler; tipli çekimde liste baştan taranır.
      if (!tip) imlec.set(k, i + 1);
    }
  }
  return secilen;
}

/** Konu adı → o konudaki (henüz alınmamış) sorular. Tek seferlik kurulur. */
let _konuHavuz = null;
function konuHavuzu() {
  if (_konuHavuz) return _konuHavuz;
  _konuHavuz = new Map();
  for (const [lawId, liste] of havuz) {
    for (const q of liste) {
      const anah = konuAnahtari(mevzuatBul(q.soru, q.kaynak, lawId));
      if (!anah) continue;
      if (!_konuHavuz.has(anah)) _konuHavuz.set(anah, []);
      _konuHavuz.get(anah).push(q);
    }
  }
  return _konuHavuz;
}

/** Belirli bir konudan n soru al (tip tercihi varsa önce onu dener). */
function konudanAl(ad, adet, tipSirasi, serbestDusme = false) {
  const liste = konuHavuzu().get(ad) ?? [];
  const alinan = [];
  // DİKKAT: tip verildiyse BAŞKA tipe DÜŞÜLMEZ. İlk sürümde sona null (=herhangi tip)
  // ekliydi ve konu kotası tip kotasını deliyordu (olumsuz %38 hedefi %27'ye düşmüştü).
  for (const tip of serbestDusme ? [...tipSirasi, null] : tipSirasi) {
    for (const q of liste) {
      if (alinan.length >= adet) break;
      if (q.alindi) continue;
      if (tip && soruTipi(q) !== tip) continue;
      q.alindi = true;
      alinan.push(q);
    }
    if (alinan.length >= adet) break;
  }
  return alinan;
}

/**
 * Bir deneme (100 soru): ÖNCE çıkmış sınavdaki konu ağırlıkları (en ağır konudan
 * başlayarak), SONRA tip kotasıyla serbest dolum, kalan boşluk round-robin.
 * Konu kotası tutmazsa (o konuda sorumuz kalmadıysa) eksik kalan pay serbest dolumla kapanır.
 */
function denemeKur(adet, imlecM, imlecB) {
  const secilen = [];
  // ŞIK DENGESİ: çıkmış sınavda şıkların ~%37'si UZUN (bir fıkra/cümle). Bizim havuzda
  // bu oran %8; denemeye alırken uzun şıklı sorulara ÖNCELİK verilir ki zorluk tutsun.
  const sikHedef = new Map([...REFERANS_SIK].map(([ad, yuz]) => [ad, Math.round((yuz * adet) / 100)]));
  const sikSayac = new Map();
  // BİÇİM DENGESİ de kotalı: "boşluk doldurma" bizde %14'e çıkıyordu, sınavda %5,7.
  const bicimHedef = new Map([...REFERANS_BICIM].map(([ad, yuz]) => [ad, Math.round((yuz * adet) / 100)]));
  const bicimSayac = new Map();
  const acik = (harita, sayac, ad) => (harita.get(ad) ?? 0) - (sayac.get(ad) ?? 0);
  // 1. geçiş: açığı EN BÜYÜK olan şık türü (pratikte "uzun şıklı" sorular) öncelikli.
  const sikOncelik = (q) => {
    const pr = soruProfili(q);
    if (acik(bicimHedef, bicimSayac, pr.bicim) <= 0) return false;
    const enAcik = [...sikHedef.keys()].sort((x, y) => acik(sikHedef, sikSayac, y) - acik(sikHedef, sikSayac, x))[0];
    return pr.sik === enAcik;
  };
  // 2. geçiş: kotasını aşmayan her soru.
  const sikUygun = (q) => {
    const pr = soruProfili(q);
    return acik(sikHedef, sikSayac, pr.sik) > 0 && acik(bicimHedef, bicimSayac, pr.bicim) > 0;
  };
  const isle = (liste) => {
    for (const q of liste) {
      const pr = soruProfili(q);
      sikSayac.set(pr.sik, (sikSayac.get(pr.sik) ?? 0) + 1);
      bicimSayac.set(pr.bicim, (bicimSayac.get(pr.bicim) ?? 0) + 1);
    }
    secilen.push(...liste);
  };

  // DIŞ HALKA: bileşik profil kotası (yön + neyi sorduğu) — çıkmış sınav oranı.
  // İÇ HALKA: o profildeki soruları çıkmış sınavın KONU ağırlığına göre dağıt.
  for (const bk of REFERANS_BILESIK) {
    let kalan = Math.round((bk.yuz * adet) / 100);
    if (kalan < 1) continue;
    for (const tur of ['oncelik', 'kotali', 'serbest']) {
      for (const k of REFERANS_KONU) {
        if (kalan <= 0) break;
        const pay = Math.max(1, Math.round((k.yuz * kalan) / 100));
        const alinan = konudanAlProfil(
          k.anahtar ?? konuAnahtari(k.ad),
          Math.min(pay, kalan),
          bk.ad,
          tur === 'oncelik' ? sikOncelik : tur === 'kotali' ? sikUygun : null,
        );
        isle(alinan);
        kalan -= alinan.length;
      }
      if (kalan <= 0) break;
    }
    // O profilde konu havuzu yetmediyse: tüm havuzdan serbest.
    if (kalan > 0) isle(tumHavuzdanProfil(kalan, bk.ad));
  }
  // Yuvarlamadan artan boşluk: serbest dolum (yarı müşterek / yarı branş).
  const eksik = adet - secilen.length;
  if (eksik > 0) {
    const m = dagit(karistir(musterekKanunlar), Math.ceil(eksik / 2), imlecM);
    isle(m);
    isle(dagit(karistir(bransKanunlar), eksik - m.length, imlecB));
  }
  return secilen.slice(0, adet);
}

/** Bir konudan, belirli BİLEŞİK profile (yön|bilgi) uyan n soru al. */
function konudanAlProfil(anahtar, adet, bilesik, sikSuzgec) {
  const liste = konuHavuzu().get(anahtar) ?? [];
  const alinan = [];
  for (const q of liste) {
    if (alinan.length >= adet) break;
    if (q.alindi) continue;
    if (profilAnahtari(soruProfili(q)) !== bilesik) continue;
    if (sikSuzgec && !sikSuzgec(q)) continue;
    q.alindi = true;
    alinan.push(q);
  }
  return alinan;
}

/** Konu kotası tutmadıysa: tüm havuzdan o profile uyan soru. */
function tumHavuzdanProfil(adet, bilesik) {
  const alinan = [];
  for (const [, liste] of havuz) {
    for (const q of liste) {
      if (alinan.length >= adet) return alinan;
      if (q.alindi) continue;
      if (profilAnahtari(soruProfili(q)) !== bilesik) continue;
      q.alindi = true;
      alinan.push(q);
    }
  }
  return alinan;
}

/** Tip kotasıyla serbest dolum (konu kotasından artan boşluk için). */
function yariDeneme(kanunlar, adet, imlec) {
  if (adet <= 0) return [];
  const secilen = [];
  for (const [tip, kota] of KOTA) {
    secilen.push(...dagit(karistir(kanunlar), Math.round((kota * adet) / 50), imlec, tip));
  }
  if (secilen.length < adet) secilen.push(...dagit(karistir(kanunlar), adet - secilen.length, imlec));
  return secilen.slice(0, adet);
}

const imlecM = new Map(), imlecB = new Map();
const denemeler = [];
for (let no = 1; no <= DENEME_SAYISI; no++) {
  
  const secilen = denemeKur(SORU_SAYISI, imlecM, imlecB);
  const m = secilen.filter((q) => blokMap.get(q.__law) === 'müşterek');
  const b = secilen.filter((q) => blokMap.get(q.__law) !== 'müşterek');
  const sorular = karistir(secilen).map(({ alindi, __law, ...q }) => q);
  denemeler.push({ no, baslik: `Karma Deneme ${no}`, sorular });
  console.log(`  Karma Deneme ${no}: ${sorular.length} soru (${m.length} müşterek + ${b.length} branş)`);
}

const tipSay = {};
for (const d of denemeler) for (const q of d.sorular) tipSay[soruTipi(q)] = (tipSay[soruTipi(q)] ?? 0) + 1;
console.log('\nTİP DAĞILIMI (hedef %: olumsuz 38 · makam 15 · duz 14 · ceza 12 · bosluk 6 · olumlu 4 · onculu 3 · tanim 2)');
for (const [t, n] of Object.entries(tipSay).sort((x, y) => y[1] - x[1])) console.log('  ' + t.padEnd(9) + String(n).padStart(4) + '  %' + (100 * n / 500).toFixed(1));

// --- doğrulama ---
const tumId = new Set();
let cakisma = 0;
for (const d of denemeler) for (const s of d.sorular) { if (tumId.has(s.id) || kullanilan.has(s.id)) cakisma++; tumId.add(s.id); }
console.log('\nDOĞRULAMA — toplam soru:', tumId.size, '| çakışma:', cakisma);
if (cakisma > 0) { console.error('ÇAKIŞMA VAR — yazılmadı'); process.exit(1); }

const govde = denemeler.map((d) => `  {
    no: ${d.no},
    baslik: ${JSON.stringify(d.baslik)},
    sorular: [
${d.sorular.map((s) => '      ' + JSON.stringify(s)).join(',\n')}
    ],
  }`).join(',\n');

writeFileSync(join(kok, 'src/assets/genel-denemeler-karma.ts'),
`// OTOMATİK ÜRETİLDİ — ELLE DÜZENLEME. \`npm run karma:uret\` ile yenile.
// Başkan (23 Ağu 2026): "hem müşterek hem branş konulardan 5 deneme, her biri 100 soru."
// Sorular UYDURULMADI; doğrulanmış havuzdan (kart soruları + düello) seçildi.
// Mevcut denemelerde kullanılanlar, kara listedekiler ve metni aynı olanlar DIŞARIDA.
// Şema müşterek GENEL_DENEMELER ile AYNI → aynı sınav akışı/puanlama/zayıf havuz.
/* eslint-disable */
import type { GenelDeneme } from './genel-denemeler';

export const GENEL_DENEMELER_KARMA: GenelDeneme[] = [
${govde},
];
`, 'utf8');
console.log('\nyazıldı: src/assets/genel-denemeler-karma.ts');
