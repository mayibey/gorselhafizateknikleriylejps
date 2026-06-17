/**
 * Supabase istemcisi (Gmail ile giriş / üyelik). GUARDED + KOŞULLU YÜKLEME:
 * - `supabaseHazir = UYELIK_AKTIF && anahtarlar dolu`. v1'de UYELIK_AKTIF=false.
 * - Ağır bağımlılıklar (@supabase/supabase-js + react-native-url-polyfill) STATİK
 *   import DEĞİL → yalnız `supabaseHazir` iken `require` ile yüklenir. Böylece v1'de
 *   bu modüller başlangıçta HİÇ çalışmaz (url-polyfill global yamalaması yok, supabase
 *   init yok) → release build başlangıç çökme yüzeyi küçülür, gerçek offline.
 * - Anahtar dolunca (v2) istemci kurulur; oturum AsyncStorage'ta kalıcı (PKCE).
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import type { SupabaseClient } from '@supabase/supabase-js'; // yalnız tip (derlemede silinir)

import { SUPABASE_ANON_KEY, SUPABASE_URL, UYELIK_AKTIF } from '@/constants/config';

export const supabaseHazir = UYELIK_AKTIF && SUPABASE_URL !== '' && SUPABASE_ANON_KEY !== '';

function istemciOlustur(): SupabaseClient | null {
  if (!supabaseHazir) return null; // v1: ağır require'lar HİÇ çalışmaz

  // Koşullu require — yalnız üyelik AÇIKKEN modülleri yükler.
  require('react-native-url-polyfill/auto'); // Supabase fetch/URL için (RN'de global URL eksik)
  const { createClient } = require('@supabase/supabase-js') as typeof import('@supabase/supabase-js');

  // Web SSR (Node ön-render) sırasında window/localStorage yok → no-op storage.
  const ssrOrtami = Platform.OS === 'web' && typeof window === 'undefined';
  const oturumStorage = ssrOrtami
    ? { getItem: async () => null, setItem: async () => {}, removeItem: async () => {} }
    : AsyncStorage;

  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      storage: oturumStorage,
      autoRefreshToken: !ssrOrtami,
      persistSession: !ssrOrtami,
      detectSessionInUrl: false, // React Native: URL'den oturum yakalama yok
      flowType: 'pkce', // mobil OAuth için güvenli akış (code → session)
    },
  });
}

export const supabase: SupabaseClient | null = istemciOlustur();
