import fs from 'node:fs';
const h = fs.readFileSync('assets/oyun/oyun-merkezi.html', 'utf8');
const TERS = String.fromCharCode(92);
function ustSeviyeSay(govde) {
  let d = 0, n = 0, tirnak = null;
  for (let i = 1; i < govde.length; i++) {
    const c = govde[i], o = govde[i - 1];
    if (tirnak) { if (c === tirnak && o !== TERS) tirnak = null; continue; }
    if (c === '"' || c === "'" || c === '`') { tirnak = c; continue; }
    if (c === '{') { if (d === 0) n++; d++; }
    else if (c === '}') d--;
    else if (c === '[') d++;
    else if (c === ']') d--;
  }
  return n;
}
const m = [...h.matchAll(/(?:const|let|var)\s+([A-Za-z_][A-Za-z0-9_]*)\s*=\s*\[|([A-Za-z_][A-Za-z0-9_]*)\s*:\s*\[/g)];
const tekil = new Map();
for (const x of m) {
  const ad = x[1] || x[2];
  const bas = x.index + x[0].length - 1;
  let d = 0, i = bas;
  for (; i < h.length; i++) { const c = h[i]; if (c === '[') d++; else if (c === ']') { d--; if (d === 0) break; } }
  if (i - bas < 2000) continue;
  const n = ustSeviyeSay(h.slice(bas, i));
  if (!tekil.has(ad) || tekil.get(ad) < n) tekil.set(ad, n);
}
let t = 0;
[...tekil].sort((a, b) => b[1] - a[1]).forEach(([ad, n]) => { t += n; console.log(ad.padEnd(20), String(n).padStart(5)); });
console.log('TOPLAM SORU:', t);
