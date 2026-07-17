// Kanun indirme boyutu manifesti — assets/kartlar + assets/sesler altındaki her kanun
// klasörünün TOPLAM bayt boyutunu (görsel webp + ses mp3) hesaplayıp
// src/assets/kart-boyutlari.ts'i üretir. İndir ekranında "≈ X MB" göstermek için
// (indirmeden ÖNCE boyut belli olsun → wifi/internet kararı).
// Çalıştır: npm run boyut:uret  (içerik yerleştirme + png-webp sonrası).
import { readdirSync, statSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const root = join(scriptDir, '..');
const outFile = join(root, 'src', 'assets', 'kart-boyutlari.ts');

/** Bir klasördeki (özyinelemeli) tüm dosyaların toplam baytı. */
function klasorBayt(dir) {
  let t = 0;
  for (const ad of readdirSync(dir)) {
    const tam = join(dir, ad);
    const st = statSync(tam);
    if (st.isDirectory()) t += klasorBayt(tam);
    else t += st.size;
  }
  return t;
}

// Her kanun klasörü (slug) için kartlar + sesler toplamı.
const boyut = {}; // slug -> bayt
for (const kok of ['assets/kartlar', 'assets/sesler']) {
  const kokTam = join(root, kok);
  if (!existsSync(kokTam)) continue;
  for (const slug of readdirSync(kokTam)) {
    const dir = join(kokTam, slug);
    if (!statSync(dir).isDirectory()) continue;
    boyut[slug] = (boyut[slug] ?? 0) + klasorBayt(dir);
  }
}

const sirali = Object.keys(boyut).sort();
const govde = sirali.map((s) => `  ${JSON.stringify(s)}: ${boyut[s]},`).join('\n');
const out = `// OTOMATİK ÜRETİLDİ — elle düzenleme. \`npm run boyut:uret\` ile yenile.
// Kanun klasörü (slug) → indirilecek toplam bayt (görsel webp + ses mp3, cihazdaki ham boyut).
// İndir ekranında "≈ X MB" göstergesi için (indirmeden önce boyut kestirimi).

export const KANUN_BOYUT: Record<string, number> = {
${govde}
};
`;
mkdirSync(dirname(outFile), { recursive: true });
writeFileSync(outFile, out, 'utf8');
const toplamMB = (Object.values(boyut).reduce((a, b) => a + b, 0) / 1048576).toFixed(1);
console.log(`${sirali.length} kanun → ${outFile} (toplam ${toplamMB} MB)`);
