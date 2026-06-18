/**
 * Seçili rütbeyi uygulama geneline sunan context (BransProvider deseninin aynısı).
 * Mount'ta AsyncStorage'tan async okur; { rutbe, yukleniyor, setRutbe } verir.
 */

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { getRutbe, type Rutbe, setRutbe as rutbeKaydet } from '@/lib/rutbe-store';

type RutbeContextDeger = {
  rutbe: Rutbe | null;
  yukleniyor: boolean;
  setRutbe: (slug: Rutbe) => Promise<void>;
};

const RutbeCtx = createContext<RutbeContextDeger | null>(null);

export function RutbeProvider({ children }: { children: ReactNode }) {
  const [rutbe, setRutbeState] = useState<Rutbe | null>(null);
  const [yukleniyor, setYukleniyor] = useState(true);

  useEffect(() => {
    void getRutbe().then((kayitli) => {
      setRutbeState(kayitli);
      setYukleniyor(false);
    });
  }, []);

  async function setRutbe(slug: Rutbe): Promise<void> {
    await rutbeKaydet(slug);
    setRutbeState(slug);
  }

  return (
    <RutbeCtx.Provider value={{ rutbe, yukleniyor, setRutbe }}>{children}</RutbeCtx.Provider>
  );
}

export function useRutbe(): RutbeContextDeger {
  const ctx = useContext(RutbeCtx);
  if (!ctx) throw new Error('useRutbe, RutbeProvider içinde kullanılmalı');
  return ctx;
}
