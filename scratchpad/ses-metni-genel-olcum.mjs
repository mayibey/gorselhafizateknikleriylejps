import fs from 'node:fs';
const rapor = JSON.parse(fs.readFileSync('scripts/_icerik_rapor.json', 'utf8'));
const ts = fs.readFileSync('src/assets/kart-ses-metinleri.ts', 'utf8');
const DESEN = new RegExp('^  "([a-z0-9_]+)": ("(?:[^"\\\\]|\\\\.)*"),$', 'gm');
const kayitli = new Map();
for (const m of ts.matchAll(DESEN)) kayitli.set(m[1], JSON.parse(m[2]));

let toplamFark = 0;
const satir = [];
for (const [slug, v] of Object.entries(rapor)) {
  const s = v.ses || {};
  let f = 0, a = 0, y = 0;
  for (const [k, yeni] of Object.entries(s)) {
    if (!kayitli.has(k)) { y++; continue; }
    if (kayitli.get(k) === yeni) { a++; continue; }
    f++;
  }
  if (f || y) satir.push([slug, f, a, y]);
  toplamFark += f;
}
console.log('kanun'.padEnd(16), 'BAYAT', 'AYNI', 'KAYITSIZ');
satir.sort((x, y) => y[1] - x[1]).forEach(([s, f, a, y]) =>
  console.log(s.padEnd(16), String(f).padStart(5), String(a).padStart(4), String(y).padStart(8)));
console.log('TOPLAM BAYAT KAYIT:', toplamFark, '| kayıtlı toplam:', kayitli.size);
