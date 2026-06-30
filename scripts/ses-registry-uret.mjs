// Kart sesi registry üreticisi (görsel sisteminin sesli analoğu).
// assets/sesler/ altını tarar; KART_SES_YOLLARI (manifest) + KART_SES_ANAHTARLARI + KART_SESLERI
// (require map) üretir. Çalıştır: npm run ses:uret
//   GORSEL_MANIFEST_ONLY=1 / --manifest → require map BOŞ (binary pakete girmez, ses sunucudan iner).

import { existsSync, mkdirSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const root = join(scriptDir, '..');
const assetsRoot = join(root, 'assets', 'sesler');
const outFile = join(root, 'src', 'assets', 'kart-sesleri.ts');
const outDir = dirname(outFile);
const manifestOnly = process.env.GORSEL_MANIFEST_ONLY === '1' || process.argv.includes('--manifest');

const UZANTILAR = ['.m4a', '.mp3'];

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

const anahtarlar = new Map(); // key -> { req, yol }
for (const tam of dosyalar) {
  const key = basename(tam).replace(/\.(m4a|mp3)$/i, '');
  let req = relative(outDir, tam).split(sep).join('/');
  if (!req.startsWith('.')) req = './' + req;
  const yol = relative(assetsRoot, tam).split(sep).join('/'); // ör. "tck/tck_m1.mp3"
  if (anahtarlar.has(key)) {
    throw new Error(`Çakışan anahtar: "${key}" (${anahtarlar.get(key).yol} ve ${yol})`);
  }
  anahtarlar.set(key, { req, yol });
}

const giris = [...anahtarlar.entries()];
const yolSatir = giris.map(([key, { yol }]) => `  ${JSON.stringify(key)}: ${JSON.stringify(yol)},`);
const reqSatir = giris.map(([key, { req }]) => `  ${JSON.stringify(key)}: require(${JSON.stringify(req)}),`);

const yolGovde = yolSatir.length ? `\n${yolSatir.join('\n')}\n` : '';
const reqGovde = reqSatir.length ? `\n${reqSatir.join('\n')}\n` : '';

const reqBlok = manifestOnly
  ? `// MANIFEST-ONLY: yerel require map yok (ses sunucudan iner; bkz. lib/ses-kaynak.ts).
export const KART_SESLERI: Record<string, number> = {};`
  : `export const KART_SESLERI: Record<string, number> = {${reqGovde}};`;

const icerik = `// OTOMATİK ÜRETİLDİ — elle düzenleme. \`npm run ses:uret\` ile yenile.
// Kaynak: assets/sesler/ · Anahtar = dosya adının uzantısız hali (ör. tck_m1).
${manifestOnly ? '// (manifest-only: require map boş — uzaktan)\n' : ''}
export const KART_SES_YOLLARI: Record<string, string> = {${yolGovde}};

export const KART_SES_ANAHTARLARI: string[] = Object.keys(KART_SES_YOLLARI);

${reqBlok}
`;

mkdirSync(outDir, { recursive: true });
writeFileSync(outFile, icerik, 'utf8');

console.log(`${anahtarlar.size} ses → ${relative(root, outFile)}${manifestOnly ? ' (MANIFEST-ONLY)' : ''}`);
