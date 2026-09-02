/**
 * KEŞİF: branş PDF kitabı ↔ soru havuzu olan branş kanunu eşleşmesi.
 * "Talim Yap" düğmesinin hangi soruları açacağını bu bağ belirleyecek — yanlış bağ,
 * kullanıcıya BAŞKA konunun sorularını sorar (Subay Sicil ↔ Astsubay Sicil tuzağı).
 * Bu betik yalnız ÖLÇER; eşleşmeyeni ve şüpheliyi ayrı listeler.
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

/** Türkçe duyarlı sadeleştirme: küçült, sayı/harf dışını at. */
const norm = (s) => String(s).toLocaleLowerCase('tr')
  .replace(/ı/g, 'i').replace(/İ/g, 'i')
  .replace(/[^a-zçğöşü0-9]/g, '');
/** Kelime kümesi (kısa/gürültü kelimeler atılır) — Jaccard benzerliği için. */
const DURAK = new Set(['sayili', 'sayılı', 've', 'ile', 'hakkinda', 'hakkında', 'dair', 'kanunu', 'kanun', 'yonetmeligi', 'yönetmeliği', 'yonetmelik', 'yönetmelik', 'genelgesi', 'esaslar', 'usul', 'islemlerine', 'iliskin']);
const kelimeler = (s) => new Set(String(s).toLocaleLowerCase('tr')
  .replace(/[^a-zçğıöşü0-9\s]/g, ' ').split(/\s+/)
  .map((w) => w.replace(/ı/g, 'i'))
  .filter((w) => w.length > 2 && !DURAK.has(w)));
const benzerlik = (a, b) => {
  const A = kelimeler(a), B = kelimeler(b);
  if (!A.size || !B.size) return 0;
  let ortak = 0;
  for (const w of A) if (B.has(w)) ortak++;
  return ortak / Math.min(A.size, B.size);
};

const kitaplar = await sql('select id, brans_slug, baslik, dosya_yolu, sira from brans_kitaplari order by brans_slug, sira');
const kitapBrans = new Map();
for (const k of kitaplar) {
  if (!kitapBrans.has(k.brans_slug)) kitapBrans.set(k.brans_slug, []);
  kitapBrans.get(k.brans_slug).push(k);
}

const cikti = [];
const supheli = [];
const kitapsizKanun = [];
let kesin = 0, yok = 0;

for (const [bid, slug] of Object.entries(SLUG)) {
  const kanunlar = baglar.filter((b) => b.brans === +bid).map((b) => ({ id: b.law, ad: adlar.get(b.law) ?? '', soru: soru.get(b.law) ?? 0 }))
    .filter((c) => c.soru > 0);
  const kit = kitapBrans.get(slug) ?? [];
  if (!kit.length && !kanunlar.length) continue;
  const kullanilan = new Set();
  console.log(`\n=== ${slug.toUpperCase()} · kitap ${kit.length} · sorulu kanun ${kanunlar.length} ===`);
  for (const k of kit) {
    let en = null, enP = 0;
    for (const c of kanunlar) {
      const p = benzerlik(k.baslik, c.ad);
      if (p > enP) { enP = p; en = c; }
    }
    // Ek güvenlik: normalize edilmiş metinlerden biri diğerini kapsıyorsa güçlendir
    const kapsam = en && (norm(en.ad).includes(norm(k.baslik)) || norm(k.baslik).includes(norm(en.ad)));
    const guven = enP >= 0.8 ? 'kesin' : enP >= 0.5 ? 'muhtemel' : 'zayıf';
    if (en && enP >= 0.5) {
      kesin += guven === 'kesin' ? 1 : 0;
      kullanilan.add(en.id);
      cikti.push({ kitap: k.id, slug, baslik: k.baslik, law: en.id, kanun: en.ad, soru: en.soru, p: +enP.toFixed(2), guven, kapsam });
      console.log(`  ${guven === 'kesin' ? '✓' : '~'} ${k.baslik.slice(0, 48).padEnd(50)} → ${en.id} ${en.ad.slice(0, 40)} (${(enP * 100) | 0}%)`);
      if (guven !== 'kesin') supheli.push({ slug, kitap: k.baslik, kanun: en.ad, law: en.id, p: +enP.toFixed(2) });
    } else {
      yok++;
      cikti.push({ kitap: k.id, slug, baslik: k.baslik, law: null });
      console.log(`  ✗ ${k.baslik.slice(0, 48).padEnd(50)} → EŞLEŞME YOK`);
    }
  }
  for (const c of kanunlar) {
    if (!kullanilan.has(c.id)) {
      kitapsizKanun.push({ slug, law: c.id, ad: c.ad, soru: c.soru });
      console.log(`  ! KİTAPSIZ KANUN: ${c.id} ${c.ad.slice(0, 55)} (${c.soru} soru)`);
    }
  }
}

fs.writeFileSync(KOK + 'scratchpad/kitap-kanun-eslesme.json', JSON.stringify({ cikti, supheli, kitapsizKanun }, null, 1), 'utf8');
console.log(`\n=== ÖZET ===`);
console.log(`kitap: ${kitaplar.length} · kesin eşleşme: ${kesin} · şüpheli: ${supheli.length} · eşleşmeyen kitap: ${yok} · kitapsız kanun: ${kitapsizKanun.length}`);
