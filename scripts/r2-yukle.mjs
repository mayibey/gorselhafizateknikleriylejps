// R2 içerik yükleyici — assets/kartlar/** görsellerini Cloudflare R2 bucket'ına (S3 uyumlu)
// klasör yapısını KORUYARAK yükler. Bucket key = manifest yolu (ör. "tck/tck_m1.webp").
//
// GİZLİLİK: R2 anahtarları REPOYA GİRMEZ — .env'den (gitignore'lu) okunur:
//   R2_ACCESS_KEY_ID=...
//   R2_SECRET_ACCESS_KEY=...
//   R2_ENDPOINT=https://<hesap-id>.r2.cloudflarestorage.com
//   R2_BUCKET=jsps-icerik
//
// Çalıştır (önce TEK kanunla doğrula, sonra tümü):
//   KANUN=tck node scripts/r2-yukle.mjs     # sadece tck/* (hızlı doğrulama)
//   node scripts/r2-yukle.mjs               # TÜM görseller
//   FORCE=1 node scripts/r2-yukle.mjs       # var olanı da üzerine yaz

import { HeadBucketCommand, ListObjectsV2Command, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, relative, sep } from 'node:path';

function envYukle() {
  let metin;
  try {
    metin = readFileSync('.env', 'utf8');
  } catch {
    return;
  }
  for (const satir of metin.split('\n')) {
    const m = satir.match(/^\s*([\w.]+)\s*=\s*(.*?)\s*$/);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}
envYukle();

const { R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_ENDPOINT } = process.env;
const BUCKET = process.env.R2_BUCKET || 'jsps-icerik';
const KANUN = process.env.KANUN || '';
const FORCE = process.env.FORCE === '1';

if (!R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY || !R2_ENDPOINT) {
  console.error('HATA: R2_ACCESS_KEY_ID + R2_SECRET_ACCESS_KEY + R2_ENDPOINT gerekli (.env).');
  process.exit(1);
}

const s3 = new S3Client({
  region: 'auto',
  endpoint: R2_ENDPOINT,
  credentials: { accessKeyId: R2_ACCESS_KEY_ID, secretAccessKey: R2_SECRET_ACCESS_KEY },
});

const KOK = 'assets/kartlar';
const TIP = { '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg' };

function topla(dir) {
  const sonuc = [];
  for (const ad of readdirSync(dir)) {
    const tam = join(dir, ad);
    if (statSync(tam).isDirectory()) sonuc.push(...topla(tam));
    else if (/\.(png|webp|jpe?g)$/i.test(ad)) sonuc.push(tam);
  }
  return sonuc;
}

/** Bucket'ta var olan key'leri çek (devam edilebilirlik için → tekrar yükleme). */
async function mevcutKeyler(prefix) {
  const set = new Set();
  let token;
  do {
    const r = await s3.send(
      new ListObjectsV2Command({ Bucket: BUCKET, Prefix: prefix || undefined, ContinuationToken: token }),
    );
    for (const o of r.Contents ?? []) set.add(o.Key);
    token = r.IsTruncated ? r.NextContinuationToken : undefined;
  } while (token);
  return set;
}

try {
  await s3.send(new HeadBucketCommand({ Bucket: BUCKET }));
} catch (e) {
  console.error(`HATA: bucket'a erişilemedi (${BUCKET}). Anahtar/endpoint/bucket adını kontrol et.`);
  console.error(`  ${e instanceof Error ? e.message : e}`);
  process.exit(1);
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
console.log(`R2 bucket: ${BUCKET} · ${dosyalar.length} dosya · ${toplamMB} MB${KANUN ? ` · filtre: ${KANUN}/*` : ''}${FORCE ? ' · FORCE' : ''}`);

const mevcut = FORCE ? new Set() : await mevcutKeyler(KANUN ? `${KANUN}/` : '');

let ok = 0;
let atla = 0;
let hata = 0;
for (let i = 0; i < dosyalar.length; i++) {
  const { tam, yol } = dosyalar[i];
  if (!FORCE && mevcut.has(yol)) {
    atla++;
  } else {
    try {
      await s3.send(
        new PutObjectCommand({
          Bucket: BUCKET,
          Key: yol,
          Body: readFileSync(tam),
          ContentType: TIP[extname(tam).toLowerCase()] || 'application/octet-stream',
        }),
      );
      ok++;
    } catch (e) {
      hata++;
      console.error(`  HATA ${yol}: ${e instanceof Error ? e.message : e}`);
    }
  }
  if ((i + 1) % 25 === 0 || i === dosyalar.length - 1) {
    console.log(`  ${i + 1}/${dosyalar.length}  (yeni ${ok} · atlandı ${atla} · hata ${hata})`);
  }
}

console.log(`\nBitti: ${ok} yüklendi · ${atla} atlandı (zaten var) · ${hata} hata.`);
