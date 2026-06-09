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

export const supabase = createClient(URL || 'https://placeholder.supabase.co', ANON || 'public-anon-placeholder', {
  auth: {
    storage: AsyncStorage,
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
