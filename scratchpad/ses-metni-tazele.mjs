/**
 * kart-ses-metinleri.ts içindeki BAYAT kayıtları tazeler — YALNIZ verilen kanunlar.
 * Satır satır, birebir eşleşen anahtarın değerini değiştirir; dosyanın geri kalanına
 * (sıra, biçim, diğer kanunlar) DOKUNMAZ.
 *   node scratchpad/ses-metni-tazele.mjs            → kuru prova
 *   node scratchpad/ses-metni-tazele.mjs --yaz      → yazar
 */
import fs from 'node:fs';

const SLUGLAR = ['jandteskyon', 'bilgiedinme', 'tebligat', 'kvkk', 'izinyon'];
const DOSYA = 'src/assets/kart-ses-metinleri.ts';

const rapor = JSON.parse(fs.readFileSync('scripts/_icerik_rapor.json', 'utf8'));
const yeniMetin = new Map();
for (const slug of SLUGLAR) {
  for (const [k, v] of Object.entries(rapor[slug]?.ses || {})) yeniMetin.set(k, v);
}

const satirlar = fs.readFileSync(DOSYA, 'utf8').split('\n');
const DESEN = new RegExp('^  "([a-z0-9_]+)": ("(?:[^"\\\\]|\\\\.)*"),$');
let degisen = 0;
const yeniSatirlar = satirlar.map((s) => {
  const m = s.match(DESEN);
  if (!m) return s;
  const yeni = yeniMetin.get(m[1]);
  if (yeni === undefined) return s;
  if (JSON.parse(m[2]) === yeni) return s;
  degisen++;
  return `  ${JSON.stringify(m[1])}: ${JSON.stringify(yeni)},`;
});

console.log('değişen kayıt:', degisen, '| toplam satır:', satirlar.length, '->', yeniSatirlar.length);
if (satirlar.length !== yeniSatirlar.length) throw new Error('satır sayısı değişti — DURDURULDU');
if (!process.argv.includes('--yaz')) { console.log('(KURU PROVA)'); process.exit(0); }
fs.writeFileSync(DOSYA, yeniSatirlar.join('\n'), 'utf8');
console.log('YAZILDI');
