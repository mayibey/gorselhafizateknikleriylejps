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
export const GIZLILIK_URL = 'https://mayibey.github.io/gorselhafizateknikleriylejps/';
export const SARTLAR_URL = 'https://mayibey.github.io/gorselhafizateknikleriylejps/sartlar.html';

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
