/**
 * Premium ürün ID'leri — Play Console'da BU ID'lerle oluşturulacak (build yüklendikten sonra).
 * Kod ile Play Console BİREBİR aynı olmalı.
 */

// Yıllık abonelik (Play "subscription" ürünü, yıllık base plan).
export const URUN_YILLIK = 'premium_yillik';
// Ömür boyu (Play "tek seferlik / managed" ürünü).
export const URUN_OMURBOYU = 'premium_omurboyu';

// expo-iap sorgu listeleri (abonelik vs tek-seferlik ayrı API).
export const ABONELIK_URUNLERI = [URUN_YILLIK];
export const TEK_SEFERLIK_URUNLERI = [URUN_OMURBOYU];

/**
 * ÜCRETSİZ (tadımlık) kanunlar — premium gerektirmez. Sadece TCK (ilk konu) + denemesi.
 * Klasör adıyla (LAW_KLASOR değeri). Gerisi premium.
 */
export const UCRETSIZ_KANUNLAR = ['tck'];

/** Bir kanun (klasör) ücretsiz tadımlık mı? */
export function ucretsizKanun(klasor: string | null | undefined): boolean {
  return !!klasor && UCRETSIZ_KANUNLAR.includes(klasor);
}
