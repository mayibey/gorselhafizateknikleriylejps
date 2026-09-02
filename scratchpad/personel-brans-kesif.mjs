/**
 * KEŞİF (kod değiştirmez): Personel branşlı kullanıcı "eskiden her branş konusundan sonra
 * sorular vardı, şimdi yok" diyor. Ne var ne yok, ölçelim.
 */
import fs from 'node:fs';

const KOK = 'D:/GorselHafizaTeknikleriyleJSPS/';
const oku = (p) => fs.readFileSync(KOK + p, 'utf8');

// —— 1) Personel branşına bağlı kanunlar ——
const digerSeed = oku('src/db/seed-brans-diger.ts');
const BRANS_ID = { jandarma: 1, mebs: 2, havacilik: 3, personel: 4, maliye: 5, istihkam: 6, ikmal: 7, bakim: 8, bando: 9, tabip: 10, eczaci: 12, saglik: 13, kimyager: 14, veteriner: 15, muhendis: 16 };

// SEED_LAW_BRANCHES_DIGER satırları: { law_id: N, branch_id: M }
const baglar = [...digerSeed.matchAll(/law_id:\s*(\d+),\s*branch_id:\s*(\d+)/g)].map((m) => ({ law: +m[1], brans: +m[2] }));
const personelLaws = baglar.filter((b) => b.brans === BRANS_ID.personel).map((b) => b.law);
console.log(`personel branşına bağlı kanun: ${personelLaws.length}`);

// kanun adları
const adlar = new Map();
for (const kaynak of ['src/db/seed.ts', 'src/db/seed-brans-diger.ts']) {
  for (const m of oku(kaynak).matchAll(/\{\s*id:\s*(\d+),\s*blok:\s*'([^']+)',\s*ad:\s*'([^']*)'/g)) {
    adlar.set(+m[1], { blok: m[2], ad: m[3] });
  }
}

// —— 2) Bu kanunlarda deneme sorusu var mı? ——
const sayilarTs = oku('src/assets/kart-soru-sayilari.ts');
const sayilar = new Map();
for (const m of sayilarTs.matchAll(/(\d+):\s*(\d+)/g)) sayilar.set(+m[1], +m[2]);

let soruluk = 0, sorusuz = 0;
console.log('\nkanun  soru  ad');
for (const id of personelLaws.sort((a, b) => a - b)) {
  const s = sayilar.get(id) ?? 0;
  if (s > 0) soruluk++; else sorusuz++;
  console.log(`  ${String(id).padStart(3)}  ${String(s).padStart(4)}  ${adlar.get(id)?.ad ?? '(ad yok)'}`);
}
console.log(`\nsorusu OLAN: ${soruluk} · sorusu OLMAYAN: ${sorusuz}`);

// —— 3) Personel için PDF kitap var mı? (kitap varsa ekran kanun listesini GİZLİYOR) ——
console.log('\n(kitap sayısı sunucudan ayrıca sorulacak)');
