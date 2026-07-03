/**
 * Gmail (Google OAuth) ile giriş — Supabase + Expo web akışı.
 * Akış: signInWithOAuth URL üret → WebBrowser ile Google'da onayla → app'e
 * `mevzu://` ile dön → PKCE `code`'unu oturuma çevir (exchangeCodeForSession).
 *
 * native modül YOK → Expo Go'da test edilebilir. Supabase yapılandırılmadıysa
 * (supabaseHazir=false) fonksiyonlar `KapaliHata` fırlatır; UI bunu "yakında" gösterir.
 */
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';

import { supabase, supabaseHazir } from '@/lib/supabase';

// OAuth/kurtarma dönüş adresi PLATFORMA GÖRE:
// - Native: SABİT `mevzu://` (makeRedirectUri DEĞİL — expo-dev-client kuruluyken bazı yapılarda
//   exp+ şeması üretip Supabase allowlist'iyle eşleşmiyor → web Site URL'ine düşüyor "beyaz ekran").
// - Web: tarayıcı `mevzu://` şemasına DÖNEMEZ (popup sonsuz döner) → sayfanın kendi origin'i
//   (örn. http://localhost:8081). Origin da Supabase Redirect URLs allowlist'inde olmalı.
function donusAdresi(): string {
  if (Platform.OS === 'web' && typeof window !== 'undefined') return window.location.origin;
  return 'mevzu://';
}
function donusSifreYenile(): string {
  if (Platform.OS === 'web' && typeof window !== 'undefined')
    return `${window.location.origin}/sifre-yenile`;
  return 'mevzu://sifre-yenile';
}

// Tarayıcı oturumu sonrası askıda kalanı temizler (Expo gereği). Yalnız üyelik AÇIKKEN
// ve SSR olmayan ortamda çağrılır (v1'de gereksiz native çağrı + "window yok" çökmesi yok).
if (supabaseHazir && !(Platform.OS === 'web' && typeof window === 'undefined')) {
  WebBrowser.maybeCompleteAuthSession();
}

export class KapaliHata extends Error {
  constructor() {
    super('Üyelik henüz yapılandırılmadı (Supabase anahtarları eksik).');
    this.name = 'KapaliHata';
  }
}

/** OAuth dönüş adresi (Supabase Redirect URLs'e EKLENMESİ gereken adres). Teşhis için. */
export function girisDonusAdresi(): string {
  return donusAdresi();
}

/** URL'deki query (?...) VE fragment (#...) parametrelerini ayrıştırır.
 * Supabase dönüşü `?code=...#` gibi (code query'de + boş/dolu fragment) gelebilir →
 * ikisini de topla, "ya o ya bu" yapma (boş `#` code'u gizlemesin). */
function paramAyikla(url: string): Record<string, string> {
  const out: Record<string, string> = {};
  const qIndex = url.indexOf('?');
  const hIndex = url.indexOf('#');
  const parcalar: string[] = [];
  if (qIndex !== -1) {
    const son = hIndex !== -1 && hIndex > qIndex ? hIndex : url.length;
    parcalar.push(url.slice(qIndex + 1, son));
  }
  if (hIndex !== -1) parcalar.push(url.slice(hIndex + 1));
  for (const sorgu of parcalar) {
    for (const parca of sorgu.split('&')) {
      if (!parca) continue;
      const [k, v] = parca.split('=');
      if (k) out[decodeURIComponent(k)] = decodeURIComponent(v ?? '');
    }
  }
  return out;
}

// OAuth code'u İKİ yoldan gelebilir: (1) WebBrowser.openAuthSessionAsync sonucu, (2) app'e
// gelen deep-link (Android'de redirect app'e deep-link olarak düşüp openAuthSession 'dismiss'
// dönebiliyor → o zaman oturum yalnız deep-link'ten kurulur). Aynı kod iki kez işlenmesin diye
// dedup: işlenen kod set'i + tek-uçuş bayrağı (exchangeCodeForSession kodu bir kez tüketir).
const islenenKodlar = new Set<string>();
let kodIsleniyor = false;

const bekle = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * PKCE `code`'unu oturuma çevirir (dedup'lu). Oturum kurulduysa true.
 *
 * FRESH-INSTALL YARIŞI: ilk denemede exchangeCodeForSession, signInWithOAuth'un
 * AsyncStorage'a yeni yazdığı `code_verifier`'ı okuyamadan çalışıp başarısız olabiliyordu
 * (kullanıcı hiçbir şey görmüyor → 2-3 kez basınca depo ısınıp giriyordu — tester bulgusu).
 * Çözüm: TEK basışta içeride kısa aralıklarla 3 kez dene (verifier gelene dek). Kod yalnız
 * GERÇEK başarıda dedup'a girer; başarısızlıkta serbest kalır (öbür yol / retry deneyebilsin).
 */
export async function oturumKoduIsle(code: string): Promise<boolean> {
  if (!supabaseHazir || !supabase) return false;
  if (!code || kodIsleniyor || islenenKodlar.has(code)) return false;
  kodIsleniyor = true;
  try {
    let sonHata: unknown = null;
    // İlk denemeden ÖNCE de kısa bekle (verifier AsyncStorage'a insin) + 5 deneme + ARTAN bekleme
    // → "ilk basışta takılıp ikincide düzeliyor" yarışı kapanır (verifier gecikmesi tolere edilir).
    const beklemeler = [250, 600, 900, 1200, 1600];
    for (let deneme = 0; deneme < beklemeler.length; deneme++) {
      await bekle(beklemeler[deneme]);
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) {
        islenenKodlar.add(code);
        return true; // onAuthStateChange(SIGNED_IN) tetiklenir → uygulama içeri girer
      }
      sonHata = error;
      // "code challenge/verifier" hataları geçici (yarış) → tekrar dene; diğerlerinde çık.
      const m = (error as { message?: string })?.message ?? '';
      if (!/verifier|challenge|code|expired|state/i.test(m)) break;
    }
    throw sonHata ?? new Error('Oturum kurulamadı');
  } finally {
    kodIsleniyor = false;
  }
}

/**
 * Gelen bir deep-link URL'inde OAuth `code` varsa oturuma çevirir (şifre-yenileme HARİÇ — o kendi
 * ekranında işlenir). _layout deep-link dinleyicisi bunu çağırır → giriş dönüşü kaçmaz.
 */
export async function oauthUrlIsle(url: string): Promise<boolean> {
  if (!url || url.includes('sifre-yenile')) return false;
  const params = paramAyikla(url);
  if (!params.code) return false;
  return oturumKoduIsle(params.code);
}

/** Gmail ile giriş. Başarılıysa oturum AsyncStorage'a yazılır (onAuthStateChange tetiklenir). */
export async function gmailIleGiris(): Promise<void> {
  if (!supabaseHazir || !supabase) throw new KapaliHata();

  const redirectTo = donusAdresi(); // native: sabit mevzu:// · web: sayfanın origin'i

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    // prompt=select_account → Google HER ZAMAN hesap seçici gösterir (tek hesabı otomatik seçmez).
    // Kullanıcı birden çok Google hesabı kullanıyorsa doğru olanı seçebilir; hesap yoksa giriş sayfası.
    options: { redirectTo, skipBrowserRedirect: true, queryParams: { prompt: 'select_account' } },
  });
  if (error) throw error;
  if (!data?.url) throw new Error('Giriş bağlantısı alınamadı.');

  const sonuc = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  // Android'de redirect app'e DEEP-LINK olarak düşebilir → openAuthSession 'dismiss'/'cancel'
  // döner ama oturum _layout deep-link dinleyicisi (oauthUrlIsle) ile kurulur. O yüzden burada
  // 'success' değilse SESSİZ dön (hata fırlatma) — dinleyici işi bitirir.
  if (sonuc.type !== 'success' || !sonuc.url) return;

  // Supabase dönüşü `?code=...#` formatında gelir (code query'de, sonda boş fragment).
  const params = paramAyikla(sonuc.url);
  if (params.error || params.error_description) {
    throw new Error(`OAuth hata: ${params.error_description ?? params.error}`);
  }
  if (params.code) {
    await oturumKoduIsle(params.code); // dedup'lu (deep-link ile yarışırsa çift işlenmez)
  } else if (params.access_token && params.refresh_token) {
    const { error: sErr } = await supabase.auth.setSession({
      access_token: params.access_token,
      refresh_token: params.refresh_token,
    });
    if (sErr) throw sErr;
  }
  // code de token da yoksa: oturum deep-link dinleyicisinden gelebilir → sessiz geç.
}

// --- E-posta/şifre ile giriş (Google'a alternatif) ---

/** E-posta + şifre ile giriş. */
export async function epostaGiris(eposta: string, sifre: string): Promise<void> {
  if (!supabaseHazir || !supabase) throw new KapaliHata();
  const { error } = await supabase.auth.signInWithPassword({ email: eposta.trim(), password: sifre });
  if (error) throw error;
}

/**
 * E-posta + şifre ile KAYIT. Supabase doğrulama e-postası gönderir (varsayılan SMTP üretimde
 * sınırlı → yayında özel SMTP). `dogrulamaGerek=true` ise kullanıcı e-postasını onaylamalı.
 */
export async function epostaKayit(
  eposta: string,
  sifre: string,
): Promise<{ dogrulamaGerek: boolean }> {
  if (!supabaseHazir || !supabase) throw new KapaliHata();
  const { data, error } = await supabase.auth.signUp({ email: eposta.trim(), password: sifre });
  if (error) throw error;
  // Oturum yoksa e-posta doğrulaması bekleniyor demektir.
  return { dogrulamaGerek: !data.session };
}

/** Şifre sıfırlama e-postası gönderir. Link app'e `mevzu://sifre-yenile?code=...` ile döner. */
export async function sifreSifirla(eposta: string): Promise<void> {
  if (!supabaseHazir || !supabase) throw new KapaliHata();
  const { error } = await supabase.auth.resetPasswordForEmail(eposta.trim(), {
    redirectTo: donusSifreYenile(),
  });
  if (error) throw error;
}

/** Şifre-yenileme linkindeki PKCE kodunu (kurtarma) oturuma çevirir. */
export async function kurtarmaKoduDegistir(code: string): Promise<void> {
  if (!supabaseHazir || !supabase) throw new KapaliHata();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) throw error;
}

/** Oturum açıkken yeni şifre belirler (şifre-yenileme ekranı). */
export async function yeniSifreBelirle(sifre: string): Promise<void> {
  if (!supabaseHazir || !supabase) throw new KapaliHata();
  const { error } = await supabase.auth.updateUser({ password: sifre });
  if (error) throw error;
}

// --- Profil (ad/soyad/telefon) + mükerrer hesap engeli ---

export type Cinsiyet = 'kadin' | 'erkek' | 'belirtmek_istemiyorum';
export type Profil = {
  ad: string | null;
  soyad: string | null;
  telefon: string | null;
  dogumTarihi: string | null; // YYYY-MM-DD
  cinsiyet: Cinsiyet | null;
};

/** Profil eksiksiz mi (zorunlu alanlar dolu) — gate/akış kararı. */
export function profilTamMi(p: Profil | null): boolean {
  return !!(p?.ad && p?.soyad && p?.telefon && p?.dogumTarihi && p?.cinsiyet);
}

/** E-posta ZATEN kayıtlı mı (mükerrer hesabı önlemek için signup öncesi kontrol). */
export async function epostaKullanimda(eposta: string): Promise<boolean> {
  if (!supabaseHazir || !supabase) return false;
  try {
    const { data, error } = await supabase.rpc('eposta_kullanimda', { p_eposta: eposta.trim() });
    return !error && data === true;
  } catch {
    return false;
  }
}

/** Giriş yapan kullanıcının profilini getirir (yoksa/hata → null). */
export async function profilGetir(): Promise<Profil | null> {
  if (!supabaseHazir || !supabase) return null;
  try {
    const { data } = await supabase
      .from('profiles')
      .select('ad, soyad, telefon, dogum_tarihi, cinsiyet')
      .single();
    if (!data) return null;
    return {
      ad: (data.ad as string | null) ?? null,
      soyad: (data.soyad as string | null) ?? null,
      telefon: (data.telefon as string | null) ?? null,
      dogumTarihi: (data.dogum_tarihi as string | null) ?? null,
      cinsiyet: (data.cinsiyet as Cinsiyet | null) ?? null,
    };
  } catch {
    return null;
  }
}

/** Profil bilgilerini kaydeder (ad/soyad/telefon/doğum tarihi/cinsiyet). */
export async function profilKaydet(p: {
  ad: string;
  soyad: string;
  telefon: string;
  dogumTarihi: string;
  cinsiyet: Cinsiyet;
}): Promise<void> {
  if (!supabaseHazir || !supabase) throw new KapaliHata();
  const { data: u } = await supabase.auth.getUser();
  const id = u.user?.id;
  if (!id) throw new Error('Oturum bulunamadı.');
  const { error } = await supabase
    .from('profiles')
    .update({
      ad: p.ad.trim(),
      soyad: p.soyad.trim(),
      telefon: p.telefon.trim(),
      dogum_tarihi: p.dogumTarihi,
      cinsiyet: p.cinsiyet,
    })
    .eq('id', id);
  if (error) throw error;
}

// --- Görev bilgisi (branş/rütbe) — SUNUCUDA, hesaba bağlı (docs/v2/08) ---
// Cihazdaki kopya hız/offline içindir; girişte sunucu ESAS alınır (hesap değişiminde
// önceki kullanıcının branşı görünmesin), seçim yapılınca sunucuya da yazılır.

export type Gorev = { brans: string | null; rutbe: string | null };

/** Sunucudaki görev bilgisi. Ağ/tablo hatasında null (cihazdaki korunur — fail-open). */
export async function gorevGetir(): Promise<Gorev | null> {
  if (!supabaseHazir || !supabase) return null;
  try {
    const { data, error } = await supabase.from('profiles').select('brans, rutbe').single();
    if (error || !data) return null;
    return {
      brans: (data.brans as string | null) ?? null,
      rutbe: (data.rutbe as string | null) ?? null,
    };
  } catch {
    return null;
  }
}

/** Görev bilgisini sunucuya yazar (kısmi olabilir: yalnız brans ya da yalnız rutbe).
 *  beklenenUid = SEÇİM ANINDAKİ hesap: yazma anında oturum değiştiyse (çıkış+farklı giriş
 *  yarışı) İPTAL — önceki kullanıcının seçimi yeni hesabın profiline yazılmasın. */
export async function gorevKaydet(g: Partial<Gorev>, beklenenUid: string): Promise<void> {
  if (!supabaseHazir || !supabase) return;
  try {
    const { data: u } = await supabase.auth.getUser();
    const id = u.user?.id;
    if (!id || id !== beklenenUid) return;
    await supabase.from('profiles').update(g).eq('id', id);
  } catch {
    // sessiz geç — offline'da cihazdaki değer geçerli kalır, sonraki seçimde yazılır
  }
}

/** Oturumu kapatır. Yapılandırılmamışsa no-op. */
export async function cikisYap(): Promise<void> {
  if (!supabaseHazir || !supabase) return;
  await supabase.auth.signOut();
}

// --- Hesap silme: 30 günlük YUMUŞAK silme (soft delete) + reaktivasyon ---
// profiles.silme_talep_tarihi: null=aktif, dolu=30g sonra kalıcı silinecek.
// Tekrar giriş yapınca otomatik geri getirilir (auth-context). Kalıcı silme = pg_cron.

/** Profilden silme talep tarihini getirir (yoksa/tablo yoksa/hata → null; güvenli). */
export async function silmeTalepTarihiGetir(): Promise<string | null> {
  if (!supabaseHazir || !supabase) return null;
  try {
    const { data } = await supabase.from('profiles').select('silme_talep_tarihi').single();
    return (data?.silme_talep_tarihi as string | null) ?? null;
  } catch {
    return null;
  }
}

/** Hesabı silmek üzere İŞARETLER (30 gün sonra kalıcı; o güne dek girişle geri gelir). */
export async function hesapSilmeTalebiKur(): Promise<void> {
  if (!supabaseHazir || !supabase) throw new KapaliHata();
  const { data: u } = await supabase.auth.getUser();
  const id = u.user?.id;
  if (!id) throw new Error('Oturum bulunamadı.');
  const { error } = await supabase
    .from('profiles')
    .update({ silme_talep_tarihi: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

/** Silme talebini İPTAL eder (hesabı geri getirir). Güvenli no-op'lu. */
export async function hesapGeriGetir(): Promise<void> {
  if (!supabaseHazir || !supabase) return;
  try {
    const { data: u } = await supabase.auth.getUser();
    const id = u.user?.id;
    if (!id) return;
    await supabase.from('profiles').update({ silme_talep_tarihi: null }).eq('id', id);
  } catch {
    // sessiz geç (tablo henüz yoksa reaktivasyon atlanır)
  }
}
