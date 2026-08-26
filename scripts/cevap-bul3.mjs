/**
 * CEVAP BULUCU v3 — KENDİ DOĞRULANMIŞ BANKAMIZDAN AKTARIM. (26 Ağu 2026)
 *
 * v1 (metin örtüşmesi) %26,5 · v2 (varlık çelişkisi) %33 — ikisi de kullanılamaz.
 * Denenmemiş tek güçlü kaynak: kendi bankamız. 5.384 soru, cevapları resmî metinden
 * küratörlenmiş. Çıkmış sınav sorusu bankadaki bir soruyla YETERİNCE benzerse, cevabı
 * oradan aktarılabilir — üstelik şık SIRASI farklı olabileceği için harf değil ŞIK METNİ
 * eşleştirilir (harf aktarmak sessiz hata üretir).
 *
 * ⛔ Yine 664 bilinen cevapla sınanır; faydalı çıta aşılmazsa dürüstçe söylenir.
 */
import fs from 'node:fs';
import { DUELLO_ADI, KANUN_ADI, mufredataOtur } from './soru-standart.mjs';

// ---------- bankayı oku ----------
const bankaTs = fs.readFileSync('src/assets/kart-sorulari.ts', 'utf8');
const banka = [];
{
  let law = null;
  for (const satir of bankaTs.split(/\r?\n/)) {
    const b = satir.match(/^\s{2}(\d+): \[/);
    if (b) { law = Number(b[1]); continue; }
    if (!law || !satir.includes('"soru"')) continue;
    try {
      const o = JSON.parse(satir.trim().replace(/,$/, ''));
      if (!o.soru || !Array.isArray(o.siklar) || typeof o.dogru !== 'number') continue;
      banka.push({
        kanun: KANUN_ADI.get(law) ?? mufredataOtur(DUELLO_ADI.get(law) ?? '') ?? null,
        soru: o.soru,
        siklar: o.siklar,
        dogruMetin: o.siklar[o.dogru],
        kaynak: o.kaynak || null,
      });
    } catch { /* atla */ }
  }
}

const sade = (s) => String(s).toLocaleLowerCase('tr').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
const govde = (s) => new Set(sade(s).split(' ').filter((w) => w.length >= 5).map((w) => w.slice(0, 7)));

// ters indeks: terim -> banka soru indeksleri (5.384 × her soru taraması çok yavaş olurdu)
const indeks = new Map();
const bankaVek = banka.map((b, i) => {
  const t = govde(b.soru);
  for (const x of t) {
    if (!indeks.has(x)) indeks.set(x, []);
    indeks.get(x).push(i);
  }
  return t;
});

function benzer(kok) {
  const t = govde(kok);
  if (t.size < 4) return null;
  const say = new Map();
  for (const x of t) for (const i of indeks.get(x) || []) say.set(i, (say.get(i) || 0) + 1);
  let enIyi = -1, enSkor = 0;
  for (const [i, ortak] of say) {
    const skor = ortak / Math.max(t.size, bankaVek[i].size);
    if (skor > enSkor) { enSkor = skor; enIyi = i; }
  }
  return enIyi >= 0 ? { ...banka[enIyi], skor: enSkor } : null;
}

/** Banka sorusunun doğru ŞIK METNİ, sınav sorusunun hangi harfine denk geliyor? */
function harfeCevir(dogruMetin, siklarNesne) {
  const hedef = govde(dogruMetin);
  let enIyi = null, enSkor = 0;
  for (const [h, m] of Object.entries(siklarNesne)) {
    const t = govde(m);
    if (!t.size) continue;
    let ortak = 0;
    for (const x of hedef) if (t.has(x)) ortak++;
    const skor = ortak / Math.max(hedef.size, t.size);
    if (skor > enSkor) { enSkor = skor; enIyi = h; }
  }
  return enSkor >= 0.5 ? { harf: enIyi, skor: enSkor } : null;
}

export function cevapBul3(kok, siklarNesne) {
  const b = benzer(kok);
  if (!b || b.skor < 0.45) return null;
  const h = harfeCevir(b.dogruMetin, siklarNesne);
  if (!h) return null;
  return { harf: h.harf, soruBenzerlik: +b.skor.toFixed(2), sikBenzerlik: +h.skor.toFixed(2), bankaKaynak: b.kaynak };
}

// ---------- ÖLÇÜM ----------
const veri = JSON.parse(fs.readFileSync('scripts/veri/sinav-cevapli.json', 'utf8'));
const bilinen = veri.sorular.filter((q) => q.cevap && Object.keys(q.siklar || {}).length >= 4);
const yuz = (a, b) => (100 * a / (b || 1)).toFixed(1);

const kayit = [];
for (const q of bilinen) {
  const c = cevapBul3(q.kok, q.siklar);
  if (!c) continue;
  kayit.push({ ...c, isabet: c.harf === q.cevap });
}
console.log('=== CEVAP BULUCU v3 (kendi bankamızdan aktarım) — 664 bilinen cevaba karşı ===');
console.log(`banka: ${banka.length} soru · denenen: ${kayit.length} · isabet: %${yuz(kayit.filter((k) => k.isabet).length, kayit.length)}`);
console.log('  (rastgele %20 · v1 %26,5 · v2 %33)\n');
console.log('SORU BENZERLİK EŞİĞİ:');
console.log('  eşik   kalan   isabet');
for (const e of [0.45, 0.5, 0.6, 0.7, 0.8, 0.9]) {
  const alt = kayit.filter((k) => k.soruBenzerlik >= e);
  if (!alt.length) continue;
  console.log(`  ${e.toFixed(2)} ${String(alt.length).padStart(6)}   %${yuz(alt.filter((k) => k.isabet).length, alt.length)}`);
}
