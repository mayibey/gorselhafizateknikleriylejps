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
    else if (/\.(png|webp)$/i.test(ad)) sonuc.push(tam);
  }
  return sonuc;
}

const dosyalar = pngTopla(assetsRoot).sort();

// Gömülü binary'leri pakete dahil etmeden SADECE manifest+anahtar üretmek için:
//   GORSEL_MANIFEST_ONLY=1 npm run gorsel:uret
// (sunucuya taşıma fazında app boyutunu ~MB'lere indirmek için; require map atlanır.)
const manifestOnly = process.env.GORSEL_MANIFEST_ONLY === '1' || process.argv.includes('--manifest');

const anahtarlar = new Map(); // key -> { req: outDir'e göre require yolu, yol: icerik-göreli yol (uzantılı) }
for (const tam of dosyalar) {
  const key = basename(tam).replace(/\.(png|webp)$/i, '');
  let req = relative(outDir, tam).split(sep).join('/');
  if (!req.startsWith('.')) req = './' + req;
  const yol = relative(assetsRoot, tam).split(sep).join('/'); // ör. "ailekoruma/ailekoruma_m1_1.png"
  if (anahtarlar.has(key)) {
    throw new Error(`Çakışan anahtar: "${key}" (${anahtarlar.get(key).yol} ve ${yol})`);
  }
  anahtarlar.set(key, { req, yol });
}

const giris = [...anahtarlar.entries()];
const yolSatir = giris.map(([key, { yol }]) => `  ${JSON.stringify(key)}: ${JSON.stringify(yol)},`);
const reqSatir = giris.map(([key, { req }]) => `  ${JSON.stringify(key)}: require(${JSON.stringify(req)}),`);

// KART_GORSEL_YOLLARI: anahtar → içerik-göreli yol (uzantılı). Uzak URL = ICERIK_TABANI + '/' + yol.
// KART_ANAHTARLARI: seed.ts ŞEMAYI bundan türetir → binary kaldırılsa bile gömülü kalır (B1).
// KART_GORSELLERI: yerel require map (manifestOnly modda ÜRETİLMEZ; pakete binary girmez).
const yolBlok = `export const KART_GORSEL_YOLLARI: Record<string, string> = {
${yolSatir.join('\n')}
};

export const KART_ANAHTARLARI: string[] = Object.keys(KART_GORSEL_YOLLARI);`;

const reqBlok = manifestOnly
  ? `// MANIFEST-ONLY modda üretildi: yerel require map yok (binary pakete girmez).
// Görseller ICERIK_TABANI üzerinden uzaktan çekilir (bkz. lib/gorsel-kaynak.ts).
export const KART_GORSELLERI: Record<string, ImageRequireSource> = {};`
  : `export const KART_GORSELLERI: Record<string, ImageRequireSource> = {
${reqSatir.join('\n')}
};`;

const icerik = `// OTOMATİK ÜRETİLDİ — elle düzenleme. \`npm run gorsel:uret\` ile yenile.
// Kaynak: assets/kartlar/ · Anahtar = dosya adının uzantısız hali (ör. tck_m1).
${manifestOnly ? '// (manifest-only: require map boş — uzaktan yükleme)\n' : ''}
import type { ImageRequireSource } from 'react-native';

${yolBlok}

${reqBlok}
`;

mkdirSync(outDir, { recursive: true });
writeFileSync(outFile, icerik, 'utf8');

console.log(
  `${anahtarlar.size} görsel → ${relative(root, outFile)}${manifestOnly ? ' (MANIFEST-ONLY)' : ''}`,
);
