// brans_kitaplari.baslik değerlerini _ozet_meta.json'daki DÜZGÜN Türkçe başlıklarla düzeltir.
// Eşleştirme: dosya_yolu (pdf/{slug}/{dosyaAdi}) → dosyaAdi → build.py fname üretimiyle meta.baslik.
// service_role .env'den. KURU çalıştırma: DRY=1 node scripts/brans-baslik-duzelt.mjs
import { createClient } from '@supabase/supabase-js';
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

function envYukle() {
  let metin; try { metin = readFileSync('.env', 'utf8'); } catch { return; }
  for (const satir of metin.split('\n')) {
    const m = satir.match(/^\s*([\w.]+)\s*=\s*(.*?)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}
envYukle();
const URL = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const DRY = process.env.DRY === '1';
if (!URL || !KEY) { console.error('HATA: SUPABASE_URL + SUPABASE_SERVICE_KEY gerekli.'); process.exit(1); }
const sb = createClient(URL, KEY, { auth: { persistSession: false } });

const BRANS_DIGER = 'D:/JSPS Fabrika/kaynaklar/astsubay/KANUN_MASTER_DOSYALARI/BRANS_DIGER';
const TR_FROM = 'şçğıöüŞÇĞİÖÜ', TR_TO = 'scgiouSCGIOU';
const translit = (s) => { let o = ''; for (const ch of s) { const i = TR_FROM.indexOf(ch); o += i >= 0 ? TR_TO[i] : ch; } return o; };
function fnameYap(meta) {
  const no = String(meta.no ?? '').trim() || 'Y';
  const slug = translit(String(meta.baslik ?? 'mevzuat')).replace(/[^A-Za-z0-9]+/g, '_').slice(0, 48).replace(/^_+|_+$/g, '');
  return `${no}_${slug}.pdf`;
}
const fnameBaslik = new Map();
for (const d of readdirSync(BRANS_DIGER)) {
  const mf = join(BRANS_DIGER, d, '_ozet_meta.json');
  if (!existsSync(mf)) continue;
  let meta; try { meta = JSON.parse(readFileSync(mf, 'utf8')); } catch { continue; }
  fnameBaslik.set(fnameYap(meta), meta.baslik);
}

const { data: rows, error } = await sb.from('brans_kitaplari').select('id, brans_slug, baslik, dosya_yolu');
if (error) { console.error('DB oku hatası:', error.message); process.exit(1); }
console.log(`Toplam kayıt: ${rows.length}${DRY ? '  (KURU ÇALIŞTIRMA)' : ''}\n`);

let degisti = 0, ayni = 0, karsiliksiz = 0;
for (const r of rows) {
  const dosyaAdi = r.dosya_yolu.split('/').pop();
  const dogru = fnameBaslik.get(dosyaAdi);
  if (!dogru) { karsiliksiz++; console.log(`  ! KARŞILIK YOK: ${r.dosya_yolu}`); continue; }
  if (dogru === r.baslik) { ayni++; continue; }
  console.log(`  [${r.brans_slug}] "${r.baslik}"\n        → "${dogru}"`);
  if (!DRY) {
    const { error: uHata } = await sb.from('brans_kitaplari').update({ baslik: dogru }).eq('id', r.id);
    if (uHata) { console.error(`     GÜNCELLE HATA: ${uHata.message}`); continue; }
  }
  degisti++;
}
console.log(`\nBitti: değişen ${degisti} · zaten doğru ${ayni} · karşılıksız ${karsiliksiz}`);
