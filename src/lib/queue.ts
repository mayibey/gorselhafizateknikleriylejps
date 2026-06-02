/**
 * Saf günlük kuyruk mantığı (platform-bağımsız).
 * Hem web (MemoryBackend) hem native (SqliteBackend) ham veriyi çekip AYNI
 * bu fonksiyonu çağırır → iki platformda birebir aynı kuyruk üretilir.
 */

import type { CardWithLaw, CardWithSrs } from '@/db/schema';

/** Tek yerden günlük yeni kart limiti. */
export const YENI_LIMIT = 8;

/** srs satırının kuyruk için gereken alanları (card_id hariç). */
export type SrsDurum = { kutu: number; sonraki_tarih: string };

/** Kuyruktaki kart: SRS durumu + "yeni mi tekrar mı" işareti. */
export type QueueCard = CardWithSrs & { yeni: boolean };

/**
 * Bugünün kuyruğu:
 *  - Tekrar (due): srs kaydı olan ve sonraki_tarih <= bugün olan kartlar.
 *  - Yeni: srs kaydı OLMAYAN kartlar, en fazla yeniLimit adet.
 * Sıralama: önce due (sonraki_tarih artan, eşitlikte id), sonra yeni.
 * Yeni kart için kutu = 0 kabul edilir (ilk cevapta srsGuncelle(0, ...)).
 */
export function gunlukKuyruk(
  cards: CardWithLaw[],
  srsMap: ReadonlyMap<number, SrsDurum>,
  bugun: string,
  yeniLimit: number = YENI_LIMIT,
): QueueCard[] {
  const due: QueueCard[] = [];
  const yeni: QueueCard[] = [];

  for (const card of cards) {
    const s = srsMap.get(card.id);
    if (s) {
      if (s.sonraki_tarih <= bugun) {
        due.push({ ...card, kutu: s.kutu, sonraki_tarih: s.sonraki_tarih, yeni: false });
      }
    } else {
      yeni.push({ ...card, kutu: 0, sonraki_tarih: '', yeni: true });
    }
  }

  due.sort((a, b) =>
    a.sonraki_tarih < b.sonraki_tarih ? -1 : a.sonraki_tarih > b.sonraki_tarih ? 1 : a.id - b.id,
  );

  return [...due, ...yeni.slice(0, yeniLimit)];
}
