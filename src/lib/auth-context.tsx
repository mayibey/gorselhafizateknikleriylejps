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
import { AppState } from 'react-native';

import {
  cikisYap,
  appleIleGiris,
  gmailIleGiris,
  hesapGeriGetir,
  hesapSilmeTalebiKur,
  profilGetir,
  profilTamMi,
  silmeTalepTarihiGetir,
  sozlesmeOnayKaydet,
} from '@/lib/auth';
import { oturumGecerliMi, oturumSahiplen } from '@/lib/oturum-kilidi';
import { senkronKaydet, senkronYukle } from '@/lib/senkron';
import { supabase, supabaseHazir } from '@/lib/supabase';

export type Kullanici = { id: string; email: string | null };

type AuthContextDeger = {
  kullanici: Kullanici | null;
  yukleniyor: boolean;
  hazir: boolean; // Supabase yapılandırıldı mı (giriş mümkün mü)
  girisYap: () => Promise<void>;
  girisYapApple: () => Promise<void>; // iOS'ta Apple ile giriş (Guideline 4.8)
  cikis: () => Promise<void>;
  hesabiSil: () => Promise<void>; // 30 günlük silme talebi + çıkış
  reaktiveEdildi: boolean; // bu girişte silinmek üzere olan hesap geri getirildi mi
  reaktivasyonGizle: () => void;
  /** TEK OTURUM: hesabına başka cihazdan girildiği için bu cihazın oturumu düşürüldü mü. */
  oturumDustu: boolean;
  profilTamam: boolean | null; // ad/soyad/telefon dolu mu (null = henüz bilinmiyor)
  profilYenile: () => Promise<void>; // profil kaydedilince çağır → gate güncellensin
};

const AuthCtx = createContext<AuthContextDeger | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [kullanici, setKullanici] = useState<Kullanici | null>(null);
  const [yukleniyor, setYukleniyor] = useState(true);
  const [reaktiveEdildi, setReaktiveEdildi] = useState(false);
  const [profilTamam, setProfilTamam] = useState<boolean | null>(null);
  const [oturumDustu, setOturumDustu] = useState(false);

  async function profilYenile(): Promise<void> {
    const p = await profilGetir();
    setProfilTamam(profilTamMi(p));
  }

  // TEK OTURUM ihlali: başka cihaz sahiplenmiş → bu cihazın oturumunu kapat + kullanıcıya söyle.
  async function oturumuDusur(): Promise<void> {
    setOturumDustu(true);
    await cikisYap();
    setKullanici(null);
    setProfilTamam(null);
  }

  useEffect(() => {
    if (!supabaseHazir || !supabase) {
      setYukleniyor(false);
      return;
    }
    const sb = supabase;
    // Girişten sonra: (0) tek-oturum, (1) silme talebi → REAKTİVASYON, (2) bulut senkron, (3) profil.
    // yeniGiris=true → bu cihaz hesabı SAHİPLENİR (diğer cihazlar düşer).
    // yeniGiris=false (oturum geri yükleme) → geçerlilik KONTROL edilir; başka cihaz sahiplendiyse düş.
    async function girisSonrasi(yeniGiris: boolean) {
      if (yeniGiris) {
        setOturumDustu(false);
        await oturumSahiplen();
      } else if (!(await oturumGecerliMi())) {
        await oturumuDusur();
        return;
      }
      const talep = await silmeTalepTarihiGetir();
      if (talep) {
        await hesapGeriGetir();
        setReaktiveEdildi(true);
      }
      // Sözleşme onay ANI (KVKK kanıtı): UI kabul olmadan giriş/kayıt başlatmıyor → ilk girişte
      // bir kez profile yazılır (zaten doluysa no-op; ilk kabul tarihi korunur).
      void sozlesmeOnayKaydet();
      await senkronYukle();
      const p = await profilGetir();
      setProfilTamam(profilTamMi(p));
    }
    // İlk oturumu oku.
    void sb.auth.getSession().then(async ({ data }) => {
      const u = data.session?.user;
      setKullanici(u ? { id: u.id, email: u.email ?? null } : null);
      setYukleniyor(false);
      if (u) await girisSonrasi(false);
    });
    // Oturum değişimlerini dinle (giriş/çıkış/yenileme).
    const { data: sub } = sb.auth.onAuthStateChange((olay, session) => {
      const u = session?.user;
      setKullanici(u ? { id: u.id, email: u.email ?? null } : null);
      if (u && olay === 'SIGNED_IN') void girisSonrasi(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // Uygulama ÖNE gelince tek-oturum kontrolü: başka cihaz giriş yaptıysa bu cihaz burada düşer.
  useEffect(() => {
    if (!supabaseHazir || !supabase) return;
    const sb = supabase;
    const sub = AppState.addEventListener('change', (durum) => {
      if (durum !== 'active') return;
      void (async () => {
        const { data } = await sb.auth.getSession();
        if (!data.session) return;
        if (!(await oturumGecerliMi())) await oturumuDusur();
      })();
    });
    return () => sub.remove();
  }, []);

  async function girisYap(): Promise<void> {
    await gmailIleGiris();
    // Oturum onAuthStateChange ile gelir; ekstra setState gerekmez.
  }

  async function girisYapApple(): Promise<void> {
    await appleIleGiris();
    // Oturum onAuthStateChange ile gelir (girisYap ile aynı).
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
        girisYapApple,
        cikis,
        hesabiSil,
        reaktiveEdildi,
        reaktivasyonGizle: () => setReaktiveEdildi(false),
        oturumDustu,
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
