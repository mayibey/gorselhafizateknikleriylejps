/**
 * Premium üyelik durumu — TEK KAPSAM modeli: herhangi bir aktif hak (yıllık abonelik ya da
 * ömür boyu) uygulamanın TAMAMINI açar. Supabase `uyelik_haklari`'ndan okur.
 * kanunErisilebilir(klasor, blok): TCK ücretsiz · gerisi premium'a bağlı (blok parametresi
 * eski müşterek/branş modelinden imza uyumu için durur; artık kullanılmaz).
 */

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { KILIT_AKTIF, PREMIUM_URUNLERI, ucretsizKanun } from '@/constants/urunler';
import { supabase } from '@/lib/supabase';

/** Aktif bir satın alma hakkı (kart/taç gösterimi için). */
export type HakSatir = { urun: string; tip: 'omurboyu' | 'abonelik'; bitis: string | null };
type Haklar = { premium: boolean; liste: HakSatir[] };

type UyelikContextDeger = {
  /** Aktif premium hak var mı (yıllık ya da ömür boyu) — uygulamanın tamamını açar. */
  premium: boolean;
  /** Kullanıcının AKTİF satın alma hakları (Üyeliğim kartı + taç için). */
  aktifHaklar: HakSatir[];
  yukleniyor: boolean;
  yenile: () => Promise<void>;
  /** Bir kanun açık mı: TCK ücretsiz · gerisi premium. (blok: eski imza uyumu, kullanılmaz.) */
  kanunErisilebilir: (klasor: string | null | undefined, blok?: string | null | undefined) => boolean;
};

const UyelikCtx = createContext<UyelikContextDeger | null>(null);

async function haklariOku(): Promise<Haklar> {
  const bos: Haklar = { premium: false, liste: [] };
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
  let premium = false;
  const liste: HakSatir[] = [];
  for (const h of data as { urun: string; tip: string; bitis: string | null }[]) {
    if (!aktif(h)) continue;
    if (PREMIUM_URUNLERI.includes(h.urun)) premium = true;
    liste.push({ urun: h.urun, tip: h.tip === 'abonelik' ? 'abonelik' : 'omurboyu', bitis: h.bitis });
  }
  return { premium, liste };
}

export function UyelikProvider({ children }: { children: ReactNode }) {
  const [haklar, setHaklar] = useState<Haklar>({ premium: false, liste: [] });
  const [yukleniyor, setYukleniyor] = useState(true);

  const yenile = async () => {
    const h = await haklariOku().catch(() => ({ premium: false, liste: [] }) as Haklar);
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

  const kanunErisilebilir = (klasor: string | null | undefined, _blok?: string | null | undefined) => {
    if (!KILIT_AKTIF) return true; // ana şalter kapalı → her içerik açık
    if (ucretsizKanun(klasor)) return true; // TCK + denemesi ücretsiz
    return haklar.premium;
  };

  return (
    <UyelikCtx.Provider
      value={{
        premium: haklar.premium,
        aktifHaklar: haklar.liste,
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
