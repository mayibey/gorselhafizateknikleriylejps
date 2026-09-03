/**
 * KEŞİF: sesli anlatımın BAŞINDA söylenen kanun numarası, kartın kanunuyla uyuşuyor mu?
 * (Bünyamin Ak, 3 Eyl 2026: "Ses karmaşa sorunu mevcut başta kanun numarasında")
 * Kod değiştirmez; yalnız ölçer.
 */
import fs from 'node:fs';

const KOK = 'D:/GorselHafizaTeknikleriyleJSPS/';
const seed = fs.readFileSync(KOK + 'src/db/seed.ts', 'utf8');

// klasör → law_id  (KANUN_BILGI bloğu)
const bilgiBas = seed.indexOf('const KANUN_BILGI');
const bilgiSon = seed.indexOf('};', bilgiBas);
const klasorLaw = new Map();
for (const m of seed.slice(bilgiBas, bilgiSon).matchAll(/^\s*([a-z0-9_]+):\s*\{\s*lawId:\s*(\d+)/gm)) {
  klasorLaw.set(m[1], Number(m[2]));
}
// law_id → ad (numara adın başında)
const lawAd = new Map();
for (const m of seed.matchAll(/\{\s*id:\s*(\d+),\s*blok:\s*'[^']+',\s*ad:\s*(?:'([^']+)'|"([^"]+)")/g)) {
  lawAd.set(Number(m[1]), m[2] ?? m[3]);
}
const lawNo = (id) => (lawAd.get(id) ?? '').match(/^(\d{3,4})/)?.[1] ?? null;

// ses metinleri
const ses = fs.readFileSync(KOK + 'src/assets/kart-ses-metinleri.ts', 'utf8');
const kayitlar = [...ses.matchAll(/"([a-z0-9_]+)":\s*"((?:[^"\\]|\\.)*)"/g)];
console.log(`ses metni: ${kayitlar.length} · klasör-kanun eşlemesi: ${klasorLaw.size}`);

let bakilan = 0, uyumsuz = 0, noYok = 0;
const bulgular = [];
for (const [, anahtar, ham] of kayitlar) {
  const klasor = anahtar.replace(/_m\d+.*$/, '').replace(/_ozet.*$/, '');
  const id = klasorLaw.get(klasor);
  if (!id) continue;
  const beklenen = lawNo(id);
  if (!beklenen) continue;
  const bas = ham.slice(0, 260).replace(/\\n/g, ' ');
  const gecen = [...bas.matchAll(/\b(\d{3,4})\s*say[ıi]l[ıi]/gi)].map((m) => m[1]);
  bakilan++;
  if (!gecen.length) { noYok++; continue; }
  if (!gecen.includes(beklenen)) {
    uyumsuz++;
    bulgular.push({ anahtar, beklenen, gecen: [...new Set(gecen)].join(','), bas: bas.slice(0, 150) });
  }
}
console.log(`\nbaşta kanun no söyleyen: ${bakilan - noYok} · söylemeyen: ${noYok}`);
console.log(`UYUMSUZ (kartın kanunu ≠ seste söylenen): ${uyumsuz}\n`);
for (const b of bulgular.slice(0, 25)) {
  console.log(`✗ ${b.anahtar}  beklenen ${b.beklenen} · seste ${b.gecen}`);
  console.log(`   "${b.bas}…"`);
}
if (bulgular.length > 25) console.log(`… ve ${bulgular.length - 25} tane daha`);
fs.writeFileSync(KOK + 'scratchpad/ses-kanun-uyumsuz.json', JSON.stringify(bulgular, null, 1), 'utf8');
