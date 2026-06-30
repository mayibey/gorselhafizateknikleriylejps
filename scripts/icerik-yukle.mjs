// İçerik yükleyici — assets/kartlar/** görsellerini bir Storage bucket'ına (Supabase veya
// S3-uyumlu) klasör yapısını KORUYARAK yükler. Bucket yolu = manifest yolu (KART_GORSEL_YOLLARI),
// ör. "tck/tck_m1.png" → app uzaktan `${ICERIK_TABANI}/tck/tck_m1.png` ile çeker.
//
// GİZLİLİK: service_role key REPOYA GİRMEZ. .env'den (gitignore'lu) veya ortamdan okunur.
//   .env'e ekle (EXPO_PUBLIC_ ÖNEKSİZ → app'e gömülmez):
//     SUPABASE_SERVICE_KEY=eyJ...   (Supabase → Project Settings → API → service_role, secret)
//
// Çalıştır (önce TEK kanunla doğrula, sonra tümü):
//   KANUN=tck node scripts/icerik-yukle.mjs        # sadece tck/* yükler (doğrulama)
//   node scripts/icerik-yukle.mjs                  # TÜM kartlar
//   FORCE=1 node scripts/icerik-yukle.mjs          # var olanları da üzerine yaz
// Bucket adı varsayılan "icerik"; değiştirmek için ICERIK_BUCKET=...

import { createClient } from '@supabase/supabase-js';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, relative, sep } from 'node:path';

// --- .env'i elle oku (dotenv yok; EXPO_PUBLIC_ öneksiz değerler de gelsin) ---
function envYukle() {
  let metin;
  try {
    metin = readFileSync('.env', 'utf8');
  } catch {
    return;
  }
  for (const satir of metin.split('\n')) {
    const m = satir.match(/^\s*([\w.]+)\s*=\s*(.*?)\s*$/);
    if (m && process.env[m[1]] === undefined) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  }
}
envYukle();

const URL = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
const BUCKET = process.env.ICERIK_BUCKET || 'icerik';
const KANUN = process.env.KANUN || ''; // önek filtresi (ör. "tck") — boşsa tümü
const FORCE = process.env.FORCE === '1';

if (!URL || !KEY) {
  console.error('HATA: SUPABASE_URL + SUPABASE_SERVICE_KEY gerekli (.env veya ortam değişkeni).');
  console.error('  .env örn: SUPABASE_SERVICE_KEY=eyJ...  (service_role, EXPO_PUBLIC_ öneksiz)');
  process.exit(1);
}

const supabase = createClient(URL, KEY, { auth: { persistSession: false } });

// Varsayılan görseller; ICERIK_KOK=assets/sesler ile sesleri yükle.
const KOK = process.env.ICERIK_KOK || 'assets/kartlar';
const TIP = {
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.mp3': 'audio/mpeg',
  '.m4a': 'audio/mp4',
};

function topla(dir) {
  const sonuc = [];
  for (const ad of readdirSync(dir)) {
    const tam = join(dir, ad);
    if (statSync(tam).isDirectory()) sonuc.push(...topla(tam));
    else if (/\.(png|webp|jpe?g|mp3|m4a)$/i.test(ad)) sonuc.push(tam);
  }
  return sonuc;
}

let dosyalar = topla(KOK)
  .map((tam) => ({ tam, yol: relative(KOK, tam).split(sep).join('/') }))
  .sort((a, b) => a.yol.localeCompare(b.yol));

if (KANUN) dosyalar = dosyalar.filter((d) => d.yol.startsWith(`${KANUN}/`));

if (dosyalar.length === 0) {
  console.error(`Yüklenecek dosya yok (KANUN="${KANUN}").`);
  process.exit(1);
}

const toplamMB = (dosyalar.reduce((t, d) => t + statSync(d.tam).size, 0) / 1048576).toFixed(1);
console.log(`Bucket: ${BUCKET} · ${dosyalar.length} dosya · ${toplamMB} MB${KANUN ? ` · filtre: ${KANUN}/*` : ''}${FORCE ? ' · FORCE' : ''}`);

let ok = 0;
let atla = 0;
let hata = 0;
for (let i = 0; i < dosyalar.length; i++) {
  const { tam, yol } = dosyalar[i];
  const veri = readFileSync(tam);
  const { error } = await supabase.storage.from(BUCKET).upload(yol, veri, {
    contentType: TIP[extname(tam).toLowerCase()] || 'application/octet-stream',
    upsert: FORCE,
  });
  if (error) {
    if (!FORCE && /exists|duplicate/i.test(error.message)) {
      atla++;
    } else {
      hata++;
      console.error(`  HATA ${yol}: ${error.message}`);
    }
  } else {
    ok++;
  }
  if ((i + 1) % 25 === 0 || i === dosyalar.length - 1) {
    console.log(`  ${i + 1}/${dosyalar.length}  (yeni ${ok} · atlandı ${atla} · hata ${hata})`);
  }
}

console.log(`\nBitti: ${ok} yüklendi · ${atla} atlandı (zaten var) · ${hata} hata.`);
console.log(`Genel erişim tabanı (ICERIK_TABANI):`);
console.log(`  ${URL}/storage/v1/object/public/${BUCKET}`);
