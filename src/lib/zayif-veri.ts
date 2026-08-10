/**
 * ZAYIF MEVZİ VERİSİ — ortak yükleyici (10 Ağu 2026).
 * Evsaf'taki özet kart ile yeni tam-sayfa /zayif-mevziler AYNI veriyi bu tek
 * fonksiyondan alır (kopya iş mantığı olmasın). Premium sızıntı kapısı ve
 * indirilmiş-içerik süzgeci sicil'deki davranışın birebir taşınmışıdır.
 */
import { getAllCards, getPerformans } from '@/db/database';
import { calisilabilirZayifMevzi, kartKlasoru } from '@/lib/gorsel-kaynak';
import { type EksikOzet, type ZayifKart, eksikOzet, zayifKartlar } from '@/lib/performans';
import { bugunISO } from '@/lib/srs';

export type ZayifVeri = {
  liste: ZayifKart[];
  ozet: EksikOzet;
  kilitli: number;
  inebilir: number;
  /** 7 gün önceki havuz büyüklüğü (gelişim cümlesi için; saf yeniden hesap). */
  haftaOnce: number;
  /** Bugünkü TÜM havuz (çalışılabilir süzgeci öncesi) — haftaOnce ile aynı ölçek. */
  simdiki: number;
};

export async function zayifVeriYukle(
  kanunErisilebilir: (klasor: string | null | undefined, blok?: string) => boolean,
): Promise<ZayifVeri> {
  const [perf, cards] = await Promise.all([getPerformans(), getAllCards()]);
  const tum = zayifKartlar(perf, cards);
  // PREMIUM SIZINTI KAPISI: çalışılabilir zayıf listesi yalnız ERİŞİLEBİLİR kanunları içerir.
  const liste = calisilabilirZayifMevzi(tum).filter((z) =>
    kanunErisilebilir(kartKlasoru(z.card.gorsel_yolu), z.card.blok),
  );
  const calisSet = new Set(liste.map((z) => z.card.id));
  const disari = tum.filter((z) => !calisSet.has(z.card.id));
  const kilitli = disari.filter(
    (z) => !kanunErisilebilir(kartKlasoru(z.card.gorsel_yolu), z.card.blok),
  ).length;
  // GELİŞİM: havuz saf fonksiyon → 7 gün önceki kayıtlarla yeniden hesapla.
  const esik = new Date(Date.parse(`${bugunISO()}T00:00:00Z`) - 7 * 86400000)
    .toISOString()
    .slice(0, 10);
  const haftaOnce = zayifKartlar(perf.filter((p) => p.tarih <= esik), cards).length;
  return {
    liste,
    ozet: eksikOzet(perf, cards),
    kilitli,
    inebilir: disari.length - kilitli,
    haftaOnce,
    simdiki: tum.length,
  };
}
