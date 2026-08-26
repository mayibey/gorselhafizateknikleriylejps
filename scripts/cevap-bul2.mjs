/**
 * CEVAP BULUCU v2 — VARLIK ÇELİŞKİSİ yöntemi. (26 Ağu 2026)
 *
 * v1 NEDEN ÇÖKTÜ (ölçüldü: %26,5 — rastgele %20): şıkkın kanun metniyle kelime örtüşmesine
 * bakıyordu. Ama sınavın YANLIŞ şıkkı, gerçek hükmün TEK KELİMESİ değiştirilmiş hâli oluyor
 * ("İçişleri Bakanlığı" → "Milli Savunma Bakanlığı"; "otuz gün" → "kırk gün"). Böyle bir şık
 * metnin %95'iyle örtüşür → örtüşme ölçüsü kör kalır.
 *
 * v2 FİKRİ: şıkkı metne EŞLE, sonra sadece AYIRT EDİCİ VARLIKLARI karşılaştır:
 *   • makam/kurum adı (İçişleri Bakanlığı, vali, hâkim, Cumhurbaşkanı…)
 *   • sayı + birim (otuz gün, 24 saat, 5 yıl)
 * Eşleşen cümlede bu varlıkların KARŞILIĞI farklıysa → o şık ÇELİŞİYOR.
 *   OLUMSUZ soruda ("hangisi yanlıştır") → çelişen şık DOĞRU CEVAPTIR.
 *   DÜZ soruda → çelişmeyen ve en iyi eşleşen şık.
 *
 * ⛔ Yine 664 bilinen cevapla sınanır. Faydalı bir çıta aşamazsa DÜRÜSTÇE söylenir;
 * "çalışıyor gibi" gösterilmez.
 */
import fs from 'node:fs';
import { korpus, siniflandir } from './sinav-madde-eslestir.mjs';
import { soruBicimi } from './soru-tipleri.mjs';

const maddeler = korpus.filter((k) => k.tur === 'madde');
const kanunCumle = new Map(); // kanun -> [{cumle, madde}]
for (const m of maddeler) {
  if (!kanunCumle.has(m.kanun)) kanunCumle.set(m.kanun, []);
  for (const c of String(m.metin).split(/(?<=[.;])\s+/)) {
    if (c.trim().length > 40) kanunCumle.get(m.kanun).push({ cumle: c.trim(), madde: m.maddeNo });
  }
}

const SAYI_KELIME = '(?:bir|iki|üç|dört|beş|altı|yedi|sekiz|dokuz|on|onbeş|yirmi|yirmidört|otuz|kırk|elli|altmış|yetmiş|seksen|doksan|yüz|bin)';
const DEGER = new RegExp(`(\\d{1,4}|${SAYI_KELIME})\\s*(gün|ay|yıl|saat|hafta)`, 'gi');
const KURUMLAR = [
  'içişleri bakan', 'milli savunma bakan', 'adalet bakan', 'maliye bakan', 'sağlık bakan',
  'cumhurbaşkan', 'genelkurmay', 'jandarma genel komutan', 'sahil güvenlik komutan',
  'emniyet genel müdür', 'valilik', 'vali', 'kaymakam', 'mülki amir', 'hâkim', 'hakim',
  'sulh ceza', 'cumhuriyet savcı', 'savcı', 'mahkeme', 'bölge komutan', 'il komutan',
  'garnizon komutan', 'belediye', 'disiplin kurulu', 'disiplin amiri', 'bakanlar kurulu',
];

const sade = (s) => String(s).toLocaleLowerCase('tr');
function varliklar(metin) {
  const d = sade(metin);
  const kurum = KURUMLAR.filter((k) => d.includes(k));
  const deger = [...String(metin).matchAll(DEGER)].map((m) => `${sade(m[1]).replace(/\s+/g, '')} ${sade(m[2])}`);
  return { kurum, deger };
}

const terim = (s) => new Set(sade(s).replace(/[^\p{L}\p{N}]+/gu, ' ').split(' ').filter((w) => w.length >= 5).map((w) => w.slice(0, 7)));

/** Şıkka en çok benzeyen resmî cümleyi bul. */
function enYakinCumle(sik, kanun) {
  const liste = kanunCumle.get(kanun) || [];
  const t = terim(sik);
  if (!t.size || !liste.length) return null;
  let enIyi = null, enSkor = 0;
  for (const c of liste) {
    const tc = terim(c.cumle);
    let ortak = 0;
    for (const x of t) if (tc.has(x)) ortak++;
    const skor = ortak / t.size;
    if (skor > enSkor) { enSkor = skor; enIyi = { ...c, skor }; }
  }
  return enSkor >= 0.35 ? enIyi : null;
}

/** Şık, eşleştiği resmî cümleyle ÇELİŞİYOR mu? */
function celiski(sik, kanun) {
  const c = enYakinCumle(sik, kanun);
  if (!c) return { celisti: false, sebep: 'eşleşme yok', skor: 0 };
  const a = varliklar(sik);
  const b = varliklar(c.cumle);
  // Değer çelişkisi: şıkta bir süre var, cümlede BAŞKA bir süre var
  for (const d of a.deger) {
    if (b.deger.length && !b.deger.includes(d)) {
      return { celisti: true, sebep: `değer: şık "${d}" ↔ metin "${b.deger.join(', ')}"`, skor: c.skor, madde: c.madde };
    }
  }
  // Kurum çelişkisi
  for (const k of a.kurum) {
    if (b.kurum.length && !b.kurum.some((x) => x.includes(k) || k.includes(x))) {
      return { celisti: true, sebep: `makam: şık "${k}" ↔ metin "${b.kurum.join(', ')}"`, skor: c.skor, madde: c.madde };
    }
  }
  return { celisti: false, sebep: 'uyumlu', skor: c.skor, madde: c.madde };
}

export function cevapBul2(kok, siklarNesne) {
  const harfler = Object.keys(siklarNesne || {}).sort();
  if (harfler.length < 4) return null;
  const r = siniflandir(kok, harfler.map((h) => siklarNesne[h]));
  if (!r.kanun) return null;
  const olumsuz = soruBicimi(kok, harfler.map((h) => siklarNesne[h])) === 'OLUMSUZ';
  const sonuc = harfler.map((h) => ({ h, ...celiski(siklarNesne[h], r.kanun) }));
  const celisenler = sonuc.filter((s) => s.celisti);
  if (olumsuz) {
    // Tam BİR çelişen varsa yüksek güven; birden çoksa karar zorlanmaz.
    if (celisenler.length === 1) return { harf: celisenler[0].h, guven: 'yuksek', sebep: celisenler[0].sebep, olumsuz };
    if (celisenler.length === 0) return null;
    const enIyi = celisenler.sort((a, b) => b.skor - a.skor)[0];
    return { harf: enIyi.h, guven: 'dusuk', sebep: enIyi.sebep, olumsuz };
  }
  const uyumlu = sonuc.filter((s) => !s.celisti && s.skor > 0).sort((a, b) => b.skor - a.skor);
  if (!uyumlu.length) return null;
  const acik = uyumlu.length > 1 ? uyumlu[0].skor - uyumlu[1].skor : uyumlu[0].skor;
  return { harf: uyumlu[0].h, guven: acik >= 0.12 ? 'yuksek' : 'dusuk', sebep: 'en iyi eşleşme', olumsuz };
}

// ---------- ÖLÇÜM ----------
const veri = JSON.parse(fs.readFileSync('scripts/veri/sinav-cevapli.json', 'utf8'));
const bilinen = veri.sorular.filter((q) => q.cevap && Object.keys(q.siklar || {}).length >= 4);
const yuz = (a, b) => (100 * a / (b || 1)).toFixed(1);

const gruplar = { 'OLUMSUZ-yuksek': [], 'OLUMSUZ-dusuk': [], 'DÜZ-yuksek': [], 'DÜZ-dusuk': [] };
let denenen = 0, dogru = 0;
for (const q of bilinen) {
  const c = cevapBul2(q.kok, q.siklar);
  if (!c) continue;
  denenen++;
  const isabet = c.harf === q.cevap;
  if (isabet) dogru++;
  gruplar[`${c.olumsuz ? 'OLUMSUZ' : 'DÜZ'}-${c.guven}`].push(isabet);
}
console.log('=== CEVAP BULUCU v2 (varlık çelişkisi) — 664 bilinen cevaba karşı ===');
console.log(`denenen: ${denenen} · isabet: ${dogru} · oran: %${yuz(dogru, denenen)}   (rastgele %20 · v1 %26,5)\n`);
for (const [ad, l] of Object.entries(gruplar)) {
  if (!l.length) continue;
  console.log(`  ${ad.padEnd(16)} ${String(l.length).padStart(4)} soru · isabet %${yuz(l.filter(Boolean).length, l.length)}`);
}
