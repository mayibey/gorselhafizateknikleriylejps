/**
 * Supabase istemcisi (Gmail ile giriş / üyelik). GUARDED:
 * - SUPABASE_URL/ANON_KEY boşsa `supabaseHazir = false` ve `supabase = null`
 *   → üyelik uykuda, uygulama offline çalışır, hiçbir yerde çökmez.
 * - Anahtar dolunca istemci kurulur; oturum AsyncStorage'ta kalıcı (PKCE akışı).
 *
 * NOT: `react-native-url-polyfill` Supabase'in fetch/URL kullanımı için ŞART (RN'de
 * global URL eksik) → en üstte import edilir.
 */
import 'react-native-url-polyfill/auto';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

import { SUPABASE_ANON_KEY, SUPABASE_URL } from '@/constants/config';

export const supabaseHazir = SUPABASE_URL !== '' && SUPABASE_ANON_KEY !== '';

// Web SSR (Expo Router'ın Node ön-render'ı) sırasında `window`/localStorage YOK →
// AsyncStorage'ın web sürümü "window is not defined" ile çöker ve dev sunucuyu öldürür.
// SSR'de no-op storage + oturum kapalı; native ve gerçek tarayıcıda AsyncStorage (kalıcı).
const ssrOrtami = Platform.OS === 'web' && typeof window === 'undefined';
const oturumStorage = ssrOrtami
  ? {
      getItem: async () => null,
      setItem: async () => {},
      removeItem: async () => {},
    }
  : AsyncStorage;

export const supabase: SupabaseClient | null = supabaseHazir
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        storage: oturumStorage,
        autoRefreshToken: !ssrOrtami,
        persistSession: !ssrOrtami,
        detectSessionInUrl: false, // React Native: URL'den oturum yakalama yok
        flowType: 'pkce', // mobil OAuth için güvenli akış (code → session)
      },
    })
  : null;
