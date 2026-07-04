/**
 * Premium ürün ID'leri — Play Console'da BU ID'lerle oluşturulacak. Kod ile BİREBİR aynı olmalı.
 * Model: 2 KATEGORİ (müşterek / branş) × 2 SEÇENEK (yıllık abonelik / ömür boyu tek-seferlik)
 * + PAKET (müşterek+branş birlikte, avantajlı) + YÜKSELTME (yıllıktan ömür boyuna FARK fiyatı).
 * Sunucu eşleşmesi: supabase/functions/dogrula-satinalma URUNLER seti — İKİSİ BİRLİKTE güncellenir.
 */

// MÜŞTEREK (ortak) konular
export const URUN_MUSTEREK_YILLIK = 'musterek_yillik'; // abonelik
export const URUN_MUSTEREK_OMURBOYU = 'musterek_omurboyu'; // tek seferlik

// BRANŞ konuları
export const URUN_BRANS_YILLIK = 'brans_yillik'; // abonelik
export const URUN_BRANS_OMURBOYU = 'brans_omurboyu'; // tek seferlik

// PAKET (müşterek + branş birlikte — iki kategoriye birden hak verir)
export const URUN_PAKET_YILLIK = 'paket_yillik'; // abonelik
export const URUN_PAKET_OMURBOYU = 'paket_omurboyu'; // tek seferlik

// YÜKSELTME: aktif YILLIK sahibi ömür boyuna FARK fiyatıyla geçer (tek seferlik; sunucu
// aktif yıllık şartını da denetler). Hak olarak o kategorinin ömür boyusu sayılır.
export const URUN_MUSTEREK_YUKSELTME = 'musterek_omurboyu_yukseltme';
export const URUN_BRANS_YUKSELTME = 'brans_omurboyu_yukseltme';

// expo-iap sorgu listeleri (abonelik vs tek-seferlik ayrı API)
export const ABONELIK_URUNLERI = [URUN_MUSTEREK_YILLIK, URUN_BRANS_YILLIK, URUN_PAKET_YILLIK];
export const TEK_SEFERLIK_URUNLERI = [
  URUN_MUSTEREK_OMURBOYU,
  URUN_BRANS_OMURBOYU,
  URUN_PAKET_OMURBOYU,
  URUN_MUSTEREK_YUKSELTME,
  URUN_BRANS_YUKSELTME,
];

// Kategoriye göre gruplar (hak hesabı için) — paket İKİ kategoriye de hak verir
export const MUSTEREK_URUNLERI = [
  URUN_MUSTEREK_YILLIK,
  URUN_MUSTEREK_OMURBOYU,
  URUN_MUSTEREK_YUKSELTME,
  URUN_PAKET_YILLIK,
  URUN_PAKET_OMURBOYU,
];
export const BRANS_URUNLERI = [
  URUN_BRANS_YILLIK,
  URUN_BRANS_OMURBOYU,
  URUN_BRANS_YUKSELTME,
  URUN_PAKET_YILLIK,
  URUN_PAKET_OMURBOYU,
];

/**
 * KİLİT ANA ŞALTERİ (tek nokta).
 *  - `false` → HİÇBİR içerik kilitlenmez, her şey açık (kapalı test / geliştirme).
 *  - `true`  → ödeme kilidi devrede: TCK + denemesi ücretsiz, gerisi ilgili hakka bağlı.
 * `kanunErisilebilir` bunu ilk satırda kontrol eder → tüm ekranlar tek yerden açılıp kapanır.
 * NOT: Bunu değiştirmek yeni derleme (build) gerektirir; test edenlere ancak yeni sürümle yansır.
 * ⚠️ true (3 Tem, final): TCK+denemesi ücretsiz, gerisi ödeme ister. Testerların erişmesi için
 *    Play'de ürünlerin OLUŞTURULMUŞ + ödeme profilinin DOĞRULANMIŞ olması ŞART (yoksa TCK hariç kilitli).
 */
export const KILIT_AKTIF = true;

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
export type UrunBilgi = {
  kategori: 'Müşterek' | 'Branş' | 'Müşterek + Branş';
  tip: 'Ömür boyu' | 'Yıllık';
  ad: string;
};
export function urunBilgi(urun: string): UrunBilgi | null {
  const paketMi = urun === URUN_PAKET_YILLIK || urun === URUN_PAKET_OMURBOYU;
  const kategori = paketMi
    ? 'Müşterek + Branş'
    : MUSTEREK_URUNLERI.includes(urun)
      ? 'Müşterek'
      : BRANS_URUNLERI.includes(urun)
        ? 'Branş'
        : null;
  if (!kategori) return null;
  const tip = ABONELIK_URUNLERI.includes(urun) ? 'Yıllık' : 'Ömür boyu';
  return { kategori, tip, ad: `${kategori} · ${tip}` };
}
