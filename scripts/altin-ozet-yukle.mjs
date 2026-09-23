// ALTIN ÖZET kitabını sunucuya yükler (private 'icerik' bucket, pdf/<slug>/...) ve
// brans_kitaplari'na EN ÜST SIRA (sira=0) olarak yazar. Aynı dosya birden çok branşa
// bağlanabilir (unique = brans_slug + dosya_yolu; 23 Eyl 2026'da genişletildi).
//
// Müşterek kitap: her branşın listesine + 'musterek' sanal branşına (Karargâh şeridi buradan okur).
//   node scripts/altin-ozet-yukle.mjs --dosya "C:/.../ALTIN OZET (MUSTEREK).pdf" --musterek
// Branş kitabı: yalnız o branşa, sira=0 (müşterek sira=-1'e çekilir ki önce müşterek görünsün).
//   node scripts/altin-ozet-yukle.mjs --dosya "C:/.../ALTIN OZET (Jandarma).pdf" --brans jandarma
// Fontlar alt-kümelenip sıkıştırılır (PyMuPDF): 8.8 MB → ~7.3 MB. FORCE=1 → üzerine yazar.

import { createClient } from '@supabase/supabase-js';
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

function envYukle() {
  let metin;
  try { metin = readFileSync('.env', 'utf8'); } catch { return; }
  for (const satir of metin.split('\n')) {
    const m = satir.match(/^\s*([\w.]+)\s*=\s*(.*?)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}
envYukle();
const URL = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!URL || !KEY) { console.error('HATA: SUPABASE_URL + SUPABASE_SERVICE_KEY gerekli.'); process.exit(1); }
const BUCKET = process.env.ICERIK_BUCKET || 'icerik';
const FORCE = process.env.FORCE === '1';

const arg = (ad) => { const i = process.argv.indexOf(ad); return i >= 0 ? process.argv[i + 1] : undefined; };
const DOSYA = arg('--dosya');
const BRANS = (arg('--brans') || '').toLowerCase();
const MUSTEREK = process.argv.includes('--musterek');
if (BRANS === 'jandarma') { console.error('jandarma branşına liste satırı yazılmaz (kanun kartlarını gizler); Karargâh yolu ayrı.'); process.exit(1); }
if (!DOSYA || !existsSync(DOSYA) || (!BRANS && !MUSTEREK)) {
  console.error('Kullanım: --dosya <pdf> (--musterek | --brans <slug>)'); process.exit(1);
}

// Uygulamadaki 16 branş (seed.ts ile aynı). 'jandarma'ya SATIR YAZILMAZ: branş sekmesi kitap listesi
// görünce kanun kartlarını gizliyor (23 Eyl'de bir kez yazıldı, hemen silindi). Jandarma ve uzman erbaş
// kitabı Karargâh şeridinden alır ('musterek' sanal satırı; jandarma branş kitabı da 'jandarma_kitap' gibi
// sanal bir satırla verilecek, listeye DEĞİL).
const BRANSLAR = ['jandarma', 'mebs', 'havacilik', 'personel', 'maliye', 'istihkam', 'ikmal', 'bakim', 'bando',
  'tabip', 'dis_tabibi', 'eczaci', 'saglik', 'kimyager', 'veteriner', 'muhendis'];
const BASLIK_MUSTEREK = 'Altın Özet — Müşterek Mevzuat (2026)';
const BASLIK_BRANS = (s) => `Altın Özet — ${{ mebs: 'MEBS', havacilik: 'Havacılık', personel: 'Personel', maliye: 'Maliye', istihkam: 'İstihkam', ikmal: 'İkmal', bakim: 'Bakım', bando: 'Bando', tabip: 'Tabip', dis_tabibi: 'Diş Tabibi', eczaci: 'Eczacı', saglik: 'Sağlık', kimyager: 'Kimyager', veteriner: 'Veteriner', muhendis: 'Mühendis', jandarma: 'Jandarma' }[s] ?? s} Branşı (2026)`;

// 1) Küçült (font alt-küme + deflate). Python+PyMuPDF yoksa orijinal yüklenir.
let veri;
try {
  const kucuk = join(tmpdir(), 'altin-ozet-kucuk.pdf');
  execFileSync('python', ['-c', `import fitz,sys\nd=fitz.open(sys.argv[1]); d.subset_fonts(); d.save(sys.argv[2], garbage=4, deflate=True, clean=True)`, DOSYA, kucuk], { stdio: 'inherit' });
  veri = readFileSync(kucuk);
  console.log(`küçültüldü: ${(readFileSync(DOSYA).length / 1048576).toFixed(1)} MB → ${(veri.length / 1048576).toFixed(1)} MB`);
} catch (e) {
  console.warn('küçültme atlandı:', e.message);
  veri = readFileSync(DOSYA);
}

const sb = createClient(URL, KEY, { auth: { persistSession: false } });
const slug = MUSTEREK ? 'musterek' : BRANS;
const yol = MUSTEREK ? 'pdf/musterek/JSPS-2026-Altin-Ozet-Musterek.pdf' : `pdf/${slug}/JSPS-2026-Altin-Ozet-${slug}.pdf`;

// 2) Yükle (private bucket; app imzalı URL + üyelik kapısıyla indirir).
const { error: uHata } = await sb.storage.from(BUCKET).upload(yol, veri, { contentType: 'application/pdf', upsert: FORCE });
if (uHata && !/exists|duplicate/i.test(uHata.message)) { console.error('YÜKLEME HATASI:', uHata.message); process.exit(1); }
console.log(uHata ? `dosya zaten vardı (FORCE=1 ile üzerine yaz): ${yol}` : `yüklendi: ${yol}`);

// 3) Liste satırları.
const satirlar = MUSTEREK
  ? ['musterek', ...BRANSLAR.filter((s) => s !== 'jandarma')].map((s) => ({ brans_slug: s, baslik: BASLIK_MUSTEREK, dosya_yolu: yol, sira: 0, law_id: null }))
  : [{ brans_slug: slug, baslik: BASLIK_BRANS(slug), dosya_yolu: yol, sira: 0, law_id: null }];
const { error: dHata } = await sb.from('brans_kitaplari').upsert(satirlar, { onConflict: 'brans_slug,dosya_yolu' });
if (dHata) { console.error('DB HATASI:', dHata.message); process.exit(1); }
// Branş kitabı geldiyse o branşın müşterek satırı -1'e çekilir → liste: Müşterek, Branş, sonra diğer konular.
if (!MUSTEREK) {
  await sb.from('brans_kitaplari').update({ sira: -1 }).eq('brans_slug', slug).like('dosya_yolu', 'pdf/musterek/%');
}
// 4) Ölç: kaç satır oldu?
const { data: kontrol } = await sb.from('brans_kitaplari').select('brans_slug, sira').eq('dosya_yolu', yol);
console.log(`brans_kitaplari: ${kontrol?.length ?? 0} satır → ${(kontrol ?? []).map((r) => r.brans_slug).join(', ')}`);
