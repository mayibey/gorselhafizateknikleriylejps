/**
 * ER MEYDANI — saf oyun mantığı (platform-bağımsız, DB/IO YOK).
 * - Tohum (seed) tabanlı deterministik soru seçimi → aynı tohum iki telefonda BİREBİR aynı 10 soru
 *   (ağdan soru taşımaya gerek yok; canlı/arkadaş modunda yalnız tohum paylaşılır).
 * - Hız puanlaması: doğru = temel + kalan süreye orantılı bonus. Her cihaz KENDİ süresini ölçer
 *   (internet gecikmesi puanı bozmaz).
 * - Gölge rakip: tek başına (2. telefon olmadan) oynanabilsin diye tohumdan üretilen sahte rakip.
 *
 * NOT: Şık sırası KARIŞTIRILMAZ (bazı açıklamalar "(C) şıkkı" gibi harfe atıf yapar; sinav.ts ile aynı kural).
 */

import { KART_SORULARI, type KartSoru } from '../assets/kart-sorulari';

/** Bir maçtaki soru sayısı. */
export const SORU_SAYISI = 10;
/** Soru başına süre (canlı/süreli mod). ms. */
export const SORU_SURE_MS = 15000;
/** Soru başına puanlar: doğru = TEMEL + hız bonusu (max HIZ_BONUS). Yanlış/boş = 0. */
export const TEMEL_PUAN = 100;
export const HIZ_BONUS = 100;
/** Bir maçın teorik max puanı (sunucu da bu tavanla doğrular). */
export const MAX_PUAN = SORU_SAYISI * (TEMEL_PUAN + HIZ_BONUS); // 2000

/** Tohumlanabilir RNG (mulberry32) — aynı tohum → aynı dizi. */
export function rngOlustur(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Yeni bir maç tohumu (paylaşılabilir; arkadaş/canlı modda karşıya bu gider). */
export function seedUret(): number {
  return (Math.floor(Math.random() * 0x7fffffff) ^ Date.now()) >>> 0;
}

/** Fisher-Yates (enjekte RNG). Girdiyi mutasyona uğratmaz. */
function karistir<T>(dizi: readonly T[], rastgele: () => number): T[] {
  const a = [...dizi];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rastgele() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Tüm kanunların sorularını tek düz listeye toplar (id'ye göre STABİL sıra — memoize). */
let _tumSorular: KartSoru[] | null = null;
export function tumSorular(): KartSoru[] {
  if (_tumSorular) return _tumSorular;
  const hepsi: KartSoru[] = [];
  for (const lawId of Object.keys(KART_SORULARI)) {
    const grup = KART_SORULARI[Number(lawId)];
    if (grup) hepsi.push(...grup);
  }
  hepsi.sort((x, y) => (x.id < y.id ? -1 : x.id > y.id ? 1 : 0));
  _tumSorular = hepsi;
  return hepsi;
}

/**
 * Bir maçın sorularını döndürür — tohumdan deterministik (aynı tohum = aynı sorular, aynı sıra).
 * Ücretsiz havuz = TÜM sorular (oyun modu açık/ücretsiz; çalışma içeriği ayrı ve kilitli kalır).
 */
export function getErMeydaniSorulari(seed: number, adet: number = SORU_SAYISI): KartSoru[] {
  const havuz = tumSorular();
  if (havuz.length === 0) return [];
  return karistir(havuz, rngOlustur(seed)).slice(0, Math.min(adet, havuz.length));
}

/** Tek sorunun puanı: doğruysa temel + kalan süreye orantılı bonus; değilse 0. `sureMs` oda ayarı. */
export function puanSoru(dogruMu: boolean, gecenMs: number, sureMs: number = SORU_SURE_MS): number {
  if (!dogruMu) return 0;
  const kalanOran = Math.max(0, Math.min(1, (sureMs - gecenMs) / sureMs));
  return TEMEL_PUAN + Math.round(HIZ_BONUS * kalanOran);
}

/** Bir maçın adım adım cevaplarını toplam puana çevirir. */
export type MacAdim = { dogru: boolean; gecenMs: number; puan: number };
export function toplamPuan(adimlar: readonly MacAdim[]): number {
  return adimlar.reduce((t, a) => t + a.puan, 0);
}

/**
 * Değişken soru sayılı maçları sıralamada ADİL kılmak için puanı 0-2000 ölçeğine indirger
 * (ortalama-soru-puanı × 10). 20 soruluk oda 10 soruluğun iki katı sıralama puanı vermesin diye.
 */
export function normalizePuan(rawToplam: number, adet: number): number {
  if (adet <= 0) return 0;
  return Math.min(MAX_PUAN, Math.round((rawToplam / adet) * SORU_SAYISI));
}

// ── GÖLGE RAKİP (tek başına oynanabilsin diye) ─────────────────────────────
const GOLGE_ADLAR = [
  'Yıldırım', 'Şahin', 'Bozkurt', 'Demir', 'Kartal', 'Poyraz', 'Aslan',
  'Çelik', 'Volkan', 'Toros', 'Fırtına', 'Alperen', 'Doğan', 'Yiğit',
];
const GOLGE_UNVAN = ['J.Er', 'Uzm.Çvş', 'Uzm.Onb', 'J.Onb', 'Astsb.'];

export type GolgeRakip = { rumuz: string; adimlar: MacAdim[]; toplam: number };

/**
 * Tohumdan sahte ama gerçekçi bir rakip üretir (deterministik → tekrar oynanabilir).
 * `zorluk` = rakibin bir soruyu doğru bilme olasılığı (0.5 kolay … 0.8 zorlu).
 * Her adımda rakibin süresi 2–12 sn arası (insan gibi), puanı ona göre hesaplanır.
 */
export function golgeRakipUret(
  seed: number,
  adet: number = SORU_SAYISI,
  sureMs: number = SORU_SURE_MS,
  zorluk: number = 0.62,
): GolgeRakip {
  const r = rngOlustur((seed ^ 0x9e3779b9) >>> 0);
  const rumuz = `${GOLGE_UNVAN[Math.floor(r() * GOLGE_UNVAN.length)]} ${GOLGE_ADLAR[Math.floor(r() * GOLGE_ADLAR.length)]}`;
  const adimlar: MacAdim[] = [];
  for (let i = 0; i < adet; i++) {
    const dogru = r() < zorluk;
    const gecenMs = Math.round((0.15 + r() * 0.65) * sureMs); // süreye orantılı, insan gibi
    adimlar.push({ dogru, gecenMs, puan: puanSoru(dogru, gecenMs, sureMs) });
  }
  return { rumuz, adimlar, toplam: toplamPuan(adimlar) };
}
