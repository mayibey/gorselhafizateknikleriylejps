/**
 * Leitner kutu mantığı.
 *  - Biliyorum → kutu + 1
 *  - Tekrar    → kutu = 2
 *  - Zor       → kutu = 1
 * sonraki_tarih = bugün + [1, 2, 4, 7, 14, 30][min(kutu, 5)] gün
 */

export type SrsCevap = 'biliyorum' | 'tekrar' | 'zor';

const ARALIKLAR = [1, 2, 4, 7, 14, 30] as const;

/**
 * Bir Date'in YEREL (cihaz saat dilimi) takvim günü → YYYY-MM-DD. toISOString (UTC)
 * DEĞİL → gün sınırı yerel gece yarısı (00:00) olur. (UTC+3 Türkiye'de toISOString
 * günü 03:00'a kadar düne sabitliyordu → sayaçlar 00:00 yerine 03:00'da sıfırlanıyordu.)
 */
export function yerelISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const g = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${g}`;
}

/**
 * Bugünün YYYY-MM-DD değeri (YEREL gün). seed, recordReview, günlük sayaçlar ve kuyruk
 * "bugün" karşılaştırması HEPSİ bunu kullanır → tüm sayaçlar yerel gece 00:00'da sıfırlanır.
 */
export function bugunISO(): string {
  return yerelISO(new Date());
}

export function sonrakiKutu(mevcutKutu: number, cevap: SrsCevap): number {
  switch (cevap) {
    case 'biliyorum':
      return mevcutKutu + 1;
    case 'tekrar':
      return 2;
    case 'zor':
      return 1;
  }
}

/** YYYY-MM-DD formatında bir sonraki tekrar tarihi (YEREL gün — bugunISO ile tutarlı). */
export function sonrakiTarih(kutu: number, bugun: Date = new Date()): string {
  const gun = ARALIKLAR[Math.min(kutu, ARALIKLAR.length - 1)];
  const tarih = new Date(bugun);
  tarih.setDate(tarih.getDate() + gun);
  return yerelISO(tarih);
}

/** Bir cevaba göre yeni SRS durumunu (kutu + sonraki_tarih) hesaplar. */
export function srsGuncelle(
  mevcutKutu: number,
  cevap: SrsCevap,
  bugun: Date = new Date(),
): { kutu: number; sonraki_tarih: string } {
  const kutu = sonrakiKutu(mevcutKutu, cevap);
  return { kutu, sonraki_tarih: sonrakiTarih(kutu, bugun) };
}
