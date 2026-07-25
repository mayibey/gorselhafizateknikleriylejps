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

import { DUELLO_SORULARI, type DuelloSoru } from '../assets/duello-sorulari';

export type { DuelloSoru } from '../assets/duello-sorulari';
import { DUELLO_KANUNLAR } from '../assets/duello-kanunlar';
export { DUELLO_KANUNLAR };

/** Branş slug → branch_id (SEED_BRANCHES ile birebir; er-meydani kanun gruplaması için). */
export const BRANS_SLUG_ID: Record<string, number> = {
  jandarma: 1, mebs: 2, havacilik: 3, personel: 4, maliye: 5, istihkam: 6, ikmal: 7,
  bakim: 8, bando: 9, tabip: 10, dis_tabibi: 11, eczaci: 12, saglik: 13, kimyager: 14,
  veteriner: 15, muhendis: 16,
};

export type SeciciKanun = { id: number; ad: string };
/**
 * Kullanıcının Er Meydanı'nda SEÇEBİLECEĞİ kanunlar: müşterek (herkese) + KENDİ branşı.
 * Kategorizasyon law_id/blok ile (duello-kanunlar.ts, seed.ts kanonik) → karışma yok.
 */
export function kullaniciKanunlari(bransSlug: string | null): { musterek: SeciciKanun[]; brans: SeciciKanun[] } {
  const bid = bransSlug ? BRANS_SLUG_ID[bransSlug] : undefined;
  const musterek: SeciciKanun[] = [];
  const brans: SeciciKanun[] = [];
  for (const k of DUELLO_KANUNLAR) {
    if (k.blok === 'müşterek') musterek.push({ id: k.id, ad: k.ad });
    else if (bid && k.branslar.includes(bid)) brans.push({ id: k.id, ad: k.ad });
  }
  return { musterek, brans };
}

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

/** Düello soru bankası (codegen'de id'ye göre stabil sıralı; tohumlu karıştırmanın tabanı). */
export function tumSorular(): DuelloSoru[] {
  return DUELLO_SORULARI;
}

/**
 * Bir maçın sorularını döndürür — tohumdan deterministik (aynı tohum = aynı sorular, aynı sıra).
 * Ücretsiz havuz = TÜM düello bankası (1992 soru; oyun modu açık/ücretsiz; çalışma içeriği ayrı).
 */
export function getErMeydaniSorulari(
  seed: number,
  adet: number = SORU_SAYISI,
  kanunlar?: number[],
): DuelloSoru[] {
  let havuz = tumSorular();
  if (kanunlar && kanunlar.length > 0) {
    const set = new Set(kanunlar);
    const filtre = havuz.filter((q) => set.has(q.kanun));
    if (filtre.length > 0) havuz = filtre; // seçili kanunda soru yoksa tüm havuza düş (boş maç olmasın)
  }
  if (havuz.length === 0) return [];
  return karistir(havuz, rngOlustur(seed)).slice(0, Math.min(adet, havuz.length));
}

/** Tek sorunun puanı: doğruysa temel + kalan süreye orantılı bonus; değilse 0. `sureMs` oda ayarı. */
export function puanSoru(dogruMu: boolean, gecenMs: number, sureMs: number = SORU_SURE_MS): number {
  if (!dogruMu) return 0;
  const kalanOran = Math.max(0, Math.min(1, (sureMs - gecenMs) / sureMs));
  return TEMEL_PUAN + Math.round(HIZ_BONUS * kalanOran);
}

/** Bir maçın adım adım cevaplarını toplam puana çevirir. `secilen` = oyuncunun işaretlediği şık (inceleme için). */
export type MacAdim = { dogru: boolean; gecenMs: number; puan: number; secilen?: number | null };
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
