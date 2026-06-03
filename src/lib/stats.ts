/**
 * Saf istatistik hesabı (platform-bağımsız).
 * Hem web (MemoryBackend tüketicisi) hem native AYNI bu fonksiyonu çağırır →
 * iki platformda birebir aynı istatistik üretilir. DB/IO yok; srs.ts gibi test edilebilir.
 */

import type { CardWithSrs } from '@/db/schema';

/** kutu >= bu eşik ise kart "öğrenildi" sayılır (Hazırlık % payı). */
export const OGRENILDI_KUTU = 4;

/** En yüksek Leitner kutusu (dağılım bunda toplanır; kutu 6+ → 6). */
export const MAKS_KUTU = 6;

/** kutu (1..6) → o kutudaki kart adedi. */
export type KutuDagilimi = Record<number, number>;

export interface Istatistik {
  /** srs satırı olan (en az bir kez çalışılmış) kart sayısı. */
  calisilanKart: number;
  /** Toplam kart sayısı (payda). */
  toplamKart: number;
  /** kutu >= OGRENILDI_KUTU olan kart sayısı. */
  ogrenilenKart: number;
  /** round(ogrenilenKart / toplamKart * 100); toplam 0 ise 0. */
  hazirlikYuzde: number;
  /** kutu 1..6 için adet (her kutu anahtarı her zaman bulunur). */
  kutuDagilimi: KutuDagilimi;
}

/**
 * Çalışılmış kartlar (CardWithSrs[], kutu içerir) + toplam kart sayısından
 * istatistikleri hesaplar. studied yalnızca srs satırı olan kartları içerir.
 */
export function hesaplaIstatistik(studied: CardWithSrs[], toplamKart: number): Istatistik {
  // kutu >= 1 = en az bir kez çalışılmış. Parite notu: web getStudyCards TÜM
  // kartları döndürür (çalışılmamış → kutu 0), native yalnız srs satırı olanları.
  // kutu >= 1 filtresi ikisinde de AYNI "çalışılmış" kümesini verir
  // (recordReview asla kutu 0 üretmez → kutu>=1 ⟺ çalışılmış).
  const calisilan = studied.filter((c) => c.kutu >= 1);

  const calisilanKart = calisilan.length;
  const ogrenilenKart = calisilan.filter((c) => c.kutu >= OGRENILDI_KUTU).length;
  const hazirlikYuzde = toplamKart > 0 ? Math.round((ogrenilenKart / toplamKart) * 100) : 0;

  const kutuDagilimi: KutuDagilimi = {};
  for (let k = 1; k <= MAKS_KUTU; k++) kutuDagilimi[k] = 0;
  for (const c of calisilan) {
    const k = Math.min(c.kutu, MAKS_KUTU);
    kutuDagilimi[k] += 1;
  }

  return { calisilanKart, toplamKart, ogrenilenKart, hazirlikYuzde, kutuDagilimi };
}
