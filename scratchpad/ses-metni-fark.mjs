import fs from 'node:fs';
const rapor = JSON.parse(fs.readFileSync('scripts/_icerik_rapor.json', 'utf8'));
const ts = fs.readFileSync('src/assets/kart-ses-metinleri.ts', 'utf8');

const DESEN = new RegExp('^  "([a-z0-9_]+)": ("(?:[^"\\\\]|\\\\.)*"),$', 'gm');
const kayitli = new Map();
for (const m of ts.matchAll(DESEN)) kayitli.set(m[1], JSON.parse(m[2]));
console.log('kayıtlı metin:', kayitli.size);

let fark = 0, yok = 0, ayni = 0;
const farklilar = [];
for (const slug of ['jandteskyon', 'bilgiedinme', 'tebligat', 'kvkk', 'izinyon']) {
  const s = rapor[slug]?.ses || {};
  for (const [k, yeni] of Object.entries(s)) {
    if (!kayitli.has(k)) { yok++; continue; }
    if (kayitli.get(k) === yeni) { ayni++; continue; }
    fark++; farklilar.push([k, kayitli.get(k).length, String(yeni).length]);
  }
}
console.log('AYNI:', ayni, '| FARKLI:', fark, '| registryde YOK:', yok);
farklilar.forEach(([k, a, b]) => console.log('  ', k, a, '->', b, 'karakter'));
