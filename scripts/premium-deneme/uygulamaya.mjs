// Premium denemeleri uygulamaya taşır: scripts/premium-deneme/cikti/*.json → src/assets/premium-denemeler.ts
// Kullanım: node scripts/premium-deneme/uygulamaya.mjs
// Sıra = dosya adı sırası; deneme numarası (no) KALICIDIR — sonuç/sıralama bu numarayla tutulur.
// Yeni deneme eklerken NO haritasına ekle, var olanın numarasını DEĞİŞTİRME.
import fs from 'node:fs';
import path from 'node:path';

const NO = {
  'P-SB-JAN-01': 1, 'P-UE-JAN-01': 2,
  'P-SB-JAN-02': 3, 'P-SB-JAN-03': 4,
  'P-ASB-JAN-01': 5, 'P-ASB-JAN-02': 6, 'P-ASB-JAN-03': 7,
  'P-UE-JAN-02': 8, 'P-UE-JAN-03': 9,
  // 2. dalga (26 Eyl 2026): Havacılık, MEBS, Personel, Bakım, Maliye, İkmal — subay/astsubay 3'er
  'P-SB-HAV-01': 10, 'P-SB-HAV-02': 11, 'P-SB-HAV-03': 12, 'P-ASB-HAV-01': 13, 'P-ASB-HAV-02': 14, 'P-ASB-HAV-03': 15,
  'P-SB-MEBS-01': 16, 'P-SB-MEBS-02': 17, 'P-SB-MEBS-03': 18, 'P-ASB-MEBS-01': 19, 'P-ASB-MEBS-02': 20, 'P-ASB-MEBS-03': 21,
  'P-SB-PER-01': 22, 'P-SB-PER-02': 23, 'P-SB-PER-03': 24, 'P-ASB-PER-01': 25, 'P-ASB-PER-02': 26, 'P-ASB-PER-03': 27,
  'P-SB-BAK-01': 28, 'P-SB-BAK-02': 29, 'P-SB-BAK-03': 30, 'P-ASB-BAK-01': 31, 'P-ASB-BAK-02': 32, 'P-ASB-BAK-03': 33,
  'P-SB-MAL-01': 34, 'P-SB-MAL-02': 35, 'P-SB-MAL-03': 36, 'P-ASB-MAL-01': 37, 'P-ASB-MAL-02': 38, 'P-ASB-MAL-03': 39,
  'P-SB-IKM-01': 40, 'P-SB-IKM-02': 41, 'P-SB-IKM-03': 42, 'P-ASB-IKM-01': 43, 'P-ASB-IKM-02': 44, 'P-ASB-IKM-03': 45,
  // 3. dalga (26 Eyl 2026): İstihkam, Tabip, Eczacı, Sağlık, Kimyager, Veteriner, Mühendis, Bando — ortak havuzdan
  'P-SB-IST-01': 46, 'P-SB-IST-02': 47, 'P-SB-IST-03': 48, 'P-ASB-IST-01': 49, 'P-ASB-IST-02': 50, 'P-ASB-IST-03': 51,
  'P-SB-TAB-01': 52, 'P-SB-TAB-02': 53, 'P-SB-TAB-03': 54, 'P-SB-ECZ-01': 55, 'P-SB-ECZ-02': 56, 'P-SB-ECZ-03': 57,
  'P-ASB-SAG-01': 58, 'P-ASB-SAG-02': 59, 'P-ASB-SAG-03': 60, 'P-SB-KIM-01': 61, 'P-SB-KIM-02': 62, 'P-SB-KIM-03': 63,
  'P-SB-VET-01': 64, 'P-SB-VET-02': 65, 'P-SB-VET-03': 66, 'P-SB-MUH-01': 67, 'P-SB-MUH-02': 68, 'P-SB-MUH-03': 69,
  'P-SB-BAN-01': 70, 'P-SB-BAN-02': 71, 'P-SB-BAN-03': 72, 'P-ASB-BAN-01': 73, 'P-ASB-BAN-02': 74, 'P-ASB-BAN-03': 75,
};

const kok = 'scripts/premium-deneme/cikti';
// "(müşterek kapsam)" paket etiketi; kullanıcıya gösterilmez.
const temiz = (t) => t.replace(/\s*\(müşterek kapsam\)/g, '');
// Açıklamadaki madde alıntısı bazen kelime ortasından başlıyor ("“kilde yapılır…", "“) Rüşvet…"):
// yarım ilk kelime/işaret atılır, başa "…" konur. Cümle başıyla (büyük harf, rakam, "(") başlayana dokunulmaz.
const alintiDuzelt = (a) =>
  a.replace(/“([^”]*)/, (tam, govde) => {
    const g = govde.trimStart();
    if (/^[A-ZÇĞİÖŞÜ0-9(“"]/.test(g)) return '“' + g;
    const bosluk = g.search(/\s/);
    const kalan = bosluk < 0 ? g : g.slice(bosluk + 1).trimStart();
    return '“…' + kalan;
  });
// TEKİL SORU TABLOSU (26 Eyl 2026): denemeler blokları paylaşıyor (aynı soru birden çok denemede).
// Her soru bir kez yazılır; deneme yalnız [soru sırası, şık dizilişi] tutar. Şıklar denemeye göre
// farklı karıştırıldığı için diziliş saklanır (ör. "20413" = gösterilen sırayla taban şık indeksleri).
const sorular = [];
const anahtar = new Map();
const denemeler = [];
for (const f of fs.readdirSync(kok).filter((x) => x.endsWith('.json')).sort()) {
  const d = JSON.parse(fs.readFileSync(path.join(kok, f), 'utf8'));
  const no = NO[d.id];
  if (!no) throw new Error(`${d.id} için NO haritasında numara yok`);
  const refs = d.sorular.map((q) => {
    const k = q.soru + '\u0001' + [...q.siklar].sort().join('\u0001');
    let i = anahtar.get(k);
    if (i == null) {
      i = sorular.length;
      anahtar.set(k, i);
      sorular.push({ l: q.lawId, k: q.soru, s: q.siklar, d: q.dogru, a: alintiDuzelt(temiz(q.aciklama)), y: temiz(q.kaynak) });
    }
    const taban = sorular[i].s;
    const dizilis = q.siklar.map((x) => taban.indexOf(x)).join('');
    if (dizilis.includes('-1')) throw new Error('şık eşleşmedi: ' + q.id);
    return [i, dizilis];
  });
  denemeler.push({ no, kod: d.id, baslik: d.baslik, brans: d.brans, rutbe: d.rutbe, r: refs });
}
denemeler.sort((a, b) => a.no - b.no);

const cikti = `// OTOMATİK ÜRETİLDİ — ELLE DÜZENLEME. \`node scripts/premium-deneme/uygulamaya.mjs\` ile yenile.
// Premium denemeler (ATA-AÖF tarzı 80 soru). Her sorunun cevabı resmî madde metnine karşı doğrulandı
// (scripts/premium-deneme/denetle.py + birlestir.py). Sorular TEKİL tabloda; deneme [sıra, şık dizilişi] tutar
// (çözümü src/lib/sinav.ts premiumKaynak()).
/* eslint-disable */
import type { GenelDeneme } from './genel-denemeler';

export type PremiumDeneme = GenelDeneme & { kod: string; brans: string; rutbe: string };
/** l: lawId · k: kök · s: taban şıklar · d: taban doğru indeksi · a: açıklama · y: kaynak künyesi */
export type PremiumSoruHam = { l: number; k: string; s: string[]; d: number; a: string; y: string };
export type PremiumDenemeHam = { no: number; kod: string; baslik: string; brans: string; rutbe: string; r: [number, string][] };

export const PREMIUM_SORULAR: PremiumSoruHam[] = ${JSON.stringify(sorular)};

export const PREMIUM_DENEMELER_HAM: PremiumDenemeHam[] = ${JSON.stringify(denemeler)};
`;
fs.writeFileSync('src/assets/premium-denemeler.ts', cikti);
console.log(denemeler.length, 'premium deneme ·', sorular.length, 'tekil soru →', denemeler.map((d) => `${d.kod}(no ${d.no}, ${d.r.length})`).join(', '));
