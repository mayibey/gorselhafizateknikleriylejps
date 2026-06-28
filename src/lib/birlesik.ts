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
