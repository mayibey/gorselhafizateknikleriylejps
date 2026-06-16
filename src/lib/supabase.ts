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

import { SUPABASE_ANON_KEY, SUPABASE_URL } from '@/constants/config';

export const supabaseHazir = SUPABASE_URL !== '' && SUPABASE_ANON_KEY !== '';

export const supabase: SupabaseClient | null = supabaseHazir
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false, // React Native: URL'den oturum yakalama yok
        flowType: 'pkce', // mobil OAuth için güvenli akış (code → session)
      },
    })
  : null;
