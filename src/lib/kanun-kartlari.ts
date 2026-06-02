/**
 * Saf "kanun çalışma" kuyruğu (platform-bağımsız).
 * gunlukKuyruk'tan FARKI: due (sonraki_tarih) filtresi YOKTUR — kanunun TÜM
 * kartlarını döndürür. Hem web hem native AYNI bu fonksiyonu çağırır → parite.
 */

import type { CardWithLaw } from '@/db/schema';
import type { QueueCard, SrsDurum } from '@/lib/queue';

/** Madde numarasındaki ilk tam sayıyı sıralama anahtarı yapar (TCK m.86 → 86). */
function maddeSira(maddeNo: string): number {
  const m = maddeNo.match(/\d+/);
  return m ? Number(m[0]) : Number.MAX_SAFE_INTEGER;
}

/**
 * Bir kanunun TÜM kartları, SRS durumuyla. srs yoksa kutu:0, yeni:true.
 * Madde numarasına göre artan (eşitlikte id) sıralı.
 */
export function kanunKuyrugu(
  cards: CardWithLaw[],
  srsMap: ReadonlyMap<number, SrsDurum>,
): QueueCard[] {
  return cards
    .map((card): QueueCard => {
      const s = srsMap.get(card.id);
      return s
        ? { ...card, kutu: s.kutu, sonraki_tarih: s.sonraki_tarih, yeni: false }
        : { ...card, kutu: 0, sonraki_tarih: '', yeni: true };
    })
    .sort((a, b) => maddeSira(a.madde_no) - maddeSira(b.madde_no) || a.id - b.id);
}
