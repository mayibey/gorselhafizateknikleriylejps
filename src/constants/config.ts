/**
 * Uygulama yapılandırma sabitleri.
 * Formspree endpoint'i: kullanıcı Formspree formunu oluşturup URL'ini buraya yazacak.
 * BOŞ olduğu sürece geri bildirim "demo" modunda çalışır (gerçek POST yapılmaz,
 * başarı simüle edilir) → akış endpoint'siz test edilebilir.
 */
export const FORMSPREE_ENDPOINT = '';

/**
 * Gizlilik Politikası ve Kullanım Şartları'nın YAYINLANMIŞ web adresleri.
 * docs/GIZLILIK_POLITIKASI.md ve docs/KULLANIM_SARTLARI.md bir sayfada yayınlanınca
 * URL'leri buraya yaz (mağaza + giriş ekranı + Hesap ekranı buraya bağlanır).
 * Boşsa uygulama "yakında" gösterir.
 */
// Gizlilik/Şartlar'ın YAYINLANMIŞ web adresleri. Boşken uygulama içi gömülü metin
// (constants/yasal-metin.ts + /yasal ekranı) kullanılır; "web'de aç" linki gizlenir.
// "mayibey" markaya uymadığı için eski mayibey.github.io KALDIRILDI. Yeni adres
// (markalı, mayibey'siz host) barındırılınca buraya yazılacak + Play Console gizlilik
// URL'ine girilecek. Şimdilik boş → uygulama gömülü metinle çalışır.
export const GIZLILIK_URL = '';
export const SARTLAR_URL = '';

/**
 * Supabase (Gmail ile giriş / üyelik altyapısı).
 * BOŞ olduğu sürece üyelik UYKUDA: uygulama %100 offline çalışır, giriş ekranı
 * "yapılandırılmadı" der, KİLİTLENME yok. Aktifleştirmek için docs/UYELIK_KURULUM.md:
 *   1. supabase.com'da proje aç → Project URL + anon key buraya.
 *   2. Google Cloud OAuth client + Supabase Google provider (kurulum dosyasında).
 * anon key PUBLIC anahtardır (istemci kodunda durması normaldir; RLS gerçek koruma).
 * Env varsa (EXPO_PUBLIC_SUPABASE_*) onu kullanır, yoksa aşağıdaki sabitler.
 */
export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

// Sentry (çökme paneli) v1'de KALDIRILDI → "veri toplanmıyor" beyanı %100 doğru olsun
// + offline gizlilik metniyle uyumlu. Çökme avı bitti (expo-asset fix). v2'de gerekirse
// geri eklenir (o zaman Data Safety'ye "crash logs" beyanı + gizlilik metni güncellenir).

/**
 * ÜYELİK ANA ŞALTERİ (derleme-zamanı). v1 yayını için FALSE:
 * - Supabase'e HİÇ bağlanılmaz (client oluşmaz, ağ çağrısı yok, e-posta toplanmaz)
 *   → uygulama gerçekten %100 offline → mevcut "hesap yok" gizlilik metni DOĞRU kalır
 *   → mağaza red riski (gizlilik çelişkisi + hesap silme zorunluluğu) ORTADAN KALKAR.
 * - Giriş girişi (Sicil'deki Hesap kartı) gizlenir; /giris rotası "yakında" gösterir.
 * v2'de (onaydan sonra, ödeme ile birlikte) TRUE yapılır → o sürümde gizlilik metni
 * güncellenir + hesap silme eklenir + Data Safety düzeltilir → yeniden incelenir.
 * Anahtarlar `.env`'de hazır bekler; sadece bu bayrak kapalı.
 */
export const UYELIK_AKTIF = false;
