/**
 * KİTAP ↔ KANUN eşleşmesi, SIKI kurallarla (2 Eyl 2026).
 * Yanlış bağ = kullanıcıya BAŞKA konunun soruları → gevşek benzerlik yetmez. Üç zorunlu şart:
 *   1) Mevzuat NUMARASI (4-5 hane) ikisinde de varsa AYNI olmalı.
 *   2) TÜR aynı olmalı: kanun / yönetmelik / genelge / diğer. ("Karayolu Taşıma Kanunu" ile
 *      "Karayolu Taşıma Yönetmeliği" birbirine bağlanmasın.)
 *   3) Kalan kelimelerde yüksek örtüşme.
 * Elle karar verilenler EL_ILE'de; şüphede kalan BAĞLANMAZ (test düğmesi çıkmaz) —
 * yanlış soru göstermektense düğmeyi hiç göstermemek yeğdir.
 */
import fs from 'node:fs';

const KOK = 'D:/GorselHafizaTeknikleriyleJSPS/';
const env = Object.fromEntries(
  fs.readFileSync(KOK + '.env', 'utf8').split(/\r?\n/)
    .filter((s) => s.includes('=') && !s.trim().startsWith('#'))
    .map((s) => [s.slice(0, s.indexOf('=')).trim(), s.slice(s.indexOf('=') + 1).trim()]),
);
const sql = async (query) => {
  const r = await fetch('https://api.supabase.com/v1/projects/vwmjrvolkbiofpkzzwef/database/query', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.SUPABASE_ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  });
  return r.json();
};

const seed = fs.readFileSync(KOK + 'src/db/seed-brans-diger.ts', 'utf8');
const adlar = new Map([...seed.matchAll(/\{\s*id:\s*(\d+),\s*blok:\s*'branş',\s*ad:\s*"([^"]*)"/g)].map((m) => [+m[1], m[2]]));
const baglar = [...seed.matchAll(/law_id:\s*(\d+),\s*branch_id:\s*(\d+)/g)].map((m) => ({ law: +m[1], brans: +m[2] }));
const soru = new Map([...fs.readFileSync(KOK + 'src/assets/kart-soru-sayilari.ts', 'utf8').matchAll(/(\d+):\s*(\d+)/g)].map((m) => [+m[1], +m[2]]));
const SLUG = { 2: 'mebs', 3: 'havacilik', 4: 'personel', 5: 'maliye', 6: 'istihkam', 7: 'ikmal', 8: 'bakim', 9: 'bando', 10: 'tabip', 11: 'dis_tabibi', 12: 'eczaci', 13: 'saglik', 14: 'kimyager', 15: 'veteriner', 16: 'muhendis' };

/** ELLE KARAR (kitap başlığı → law id | null = bilerek bağlama). */
const EL_ILE = new Map([
  // Kapsamı FARKLI: kitap "Personel Hükümleri", elimizdeki soru havuzu "Mali Hükümler" → bağlama.
  ['Uzman Erbaş Kanunu (Personel Hükümleri)', null],
  ['Uzman Jandarma Kanunu (Personel Hükümleri)', null],
  ['TSK Personel Kanunu (Personel Hükümleri)', null],
  // Bütçe kanunu: doğru havuz 7567 (2026 Bütçe), harcama belgeleri yönetmeliği DEĞİL.
  ['Cari Yıl Merkezî Yönetim Bütçe Kanunu (H · K · İ Cetvelleri)', 113],
  // Jandarma Teşkilat Kanunu'nun branş havuzu yok (müşterekte var) → bağlama.
  ['Jandarma Teşkilat, Görev ve Yetkileri Kanunu (Mali Hükümler)', null],
]);

/** Kısaltmaları aç: kitap adlarında "TSK, JGK", kanun adlarında tam hâli yazılı. */
const KISALTMA = [
  [/tsk/g, 'türk silahlı kuvvetleri'],
  [/jgk/g, 'jandarma genel komutanlığı'],
  [/sgk/g, 'sahil güvenlik komutanlığı'],
  [/mit/g, 'millî istihbarat teşkilatı'],
  [/egm/g, 'emniyet genel müdürlüğü'],
  [/gn\.?\s*k\.?\s*l[ıi]ğ[ıi]/g, 'genel komutanlığı'],
  [/k\.?\s*l[ıi]ğ[ıi]/g, 'komutanlığı'],
];
const ac = (s) => KISALTMA.reduce((a, [re, y]) => a.replace(re, y), s);

/** Türkçe duyarlı küçültme (BÜYÜK harfli kanun adları regex'e takılmıyordu: İ ≠ i). */
const kucuk = (s) => String(s).replace(/İ/g, 'i').replace(/I/g, 'ı').toLocaleLowerCase('tr');

const TURLER = [
  [/yönetmeli|yonetmeli/i, 'yönetmelik'],
  [/genelge/i, 'genelge'],
  [/kurallar|etik/i, 'kurallar'],
  [/kanun/i, 'kanun'],
];
const tur = (s) => TURLER.find(([re]) => re.test(kucuk(s)))?.[1] ?? 'diğer';
/** Metindeki mevzuat numaraları (4-5 hane). */
const numaralar = (s) => new Set(String(s).match(/\b\d{4,5}\b/g) ?? []);
const DURAK = new Set(['sayili', 'sayılı', 've', 'ile', 'hakkinda', 'hakkında', 'dair', 'kanunu', 'kanun', 'yonetmeligi', 'yönetmeliği', 'yonetmelik', 'yönetmelik', 'genelgesi', 'genelge', 'uygulama', 'esaslari', 'esasları', 'usul', 'iliskin', 'ilişkin', 'islemlerine', 'işlemlerine', 'olan', 'icin', 'için']);
const kelimeler = (s) => new Set(ac(kucuk(s))
  .replace(/[^a-zçğıöşü0-9\s]/g, ' ').split(/\s+/)
  .map((w) => w.replace(/ı/g, 'i'))
  .filter((w) => w.length > 2 && !DURAK.has(w) && !/^\d{4,5}$/.test(w)));
/** Jaccard: kesişim / BİRLEŞİM. Min'e bölmek "Kamu İhale Kanunu" ile "Kamu İhale
 * Sözleşmeleri Kanunu"nu eşit yapıyordu (kısa olan hep %100 çıkıyordu). */
const ortakOran = (a, b) => {
  const A = kelimeler(a), B = kelimeler(b);
  if (!A.size || !B.size) return 0;
  let o = 0; for (const w of A) if (B.has(w)) o++;
  return o / (A.size + B.size - o);
};

/** İki başlık AYNI mevzuatı mı gösteriyor? */
function eslesirMi(kitapAd, kanunAd) {
  if (tur(kitapAd) !== tur(kanunAd)) return { olur: false, sebep: 'tür farklı' };
  const nk = numaralar(kitapAd), nc = numaralar(kanunAd);
  if (nk.size && nc.size) {
    const kesisim = [...nk].some((x) => nc.has(x));
    if (!kesisim) return { olur: false, sebep: 'numara farklı' };
    return { olur: true, p: 1, sebep: 'numara aynı' };
  }
  const p = ortakOran(kitapAd, kanunAd);
  return { olur: p >= 0.55, p, sebep: `kelime ${(p * 100) | 0}%` };
}

const kitaplar = await sql('select id, brans_slug, baslik, dosya_yolu, sira from brans_kitaplari order by brans_slug, sira');
const sonuc = [];
let bagli = 0, bagsiz = 0;
const bagsizlar = [], elle = [];

for (const [bid, slug] of Object.entries(SLUG)) {
  const kanunlar = baglar.filter((b) => b.brans === +bid).map((b) => ({ id: b.law, ad: adlar.get(b.law) ?? '', soru: soru.get(b.law) ?? 0 })).filter((c) => c.soru > 0);
  for (const k of kitaplar.filter((x) => x.brans_slug === slug)) {
    if (EL_ILE.has(k.baslik)) {
      const law = EL_ILE.get(k.baslik);
      sonuc.push({ kitap: k.id, slug, baslik: k.baslik, law, kaynak: 'elle' });
      elle.push(`${slug} · ${k.baslik.slice(0, 45)} → ${law ?? 'BAĞLANMADI (bilerek)'}`);
      if (law) bagli++; else bagsiz++;
      continue;
    }
    const adaylar = [];
    for (const c of kanunlar) {
      const r = eslesirMi(k.baslik, c.ad);
      if (r.olur) adaylar.push({ c, p: r.p ?? 0 });
    }
    adaylar.sort((x, y) => y.p - x.p);
    let en = adaylar[0]?.c ?? null, enP = adaylar[0]?.p ?? 0;
    // İki aday birbirine çok yakınsa hangisi olduğu belirsizdir → bağlama.
    if (adaylar.length > 1 && adaylar[0].p - adaylar[1].p < 0.15) {
      bagsizlar.push(`${slug} · ${k.baslik.slice(0, 55)}  (BELİRSİZ: ${adaylar[0].c.id} vs ${adaylar[1].c.id})`);
      en = null;
    }
    if (en) { bagli++; sonuc.push({ kitap: k.id, slug, baslik: k.baslik, law: en.id, kanun: en.ad, soru: en.soru, p: enP, kaynak: 'kural' }); }
    else {
      bagsiz++;
      sonuc.push({ kitap: k.id, slug, baslik: k.baslik, law: null, kaynak: 'kural' });
      const ust = kanunlar.map((c) => ({ c, p: ortakOran(k.baslik, c.ad), t: tur(c.ad) })).sort((x, y) => y.p - x.p).slice(0, 2)
        .map((x) => `${x.c.id}:${x.c.ad.slice(0, 32)}(${(x.p * 100) | 0}%,${x.t})`).join(' | ');
      bagsizlar.push(`${slug} · [${tur(k.baslik)}] ${k.baslik.slice(0, 48)}
        adaylar: ${ust}`);
    }
  }
}

fs.writeFileSync(KOK + 'scratchpad/kitap-kanun-eslesme2.json', JSON.stringify(sonuc, null, 1), 'utf8');
console.log('=== ELLE KARAR ===');
elle.forEach((s) => console.log('  ' + s));
console.log(`\n=== BAĞLANAMAYAN KİTAP (${bagsizlar.length}) — test düğmesi çıkmaz ===`);
bagsizlar.forEach((s) => console.log('  ' + s));
// aynı kanuna birden çok kitap bağlandı mı? (branş içinde)
const cift = new Map();
for (const s of sonuc) {
  if (!s.law) continue;
  const a = `${s.slug}#${s.law}`;
  cift.set(a, (cift.get(a) ?? 0) + 1);
}
const cakisan = [...cift.entries()].filter(([, n]) => n > 1);
console.log(`\n=== AYNI KANUNA BİRDEN ÇOK KİTAP (${cakisan.length}) ===`);
for (const [a] of cakisan) {
  const [slug, law] = a.split('#');
  console.log(`  ${slug} · kanun ${law}: ` + sonuc.filter((s) => s.slug === slug && String(s.law) === law).map((s) => s.baslik.slice(0, 40)).join('  |  '));
}
console.log(`\nÖZET: kitap ${kitaplar.length} · bağlı ${bagli} · bağsız ${bagsiz}`);
