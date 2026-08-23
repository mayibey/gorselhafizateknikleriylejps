// Genel deneme (Tatbikat) soru registry üreticisi — soru-registry-uret.mjs analoğu.
// Fabrikadaki 3 GENEL_DENEME_*.json'u okuyup src/assets/genel-denemeler.ts'i OTOMATİK yazar.
// Çalıştır: npm run genel:uret
//
// Kaynak: D:/JSPS Fabrika/.../MUSTEREK/_DENEME_SORULARI/GENEL_DENEMELER/GENEL_DENEME_{1,2,3}.json
// Her deneme 50 karma soru (25 müşterek kanundan). soru_id benzersiz (çakışma kontrolü buradan).
// kart_id → yanlış cevapta ilgili karta yönlendirme (kaynak_madde ile birlikte).
// DB'ye GİRMEZ — quiz salt ölçüm.

import { existsSync, readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SORU_KARA_LISTE } from './soru-kara-liste.mjs';
import { denetle, yedekSoru } from './soru-standart.mjs';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const root = join(scriptDir, '..');
const KAYNAK = 'D:/JSPS Fabrika/kaynaklar/astsubay/KANUN_MASTER_DOSYALARI/MUSTEREK/_DENEME_SORULARI/GENEL_DENEMELER';
const outFile = join(root, 'src', 'assets', 'genel-denemeler.ts');
const outDir = dirname(outFile);

function sikTemizle(s) {
  return String(s).replace(/^\s*[A-E]\)\s*/, '').trim();
}

const DOSYALAR = ['GENEL_DENEME_1.json', 'GENEL_DENEME_2.json', 'GENEL_DENEME_3.json'];
const denemeler = [];
const stdKalan = new Map();
let stdDuzeltilen = 0;
let stdDegistirilen = 0;
const gorulenId = new Set();
let toplam = 0;
let atlanan = 0;
let cakisma = 0;

for (let i = 0; i < DOSYALAR.length; i++) {
  const yol = join(KAYNAK, DOSYALAR[i]);
  if (!existsSync(yol)) {
    console.log(`UYARI: ${DOSYALAR[i]} yok — atlandı`);
    continue;
  }
  const veri = JSON.parse(readFileSync(yol, 'utf8'));
  const ham = Array.isArray(veri.sorular) ? veri.sorular : [];
  const sorular = [];
  for (const s of ham) {
    const siklar = Array.isArray(s.siklar) ? s.siklar : [];
    const dogruIdx = typeof s.dogru === 'string' ? s.dogru.trim().toUpperCase().charCodeAt(0) - 65 : -1;
    if (!s.soru || siklar.length < 2 || dogruIdx < 0 || dogruIdx >= siklar.length) {
      atlanan++;
      continue;
    }
    const id = String(s.soru_id ?? '').trim();
    if (SORU_KARA_LISTE.has(id)) { atlanan++; continue; } // salakça/mülga → atla [[soru-kara-liste]]
    if (gorulenId.has(id)) {
      cakisma++;
      console.log(`CAKISMA: soru_id "${id}" tekrar (deneme ${i + 1}) — atlandı`);
      continue;
    }
    gorulenId.add(id);
    const kayit = {
      id,
      soru: String(s.soru).trim(),
      siklar: siklar.map(sikTemizle),
      dogru: dogruIdx,
      aciklama: String(s.aciklama ?? '').trim(),
      kaynak: String(s.kaynak_madde ?? '').trim(),
      zorluk: String(s.zorluk ?? '').trim(),
      kartId: String(s.kart_id ?? '').trim(),
    };
    // ÇIKMIŞ SINAV STANDARDI: künye kanonikleştirilir. Bu denemeler SABİT 50 soruluk
    // küratörlü setler → standarda girmeyen soru ATILMAZ (deneme eksilmesin), sayılır ve
    // raporlanır; fabrikadaki kaynak düzeltilince kendiliğinden temizlenir.
    // İpucu olarak kaynak + kart kimliği birlikte verilir (kart kimliği öneki mevzuatı ele veriyor).
    const ipucu = `${kayit.kaynak} ${kayit.kartId}`.trim();
    const std = denetle({ ...kayit, kaynak: ipucu }, null);
    if (std.at) {
      // Standarda girmiyor → AYNI MEVZUATTAN standart bir yedekle değiştirilir.
      const yedek = yedekSoru(kayit.soru, ipucu, gorulenId);
      if (yedek) {
        const y = denetle(yedek, null);
        sorular.push({ ...yedek, soru: y.tamam ? y.soru : yedek.soru, kartId: '' });
        stdDegistirilen++;
        continue;
      }
      stdKalan.set(std.at, (stdKalan.get(std.at) ?? 0) + 1);
    } else if (std.degisti) {
      kayit.soru = std.soru;
      stdDuzeltilen++;
    }
    sorular.push(kayit);
  }
  denemeler.push({
    no: veri.deneme_no ?? i + 1,
    baslik: `Genel Deneme ${veri.deneme_no ?? i + 1}`,
    sorular,
  });
  toplam += sorular.length;
  console.log(`Genel Deneme ${veri.deneme_no ?? i + 1}: ${sorular.length} soru`);
}

const govde = denemeler
  .map((d) => {
    const satirlar = d.sorular.map((q) => `      ${JSON.stringify(q)},`).join('\n');
    return `  {\n    no: ${d.no},\n    baslik: ${JSON.stringify(d.baslik)},\n    sorular: [\n${satirlar}\n    ],\n  },`;
  })
  .join('\n');

const out = `// OTOMATİK ÜRETİLDİ — elle düzenleme. \`npm run genel:uret\` ile yenile.
// Kaynak: .../MUSTEREK/_DENEME_SORULARI/GENEL_DENEMELER/GENEL_DENEME_{1,2,3}.json (karma genel denemeler).
// \`dogru\` 0-tabanlı şık index (A=0..E=4). Şık önekleri ayıklanmış; sıra KORUNUR.
// \`kartId\` + \`kaynak\` → yanlış cevapta ilgili karta yönlendirme.

/** Genel deneme sorusu (kart-sorulari KartSoru + kartId yönlendirme). */
export type GenelSoru = {
  id: string;
  soru: string;
  siklar: string[];
  dogru: number;
  aciklama: string;
  kaynak: string;
  zorluk: string;
  /** Yanlış cevapta yönlendirilecek kart anahtarı (örn. "2803 MADDE 21-1"). */
  kartId: string;
};

export type GenelDeneme = {
  /** Deneme numarası (1/2/3). */
  no: number;
  /** Görünen başlık ("Genel Deneme 1"). */
  baslik: string;
  sorular: GenelSoru[];
};

export const GENEL_DENEMELER: GenelDeneme[] = [
${govde}
];
`;

if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
writeFileSync(outFile, out, 'utf8');

console.log(`\nTOPLAM: ${denemeler.length} deneme · ${toplam} soru → ${outFile}`);
if (atlanan) console.log(`ATLANAN (geçersiz): ${atlanan}`);
if (cakisma) console.log(`STANDART: ${stdDuzeltilen} künye düzeltildi · ${stdDegistirilen} soru standart yedekle DEĞİŞTİRİLDİ`);
for (const [sebep, n] of [...stdKalan].sort((x, y) => y[1] - x[1])) console.log(`  standart dışı KALDI: ${n}  ${sebep}`);
console.log(`ÇAKIŞAN soru_id: ${cakisma}`);
