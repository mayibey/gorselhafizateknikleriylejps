/**
 * Seçili rütbeyi uygulama geneline sunan context (BransProvider deseninin aynısı).
 * Mount'ta AsyncStorage'tan async okur; { rutbe, yukleniyor, setRutbe } verir.
 *
 * SUNUCU SENKRONU (docs/v2/08): girişte sunucudaki seçim ESAS — doluysa cihaza iner,
 * boşsa cihazdaki TEMİZLENİR (hesap değişimi). Ağ hatasında cihazdaki korunur.
 */

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { gorevGetir, gorevKaydet } from '@/lib/auth';
import { useAuth } from '@/lib/auth-context';
import { getRutbe, RUTBELER, type Rutbe, rutbeTemizle, setRutbe as rutbeKaydet } from '@/lib/rutbe-store';

type RutbeContextDeger = {
  rutbe: Rutbe | null;
  yukleniyor: boolean;
  setRutbe: (slug: Rutbe) => Promise<void>;
};

const RutbeCtx = createContext<RutbeContextDeger | null>(null);

export function RutbeProvider({ children }: { children: ReactNode }) {
  const { kullanici } = useAuth();
  const [rutbe, setRutbeState] = useState<Rutbe | null>(null);
  const [yukleniyor, setYukleniyor] = useState(true);

  useEffect(() => {
    void getRutbe().then((kayitli) => {
      setRutbeState(kayitli);
      setYukleniyor(false);
    });
  }, []);

  // Girişte / hesap değişiminde sunucudaki seçim esas.
  const uid = kullanici?.id ?? null;
  useEffect(() => {
    if (!uid) return;
    let iptal = false;
    void gorevGetir().then((g) => {
      if (iptal || g === null) return; // ağ hatası → cihazdaki korunur
      const gecerli = g.rutbe && RUTBELER.some((r) => r.slug === g.rutbe) ? (g.rutbe as Rutbe) : null;
      if (gecerli) {
        void rutbeKaydet(gecerli);
        setRutbeState(gecerli);
      } else {
        void rutbeTemizle();
        setRutbeState(null); // gate GorevAdim'a yollar → seçim sunucuya yazılır
      }
    });
    return () => {
      iptal = true;
    };
  }, [uid]);

  async function setRutbe(slug: Rutbe): Promise<void> {
    await rutbeKaydet(slug);
    setRutbeState(slug);
    // Sunucuya da — seçim ANINDAKİ hesapla (yazma sırasında hesap değişirse iptal).
    // AWAIT ŞART: yazma bitmeden profilYenile→gorevGetir çalışırsa sunucu rütbesi boş görünüp
    // cihazdakini SİLER → statü/rütbe 2. kez sorulur (ilk-kayıt bug'ı). Bekle.
    if (uid) await gorevKaydet({ rutbe: slug }, uid);
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
