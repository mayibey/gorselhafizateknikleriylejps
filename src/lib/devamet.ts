/**
 * "En son çalışılan kanun" türetme (saf mantık — IO yok, Date.now() yok).
 * Kaynak: kart_performans log'u (her review bir satır, kronolojik). srs'te
 * timestamp YOK; bu yüzden son 'calisma' satırından law'a inilir. Migration yok.
 * Girdiler dışarıdan enjekte edilir (stats.ts/patika.ts deseni) → test edilebilir.
 */

import type { PerformansSatir } from '@/db/schema';

export type DevamEtSonuc =
  | { tip: 'yok' } // hiç çalışma yok → Devam Et kartı gizlenir
  | { tip: 'devam'; lawId: number } // son çalışılan kanun, %<100 → devam et
  | { tip: 'siradaki'; lawId: number } // son kanun %100 → en ilerlemiş %<100 kanun
  | { tip: 'hepsiBitti' }; // tüm kanunlar %100

type Ilerleme = { calisilan: number; toplam: number };

/** lawId'nin tamamlanma yüzdesi (0..100); toplam 0 ise 0. */
function yuzdesi(lawIlerleme: Map<number, Ilerleme>, lawId: number): number {
  const il = lawIlerleme.get(lawId);
  if (!il || il.toplam === 0) return 0;
  return (il.calisilan / il.toplam) * 100;
}

/**
 * @param perf        getPerformans() sonucu (KRONOLOJİK — son eleman en yeni)
 * @param cardLawMap  card_id → law_id (getAllCards'tan)
 * @param lawIlerleme law_id → {calisilan, toplam} (Mevzuat'ın kurduğu map)
 */
export function sonCalisilanKanun(
  perf: PerformansSatir[],
  cardLawMap: Map<number, number>,
  lawIlerleme: Map<number, Ilerleme>,
): DevamEtSonuc {
  // Sondan başa: ilk çözülebilen 'calisma' satırı → son çalışılan kanun.
  let sonLawId: number | null = null;
  for (let i = perf.length - 1; i >= 0; i--) {
    if (perf[i].kaynak !== 'calisma') continue;
    const lawId = cardLawMap.get(perf[i].card_id);
    if (lawId !== undefined) {
      sonLawId = lawId;
      break;
    }
  }
  if (sonLawId === null) return { tip: 'yok' };

  if (yuzdesi(lawIlerleme, sonLawId) < 100) return { tip: 'devam', lawId: sonLawId };

  // Son kanun %100 → sıradaki: %<100 kanunlardan EN İLERLEMİŞ
  // (en yüksek yuzde; eşitlikte en çok calisilan; o da eşitse en düşük lawId).
  let enIyi: { lawId: number; yuzde: number; calisilan: number } | null = null;
  for (const [lawId, il] of lawIlerleme) {
    if (il.toplam === 0) continue;
    const y = (il.calisilan / il.toplam) * 100;
    if (y >= 100) continue;
    const dahaIyi =
      enIyi === null ||
      y > enIyi.yuzde ||
      (y === enIyi.yuzde && il.calisilan > enIyi.calisilan) ||
      (y === enIyi.yuzde && il.calisilan === enIyi.calisilan && lawId < enIyi.lawId);
    if (dahaIyi) enIyi = { lawId, yuzde: y, calisilan: il.calisilan };
  }
  return enIyi ? { tip: 'siradaki', lawId: enIyi.lawId } : { tip: 'hepsiBitti' };
}
