/**
 * Premium üyelik durumu — TEK KAPSAM modeli: herhangi bir aktif hak (yıllık abonelik ya da
 * ömür boyu) uygulamanın TAMAMINI açar. Supabase `uyelik_haklari`'ndan okur.
 *
 * ÇEVRİMDIŞI ÇALIŞMA KORUNUR: sunucu okunamazsa (çevrimdışı) son premium değeri KORUNUR —
 * arazide/sinyalsiz kullanıcı cezalanmaz (başkan kararı, 5 Tem). Paylaşım koruması iki katman:
 * tek-oturum (auth-context; online olunca sahibi olmayan cihaz çıkışa zorlanır) + cihaz kötüye
 * kullanım kilidi (7 günde 2 cihaz — docs/v2/12). Çevrimdışı süre kilidi KALDIRILDI.
 */

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';

import { KILIT_AKTIF, PREMIUM_URUNLERI, ucretsizKanun } from '@/constants/urunler';
import { getCihazKimlik } from '@/lib/cihaz-kimlik';
import { supabase, supabaseHazir } from '@/lib/supabase';

/** Aktif bir satın alma hakkı (kart/taç gösterimi için). */
export type HakSatir = { urun: string; tip: 'omurboyu' | 'abonelik'; bitis: string | null };
type Haklar = { premium: boolean; liste: HakSatir[] };

/** haklariOku sonucu: 'ok' (sunucu okundu) / 'offline' (okunamadı — son değer korunur). */
type OkumaSonuc = { durum: 'ok'; haklar: Haklar } | { durum: 'offline' };

type UyelikContextDeger = {
  /** Aktif premium hak var mı — uygulamanın tamamını açar. */
  premium: boolean;
  aktifHaklar: HakSatir[];
  yukleniyor: boolean;
  /** Çok fazla farklı cihazda kullanım → hesap otomatik kilitli mi (destek ile açılır). */
  cihazKilit: boolean;
  yenile: () => Promise<void>;
  kanunErisilebilir: (klasor: string | null | undefined, blok?: string | null | undefined) => boolean;
};

const UyelikCtx = createContext<UyelikContextDeger | null>(null);

/** Sunucudan hakları oku. Oturum yoksa → ok+boş. Ağ/sorgu hatası → offline (son değer korunur). */
async function haklariOku(): Promise<OkumaSonuc> {
  if (!supabase) return { durum: 'ok', haklar: { premium: false, liste: [] } };
  let user;
  try {
    const r = await supabase.auth.getUser();
    user = r.data.user;
    if (r.error) return { durum: 'offline' }; // token yenilenemedi vb. → çevrimdışı say
  } catch {
    return { durum: 'offline' };
  }
  if (!user) return { durum: 'ok', haklar: { premium: false, liste: [] } };

  const { data, error } = await supabase.from('uyelik_haklari').select('urun, tip, bitis');
  if (error) return { durum: 'offline' }; // sunucuya ulaşılamadı → son değeri koru
  const simdi = Date.now();
  const aktif = (h: { tip: string; bitis: string | null }) =>
    h.tip === 'omurboyu' || (h.tip === 'abonelik' && h.bitis != null && new Date(h.bitis).getTime() > simdi);
  let premium = false;
  const liste: HakSatir[] = [];
  for (const h of (data ?? []) as { urun: string; tip: string; bitis: string | null }[]) {
    if (!aktif(h)) continue;
    if (PREMIUM_URUNLERI.includes(h.urun)) premium = true;
    liste.push({ urun: h.urun, tip: h.tip === 'abonelik' ? 'abonelik' : 'omurboyu', bitis: h.bitis });
  }
  return { durum: 'ok', haklar: { premium, liste } };
}

export function UyelikProvider({ children }: { children: ReactNode }) {
  const [haklar, setHaklar] = useState<Haklar>({ premium: false, liste: [] });
  const [yukleniyor, setYukleniyor] = useState(true);
  const [cihazKilit, setCihazKilit] = useState(false);

  const yenile = async () => {
    const sonuc = await haklariOku().catch(() => ({ durum: 'offline' }) as OkumaSonuc);
    if (sonuc.durum === 'ok') {
      setHaklar(sonuc.haklar);
      // CİHAZ KÖTÜYE KULLANIM: yalnız premium hesaplarda denetle (paylaşım koruması). Bu cihazı
      // kaydet + 7 günde >2 farklı cihaz kullanılıyorsa sunucu otomatik kilitler (docs/v2/12).
      if (sonuc.haklar.premium && supabase) {
        try {
          const kimlik = await getCihazKimlik();
          const { data, error } = await supabase.rpc('cihaz_dogrula', { p_cihaz_id: kimlik });
          setCihazKilit(!error && data != null); // data = kilit anı (null → açık)
        } catch {
          setCihazKilit(false); // RPC hatası → kilitleme (fail-open)
        }
      } else {
        setCihazKilit(false);
      }
    }
    // Çevrimdışı (durum='offline') → hiçbir şey yapma: son premium/kilit değeri KORUNUR.
    setYukleniyor(false);
  };

  useEffect(() => {
    void yenile();
    const authSub = supabase?.auth.onAuthStateChange(() => {
      void yenile();
    });
    // Uygulama öne gelince tekrar doğrula (cihaz kaydı + hak tazeleme).
    const appSub = AppState.addEventListener('change', (durum) => {
      if (durum === 'active') void yenile();
    });
    return () => {
      authSub?.data.subscription.unsubscribe();
      appSub.remove();
    };
  }, []);

  // Premium = aktif hak VAR ve cihaz kötüye kullanım kilidi yok. (Çevrimdışı süre kilidi YOK.)
  const premium = haklar.premium && !cihazKilit;

  const kanunErisilebilir = (klasor: string | null | undefined, _blok?: string | null | undefined) => {
    if (!KILIT_AKTIF) return true; // ana şalter kapalı → her içerik açık
    if (ucretsizKanun(klasor)) return true; // TCK + denemesi ücretsiz
    return premium;
  };

  return (
    <UyelikCtx.Provider
      value={{
        premium,
        aktifHaklar: haklar.liste,
        yukleniyor,
        cihazKilit,
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
