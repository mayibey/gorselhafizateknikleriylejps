/**
 * Premium üyelik durumu — TEK KAPSAM modeli: herhangi bir aktif hak (yıllık abonelik ya da
 * ömür boyu) uygulamanın TAMAMINI açar. Supabase `uyelik_haklari`'ndan okur.
 *
 * ÇEVRİMDIŞI ÇALIŞMA KORUNUR: sunucu okunamazsa (çevrimdışı) son premium değeri KORUNUR —
 * arazide/sinyalsiz kullanıcı cezalanmaz (başkan kararı, 5 Tem). Paylaşım koruması iki katman:
 * tek-oturum (auth-context; online olunca sahibi olmayan cihaz çıkışa zorlanır) + cihaz kötüye
 * kullanım kilidi (7 günde 2 cihaz — docs/v2/12). Çevrimdışı süre kilidi KALDIRILDI.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';

import { kanunErisilebilirSaf, PREMIUM_URUNLERI } from '@/constants/urunler';
import { abonelikTazele } from '@/lib/uyelik-tazele';
import { getCihazKimlik } from '@/lib/cihaz-kimlik';
import { supabase, supabaseHazir } from '@/lib/supabase';

/** Aktif bir satın alma hakkı (kart/taç gösterimi için). */
export type HakSatir = { urun: string; tip: 'omurboyu' | 'abonelik'; bitis: string | null };
type Haklar = { premium: boolean; liste: HakSatir[] };

/** haklariOku sonucu: 'ok' (sunucu okundu) / 'offline' (okunamadı — son değer korunur). */
type OkumaSonuc = { durum: 'ok'; haklar: Haklar; uid: string | null } | { durum: 'offline'; uid: string | null };

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

// SON BİLİNEN HAKLAR (29 Eyl 2026 — Fatih Keyvan vakası): uygulama uzun süre kapalı kalıp açılınca oturum
// anahtarı süresi dolmuş oluyor; ilk `uyelik_haklari` isteği 401 dönüyor, kod bunu "çevrimdışı" sayıyor ama
// açılış değeri premium=false olduğu için ödeyen kullanıcı paywall'a atılıyordu (anahtar 2 sn sonra yenilenince
// düzeliyor, adam o sırada paywall'da kalıyor). Çözüm: son OK okuma cihazda saklanır (kullanıcı id'siyle);
// açılışta o değerle başlanır, çevrimdışı/anahtar hatasında da o korunur. İçerik indirme kilidi sunucuda
// olduğu için güvenlik açığı doğurmaz; iade/kilit ilk başarılı okumada yine düşer.
const SON_HAKLAR_KEY = 'jsps.uyelik.sonHaklar';
async function sonHaklariOku(): Promise<{ uid: string; haklar: Haklar } | null> {
  try {
    const ham = await AsyncStorage.getItem(SON_HAKLAR_KEY);
    return ham ? (JSON.parse(ham) as { uid: string; haklar: Haklar }) : null;
  } catch {
    return null;
  }
}
async function sonHaklariYaz(uid: string, haklar: Haklar): Promise<void> {
  try {
    await AsyncStorage.setItem(SON_HAKLAR_KEY, JSON.stringify({ uid, haklar }));
  } catch {
    /* saklanamadı — sorun değil */
  }
}

/** Sunucudan hakları oku. OTURUM YOKSA (çıkış) → ok+boş (premium sıfırlanır, bayat kalmaz).
 * Oturum VAR ama sorgu ağ hatası verirse → offline (son değer korunur, çevrimdışı çalışma sürsün). */
async function haklariOku(): Promise<OkumaSonuc> {
  if (!supabase) return { durum: 'ok', haklar: { premium: false, liste: [] }, uid: null };
  // getSession YERELDEN okur (ağsız, çıkışta null döner) → "oturum yok"u "çevrimdışı"dan ayırır.
  let oturum;
  try {
    oturum = (await supabase.auth.getSession()).data.session;
  } catch {
    return { durum: 'offline', uid: null };
  }
  if (!oturum) return { durum: 'ok', haklar: { premium: false, liste: [] }, uid: null }; // çıkış → premium false
  const uid = oturum.user?.id ?? null;

  let { data, error } = await supabase.from('uyelik_haklari').select('urun, tip, bitis');
  if (error && /jwt|token|401|expired/i.test(`${error.message} ${error.code ?? ''}`)) {
    // Anahtar süresi dolmuş: bir kez yenile ve tekrar dene (SDK yenilemeyi henüz bitirmemiş olabilir).
    try {
      await supabase.auth.refreshSession();
      ({ data, error } = await supabase.from('uyelik_haklari').select('urun, tip, bitis'));
    } catch {
      /* yenilenemedi → aşağıda offline */
    }
  }
  if (error) return { durum: 'offline', uid }; // sunucuya ulaşılamadı → son değeri koru
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
  return { durum: 'ok', haklar: { premium, liste }, uid };
}

export function UyelikProvider({ children }: { children: ReactNode }) {
  const [haklar, setHaklar] = useState<Haklar>({ premium: false, liste: [] });
  const [yukleniyor, setYukleniyor] = useState(true);
  const [cihazKilit, setCihazKilit] = useState(false);

  const yenile = async () => {
    const sonuc = await haklariOku().catch(() => ({ durum: 'offline', uid: null }) as OkumaSonuc);
    if (sonuc.durum === 'offline') {
      // Sunucu okunamadı: bu kullanıcının son bilinen hakları varsa onunla devam (paywall'a atma).
      const son = await sonHaklariOku();
      if (son && sonuc.uid && son.uid === sonuc.uid) setHaklar(son.haklar);
    }
    if (sonuc.durum === 'ok') {
      setHaklar(sonuc.haklar);
      if (sonuc.uid) void sonHaklariYaz(sonuc.uid, sonuc.haklar);
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
    // ABONELİK TAZELEME (26 Ağu): bitişi yaklaşan/geçmiş aboneliği mağazadan yeniden
    // doğrulat → yenilenen dönem `bitis`e yazılsın. Yalnız gerekince çalışır, hiçbir hak
    // silmez, hata yutulur. Tazelendiyse hakları TEKRAR oku.
    void (async () => {
      await yenile();
      if (await abonelikTazele()) await yenile();
    })();
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

  // Saf fonksiyona delege (davranış aynı; kuyruk süzme/hook aynı mantığı kullanır → tek kaynak).
  const kanunErisilebilir = (klasor: string | null | undefined, _blok?: string | null | undefined) =>
    kanunErisilebilirSaf(klasor, premium);

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
