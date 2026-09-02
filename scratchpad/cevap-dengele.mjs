/**
 * CEVAP DAĞILIMINI DENGELE — uygulama şıkları KARIŞTIRMIYOR (yalnız soru sırası karışıyor),
 * bu yüzden doğru cevabın hep B/C'de toplanması gerçek bir kusurdur (aday harften ipucu alır).
 * Şıklar DÖNDÜRÜLEREK (sıra korunarak) doğru cevap hedef harfe taşınır, "A) " önekleri yeniden yazılır.
 * Konum bağımlı şık içeren sorular (hiçbiri / hepsi / yukarıdakiler) DOKUNULMADAN bırakılır.
 * Kullanım: node scratchpad/cevap-dengele.mjs <SORULAR.json yolu>
 */
import fs from 'node:fs';

const yol = process.argv[2];
const j = JSON.parse(fs.readFileSync(yol, 'utf8'));
const HARF = ['A', 'B', 'C', 'D', 'E'];
const KONUM_BAGIMLI = /hiçbiri|hepsi|yukarıdaki|ikisi de|üçü de|ve b\b|ve c\b/i;

const dokunma = (s) => s.siklar.some((x) => KONUM_BAGIMLI.test(x));
const say = (liste) => liste.reduce((a, s) => ((a[s.dogru] = (a[s.dogru] ?? 0) + 1), a), {});
console.log('ÖNCE :', JSON.stringify(say(j.sorular)));

// Hedef: dokunulabilir soruları sırayla A,B,C,D,E... diye dağıt → dağılım kendiliğinden eşit.
// (Önceki 'kota + serpiştirme' kurgusu düzgün dağıtmıyordu; B'de yığılma kaldı.)
const sabit = j.sorular.filter(dokunma);
const oynak = j.sorular.filter((s) => !dokunma(s));
const serpistirilmis = oynak.map((_, n) => HARF[n % 5]);

let degisen = 0;
oynak.forEach((s, n) => {
  const hedef = serpistirilmis[n] ?? s.dogru;
  const su = HARF.indexOf(s.dogru);
  const hd = HARF.indexOf(hedef);
  if (su === hd) return;
  const metinler = s.siklar.map((x) => x.replace(/^[A-E]\)\s*/, ''));
  const kaydir = (su - hd + 5) % 5; // diziyi kaydır: doğru şık hedef konuma gelsin
  const yeni = metinler.slice(kaydir).concat(metinler.slice(0, kaydir));
  s.siklar = yeni.map((m, k) => `${HARF[k]}) ${m}`);
  s.dogru = hedef;
  degisen++;
});

console.log('SONRA:', JSON.stringify(say(j.sorular)), '· döndürülen soru:', degisen, '· dokunulmayan:', sabit.length);
fs.writeFileSync(yol, JSON.stringify(j, null, 2) + '\n', 'utf8');
