import fs from 'node:fs';
const ts = fs.readFileSync('src/assets/oyun-merkezi-html.ts', 'utf8');
const s = ts.indexOf('<meta charset');
const j = ts.lastIndexOf('`');
let h = ts.slice(s, j);
const BS = String.fromCharCode(92);
h = h.split(BS + '"').join('"').split(BS + '`').join('`').split(BS + '$').join('$').split(BS + 'n').join(String.fromCharCode(10)).split(BS + BS).join(BS);
fs.writeFileSync('scratchpad/gomulu-oyun.html', h);
const c = fs.readFileSync('scratchpad/canli-oyun.html', 'utf8');
console.log('gomulu html:', h.length);
console.log('canli html :', c.length);
console.log('AYNI MI    :', h === c);
if (h !== c) {
  let k = 0;
  while (k < Math.min(h.length, c.length) && h[k] === c[k]) k++;
  console.log('ilk fark konumu:', k, '/', c.length);
  console.log(' gomulu:', JSON.stringify(h.slice(k, k + 120)));
  console.log(' canli :', JSON.stringify(c.slice(k, k + 120)));
}
