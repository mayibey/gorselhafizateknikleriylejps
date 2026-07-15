// KEŞİF (DB'ye DOKUNMAZ): _ozet_meta.json baslik'lerinden dosya adı üretir (build.py birebir),
// dosya adı -> düzgün Türkçe başlık haritası kurar, _OZET_KITAPLAR'daki gerçek dosyalarla
// eşleşiyor mu raporlar. Eksik/fazla olanları listeler.
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { join } from 'node:path';

const BRANS_DIGER = 'D:/JSPS Fabrika/kaynaklar/astsubay/KANUN_MASTER_DOSYALARI/BRANS_DIGER';
const OZET = join(BRANS_DIGER, '_OZET_KITAPLAR');

// build.py TR_MAP + slug üretimi birebir.
const TR_FROM = 'şçğıöüŞÇĞİÖÜ';
const TR_TO = 'scgiouSCGIOU';
function translit(s) {
  let o = '';
  for (const ch of s) { const i = TR_FROM.indexOf(ch); o += i >= 0 ? TR_TO[i] : ch; }
  return o;
}
function fnameYap(meta) {
  const no = String(meta.no ?? '').trim() || 'Y';
  let slug = translit(String(meta.baslik ?? 'mevzuat')).replace(/[^A-Za-z0-9]+/g, '_').slice(0, 48).replace(/^_+|_+$/g, '');
  return `${no}_${slug}.pdf`;
}

// Tüm kaynak klasörlerdeki _ozet_meta.json'ları oku → fname -> baslik.
const fnameBaslik = new Map();
for (const d of readdirSync(BRANS_DIGER)) {
  const dir = join(BRANS_DIGER, d);
  const mf = join(dir, '_ozet_meta.json');
  if (!existsSync(mf)) continue;
  let meta;
  try { meta = JSON.parse(readFileSync(mf, 'utf8')); } catch { continue; }
  const fn = fnameYap(meta);
  fnameBaslik.set(fn, meta.baslik);
}
console.log(`_ozet_meta.json'dan üretilen dosya adı sayısı: ${fnameBaslik.size}`);

// _OZET_KITAPLAR'daki gerçek dosyalar (branş klasörleri).
const gercek = new Set();
for (const d of readdirSync(OZET)) {
  if (d.startsWith('_') || d.startsWith('.')) continue;
  const dir = join(OZET, d);
  try { if (!statSync(dir).isDirectory()) continue; } catch { continue; }
  for (const f of readdirSync(dir)) if (/\.pdf$/i.test(f)) gercek.add(f);
}
console.log(`_OZET_KITAPLAR'daki benzersiz gerçek dosya: ${gercek.size}\n`);

const eslesmeyen = [...gercek].filter((f) => !fnameBaslik.has(f));
console.log(`=== Haritada KARŞILIĞI OLMAYAN gerçek dosyalar (${eslesmeyen.length}) ===`);
for (const f of eslesmeyen.sort()) console.log('  ! ' + f);

console.log(`\n=== ÖRNEK eşleşmeler (ilk 20) ===`);
let n = 0;
for (const f of [...gercek].sort()) {
  if (n++ >= 20) break;
  console.log(`  ${f}\n     → ${fnameBaslik.get(f) ?? '(YOK)'}`);
}
