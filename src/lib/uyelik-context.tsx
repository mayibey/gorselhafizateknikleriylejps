/**
 * Premium üyelik durumunu uygulama geneline sunan context.
 * Supabase `uyelik_haklari`'ndan okur → premium = (ömür boyu hak VAR) ya da (abonelik aktif).
 * { premium, yukleniyor, yenile, kanunErisilebilir } verir. Satın alma/giriş sonrası yenile().
 */

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { ucretsizKanun } from '@/constants/urunler';
import { supabase } from '@/lib/supabase';

type UyelikContextDeger = {
  premium: boolean;
  yukleniyor: boolean;
  yenile: () => Promise<void>;
  /** Bir kanun (klasör) açık mı: ücretsiz tadımlık ya da premium. */
  kanunErisilebilir: (klasor: string | null | undefined) => boolean;
};

const UyelikCtx = createContext<UyelikContextDeger | null>(null);

async function premiumOku(): Promise<boolean> {
  if (!supabase) return false;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;
  const { data, error } = await supabase.from('uyelik_haklari').select('tip, bitis');
  if (error || !data) return false;
  const simdi = Date.now();
  return data.some(
    (h) =>
      h.tip === 'omurboyu' ||
      (h.tip === 'abonelik' && h.bitis != null && new Date(h.bitis as string).getTime() > simdi),
  );
}

export function UyelikProvider({ children }: { children: ReactNode }) {
  const [premium, setPremium] = useState(false);
  const [yukleniyor, setYukleniyor] = useState(true);

  const yenile = async () => {
    const p = await premiumOku().catch(() => false);
    setPremium(p);
    setYukleniyor(false);
  };

  useEffect(() => {
    void yenile();
    // Giriş/çıkış olunca premium durumunu tazele.
    const sub = supabase?.auth.onAuthStateChange(() => {
      void yenile();
    });
    return () => sub?.data.subscription.unsubscribe();
  }, []);

  const kanunErisilebilir = (klasor: string | null | undefined) => ucretsizKanun(klasor) || premium;

  return (
    <UyelikCtx.Provider value={{ premium, yukleniyor, yenile, kanunErisilebilir }}>
      {children}
    </UyelikCtx.Provider>
  );
}

export function useUyelik(): UyelikContextDeger {
  const ctx = useContext(UyelikCtx);
  if (!ctx) throw new Error('useUyelik, UyelikProvider içinde kullanılmalı');
  return ctx;
}
