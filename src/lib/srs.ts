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
 * Bugünün YYYY-MM-DD (UTC) değeri. seed, recordReview ve kuyruk sorgusundaki
 * "bugün" karşılaştırması HEPSİ bunu kullanır ki tarih dilimi tutarlı olsun.
 */
export function bugunISO(): string {
  return new Date().toISOString().slice(0, 10);
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

/** YYYY-MM-DD formatında bir sonraki tekrar tarihi. */
export function sonrakiTarih(kutu: number, bugun: Date = new Date()): string {
  const gun = ARALIKLAR[Math.min(kutu, ARALIKLAR.length - 1)];
  const tarih = new Date(bugun);
  tarih.setDate(tarih.getDate() + gun);
  return tarih.toISOString().slice(0, 10);
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
