// Kart sesi registry üreticisi (görsel sisteminin sesli analoğu).
// assets/sesler/ altını tarar, her .m4a/.mp3 için literal require üreten
// src/assets/kart-sesleri.ts dosyasını OTOMATİK yazar.
// Çalıştır: npm run ses:uret
//
// Metro dinamik require'ı (require(degisken)) çözmez; bu yüzden sesler de
// görseller gibi bu script ile statik require'a dökülür.
// Şu an 0 ses dosyası var → BOŞ registry üretir (assets/sesler/ yoksa da güvenli).

import { existsSync, readdirSync, statSync, mkdirSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const root = join(scriptDir, '..');
const assetsRoot = join(root, 'assets', 'sesler');
const outFile = join(root, 'src', 'assets', 'kart-sesleri.ts');
const outDir = dirname(outFile);

const UZANTILAR = ['.m4a', '.mp3'];

/** Klasörü özyinelemeli tarayıp tüm ses yollarını döndürür (klasör yoksa boş). */
function sesTopla(dir) {
  if (!existsSync(dir)) return [];
  const sonuc = [];
  for (const ad of readdirSync(dir)) {
    const tam = join(dir, ad);
    if (statSync(tam).isDirectory()) sonuc.push(...sesTopla(tam));
    else if (UZANTILAR.some((u) => ad.toLowerCase().endsWith(u))) sonuc.push(tam);
  }
  return sonuc;
}

const dosyalar = sesTopla(assetsRoot).sort();

const anahtarlar = new Map(); // key -> rel path (çakışma tespiti için)
for (const tam of dosyalar) {
  const key = basename(tam).replace(/\.(m4a|mp3)$/i, '');
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

const govde = satirlar.length ? `\n${satirlar.join('\n')}\n` : '';
const icerik = `// OTOMATİK ÜRETİLDİ — elle düzenleme. \`npm run ses:uret\` ile yenile.
// Kaynak: assets/sesler/ · Anahtar = dosya adının uzantısız hali (ör. tck_m1).
// Değer = require'lı ses kaynağı (Metro asset id, number). Şu an boş olabilir.

export const KART_SESLERI: Record<string, number> = {${govde}};
`;

mkdirSync(outDir, { recursive: true });
writeFileSync(outFile, icerik, 'utf8');

console.log(`${anahtarlar.size} ses → ${relative(root, outFile)}`);
