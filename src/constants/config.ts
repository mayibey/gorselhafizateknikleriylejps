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
// Markalı alan adı mevzujsps.com (GitHub Pages, HTTPS) yayında — App Store/Play gizlilik
// URL'i de buraya işaret eder. (Eski mayibey.github.io markaya uymadığı için KALDIRILDI.)
export const GIZLILIK_URL = 'https://mevzujsps.com/';
export const SARTLAR_URL = 'https://mevzujsps.com/sartlar.html';

/**
 * Resmî mevzuat kaynağı. Google "Yanıltıcı İddialar Politikası" (resmî bilgi gösteren
 * uygulamalar orijinal kaynağa net ve erişilebilir link vermek ZORUNDA) gereği:
 * uygulamada gösterilen tüm kanun/madde metinlerinin resmî kaynağı T.C. Mevzuat Bilgi
 * Sistemi'dir. Madde metni panelinde tıklanabilir kaynak satırı olarak gösterilir +
 * mağaza açıklamasında belirtilir. DEĞİŞTİRME (resmî .gov adresi).
 */
export const MEVZUAT_KAYNAK_URL = 'https://www.mevzuat.gov.tr';

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

/**
 * İÇERİK CDN/sunucu tabanı (kart görsel/ses dosyaları). BOŞ ise içerik GÖMÜLÜ (yerel
 * require) okunur — varsayılan, mevcut davranış. Dolu ise (örn. R2/Supabase Storage
 * public base URL) görseller uzaktan çekilir: `${ICERIK_TABANI}/${yol}` (bkz. lib/gorsel-kaynak).
 * Sona '/' KOYMA. Sunucuya taşıma fazında doldurulur + codegen GORSEL_MANIFEST_ONLY ile yenilenir.
 */
export const ICERIK_TABANI = process.env.EXPO_PUBLIC_ICERIK_TABANI ?? '';

/**
 * İmzalı URL modu: bucket PRIVATE + indirme `imzali-url` Edge Function'ından kısa-ömürlü URL alır
 * (public scraping biter, auth'a bağlı). Edge Function DEPLOY + bucket PRIVATE olunca '1' yap.
 * Kapalıyken (varsayılan) indirme public ICERIK_TABANI'dan iner (mevcut davranış).
 */
export const IMZALI_URL_AKTIF = (process.env.EXPO_PUBLIC_IMZALI_URL ?? '') === '1';

// Sentry (çökme paneli) v1'de KALDIRILDI → "veri toplanmıyor" beyanı %100 doğru olsun
// + offline gizlilik metniyle uyumlu. Çökme avı bitti (expo-asset fix). v2'de gerekirse
// geri eklenir (o zaman Data Safety'ye "crash logs" beyanı + gizlilik metni güncellenir).

/**
 * ÜYELİK ANA ŞALTERİ (derleme-zamanı). ŞU AN TRUE — giriş ZORUNLU (Supabase auth aktif).
 * TRUE olduğunda yasal/uyum gereksinimleri (2 Tem 2026 itibarıyla KARŞILANDI):
 * - Gizlilik/KVKK metni gerçek toplanan veriyi (e-posta/ad/soyad/telefon/DT/cinsiyet) sayar
 *   + yurt dışı aktarım onay kutusuna bağlı açık rıza (bkz. yasal-metin.ts, auth-ekrani.tsx).
 * - Hesap silme uygulama içi (30 gün soft-delete) + web (docs/hesap-sil.html) mevcut.
 * - Play Data Safety cevapları docs/MAGAZA_LISTELEME.md'de güncel ("veri topluyor").
 * FALSE yapılırsa client hiç oluşmaz, uygulama offline çalışır (v1 öncesi mod).
 */
export const UYELIK_AKTIF = true;
