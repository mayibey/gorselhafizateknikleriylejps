/** "Telekomünikasyon Kurumu" eski adı hangi kartlarda geçiyor, BTK notu var mı? (Serhat Ceyhan bildirdi) */
import fs from 'node:fs';
const KOK = 'D:/GorselHafizaTeknikleriyleJSPS/';
const oku = (p) => fs.readFileSync(KOK + p, 'utf8');

for (const dosya of ['src/assets/kart-ses-metinleri.ts', 'src/assets/kart-madde-metinleri.ts']) {
  const s = oku(dosya);
  const kayitlar = [...s.matchAll(/"([a-z0-9_]+)":\s*"((?:[^"\\]|\\.)*)"/g)];
  console.log(`\n### ${dosya} — ${kayitlar.length} kayıt`);
  for (const [, anahtar, ham] of kayitlar) {
    if (!/Telekom[üu]nikasyon\s+Kurum/i.test(ham)) continue;
    const btk = /BTK|Bilgi Teknolojileri ve İletişim/i.test(ham);
    const yer = ham.search(/Telekom[üu]nikasyon\s+Kurum/i);
    console.log(`  ${btk ? '✓ BTK notu VAR ' : '✗ BTK notu YOK'} [${anahtar}]`);
    console.log(`      …${ham.slice(Math.max(0, yer - 110), yer + 150).replace(/\\n/g, ' ')}…`);
  }
}
// sorular
const q = oku('src/assets/kart-sorulari.ts');
console.log('\n### sorular');
for (const satir of q.split(/\r?\n/)) {
  if (!/Telekom[üu]nikasyon\s+Kurum/i.test(satir)) continue;
  try {
    const o = JSON.parse(satir.trim().replace(/,$/, ''));
    const btk = /BTK|Bilgi Teknolojileri/i.test(JSON.stringify(o));
    console.log(`  ${btk ? '✓' : '✗'} [${o.id}] ${o.soru.slice(0, 110)}`);
  } catch { /* atla */ }
}
