// assets/kartlar altındaki tüm .png'leri .webp'e çevirir (q80) ve PNG'yi SİLER.
// (Codegen aynı anahtarda iki dosya görmemeli → PNG silinir. Yedek: git + R2 + Supabase.)
// Çalıştır: node scripts/png-webp.mjs

import sharp from 'sharp';
import { readdirSync, statSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';

const KOK = 'assets/kartlar';
const KALITE = 80;

function pngTopla(dir) {
  const sonuc = [];
  for (const ad of readdirSync(dir)) {
    const tam = join(dir, ad);
    if (statSync(tam).isDirectory()) sonuc.push(...pngTopla(tam));
    else if (/\.png$/i.test(ad)) sonuc.push(tam);
  }
  return sonuc;
}

const pngler = pngTopla(KOK).sort();
console.log(`${pngler.length} PNG → WebP (q${KALITE})...`);

let ok = 0;
let hata = 0;
let oncesi = 0;
let sonrasi = 0;
for (const png of pngler) {
  const webp = png.replace(/\.png$/i, '.webp');
  try {
    oncesi += statSync(png).size;
    await sharp(png).webp({ quality: KALITE }).toFile(webp);
    sonrasi += statSync(webp).size;
    unlinkSync(png);
    ok++;
  } catch (e) {
    hata++;
    console.error(`  HATA ${png}: ${e instanceof Error ? e.message : e}`);
  }
  if (ok % 50 === 0) console.log(`  ${ok}/${pngler.length}`);
}

console.log(
  `\nBitti: ${ok} çevrildi · ${hata} hata · ${(oncesi / 1048576).toFixed(0)}MB → ${(sonrasi / 1048576).toFixed(0)}MB`,
);
