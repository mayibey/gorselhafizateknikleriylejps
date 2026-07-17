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

// PROMOSYON ürünleri — Play'de SATILMAZ; promo kodu kullanınca sunucu (promo_kullan RPC)
// bu ürünle uyelik_haklari satırı açar. Premium sayılır (Play satın almasıyla aynı hak).
export const URUN_PROMO_YILLIK = 'promo_yillik'; // abonelik — süreli (kod tanımına göre gün)
export const URUN_PROMO_OMURBOYU = 'promo_omurboyu'; // omurboyu — süresiz
export const PROMO_URUNLERI = [URUN_PROMO_YILLIK, URUN_PROMO_OMURBOYU];

/**
 * İNDİRİM KODU — YILLIK üyelikte gerçek %X indirim (bedava DEĞİL; kişi indirimli öder, para Google'dan).
 * Play Console'da yıllık base plana bu offerId ile bir "promosyon teklifi" (%X, uygunluk=developer
 * determined) açılır. İndirim kodu kullanan kullanıcıya satın almada TEMEL teklif yerine bu teklif
 * gösterilir → Google az tahsil eder. Sunucudaki indirim_kodlari.offer_id bununla EŞLEŞMELİ.
 * NOT: Play tarafı ödeme profili aktif olunca kurulur/test edilir; buraya kadar hazır.
 */
export const INDIRIM_OFFER_ID = 'indirim20';

/**
 * İNDİRİMLİ ÖMÜR BOYU ürünleri — Google tek seferlik üründe "kodla % teklif" desteklemez, o yüzden
 * indirim ömür boyunda AYRI ürünle uygulanır: eligible kullanıcıya app bu ucuz SKU'yu satın aldırır.
 * Play'de %80/%70 fiyatla açılır (ödeme profili sonrası). Sunucu (indirim_durumu.omurboyu_urun) hangi
 * SKU'nun kullanılacağını söyler. dogrula-satinalma bu SKU'ları omurboyu premium sayar.
 */
export const URUN_OMURBOYU_I20 = 'musterek_omurboyu_i20'; // %20 indirimli ömür boyu
export const URUN_OMURBOYU_I30 = 'musterek_omurboyu_i30'; // %30 indirimli ömür boyu
export const INDIRIMLI_OMURBOYU_URUNLERI = [URUN_OMURBOYU_I20, URUN_OMURBOYU_I30];

// Eski model ürünleri (artık SATILMAZ; geçmiş satın alma/geri yükleme premium saysın diye tanınır)
export const ESKI_PREMIUM_URUNLERI = [
  'brans_yillik',
  'brans_omurboyu',
  'brans_omurboyu_yukseltme',
  'paket_yillik',
  'paket_omurboyu',
];

/** uyelik_haklari'nda premium sayılan TÜM ürünler (satılan + indirimli ömür boyu + promo + eski). */
export const PREMIUM_URUNLERI = [
  URUN_YILLIK,
  URUN_OMURBOYU,
  URUN_YUKSELTME,
  ...INDIRIMLI_OMURBOYU_URUNLERI,
  ...PROMO_URUNLERI,
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

/** ÜCRETSİZ (tadımlık) kanunlar — premium gerektirmez. TCK hem müşterek ('tck') hem branş ('brtck'):
 * ikisinin de kartları + kanun denemeleri herkese açık; gerisi premium. */
export const UCRETSIZ_KANUNLAR = ['tck', 'brtck'];

/** Bir kanun (klasör) ücretsiz tadımlık mı? */
export function ucretsizKanun(klasor: string | null | undefined): boolean {
  return !!klasor && UCRETSIZ_KANUNLAR.includes(klasor);
}

/** Genel deneme (Tatbikat sınavı) erişilebilir mi? Başkan kararı: tatbikat sınavları HERKESE
 * ücretsiz (müşterek + branş genel denemeleri). Kanun denemeleri TCK dışında premium kalır. */
export function genelDenemeErisilebilir(): boolean {
  return true;
}

/**
 * SAF premium kilidi — reaktif context DIŞINDA da (kuyruk süzme, hook) kullanılır. Davranış:
 * KILIT_AKTIF kapalı → açık; ücretsiz TCK → açık; aksi → premium şart. (uyelik-context bunu çağırır.)
 */
export function kanunErisilebilirSaf(klasor: string | null | undefined, premium: boolean): boolean {
  if (!KILIT_AKTIF) return true;
  if (ucretsizKanun(klasor)) return true;
  return premium;
}

/** Ürün ID → okunabilir ad/tip (Üyeliğim kartı + taç etiketi için). Bilinmeyen ürün → null. */
export type UrunBilgi = { tip: 'Ömür boyu' | 'Yıllık'; ad: string };
export function urunBilgi(urun: string): UrunBilgi | null {
  if (!PREMIUM_URUNLERI.includes(urun)) return null;
  const yillikMi =
    urun === URUN_YILLIK ||
    urun === URUN_PROMO_YILLIK ||
    urun === 'brans_yillik' ||
    urun === 'paket_yillik';
  return yillikMi
    ? { tip: 'Yıllık', ad: 'Tam Erişim · Yıllık' }
    : { tip: 'Ömür boyu', ad: 'Tam Erişim · Ömür Boyu' };
}
