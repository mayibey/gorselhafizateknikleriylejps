// Branş PDF özet kitaplarını private 'icerik' bucket'ına (pdf/{brans_slug}/...) yükler +
// brans_kitaplari tablosunu doldurur. Görsel/ses ile AYNI güvenlik (private bucket + imzalı URL;
// app indirince cihazda AES şifreler). service_role .env'den okunur (repoya girmez).
//
// Çalıştır:  node scripts/brans-kitap-yukle.mjs
//            BRANS=mebs node scripts/brans-kitap-yukle.mjs   # tek branş (doğrulama)
//            FORCE=1 node scripts/brans-kitap-yukle.mjs      # üzerine yaz

import { createClient } from '@supabase/supabase-js';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

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
const BUCKET = process.env.ICERIK_BUCKET || 'icerik';
const KOK = 'D:/JSPS Fabrika/kaynaklar/astsubay/KANUN_MASTER_DOSYALARI/BRANS_DIGER/_OZET_KITAPLAR';
const TEK = (process.env.BRANS || '').toLowerCase();
const FORCE = process.env.FORCE === '1';
if (!URL || !KEY) { console.error('HATA: SUPABASE_URL + SUPABASE_SERVICE_KEY gerekli.'); process.exit(1); }

const sb = createClient(URL, KEY, { auth: { persistSession: false } });

// DÜZGÜN Türkçe başlık kaynağı: BRANS_DIGER/*/_ozet_meta.json baslik'i (build.py bunu ASCII'ye
// çevirip kırparak dosya adını üretmiş). Aynı algoritmayla dosya adı → meta.baslik haritası kur.
const BRANS_DIGER = 'D:/JSPS Fabrika/kaynaklar/astsubay/KANUN_MASTER_DOSYALARI/BRANS_DIGER';
const TR_FROM = 'şçğıöüŞÇĞİÖÜ', TR_TO = 'scgiouSCGIOU';
const translit = (s) => { let o = ''; for (const ch of s) { const i = TR_FROM.indexOf(ch); o += i >= 0 ? TR_TO[i] : ch; } return o; };
function fnameYap(meta) {
  const no = String(meta.no ?? '').trim() || 'Y';
  const slug = translit(String(meta.baslik ?? 'mevzuat')).replace(/[^A-Za-z0-9]+/g, '_').slice(0, 48).replace(/^_+|_+$/g, '');
  return `${no}_${slug}.pdf`;
}
const FNAME_BASLIK = new Map();
try {
  for (const d of readdirSync(BRANS_DIGER)) {
    const mf = join(BRANS_DIGER, d, '_ozet_meta.json');
    let meta; try { meta = JSON.parse(readFileSync(mf, 'utf8')); } catch { continue; }
    FNAME_BASLIK.set(fnameYap(meta), meta.baslik);
  }
} catch { /* kaynak yoksa fallback baslikYap kullanılır */ }

// Düzgün başlık meta'dan; yoksa dosya adından kaba türet (fallback).
function baslikYap(ad) {
  const dogru = FNAME_BASLIK.get(ad);
  if (dogru) return dogru;
  let t = ad.replace(/\.pdf$/i, '').replace(/_/g, ' ').trim();
  t = t.replace(/^(\d+)\s+\1\b/, '$1'); // "5809 5809 Sayili" → "5809 Sayili"
  return t.replace(/\s+/g, ' ').trim();
}

// Branş klasörleri (alt çizgi/başlık dışı klasörleri atla). slug = klasör.toLowerCase().
const klasorler = readdirSync(KOK).filter((d) => {
  if (d.startsWith('_') || d.startsWith('.')) return false;
  try { return statSync(join(KOK, d)).isDirectory(); } catch { return false; }
});

let toplam = 0, yuklendi = 0, atlandi = 0, hata = 0, kayit = 0;
for (const klasor of klasorler) {
  const slug = klasor.toLowerCase();
  if (TEK && slug !== TEK) continue;
  const pdfler = readdirSync(join(KOK, klasor)).filter((f) => /\.pdf$/i.test(f)).sort();
  let sira = 0;
  for (const dosya of pdfler) {
    toplam++;
    sira++;
    const tam = join(KOK, klasor, dosya);
    const yol = `pdf/${slug}/${dosya}`;
    const veri = readFileSync(tam);
    const { error: uHata } = await sb.storage.from(BUCKET).upload(yol, veri, {
      contentType: 'application/pdf', upsert: FORCE,
    });
    if (uHata && !/exists|duplicate/i.test(uHata.message)) { hata++; console.error(`  YUK HATA ${yol}: ${uHata.message}`); continue; }
    if (uHata) atlandi++; else yuklendi++;
    // Liste kaydı (idempotent: dosya_yolu unique).
    const { error: dHata } = await sb.from('brans_kitaplari')
      .upsert({ brans_slug: slug, baslik: baslikYap(dosya), dosya_yolu: yol, sira }, { onConflict: 'dosya_yolu' });
    if (dHata) { hata++; console.error(`  DB HATA ${yol}: ${dHata.message}`); } else kayit++;
  }
  console.log(`  [${slug}] ${pdfler.length} kitap işlendi`);
}
console.log(`\nBitti: ${toplam} PDF · yüklendi ${yuklendi} · atlandı ${atlandi} · DB kayıt ${kayit} · hata ${hata}`);
