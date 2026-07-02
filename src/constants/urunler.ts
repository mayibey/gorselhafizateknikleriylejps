/**
 * Premium ürün ID'leri — Play Console'da BU ID'lerle oluşturulacak. Kod ile BİREBİR aynı olmalı.
 * Model: 2 KATEGORİ (müşterek / branş) × 2 SEÇENEK (yıllık abonelik / ömür boyu tek-seferlik).
 */

// MÜŞTEREK (ortak) konular
export const URUN_MUSTEREK_YILLIK = 'musterek_yillik'; // abonelik
export const URUN_MUSTEREK_OMURBOYU = 'musterek_omurboyu'; // tek seferlik

// BRANŞ konuları
export const URUN_BRANS_YILLIK = 'brans_yillik'; // abonelik
export const URUN_BRANS_OMURBOYU = 'brans_omurboyu'; // tek seferlik

// expo-iap sorgu listeleri (abonelik vs tek-seferlik ayrı API)
export const ABONELIK_URUNLERI = [URUN_MUSTEREK_YILLIK, URUN_BRANS_YILLIK];
export const TEK_SEFERLIK_URUNLERI = [URUN_MUSTEREK_OMURBOYU, URUN_BRANS_OMURBOYU];

// Kategoriye göre gruplar (hak hesabı için)
export const MUSTEREK_URUNLERI = [URUN_MUSTEREK_YILLIK, URUN_MUSTEREK_OMURBOYU];
export const BRANS_URUNLERI = [URUN_BRANS_YILLIK, URUN_BRANS_OMURBOYU];

/**
 * KİLİT ANA ŞALTERİ (tek nokta).
 *  - `false` → HİÇBİR içerik kilitlenmez, her şey açık (kapalı test / geliştirme).
 *  - `true`  → ödeme kilidi devrede: TCK + denemesi ücretsiz, gerisi ilgili hakka bağlı.
 * `kanunErisilebilir` bunu ilk satırda kontrol eder → tüm ekranlar tek yerden açılıp kapanır.
 * NOT: Bunu değiştirmek yeni derleme (build) gerektirir; test edenlere ancak yeni sürümle yansır.
 */
export const KILIT_AKTIF = false;

/** ÜCRETSİZ (tadımlık) kanunlar — premium gerektirmez. Sadece TCK (ilk müşterek konu) + denemesi. */
export const UCRETSIZ_KANUNLAR = ['tck'];

/** Bir kanun (klasör) ücretsiz tadımlık mı? */
export function ucretsizKanun(klasor: string | null | undefined): boolean {
  return !!klasor && UCRETSIZ_KANUNLAR.includes(klasor);
}

/** Bir law.blok değeri müşterek mi (değilse branş bloğu). */
export function musterekBlokMu(blok: string | null | undefined): boolean {
  return (blok ?? '').toLocaleLowerCase('tr') === 'müşterek';
}

/** Ürün ID → okunabilir kategori/tip (Üyeliğim kartı + taç etiketi için). Bilinmeyen ürün → null. */
export type UrunBilgi = { kategori: 'Müşterek' | 'Branş'; tip: 'Ömür boyu' | 'Yıllık'; ad: string };
export function urunBilgi(urun: string): UrunBilgi | null {
  const kategori = MUSTEREK_URUNLERI.includes(urun)
    ? 'Müşterek'
    : BRANS_URUNLERI.includes(urun)
      ? 'Branş'
      : null;
  if (!kategori) return null;
  const tip = ABONELIK_URUNLERI.includes(urun) ? 'Yıllık' : 'Ömür boyu';
  return { kategori, tip, ad: `${kategori} · ${tip}` };
}
