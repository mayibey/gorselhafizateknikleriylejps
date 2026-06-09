/**
 * Oturum (auth) bağlamı. Supabase oturumunu izler ve uygulama geneline yayar.
 * `hazir=false` (Supabase yapılandırılmamış) ise oturum aramaz → uygulama eski offline
 * davranışıyla çalışır (giriş zorunlu DEĞİL). hazir=true ise giriş kapısı devreye girer.
 */

import type { Session } from '@supabase/supabase-js';
import { createContext, type ReactNode, useContext, useEffect, useState } from 'react';

import { supabase, supabaseHazir } from '@/lib/supabase';

type AuthDurum = {
  session: Session | null;
  yukleniyor: boolean;
  /** Supabase yapılandırıldı mı (giriş kapısı bunda aktif). */
  hazir: boolean;
};

const AuthCtx = createContext<AuthDurum>({ session: null, yukleniyor: true, hazir: false });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [yukleniyor, setYukleniyor] = useState(true);

  useEffect(() => {
    if (!supabaseHazir) {
      setYukleniyor(false);
      return;
    }
    let aktif = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (!aktif) return;
      setSession(data.session);
      setYukleniyor(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_olay, s) => setSession(s));
    return () => {
      aktif = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthCtx.Provider value={{ session, yukleniyor, hazir: supabaseHazir }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
