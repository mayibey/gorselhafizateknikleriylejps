/**
 * Seçili branşı uygulama geneline sunan context.
 * Mount'ta AsyncStorage'tan async okur; { brans, yukleniyor, setBrans } verir.
 *
 * SUNUCU SENKRONU (docs/v2/08): girişte sunucudaki seçim ESAS —
 * doluysa cihaza iner, boşsa cihazdaki TEMİZLENİR (hesap değişiminde önceki
 * kullanıcının branşı görünmesin; gate GorevAdim'a yollar, seçim sunucuya yazılır).
 * Ağ hatasında cihazdaki korunur (offline çalışma bozulmaz).
 */

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { gorevGetir, gorevKaydet } from '@/lib/auth';
import { useAuth } from '@/lib/auth-context';
import { bransTemizle, getBrans, setBrans as bransKaydet } from '@/lib/brans-store';

type BransContextDeger = {
  brans: string | null;
  yukleniyor: boolean;
  setBrans: (slug: string) => Promise<void>;
};

const BransCtx = createContext<BransContextDeger | null>(null);

export function BransProvider({ children }: { children: ReactNode }) {
  const { kullanici } = useAuth();
  const [brans, setBransState] = useState<string | null>(null);
  const [yukleniyor, setYukleniyor] = useState(true);

  useEffect(() => {
    void getBrans().then((kayitli) => {
      setBransState(kayitli);
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
      if (g.brans) {
        void bransKaydet(g.brans);
        setBransState(g.brans);
      } else {
        void bransTemizle();
        setBransState(null); // gate GorevAdim'a yollar → seçim sunucuya yazılır
      }
    });
    return () => {
      iptal = true;
    };
  }, [uid]);

  async function setBrans(slug: string): Promise<void> {
    await bransKaydet(slug);
    setBransState(slug);
    // Sunucuya da — seçim ANINDAKİ hesapla (yazma sırasında hesap değişirse iptal).
    // AWAIT ŞART: yazma bitmeden onboarding profilYenile→gorevGetir çalışırsa sunucu branşı
    // hâlâ boş görünüp cihazdakini SİLER → gate branşı 2. kez sorar (ilk-kayıt bug'ı). Bekle.
    if (uid) await gorevKaydet({ brans: slug }, uid);
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
