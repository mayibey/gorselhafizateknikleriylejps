/**
 * Üyelik/oturum durumunu uygulama geneline sunan context (BransProvider deseni).
 * Mount'ta Supabase oturumunu okur + onAuthStateChange'e abone olur.
 * Supabase yapılandırılmamışsa (supabaseHazir=false) güvenli boş durum:
 * kullanici=null, hazir=false → uygulama offline çalışır, giriş ekranı "yakında".
 */
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { cikisYap, gmailIleGiris } from '@/lib/auth';
import { supabase, supabaseHazir } from '@/lib/supabase';

export type Kullanici = { id: string; email: string | null };

type AuthContextDeger = {
  kullanici: Kullanici | null;
  yukleniyor: boolean;
  hazir: boolean; // Supabase yapılandırıldı mı (giriş mümkün mü)
  girisYap: () => Promise<void>;
  cikis: () => Promise<void>;
};

const AuthCtx = createContext<AuthContextDeger | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [kullanici, setKullanici] = useState<Kullanici | null>(null);
  const [yukleniyor, setYukleniyor] = useState(true);

  useEffect(() => {
    if (!supabaseHazir || !supabase) {
      setYukleniyor(false);
      return;
    }
    // İlk oturumu oku.
    void supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user;
      setKullanici(u ? { id: u.id, email: u.email ?? null } : null);
      setYukleniyor(false);
    });
    // Oturum değişimlerini dinle (giriş/çıkış/yenileme).
    const { data: sub } = supabase.auth.onAuthStateChange((_olay, session) => {
      const u = session?.user;
      setKullanici(u ? { id: u.id, email: u.email ?? null } : null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function girisYap(): Promise<void> {
    await gmailIleGiris();
    // Oturum onAuthStateChange ile gelir; ekstra setState gerekmez.
  }

  async function cikis(): Promise<void> {
    await cikisYap();
    setKullanici(null);
  }

  return (
    <AuthCtx.Provider value={{ kullanici, yukleniyor, hazir: supabaseHazir, girisYap, cikis }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth(): AuthContextDeger {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error('useAuth, AuthProvider içinde kullanılmalı');
  return ctx;
}
