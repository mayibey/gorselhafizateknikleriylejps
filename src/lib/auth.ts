/**
 * Gmail (Google OAuth) ile giriş — Supabase + Expo web akışı.
 * Akış: signInWithOAuth URL üret → WebBrowser ile Google'da onayla → app'e
 * `mevzu://` ile dön → PKCE `code`'unu oturuma çevir (exchangeCodeForSession).
 *
 * native modül YOK → Expo Go'da test edilebilir. Supabase yapılandırılmadıysa
 * (supabaseHazir=false) fonksiyonlar `KapaliHata` fırlatır; UI bunu "yakında" gösterir.
 */
import { makeRedirectUri } from 'expo-auth-session';
import { Platform } from 'react-native';
import * as WebBrowser from 'expo-web-browser';

import { supabase, supabaseHazir } from '@/lib/supabase';

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
  return makeRedirectUri({ scheme: 'mevzu' });
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

/** Gmail ile giriş. Başarılıysa oturum AsyncStorage'a yazılır (onAuthStateChange tetiklenir). */
export async function gmailIleGiris(): Promise<void> {
  if (!supabaseHazir || !supabase) throw new KapaliHata();

  // OAuth dönüş adresi: gerçek build'de `mevzu://`, Expo Go'da `exp://<ip>:<port>`.
  // Çalışma anında (her zaman istemci tarafı) üretilir → SSR'de değerlendirilmez.
  const redirectTo = makeRedirectUri({ scheme: 'mevzu' });

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo, skipBrowserRedirect: true },
  });
  if (error) throw error;
  if (!data?.url) throw new Error('Giriş bağlantısı alınamadı.');

  const sonuc = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (sonuc.type !== 'success' || !sonuc.url) {
    // Kullanıcı vazgeçti / iptal → sessiz dön (hata değil).
    return;
  }

  // Supabase dönüşü `?code=...#` formatında gelir (code query'de, sonda boş fragment).
  const params = paramAyikla(sonuc.url);
  if (params.error || params.error_description) {
    throw new Error(`OAuth hata: ${params.error_description ?? params.error}`);
  }
  if (params.code) {
    const { error: cErr } = await supabase.auth.exchangeCodeForSession(params.code);
    if (cErr) throw cErr;
  } else if (params.access_token && params.refresh_token) {
    const { error: sErr } = await supabase.auth.setSession({
      access_token: params.access_token,
      refresh_token: params.refresh_token,
    });
    if (sErr) throw sErr;
  } else {
    throw new Error('Giriş tamamlanamadı (oturum belirteci alınamadı).');
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
    redirectTo: makeRedirectUri({ scheme: 'mevzu', path: 'sifre-yenile' }),
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

export type Profil = { ad: string | null; soyad: string | null; telefon: string | null };

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
    const { data } = await supabase.from('profiles').select('ad, soyad, telefon').single();
    if (!data) return null;
    return {
      ad: (data.ad as string | null) ?? null,
      soyad: (data.soyad as string | null) ?? null,
      telefon: (data.telefon as string | null) ?? null,
    };
  } catch {
    return null;
  }
}

/** Profil bilgilerini kaydeder (ad/soyad/telefon). */
export async function profilKaydet(ad: string, soyad: string, telefon: string): Promise<void> {
  if (!supabaseHazir || !supabase) throw new KapaliHata();
  const { data: u } = await supabase.auth.getUser();
  const id = u.user?.id;
  if (!id) throw new Error('Oturum bulunamadı.');
  const { error } = await supabase
    .from('profiles')
    .update({ ad: ad.trim(), soyad: soyad.trim(), telefon: telefon.trim() })
    .eq('id', id);
  if (error) throw error;
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
