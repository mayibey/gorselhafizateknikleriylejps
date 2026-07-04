/**
 * Premium ürünleri — TEK KAPSAM modeli (4 Tem revizyonu, başkan kararı):
 * uygulamanın TAMAMI iki üründen biriyle açılır → YILLIK (abonelik) ya da ÖMÜR BOYU (tek seferlik).
 * + YÜKSELTME: aktif yıllık sahibi FARK fiyatıyla ömür boyuna geçer.
 * (Eski müşterek/branş/paket ayrımı KALDIRILDI — branş içeriği üretilmeyecek; eski ürün ID'leri
 * geriye uyum için ESKI_PREMIUM_URUNLERI'nde tutulur: geçmiş satın almalar premium saymaya devam eder.)
 * Play tarafında satılan ID'ler: musterek_yillik / musterek_omurboyu / musterek_omurboyu_yukseltme
 * (ID'ler Play'de değiştirilemez; mağaza görünen adları "Tam Erişim – ..." olarak güncellendi).
 * Sunucu eşleşmesi: supabase/functions/dogrula-satinalma URUNLER seti.
 */

// SATILAN ürünler
export const URUN_YILLIK = 'musterek_yillik'; // abonelik — tüm içerik 1 yıl
export const URUN_OMURBOYU = 'musterek_omurboyu'; // tek seferlik — tüm içerik ömür boyu
export const URUN_YUKSELTME = 'musterek_omurboyu_yukseltme'; // tek seferlik — yıllıktan ömür boyuna FARK

// expo-iap sorgu listeleri (abonelik vs tek-seferlik ayrı API)
export const ABONELIK_URUNLERI = [URUN_YILLIK];
export const TEK_SEFERLIK_URUNLERI = [URUN_OMURBOYU, URUN_YUKSELTME];

// Eski model ürünleri (artık SATILMAZ; geçmiş satın alma/geri yükleme premium saysın diye tanınır)
export const ESKI_PREMIUM_URUNLERI = [
  'brans_yillik',
  'brans_omurboyu',
  'brans_omurboyu_yukseltme',
  'paket_yillik',
  'paket_omurboyu',
];

/** uyelik_haklari'nda premium sayılan TÜM ürünler (satılan + eski). */
export const PREMIUM_URUNLERI = [
  URUN_YILLIK,
  URUN_OMURBOYU,
  URUN_YUKSELTME,
  ...ESKI_PREMIUM_URUNLERI,
];

/**
 * KİLİT ANA ŞALTERİ (tek nokta).
 *  - `false` → HİÇBİR içerik kilitlenmez, her şey açık (kapalı test / geliştirme).
 *  - `true`  → ödeme kilidi devrede: TCK + denemesi ücretsiz, gerisi premium'a bağlı.
 * `kanunErisilebilir` bunu ilk satırda kontrol eder → tüm ekranlar tek yerden açılıp kapanır.
 * NOT: Bunu değiştirmek yeni derleme (build) gerektirir; test edenlere ancak yeni sürümle yansır.
 */
export const KILIT_AKTIF = true;

/** ÜCRETSİZ (tadımlık) kanunlar — premium gerektirmez. Sadece TCK (ilk konu) + denemesi. */
export const UCRETSIZ_KANUNLAR = ['tck'];

/** Bir kanun (klasör) ücretsiz tadımlık mı? */
export function ucretsizKanun(klasor: string | null | undefined): boolean {
  return !!klasor && UCRETSIZ_KANUNLAR.includes(klasor);
}

/** Ürün ID → okunabilir ad/tip (Üyeliğim kartı + taç etiketi için). Bilinmeyen ürün → null. */
export type UrunBilgi = { tip: 'Ömür boyu' | 'Yıllık'; ad: string };
export function urunBilgi(urun: string): UrunBilgi | null {
  if (!PREMIUM_URUNLERI.includes(urun)) return null;
  const yillikMi = urun === URUN_YILLIK || urun === 'brans_yillik' || urun === 'paket_yillik';
  return yillikMi
    ? { tip: 'Yıllık', ad: 'Tam Erişim · Yıllık' }
    : { tip: 'Ömür boyu', ad: 'Tam Erişim · Ömür Boyu' };
}
