/**
 * Birleşik (ayırt/özet) kart yardımcıları — platform-bağımsız, saf.
 *
 * Bir "ayırt"/"özet" kartı BİRDEN ÇOK maddeyi tek görselde birleştirir. Üye madde
 * numaraları görsel anahtarında kodludur (örn. "tck_ayirt_m247_250_252" → 247,250,252;
 * "tck_ozet_m37_44" → 37,44). Seed (patika bağlama) ve kanunKuyrugu (sıralama) bu TEK
 * kaynaktan üye listesini okur → kart, içerdiği TÜM maddeler görüldükten SONRA gelir.
 */

/**
 * Görsel anahtarından birleşik kartın ÜYE madde numaraları.
 * - Çok üyeli ayırt/özet → [a, b, ...] (görseldeki sıra).
 * - Tek üyeli ayırt (örn. "eimza_ayirt_m4") veya birleşik OLMAYAN kart → null.
 */
export function birlesikUyeler(gorselYolu: string | null | undefined): number[] | null {
  if (!gorselYolu) return null;
  const us = gorselYolu.indexOf('_');
  if (us < 0) return null;
  const geri = gorselYolu.slice(us + 1); // 'ayirt_m247_250_252' | 'ozet_m37_44' | 'm35_1'
  let govde: string | null = null;
  if (geri.startsWith('ayirt_m')) govde = geri.slice(7);
  else if (geri.startsWith('ozet_m')) govde = geri.slice(6);
  if (govde === null) return null;
  const uyeler = govde
    .split('_')
    .filter((s) => /^\d+$/.test(s))
    .map(Number);
  return uyeler.length > 1 ? uyeler : null;
}

/** Ayırt/özet kartının üye maddeleri + tipi (TEK üyeli de DAHİL — patika düğüm adı için). */
export type AyirtOzet = { uyeler: number[]; tip: 'ayırt' | 'özet' };

/**
 * Bir ayırt/özet kartının üyeleri + tipi. `birlesikUyeler`'den FARKI: tek üyeli kartı da
 * döndürür (örn. "eimza_ayirt_m4" → {uyeler:[4], tip:'ayırt'}) ve tip bilgisini taşır →
 * patikada her ayırt/özet kartına KENDİ düğümü ("Madde 35–36 ayırt") verilir.
 * Birleşik (ayırt/özet) olmayan veya madde-no'suz genel-özet (ozet_tutar) → null.
 */
export function ayirtOzetBilgi(gorselYolu: string | null | undefined): AyirtOzet | null {
  if (!gorselYolu) return null;
  const us = gorselYolu.indexOf('_');
  if (us < 0) return null;
  const geri = gorselYolu.slice(us + 1);
  let tip: 'ayırt' | 'özet' | null = null;
  let govde: string | null = null;
  if (geri.startsWith('ayirt_m')) {
    tip = 'ayırt';
    govde = geri.slice(7);
  } else if (geri.startsWith('ozet_m')) {
    tip = 'özet';
    govde = geri.slice(6);
  }
  if (!tip || !govde) return null;
  const uyeler = govde
    .split('_')
    .filter((s) => /^\d+$/.test(s))
    .map(Number);
  return uyeler.length ? { uyeler, tip } : null;
}

/** Ayırt/özet düğümünün adı: "Madde 35–36 ayırt" / "Madde 247–250–252 özet" / "Madde 4 ayırt". */
export function birlesikDugumAd(bilgi: AyirtOzet): string {
  return `Madde ${bilgi.uyeler.join('–')} ${bilgi.tip}`;
}
