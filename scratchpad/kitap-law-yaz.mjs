/**
 * KİTAP → KANUN bağını sunucuya yaz (brans_kitaplari.law_id) — 2 Eyl 2026.
 * Bu bağ, branş kitabının altındaki "Talim Yap" düğmesinin HANGİ soru havuzunu açacağını
 * belirler. Yanlış bağ = başka konunun soruları → kural + ELLE liste birlikte kullanılır,
 * şüphede kalan BAĞLANMAZ (o kitapta test düğmesi çıkmaz, sadece "Çalış" olur).
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
  const t = await r.text();
  try { return JSON.parse(t); } catch { return { hata: t }; }
};

/** Kural motorunun bulduğu bağlar. */
const kural = JSON.parse(fs.readFileSync(KOK + 'scratchpad/kitap-kanun-eslesme2.json', 'utf8'));

/**
 * ELLE KARAR — kitap başlığı → kanun id (null = bilerek bağlama).
 * Kural motoru kısaltma/büyük harf yüzünden bulamadıklarını burada elle bağladım;
 * her biri iki adı yan yana koyup teyit edildi.
 */
const ELLE = new Map([
  ['Bilgi ve İletişim Güvenliği Rehberi', 103],
  ['Kodlu/Kriptolu Haberleşme Yapma Usul ve Esasları Yönetmeliği', 100],
  ['TSK, MİT, EGM, Jandarma ve Sahil Güvenlik Taşınır Mal Yönetmeliği', 98],
  ['TSK, Jandarma ve Sahil Güvenlik Sağlık Yeteneği Yönetmeliği (Uçucular)', 104],
  ['657 Sayılı Devlet Memurları Kanunu', 71],
  ['JGK ve SGK Kurum Kimlik Kartı Yönetmeliği', 105],
  ['Tayın Bedeli Kanunu', 81],
  ['Silahlı Kuvvetler İhtiyaç Fazlası Mal ve Hizmetler Kanunu', 83],
  ['TSK, Jandarma ve Sahil Güvenlik Besleme Kanunu', 84],
  ['Cari Yıl Merkezî Yönetim Bütçe Kanunu (H · K · E Cetvelleri)', 113],
  ['Cari Yıl Merkezî Yönetim Bütçe Kanunu (H · K · İ Cetvelleri)', 113],
  ['İç Kontrol ve Ön Malî Kontrole İlişkin Usul ve Esaslar', 117],
  ['Ön Ödeme Usul ve Esasları Hakkında Yönetmelik', 116],
  ['TSK, MİT, EGM, JGK ve SGK Taşınır Mal Yönetmeliği', 124],
  ['Kazandan Beslemesi Olanaksız Erbaş/Erlere Tayın Bedeli Yönetmeliği', 132],
  ['TSK Beslenme Bedellerinin Uygulanmasına Dair Yönetmelik', 130],
  ['TSK, Jandarma Gn.K.lığı ve Sahil Güvenlik K.lığı Besleme Kanunu Uygulama Yönetmeliği', 129],
  // BİLEREK BAĞLANMADI — kitabın kapsamı ile elimizdeki soru havuzunun kapsamı farklı,
  // ya da o mevzuatın branş soru havuzu hiç yok. Yanlış soru göstermektense düğme çıkmasın.
  ['Uzman Erbaş Kanunu (Personel Hükümleri)', null],          // havuz: Mali Hükümler
  ['Uzman Jandarma Kanunu (Personel Hükümleri)', null],       // havuz: Mali Hükümler
  ['TSK Personel Kanunu (Personel Hükümleri)', null],         // havuz: Mali Hükümler
  ['Jandarma Teşkilat, Görev ve Yetkileri Kanunu (Mali Hükümler)', null],
  ["TSK'da İstihdam Edilecek Sözleşmeli Subay ve Astsubaylar Hakkında Kanun (Mali Hükümler)", null],
  ['Taşınmaz Mal Zilyedliğine Yapılan Tecavüzlerin Önlenmesi Hakkında Kanun', null],
  ['Çevre Kanunu', null],
  ['Türk Ceza Kanunu — Mal veya Hizmet Satımından Kaçınma (m.240)', null],
  ['Tasarruf Tedbirleri Genelgesi (2024/7) — Haberleşme Giderleri', null],
]);

// —— sütun ——
const kolon = await sql("select column_name from information_schema.columns where table_name='brans_kitaplari' and column_name='law_id'");
if (!Array.isArray(kolon) || kolon.length === 0) {
  console.log('law_id sütunu ekleniyor…');
  console.log(await sql('alter table brans_kitaplari add column law_id integer'));
} else console.log('law_id sütunu zaten var');

// —— değerler ——
const kitaplar = await sql('select id, brans_slug, baslik from brans_kitaplari order by id');
let yazilan = 0, bos = 0;
const guncellemeler = [];
for (const k of kitaplar) {
  let law = null;
  if (ELLE.has(k.baslik)) law = ELLE.get(k.baslik);
  else law = kural.find((x) => x.kitap === k.id)?.law ?? null;
  if (law) { guncellemeler.push(`(${k.id}, ${law})`); yazilan++; } else bos++;
}
// tek sorguda yaz
const parca = 60;
for (let i = 0; i < guncellemeler.length; i += parca) {
  const dilim = guncellemeler.slice(i, i + parca).join(',');
  const r = await sql(`update brans_kitaplari k set law_id = v.law from (values ${dilim}) as v(id, law) where k.id = v.id`);
  if (r?.hata) { console.log('HATA:', String(r.hata).slice(0, 200)); break; }
}
console.log(`\nbağlanan kitap: ${yazilan} · bağlanmayan: ${bos}`);

// —— doğrulama ——
const ozet = await sql(`
  select brans_slug,
         count(*) as kitap,
         count(law_id) as bagli,
         count(*) - count(law_id) as bagsiz
    from brans_kitaplari group by brans_slug order by brans_slug`);
console.table(ozet);
const cift = await sql('select brans_slug, law_id, count(*) from brans_kitaplari where law_id is not null group by 1,2 having count(*) > 1');
console.log('aynı branşta aynı kanuna bağlı birden çok kitap:', Array.isArray(cift) && cift.length === 0 ? 'YOK ✓' : JSON.stringify(cift));
