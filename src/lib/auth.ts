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

/** Oturumu kapatır. Yapılandırılmamışsa no-op. */
export async function cikisYap(): Promise<void> {
  if (!supabaseHazir || !supabase) return;
  await supabase.auth.signOut();
}
