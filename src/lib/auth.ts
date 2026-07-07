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

// Kendi Google OAuth client'ımızın WEB client ID'si (Supabase Google provider + native audience).
// NATIVE giriş bunu webClientId olarak kullanır → idToken'ı DOĞRUDAN Supabase'e verir (redirect YOK).
const GOOGLE_WEB_CLIENT_ID = '1065249322807-rooson7kmj49lgt3hvfl25s41hnmappv.apps.googleusercontent.com';
// iOS NATIVE Google client (Google Cloud → OAuth client type iOS, bundle app.mevzujsps.ios).
// iOS'ta GoogleSignin bunu ister (+ app.json google-signin plugin iosUrlScheme = ters çevrilmişi).
const GOOGLE_IOS_CLIENT_ID = '1065249322807-8a9q8ugdp7jrsragmb6292h1jffiuleu.apps.googleusercontent.com';
let googleConfigured = false;

/**
 * NATIVE Google girişi — telefonun kendi hesap seçici penceresi → idToken → Supabase
 * signInWithIdToken. WebBrowser/redirect/Supabase-callback YOK → "supabase.co'da dönüp durma"
 * takılması biter, kullanıcı "supabase.co" yerine markayı görür. (GoogleSignin native-only:
 * dinamik import → web bundle'ına native modül GİRMEZ.)
 */
/** Google girişinin GERÇEK sebebi — UI bu mesajı OLDUĞU GİBİ gösterir (genel "işlem yapılamadı"
 * yerine; kör teşhis bitsin). name üzerinden tanınır (auth-ekrani hataMetni). */
export class GoogleGirisHatasi extends Error {
  constructor(mesaj: string) {
    super(mesaj);
    this.name = 'GoogleGirisHatasi';
  }
}

// @react-native-google-signin hata kodu → anlaşılır Türkçe açıklama.
function googleHataAciklama(kod: string | number | undefined, ham: string): string {
  const k = String(kod ?? '');
  if (k === '10' || k === 'DEVELOPER_ERROR')
    return 'Google yapılandırma hatası (kod 10 — imza/istemci uyuşmazlığı). Uygulamanın bu sürümü Google tarafında henüz tanınmıyor olabilir; birkaç saat sonra tekrar dene, sürerse bildir.';
  if (k === '7' || k === 'NETWORK_ERROR') return 'Ağ hatası — internet bağlantını kontrol edip tekrar dene.';
  if (k === '5' || k === 'INVALID_ACCOUNT') return 'Google hesabı geçersiz görünüyor. Başka bir hesapla dene.';
  if (k === '12502' || k === 'IN_PROGRESS') return 'Zaten bir giriş denemesi sürüyor — bir saniye bekleyip tekrar dene.';
  if (k === 'PLAY_SERVICES_NOT_AVAILABLE')
    return 'Google Play Hizmetleri bu cihazda yok/güncel değil. Play Store’dan güncelleyip tekrar dene.';
  return `Google giriş hatası (kod ${k || '?'}): ${ham}`;
}

async function nativeGoogleGiris(): Promise<void> {
  const { GoogleSignin } = await import('@react-native-google-signin/google-signin');
  if (!googleConfigured) {
    GoogleSignin.configure({ webClientId: GOOGLE_WEB_CLIENT_ID, iosClientId: GOOGLE_IOS_CLIENT_ID });
    googleConfigured = true;
  }
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  // Önceki Google oturumunu BIRAK → hesap seçici HER girişte çıksın (yoksa ikinci girişte
  // sormadan son hesapla girer; kullanıcı farklı hesap seçemez — başkan bulgusu).
  try {
    await GoogleSignin.signOut();
  } catch {
    // oturum yoksa/hata → önemsiz, seçici zaten çıkar
  }
  let resp: unknown;
  try {
    resp = await GoogleSignin.signIn();
  } catch (e) {
    const kod = (e as { code?: string | number })?.code;
    if (String(kod) === '12501' || kod === 'SIGN_IN_CANCELLED') return; // kullanıcı vazgeçti → sessiz
    throw new GoogleGirisHatasi(
      googleHataAciklama(kod, e instanceof Error ? e.message : String(e)),
    );
  }
  // @react-native-google-signin v13+ dönüş: { type:'success'|'cancelled', data:{ idToken, ... } }
  const idToken =
    (resp as { data?: { idToken?: string } })?.data?.idToken ??
    (resp as { idToken?: string })?.idToken;
  if (!idToken) {
    if ((resp as { type?: string })?.type === 'cancelled') return; // kullanıcı vazgeçti → sessiz
    throw new GoogleGirisHatasi('Google kimlik bilgisi (idToken) alınamadı — tekrar dene.');
  }
  const { error } = await supabase!.auth.signInWithIdToken({ provider: 'google', token: idToken });
  if (error) throw new GoogleGirisHatasi(`Sunucu Google girişini kabul etmedi: ${error.message}`);
}

/** Gmail ile giriş. Başarılıysa oturum AsyncStorage'a yazılır (onAuthStateChange tetiklenir). */
export async function gmailIleGiris(): Promise<void> {
  if (!supabaseHazir || !supabase) throw new KapaliHata();

  // NATIVE: kendi client'ımızla native hesap seçici (redirect/WebBrowser YOK → takılma biter).
  // Web'de GoogleSignin çalışmaz → aşağıdaki Supabase OAuth (WebBrowser) akışı kullanılır.
  if (Platform.OS !== 'web') {
    return nativeGoogleGiris();
  }

  const redirectTo = donusAdresi(); // web: sayfanın origin'i

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

/** Apple girişinin GERÇEK sebebi — UI bu mesajı OLDUĞU GİBİ gösterir (GoogleGirisHatasi deseni). */
export class AppleGirisHatasi extends Error {
  constructor(mesaj: string) {
    super(mesaj);
    this.name = 'AppleGirisHatasi';
  }
}

/**
 * NATIVE Apple girişi (YALNIZ iOS) — App Store Guideline 4.8: Google sunuluyorsa Apple da EŞDEĞER
 * seçenek olarak ZORUNLU. AppleAuthentication.signInAsync → identityToken → Supabase
 * signInWithIdToken({ provider:'apple' }). Dinamik import → Android/web bundle'ına iOS native
 * modülü GİRMEZ (nativeGoogleGiris ile aynı desen). Ad-soyad SADECE İLK girişte gelir (Apple
 * sonraki girişlerde vermez) → geldiğinde kullanıcı meta verisine yazılır (profil ön-doldurma).
 * ÖN KOŞUL (başkan panel işi): Supabase Auth → Providers → Apple AÇIK + Apple Developer'da
 * "Sign in with Apple" capability & Services ID/key. Bunlar olmadan signInWithIdToken reddeder.
 */
export async function appleIleGiris(): Promise<void> {
  if (!supabaseHazir || !supabase) throw new KapaliHata();
  if (Platform.OS !== 'ios') {
    throw new AppleGirisHatasi('Apple ile giriş yalnızca iPhone/iPad üzerinde kullanılabilir.');
  }
  const AppleAuthentication = await import('expo-apple-authentication');
  let credential: import('expo-apple-authentication').AppleAuthenticationCredential;
  try {
    credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });
  } catch (e) {
    if ((e as { code?: string })?.code === 'ERR_REQUEST_CANCELED') return; // vazgeçti → sessiz
    throw new AppleGirisHatasi(`Apple giriş hatası: ${e instanceof Error ? e.message : String(e)}`);
  }
  const idToken = credential.identityToken;
  if (!idToken) throw new AppleGirisHatasi('Apple kimlik bilgisi alınamadı — tekrar dene.');
  const { error } = await supabase.auth.signInWithIdToken({ provider: 'apple', token: idToken });
  if (error) throw new AppleGirisHatasi(`Sunucu Apple girişini kabul etmedi: ${error.message}`);
  // Ad-soyad yalnız İLK girişte gelir → geldiğinde meta veriye yaz (profil ekranı ön-doldurabilir).
  const tamAd = [credential.fullName?.givenName, credential.fullName?.familyName]
    .filter(Boolean)
    .join(' ')
    .trim();
  if (tamAd) {
    try {
      await supabase.auth.updateUser({ data: { full_name: tamAd } });
    } catch {
      // meta yazımı başarısız → önemsiz, giriş yine geçerli
    }
  }
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
// Doğrulama e-postasındaki bağlantıya tıklayınca açılacak markalı "onaylandı" sayfası.
const ONAY_DONUS = 'https://mevzujsps.com/onaylandi.html';

export async function epostaKayit(
  eposta: string,
  sifre: string,
): Promise<{ dogrulamaGerek: boolean }> {
  if (!supabaseHazir || !supabase) throw new KapaliHata();
  const { data, error } = await supabase.auth.signUp({
    email: eposta.trim(),
    password: sifre,
    options: { emailRedirectTo: ONAY_DONUS },
  });
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

/** Şifre sıfırlama MAİLİNDEKİ KODU doğrular → kurtarma oturumu açılır (ardından
 * yeniSifreBelirle ile yeni şifre konur). Link tıklamaya göre her cihazda şaşmaz çalışır. */
export async function sifreKoduDogrula(eposta: string, kod: string): Promise<void> {
  if (!supabaseHazir || !supabase) throw new KapaliHata();
  const { error } = await supabase.auth.verifyOtp({
    email: eposta.trim(),
    token: kod.trim(),
    type: 'recovery',
  });
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

// --- Sözleşme onayı (KVKK kanıtı) — İLK kabul anı profile bir kez yazılır ---

/** Sözleşme onay anını kaydeder (yalnız BOŞSA — ilk kabul anı korunur). Sessiz/no-op'lu. */
export async function sozlesmeOnayKaydet(): Promise<void> {
  if (!supabaseHazir || !supabase) return;
  try {
    const { data: u } = await supabase.auth.getUser();
    const id = u.user?.id;
    if (!id) return;
    await supabase
      .from('profiles')
      .update({ sozlesme_onay: new Date().toISOString() })
      .eq('id', id)
      .is('sozlesme_onay', null);
  } catch {
    // sessiz — bir sonraki girişte tekrar denenir
  }
}

// --- Tanıtım turu (sunucu tarafı) — hesap gördü mü? (profiles.tanitim_gordu) ---

/** Sunucuda bu HESAP turu gördü mü? true/false; okunamazsa (offline/hata) null. */
export async function tanitimSunucudanOku(): Promise<boolean | null> {
  if (!supabaseHazir || !supabase) return null;
  try {
    const { data, error } = await supabase.from('profiles').select('tanitim_gordu').single();
    if (error || !data) return null;
    return data.tanitim_gordu != null;
  } catch {
    return null;
  }
}

/** Bu hesabı "turu gördü" işaretler (yalnız boşsa — ilk görüş anı korunur). Sessiz. */
export async function tanitimSunucuyaYaz(): Promise<void> {
  if (!supabaseHazir || !supabase) return;
  try {
    const { data: u } = await supabase.auth.getUser();
    const id = u.user?.id;
    if (!id) return;
    await supabase
      .from('profiles')
      .update({ tanitim_gordu: new Date().toISOString() })
      .eq('id', id)
      .is('tanitim_gordu', null);
  } catch {
    // sessiz
  }
}

// --- E-posta doğrulama (içerik kapısı) ---

/** Oturumdaki e-posta doğrulanmış mı? SUNUCUDAN taze okur (kullanıcı maildeki linke tıkladıysa
 * görünür). true/false; okunamazsa (offline) null → kapı FAIL-OPEN davranır (mağduriyet yok). */
export async function epostaDogrulanmisMi(): Promise<boolean | null> {
  if (!supabaseHazir || !supabase) return null;
  try {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) return null;
    const u = data.user as { email_confirmed_at?: string | null; confirmed_at?: string | null };
    return u.email_confirmed_at != null || u.confirmed_at != null;
  } catch {
    return null;
  }
}

/** Doğrulama e-postasını YENİDEN gönderir (kayıt onayı). */
export async function dogrulamaMailiGonder(eposta: string): Promise<void> {
  if (!supabaseHazir || !supabase) throw new KapaliHata();
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email: eposta.trim(),
    options: { emailRedirectTo: ONAY_DONUS },
  });
  if (error) throw error;
}

// --- Telefon ile giriş (SMS OTP) — uzak bayrak `telefon_giris` açıkken kullanılır ---

/** TR telefonunu E.164'e çevirir: "5xx xxx xx xx" → "+905xxxxxxxxx". Geçersizse null. */
export function telefonE164(ham: string): string | null {
  const rakamlar = ham.replace(/\D/g, '');
  if (/^5\d{9}$/.test(rakamlar)) return `+90${rakamlar}`;
  if (/^05\d{9}$/.test(rakamlar)) return `+9${rakamlar}`;
  if (/^905\d{9}$/.test(rakamlar)) return `+${rakamlar}`;
  return null;
}

/** Telefona tek kullanımlık giriş kodu (SMS) gönderir. Hesap yoksa oluşturur. */
export async function telefonKodGonder(telefonE164Str: string): Promise<void> {
  if (!supabaseHazir || !supabase) throw new KapaliHata();
  const { error } = await supabase.auth.signInWithOtp({ phone: telefonE164Str });
  if (error) throw error;
}

/** SMS ile gelen kodu doğrular → oturum açılır (onAuthStateChange tetiklenir). */
export async function telefonKodDogrula(telefonE164Str: string, kod: string): Promise<void> {
  if (!supabaseHazir || !supabase) throw new KapaliHata();
  const { error } = await supabase.auth.verifyOtp({
    phone: telefonE164Str,
    token: kod.trim(),
    type: 'sms',
  });
  if (error) throw error;
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
