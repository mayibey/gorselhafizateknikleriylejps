/**
 * Üyelik/oturum durumunu uygulama geneline sunan context (BransProvider deseni).
 * Mount'ta Supabase oturumunu okur + onAuthStateChange'e abone olur.
 * Supabase yapılandırılmamışsa (supabaseHazir=false) güvenli boş durum:
 * kullanici=null, hazir=false → uygulama offline çalışır, giriş ekranı "yakında".
 *
 * Hesap silme = 30 günlük YUMUŞAK silme: girişte silme talebi varsa OTOMATİK geri getirilir
 * (reaktiveEdildi=true → UI "hesabın geri geldi" der). bkz. lib/auth.ts + docs/v2.
 */
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import {
  cikisYap,
  gmailIleGiris,
  hesapGeriGetir,
  hesapSilmeTalebiKur,
  profilGetir,
  silmeTalepTarihiGetir,
} from '@/lib/auth';
import { senkronKaydet, senkronYukle } from '@/lib/senkron';
import { supabase, supabaseHazir } from '@/lib/supabase';

export type Kullanici = { id: string; email: string | null };

type AuthContextDeger = {
  kullanici: Kullanici | null;
  yukleniyor: boolean;
  hazir: boolean; // Supabase yapılandırıldı mı (giriş mümkün mü)
  girisYap: () => Promise<void>;
  cikis: () => Promise<void>;
  hesabiSil: () => Promise<void>; // 30 günlük silme talebi + çıkış
  reaktiveEdildi: boolean; // bu girişte silinmek üzere olan hesap geri getirildi mi
  reaktivasyonGizle: () => void;
  profilTamam: boolean | null; // ad/soyad/telefon dolu mu (null = henüz bilinmiyor)
  profilYenile: () => Promise<void>; // profil kaydedilince çağır → gate güncellensin
};

const AuthCtx = createContext<AuthContextDeger | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [kullanici, setKullanici] = useState<Kullanici | null>(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [reaktiveEdildi, setReaktiveEdildi] = useState(false);
  const [profilTamam, setProfilTamam] = useState<boolean | null>(null);

  async function profilYenile(): Promise<void> {
    const p = await profilGetir();
    setProfilTamam(!!(p?.ad && p?.soyad && p?.telefon));
  }

  useEffect(() => {
    if (!supabaseHazir || !supabase) {
      setYukleniyor(false);
      return;
    }
    const sb = supabase;
    // Girişten sonra: (1) silme talebi → REAKTİVASYON, (2) bulut senkron, (3) profil tamlığı.
    async function girisSonrasi() {
      const talep = await silmeTalepTarihiGetir();
      if (talep) {
        await hesapGeriGetir();
        setReaktiveEdildi(true);
      }
      await senkronYukle();
      const p = await profilGetir();
      setProfilTamam(!!(p?.ad && p?.soyad && p?.telefon));
    }
    // İlk oturumu oku.
    void sb.auth.getSession().then(async ({ data }) => {
      const u = data.session?.user;
      setKullanici(u ? { id: u.id, email: u.email ?? null } : null);
      setYukleniyor(false);
      if (u) await girisSonrasi();
    });
    // Oturum değişimlerini dinle (giriş/çıkış/yenileme).
    const { data: sub } = sb.auth.onAuthStateChange((olay, session) => {
      const u = session?.user;
      setKullanici(u ? { id: u.id, email: u.email ?? null } : null);
      if (u && olay === 'SIGNED_IN') void girisSonrasi();
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function girisYap(): Promise<void> {
    await gmailIleGiris();
    // Oturum onAuthStateChange ile gelir; ekstra setState gerekmez.
  }

  async function cikis(): Promise<void> {
    await senkronKaydet(); // çıkmadan önce son ilerlemeyi buluta yaz
    await cikisYap();
    setKullanici(null);
    setProfilTamam(null);
  }

  async function hesabiSil(): Promise<void> {
    await hesapSilmeTalebiKur(); // 30 günlük silme işareti
    await cikisYap();
    setKullanici(null);
    setProfilTamam(null);
  }

  return (
    <AuthCtx.Provider
      value={{
        kullanici,
        yukleniyor,
        hazir: supabaseHazir,
        girisYap,
        cikis,
        hesabiSil,
        reaktiveEdildi,
        reaktivasyonGizle: () => setReaktiveEdildi(false),
        profilTamam,
        profilYenile,
      }}>
      {children}
    </AuthCtx.Provider>
  );
}

export function useAuth(): AuthContextDeger {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error('useAuth, AuthProvider içinde kullanılmalı');
  return ctx;
}
