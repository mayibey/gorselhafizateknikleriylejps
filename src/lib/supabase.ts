/**
 * Supabase istemcisi (İçtima Alanı backend'i). Yapılandırma EXPO_PUBLIC_ env'den gelir.
 * Anahtarlar yoksa `supabaseHazir=false` → backend özellikleri UYKUDA kalır (uygulama
 * offline çalışmaya devam eder, kimse kilitlenmez). Anahtarlar .env'e girilince aktifleşir.
 *
 * Kurulum: repo `docs/SUPABASE_KURULUM.md` (proje aç → SQL çalıştır → anahtarları .env'e yaz).
 */

import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

const URL = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const ANON = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

/** URL + anon anahtar tanımlı mı. false ise İçtima/giriş özellikleri devre dışı. */
export const supabaseHazir = URL.length > 0 && ANON.length > 0;

/**
 * SSR-güvenli oturum deposu. Web sunucu-render'ında (window YOK) auth-js açılışta
 * storage'a dokunur → AsyncStorage `window`'a erişince çökerdi (beyaz ekran). Web'de
 * yalnız window varken localStorage; SSR'da no-op; native'de AsyncStorage.
 */
const depolama = {
  getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      return Promise.resolve(typeof window === 'undefined' ? null : window.localStorage.getItem(key));
    }
    return AsyncStorage.getItem(key);
  },
  setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') window.localStorage.setItem(key, value);
      return Promise.resolve();
    }
    return AsyncStorage.setItem(key, value);
  },
  removeItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined') window.localStorage.removeItem(key);
      return Promise.resolve();
    }
    return AsyncStorage.removeItem(key);
  },
};

export const supabase = createClient(URL || 'https://placeholder.supabase.co', ANON || 'public-anon-placeholder', {
  auth: {
    storage: depolama,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Uygulama ön plandayken oturum token'ını otomatik tazele (Supabase RN önerisi).
if (supabaseHazir && Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') void supabase.auth.startAutoRefresh();
    else void supabase.auth.stopAutoRefresh();
  });
}
