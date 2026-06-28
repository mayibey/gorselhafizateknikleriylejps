/**
 * Saf "kanun çalışma" kuyruğu (platform-bağımsız).
 * gunlukKuyruk'tan FARKI: due (sonraki_tarih) filtresi YOKTUR — kanunun TÜM
 * kartlarını döndürür. Hem web hem native AYNI bu fonksiyonu çağırır → parite.
 */

import type { CardWithLaw } from '@/db/schema';
import { birlesikUyeler } from '@/lib/birlesik';
import type { QueueCard, SrsDurum } from '@/lib/queue';

/**
 * Sıralama anahtarı:
 *  - Normal kart → madde numarası (TCK m.86 → 86).
 *  - Birleşik (ayırt/özet) kart → EN BÜYÜK üye madde + 0.5 → içerdiği tüm maddelerin
 *    kartlarından SONRA gelir (örn. m.21–22 ayırt, m.22'den sonra). Kullanıcı 22'yi görmeden
 *    ayırt kartı düşmez.
 */
function maddeSira(card: { gorsel_yolu: string | null; madde_no: string }): number {
  const uyeler = birlesikUyeler(card.gorsel_yolu);
  if (uyeler) return Math.max(...uyeler) + 0.5;
  const m = card.madde_no.match(/\d+/);
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
    .sort((a, b) => maddeSira(a) - maddeSira(b) || a.id - b.id);
}
