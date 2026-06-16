/**
 * Gmail (Google OAuth) ile giriş — Supabase + Expo web akışı.
 * Akış: signInWithOAuth URL üret → WebBrowser ile Google'da onayla → app'e
 * `mevzu://` ile dön → PKCE `code`'unu oturuma çevir (exchangeCodeForSession).
 *
 * native modül YOK → Expo Go'da test edilebilir. Supabase yapılandırılmadıysa
 * (supabaseHazir=false) fonksiyonlar `KapaliHata` fırlatır; UI bunu "yakında" gösterir.
 */
import { makeRedirectUri } from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';

import { supabase, supabaseHazir } from '@/lib/supabase';

/** Tarayıcı oturumu sonrası askıda kalan auth oturumunu temizler (Expo gereği). */
WebBrowser.maybeCompleteAuthSession();

export class KapaliHata extends Error {
  constructor() {
    super('Üyelik henüz yapılandırılmadı (Supabase anahtarları eksik).');
    this.name = 'KapaliHata';
  }
}

/** OAuth dönüş adresi: app scheme `mevzu://` (app.json scheme ile aynı). */
const redirectTo = makeRedirectUri({ scheme: 'mevzu' });

/** URL'deki query/fragment parametrelerini ayrıştırır (code / access_token vb.). */
function paramAyikla(url: string): Record<string, string> {
  const out: Record<string, string> = {};
  const sorgu = url.includes('#') ? url.split('#')[1] : url.split('?')[1];
  if (!sorgu) return out;
  for (const parca of sorgu.split('&')) {
    const [k, v] = parca.split('=');
    if (k) out[decodeURIComponent(k)] = decodeURIComponent(v ?? '');
  }
  return out;
}

/** Gmail ile giriş. Başarılıysa oturum AsyncStorage'a yazılır (onAuthStateChange tetiklenir). */
export async function gmailIleGiris(): Promise<void> {
  if (!supabaseHazir || !supabase) throw new KapaliHata();

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

  const params = paramAyikla(sonuc.url);
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
    throw new Error('Giriş tamamlanamadı (oturum belirteci yok).');
  }
}

/** Oturumu kapatır. Yapılandırılmamışsa no-op. */
export async function cikisYap(): Promise<void> {
  if (!supabaseHazir || !supabase) return;
  await supabase.auth.signOut();
}
