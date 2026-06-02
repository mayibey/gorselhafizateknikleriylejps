// Kart görseli registry üreticisi.
// assets/kartlar/ altını tarar, her .png için literal require üreten
// src/assets/kart-gorselleri.ts dosyasını OTOMATİK yazar.
// Çalıştır: npm run gorsel:uret
//
// Metro dinamik require'ı (require(degisken)) çözmez; bu yüzden 1100 karta
// ölçeklenirken bu dosya elle değil, bu script ile üretilir.

import { readdirSync, statSync, mkdirSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const root = join(scriptDir, '..');
const assetsRoot = join(root, 'assets', 'kartlar');
const outFile = join(root, 'src', 'assets', 'kart-gorselleri.ts');
const outDir = dirname(outFile);

/** Klasörü özyinelemeli tarayıp tüm .png yollarını döndürür. */
function pngTopla(dir) {
  const sonuc = [];
  for (const ad of readdirSync(dir)) {
    const tam = join(dir, ad);
    if (statSync(tam).isDirectory()) sonuc.push(...pngTopla(tam));
    else if (ad.toLowerCase().endsWith('.png')) sonuc.push(tam);
  }
  return sonuc;
}

const dosyalar = pngTopla(assetsRoot).sort();

const anahtarlar = new Map(); // key -> rel path (çakışma tespiti için)
for (const tam of dosyalar) {
  const key = basename(tam).replace(/\.png$/i, '');
  let rel = relative(outDir, tam).split(sep).join('/');
  if (!rel.startsWith('.')) rel = './' + rel;
  if (anahtarlar.has(key)) {
    throw new Error(`Çakışan anahtar: "${key}" (${anahtarlar.get(key)} ve ${rel})`);
  }
  anahtarlar.set(key, rel);
}

const satirlar = [...anahtarlar.entries()].map(
  ([key, rel]) => `  ${JSON.stringify(key)}: require(${JSON.stringify(rel)}),`,
);

const icerik = `// OTOMATİK ÜRETİLDİ — elle düzenleme. \`npm run gorsel:uret\` ile yenile.
// Kaynak: assets/kartlar/ · Anahtar = dosya adının uzantısız hali (ör. tck_m1).

import type { ImageRequireSource } from 'react-native';

export const KART_GORSELLERI: Record<string, ImageRequireSource> = {
${satirlar.join('\n')}
};
`;

mkdirSync(outDir, { recursive: true });
writeFileSync(outFile, icerik, 'utf8');

console.log(`${anahtarlar.size} görsel → ${relative(root, outFile)}`);
