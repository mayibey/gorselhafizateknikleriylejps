/**
 * Premium üyelik durumu — TEK KAPSAM modeli: herhangi bir aktif hak (yıllık abonelik ya da
 * ömür boyu) uygulamanın TAMAMINI açar. Supabase `uyelik_haklari`'ndan okur.
 *
 * ÇEVRİMDIŞI PAYLAŞIM KORUMASI (heartbeat): premium yalnız SUNUCUDAN taze okundukça geçerlidir.
 * Her başarılı okuma "son doğrulama" anını cihaza yazar. Cihaz N gün (uzak ayar premium_offline_gun,
 * vars. 5) boyunca sunucuyu DOĞRULAYAMAZSA premium KİLİTLENİR ("üyeliğini doğrulamak için internete
 * bağlan"). Böylece bir hesabı iki cihazda çevrimdışı paylaşma penceresi N günle sınırlanır; ayrıca
 * tek-oturum kilidi (auth-context) sahibi olmayan cihazı ONLINE olunca komple çıkışa zorlar.
 */

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { KILIT_AKTIF, PREMIUM_URUNLERI, ucretsizKanun } from '@/constants/urunler';
import { supabase, supabaseHazir } from '@/lib/supabase';
import { premiumOfflineGun } from '@/lib/uzak-ayar';

const HEARTBEAT_KEY = 'jsps.uyelik.songecerli'; // premium'un en son SUNUCUDAN doğrulandığı an (ms)

/** Aktif bir satın alma hakkı (kart/taç gösterimi için). */
export type HakSatir = { urun: string; tip: 'omurboyu' | 'abonelik'; bitis: string | null };
type Haklar = { premium: boolean; liste: HakSatir[] };

/** haklariOku sonucu: 'ok' (sunucu okundu) / 'offline' (okunamadı — son değer korunur). */
type OkumaSonuc = { durum: 'ok'; haklar: Haklar } | { durum: 'offline' };

type UyelikContextDeger = {
  /** Aktif premium hak var mı VE heartbeat taze mi — uygulamanın tamamını açar. */
  premium: boolean;
  aktifHaklar: HakSatir[];
  yukleniyor: boolean;
  /** Çevrimdışı çok uzun kalındığı için premium geçici kilitli mi (internete bağlan uyarısı). */
  offlineKilit: boolean;
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
  const [offlineKilit, setOfflineKilit] = useState(false);

  const yenile = async () => {
    const sonuc = await haklariOku().catch(() => ({ durum: 'offline' }) as OkumaSonuc);
    if (sonuc.durum === 'ok') {
      // Sunucu okundu → değerleri tazele + heartbeat damgasını at + kilidi aç.
      setHaklar(sonuc.haklar);
      setOfflineKilit(false);
      try {
        await AsyncStorage.setItem(HEARTBEAT_KEY, String(Date.now()));
      } catch {
        // damga yazılamazsa sorun değil — sonraki okuma tekrar dener
      }
    } else {
      // Çevrimdışı → son premium değeri KORUNUR ama heartbeat penceresi aşıldıysa KİLİTLE.
      try {
        const ham = await AsyncStorage.getItem(HEARTBEAT_KEY);
        const son = ham ? parseInt(ham, 10) : NaN;
        const gun = await premiumOfflineGun();
        const asildi = !Number.isFinite(son) || Date.now() - son > gun * 24 * 60 * 60 * 1000;
        setOfflineKilit(asildi);
      } catch {
        // ayar/damga okunamadı → kilitleme (fail-open; çevrimdışı çalışma bozulmasın)
        setOfflineKilit(false);
      }
    }
    setYukleniyor(false);
  };

  useEffect(() => {
    void yenile();
    const authSub = supabase?.auth.onAuthStateChange(() => {
      void yenile();
    });
    // Uygulama öne gelince tekrar doğrula (heartbeat) → çevrimdışı pencere gerçekçi ilerler.
    const appSub = AppState.addEventListener('change', (durum) => {
      if (durum === 'active') void yenile();
    });
    return () => {
      authSub?.data.subscription.unsubscribe();
      appSub.remove();
    };
  }, []);

  // Premium = aktif hak VAR ve çevrimdışı pencere aşılmadı.
  const premium = haklar.premium && !offlineKilit;

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
        offlineKilit,
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
