// SEED_KAPSAM (uygulamanın kendi sınav kapsamı: law_id -> madde etiketleri) -> JSON
import fs from 'node:fs';
const s = fs.readFileSync('src/db/seed.ts', 'utf8');
// SEED_KAPSAM once bir nesne olarak tanimlaniyor, sonra Object.assign(...) ile iki kez daha
// genisletiliyor. Yalniz ilkini okursak branş kanunları (26-67) eksik kalıyor.
const bloklar = [];
const ilk = s.indexOf('export const SEED_KAPSAM');
bloklar.push(s.slice(s.indexOf('{', ilk)));
let a = 0;
while ((a = s.indexOf('Object.assign(SEED_KAPSAM', a + 1)) !== -1) bloklar.push(s.slice(s.indexOf('{', a)));
const tam = (n, o = {}) => {
  const mulga = new Set(o.mulga ?? []); const r = [];
  for (let i = 1; i <= n; i++) if (!mulga.has(i)) r.push(String(i));
  for (const k of o.ek ?? []) r.push(`Ek ${k}`);
  for (const k of o.gecici ?? []) r.push('Geçici ' + k);
  return r;
};
const nesne = {};
for (const g of bloklar) {
  const kes = g.indexOf(String.fromCharCode(10) + '}');
  Object.assign(nesne, new Function('tam', 'return ' + g.slice(0, kes + 2))(tam));
}

const adRx = new RegExp("\\{\\s*id:\\s*(\\d+)\\s*,\\s*blok:\\s*'([^']*)'\\s*,\\s*ad:\\s*'((?:[^'\\\\]|\\\\.)*)'", 'g');
const ad = {};
for (const m of s.matchAll(adRx)) ad[m[1]] = { blok: m[2], ad: m[3].split("\\'").join("'") };

const cikti = {};
for (const [k, v] of Object.entries(nesne)) cikti[k] = { ad: ad[k]?.ad ?? null, blok: ad[k]?.blok ?? null, maddeler: v };
fs.writeFileSync(process.argv[2], JSON.stringify(cikti, null, 1));
const brans = Object.entries(cikti).filter(([, v]) => v.blok === 'branş');
console.log('SEED_KAPSAM kanun sayisi:', Object.keys(cikti).length);
console.log('bransta:', brans.length, '· toplam madde:', brans.reduce((t, [, v]) => t + v.maddeler.length, 0));
for (const [k, v] of brans) console.log(`   ${String(k).padStart(3)} ${String(v.ad).slice(0, 52).padEnd(54)} ${v.maddeler.length}`);
