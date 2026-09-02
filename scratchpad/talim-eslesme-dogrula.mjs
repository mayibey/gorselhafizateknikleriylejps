/**
 * TALİM EŞLEŞMESİ KANITLI DOĞRULAMA (2 Eyl 2026, başkan: "kesinlikle doğru mu, emin ol").
 *
 * İsim benzerliğine GÜVENMİYORUZ. Fabrikada her mevzuat klasörü hem özet kitabı
 * (`_ozet_meta.json` → kitabın başlığı) hem sorularını (`_SORULAR.json` → law_id) üretti.
 * Yani klasör = tek kaynak: aynı klasörden çıkan kitap ile soru havuzu AYNI mevzuattır.
 * Bu betik sunucudaki her kitap-kanun bağını bu kanıta karşı sınar.
 */
import fs from 'node:fs';
import path from 'node:path';

const KOK = 'D:/JSPS Fabrika/kaynaklar/astsubay/KANUN_MASTER_DOSYALARI/BRANS_DIGER';
const PROJE = 'D:/GorselHafizaTeknikleriyleJSPS/';
const env = Object.fromEntries(
  fs.readFileSync(PROJE + '.env', 'utf8').split(/\r?\n/)
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

const klasorLaw = JSON.parse(fs.readFileSync(PROJE + 'scripts/_brans-diger-law-map.json', 'utf8'));

// klasör → { lawId, ozetBaslik, kanunNo, soruKaynaklari }
const kanit = new Map();
for (const [klasor, lawId] of Object.entries(klasorLaw)) {
  const dir = path.join(KOK, klasor);
  if (!fs.existsSync(dir)) continue;
  let ozet = null;
  const oy = path.join(dir, '_ozet_meta.json');
  if (fs.existsSync(oy)) { try { ozet = JSON.parse(fs.readFileSync(oy, 'utf8')); } catch { /* boş */ } }
  let kaynaklar = new Set();
  const sd = fs.readdirSync(dir).find((f) => /_SORULAR\.json$/i.test(f));
  if (sd) {
    try {
      const j = JSON.parse(fs.readFileSync(path.join(dir, sd), 'utf8'));
      for (const s of j.sorular ?? []) {
        const k = String(s.kaynak_madde ?? '').split(/\s+m\./)[0].trim();
        if (k) kaynaklar.add(k);
      }
    } catch { /* boş */ }
  }
  kanit.set(klasor, { lawId, ozetBaslik: ozet?.baslik ?? null, kanunNo: ozet?.no ?? null, kaynaklar: [...kaynaklar] });
}
const lawOzet = new Map(); // lawId → { klasor, ozetBaslik, kanunNo }
for (const [klasor, v] of kanit) if (v.ozetBaslik) lawOzet.set(v.lawId, { klasor, ...v });
console.log(`fabrika klasörü: ${kanit.size} · özet kitabı OLAN (kanıtlı): ${lawOzet.size}`);

const kitaplar = await sql('select id, brans_slug, baslik, dosya_yolu, law_id from brans_kitaplari where law_id is not null order by brans_slug, sira');
const norm = (s) => String(s).replace(/İ/g, 'i').replace(/I/g, 'ı').toLocaleLowerCase('tr').replace(/[^a-zçğıöşü0-9]/g, '');

let kanitli = 0, kanitYok = 0;
const yanlis = [], supheli = [];
for (const k of kitaplar) {
  const kanitSatir = lawOzet.get(k.law_id);
  if (!kanitSatir) {
    // Özet kitabı fabrika klasöründen değil (ör. jandarma havuzu law 47) → ikinci kanıt: dosya adı numarası
    const dosyaNo = path.basename(k.dosya_yolu).match(/^(\d{3,5})_/)?.[1] ?? null;
    kanitYok++;
    supheli.push({ ...k, dosyaNo });
    continue;
  }
  if (norm(kanitSatir.ozetBaslik) === norm(k.baslik)) { kanitli++; continue; }
  yanlis.push({ ...k, beklenen: kanitSatir.ozetBaslik, klasor: kanitSatir.klasor });
}

console.log(`\nKANITLI DOĞRU (aynı fabrika klasörü, başlık birebir): ${kanitli}`);
console.log(`BAŞLIK TUTMUYOR (incele): ${yanlis.length}`);
for (const y of yanlis) console.log(`  ✗ ${y.brans_slug} · "${y.baslik}" → law ${y.law_id} ama o kanunun özet başlığı: "${y.beklenen}"`);
console.log(`\nKANIT YOK (özet kitabı fabrika klasöründen çıkmamış) — ikinci yöntemle bakılacak: ${kanitYok}`);
const grup = new Map();
for (const s of supheli) {
  const a = `${s.baslik}||${s.law_id}`;
  if (!grup.has(a)) grup.set(a, { ...s, branslar: [] });
  grup.get(a).branslar.push(s.brans_slug);
}
for (const s of grup.values()) console.log(`  ? "${s.baslik.slice(0, 55)}" → law ${s.law_id} · dosya no: ${s.dosyaNo ?? '-'} · ${s.branslar.join(',')}`);
fs.writeFileSync(PROJE + 'scratchpad/talim-eslesme-supheli.json', JSON.stringify([...grup.values()], null, 1), 'utf8');
