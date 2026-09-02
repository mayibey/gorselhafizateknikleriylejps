/**
 * Kapsamdaki maddelerin RESMÎ METNİNİ çıkarır (soru üretimi bu metinden yapılacak).
 * Kullanım: node scratchpad/madde-cikar.mjs 3466 8,9,13,18
 */
import fs from 'node:fs';

const KOK = 'D:/JSPS Fabrika/kaynaklar/astsubay/KANUN_MASTER_DOSYALARI/BRANS_DIGER/_KAYNAK_METIN/';
const [, , no, kapsamStr] = process.argv;
const kapsam = kapsamStr.split(',').map((s) => s.trim());

const ham = fs.readFileSync(KOK + `${no}.txt`, 'utf8');
const satirlar = ham.split(/\r?\n/);

// "Madde 12 –" / "MADDE 12-" / "Ek Madde 3 –" başlangıçları
const bas = /^\s*(Ek\s+)?(Madde|MADDE)\s+(\d+)\s*[–\-—]/;
const bloklar = [];
let simdiki = null;
for (const s of satirlar) {
  const m = s.match(bas);
  if (m) {
    if (simdiki) bloklar.push(simdiki);
    simdiki = { ek: !!m[1], no: m[3], satirlar: [s] };
  } else if (simdiki) simdiki.satirlar.push(s);
}
if (simdiki) bloklar.push(simdiki);

let cikti = '';
for (const k of kapsam) {
  const b = bloklar.find((x) => !x.ek && x.no === k);
  if (!b) { cikti += `\n\n########## MADDE ${k} — BULUNAMADI ##########\n`; continue; }
  // Sonraki madde başlığına kadar; mülga/başlık satırlarını da bırak (üretimde göz karar)
  const metin = b.satirlar.join('\n').replace(/\n{3,}/g, '\n\n').trim();
  cikti += `\n\n########## ${no} MADDE ${k} ##########\n${metin}\n`;
}
const hedef = `D:/GorselHafizaTeknikleriyleJSPS/scratchpad/metin_${no}.txt`;
fs.writeFileSync(hedef, cikti, 'utf8');
console.log(`madde: ${kapsam.length} · çıkarılan: ${(cikti.match(/##########/g) || []).length / 2} · ${Math.round(cikti.length / 1024)} KB → ${hedef}`);
console.log('bulunamayan:', kapsam.filter((k) => !bloklar.some((b) => !b.ek && b.no === k)).join(', ') || 'yok');
