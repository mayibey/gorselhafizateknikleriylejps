/**
 * Premium üyelik durumu — KATEGORİ bazlı (müşterek / branş ayrı).
 * Supabase `uyelik_haklari`'ndan okur → her kategori için aktif hak var mı (ömür boyu ya da abonelik).
 * kanunErisilebilir(klasor, blok): TCK ücretsiz · müşterek blok → müşterek hakkı · branş blok → branş hakkı.
 */

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { BRANS_URUNLERI, MUSTEREK_URUNLERI, musterekBlokMu, ucretsizKanun } from '@/constants/urunler';
import { supabase } from '@/lib/supabase';

type Haklar = { musterek: boolean; brans: boolean };

type UyelikContextDeger = {
  musterek: boolean;
  brans: boolean;
  /** Herhangi bir premium hak var mı (müşterek veya branş). */
  premium: boolean;
  yukleniyor: boolean;
  yenile: () => Promise<void>;
  /** Bir kanun açık mı: TCK ücretsiz · müşterek bloğu müşterek hakkına · branş bloğu branş hakkına bağlı. */
  kanunErisilebilir: (klasor: string | null | undefined, blok: string | null | undefined) => boolean;
};

const UyelikCtx = createContext<UyelikContextDeger | null>(null);

async function haklariOku(): Promise<Haklar> {
  const bos = { musterek: false, brans: false };
  if (!supabase) return bos;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return bos;
  const { data, error } = await supabase.from('uyelik_haklari').select('urun, tip, bitis');
  if (error || !data) return bos;
  const simdi = Date.now();
  const aktif = (h: { tip: string; bitis: string | null }) =>
    h.tip === 'omurboyu' || (h.tip === 'abonelik' && h.bitis != null && new Date(h.bitis).getTime() > simdi);
  let musterek = false;
  let brans = false;
  for (const h of data as { urun: string; tip: string; bitis: string | null }[]) {
    if (!aktif(h)) continue;
    if (MUSTEREK_URUNLERI.includes(h.urun)) musterek = true;
    if (BRANS_URUNLERI.includes(h.urun)) brans = true;
  }
  return { musterek, brans };
}

export function UyelikProvider({ children }: { children: ReactNode }) {
  const [haklar, setHaklar] = useState<Haklar>({ musterek: false, brans: false });
  const [yukleniyor, setYukleniyor] = useState(true);

  const yenile = async () => {
    const h = await haklariOku().catch(() => ({ musterek: false, brans: false }));
    setHaklar(h);
    setYukleniyor(false);
  };

  useEffect(() => {
    void yenile();
    const sub = supabase?.auth.onAuthStateChange(() => {
      void yenile();
    });
    return () => sub?.data.subscription.unsubscribe();
  }, []);

  const kanunErisilebilir = (klasor: string | null | undefined, blok: string | null | undefined) => {
    if (ucretsizKanun(klasor)) return true;
    return musterekBlokMu(blok) ? haklar.musterek : haklar.brans;
  };

  return (
    <UyelikCtx.Provider
      value={{
        musterek: haklar.musterek,
        brans: haklar.brans,
        premium: haklar.musterek || haklar.brans,
        yukleniyor,
        yenile,
        kanunErisilebilir,
      }}>
      {children}
    </UyelikCtx.Provider>
  );
}

export function useUyelik(): UyelikContextDeger {
  const ctx = useContext(UyelikCtx);
  if (!ctx) throw new Error('useUyelik, UyelikProvider içinde kullanılmalı');
  return ctx;
}
