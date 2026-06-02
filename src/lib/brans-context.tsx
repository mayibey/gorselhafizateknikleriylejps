/**
 * Seçili branşı uygulama geneline sunan context.
 * Mount'ta AsyncStorage'tan async okur; { brans, yukleniyor, setBrans } verir.
 */

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { getBrans, setBrans as bransKaydet } from '@/lib/brans-store';

type BransContextDeger = {
  brans: string | null;
  yukleniyor: boolean;
  setBrans: (slug: string) => Promise<void>;
};

const BransCtx = createContext<BransContextDeger | null>(null);

export function BransProvider({ children }: { children: ReactNode }) {
  const [brans, setBransState] = useState<string | null>(null);
  const [yukleniyor, setYukleniyor] = useState(true);

  useEffect(() => {
    void getBrans().then((kayitli) => {
      setBransState(kayitli);
      setYukleniyor(false);
    });
  }, []);

  async function setBrans(slug: string): Promise<void> {
    await bransKaydet(slug);
    setBransState(slug);
  }

  return (
    <BransCtx.Provider value={{ brans, yukleniyor, setBrans }}>{children}</BransCtx.Provider>
  );
}

export function useBrans(): BransContextDeger {
  const ctx = useContext(BransCtx);
  if (!ctx) throw new Error('useBrans, BransProvider içinde kullanılmalı');
  return ctx;
}
