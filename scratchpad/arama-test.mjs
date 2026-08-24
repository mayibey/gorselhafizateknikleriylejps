/** Arama gerçekten iyileşti mi? Eski (522) ve yeni (1511) metin haritasıyla aynı sorguları dener. */
import fs from 'node:fs';
import { execSync } from 'node:child_process';

const DESEN = new RegExp('^  "([a-z0-9_]+)": ("(?:[^"\\\\]|\\\\.)*"),$', 'gm');
const oku = (t) => {
  const m = new Map();
  for (const x of t.matchAll(DESEN)) m.set(x[1], JSON.parse(x[2]));
  return m;
};
const yeni = oku(fs.readFileSync('src/assets/kart-ses-metinleri.ts', 'utf8'));
const eski = oku(execSync('git show HEAD:src/assets/kart-ses-metinleri.ts', { encoding: 'utf8', maxBuffer: 64e6 }));

const kucuk = (s) => s.toLocaleLowerCase('tr');
const say = (harita, sorgu) => {
  const q = kucuk(sorgu);
  let n = 0;
  for (const v of harita.values()) if (kucuk(v).includes(q)) n++;
  return n;
};
const SORGULAR = ['alkol', 'orman', 'çevre', 'trafik', 'gümrük', 'çocuk', 'av tüfeği', 'pasaport', 'kaçakçılık', 'zilyet', 'mera', 'yakalama', 'ifade', 'yedi sütun'];
console.log('sorgu'.padEnd(14), 'ESKİ', 'YENİ');
for (const s of SORGULAR) console.log(s.padEnd(14), String(say(eski, s)).padStart(4), String(say(yeni, s)).padStart(4));
console.log('\nmetni olan kart:', eski.size, '->', yeni.size);
