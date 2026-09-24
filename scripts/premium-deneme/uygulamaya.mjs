// Premium denemeleri uygulamaya taşır: scripts/premium-deneme/cikti/*.json → src/assets/premium-denemeler.ts
// Kullanım: node scripts/premium-deneme/uygulamaya.mjs
// Sıra = dosya adı sırası; deneme numarası (no) KALICIDIR — sonuç/sıralama bu numarayla tutulur.
// Yeni deneme eklerken NO haritasına ekle, var olanın numarasını DEĞİŞTİRME.
import fs from 'node:fs';
import path from 'node:path';

const NO = { 'P-SB-JAN-01': 1, 'P-UE-JAN-01': 2 };

const kok = 'scripts/premium-deneme/cikti';
const denemeler = [];
for (const f of fs.readdirSync(kok).filter((x) => x.endsWith('.json')).sort()) {
  const d = JSON.parse(fs.readFileSync(path.join(kok, f), 'utf8'));
  const no = NO[d.id];
  if (!no) throw new Error(`${d.id} için NO haritasında numara yok`);
  // "(müşterek kapsam)" paket etiketi; kullanıcıya gösterilmez.
  const temiz = (t) => t.replace(/\s*\(müşterek kapsam\)/g, '');
  denemeler.push({
    no,
    kod: d.id,
    baslik: d.baslik,
    brans: d.brans,
    rutbe: d.rutbe,
    sorular: d.sorular.map((q) => ({
      id: q.id,
      lawId: q.lawId,
      soru: q.soru,
      siklar: q.siklar,
      dogru: q.dogru,
      aciklama: temiz(q.aciklama),
      kaynak: temiz(q.kaynak),
      zorluk: 'orta',
      kartId: '',
    })),
  });
}
denemeler.sort((a, b) => a.no - b.no);

const cikti = `// OTOMATİK ÜRETİLDİ — ELLE DÜZENLEME. \`node scripts/premium-deneme/uygulamaya.mjs\` ile yenile.
// Premium denemeler (ATA-AÖF tarzı 80 soru: müşterek 40 + branş 40). Her sorunun cevabı
// resmî madde metnine karşı doğrulandı (scripts/premium-deneme/denetle.py + birlestir.py).
/* eslint-disable */
import type { GenelDeneme } from './genel-denemeler';

export type PremiumDeneme = GenelDeneme & { kod: string; brans: string; rutbe: string };

export const PREMIUM_DENEMELER: PremiumDeneme[] = ${JSON.stringify(denemeler)};
`;
fs.writeFileSync('src/assets/premium-denemeler.ts', cikti);
console.log(denemeler.length, 'premium deneme →', denemeler.map((d) => `${d.kod}(no ${d.no}, ${d.sorular.length} soru)`).join(', '));
