/**
 * Üyelik/oturum durumunu uygulama geneline sunan context (BransProvider deseni).
 * Mount'ta Supabase oturumunu okur + onAuthStateChange'e abone olur.
 * Supabase yapılandırılmamışsa (supabaseHazir=false) güvenli boş durum:
 * kullanici=null, hazir=false → uygulama offline çalışır, giriş ekranı "yakında".
 *
 * Hesap silme = 30 günlük YUMUŞAK silme: girişte silme talebi varsa OTOMATİK geri getirilir
 * (reaktiveEdildi=true → UI "hesabın geri geldi" der). bkz. lib/auth.ts + docs/v2.
 *
 * OTURUM KORUMA (3 Eki 2026, bayrak 'oturum-koruma'; kapalıyken davranış eskisiyle birebir aynı):
 * internetsiz açılışta cihazdaki oturum korunur (çıkış sayılmaz), tek-oturum düşürmesi ve çıkış yalnız
 * bu cihazı kapatır, açılışta geri yüklenen oturum hesabı yeniden sahiplenmez. bkz. lib/oturum-koruma.ts.
 */
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js'; // yalnız tip (derlemede silinir)

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
import {
  oturumGecerliMi,
  oturumKilidiKoruma,
  oturumSahiplen,
  sahipOturumKimligi,
  yerelSahiplikTemizle,
  yerelSahiplikVarMi,
} from '@/lib/oturum-kilidi';
import {
  depodakiOturumKullanicisi,
  geciciOturumHatasi,
  girisNiyetiTaze,
  girisNiyetiTemizle,
  jwtOturumKimligi,
  oturumKorumaAcikMi,
} from '@/lib/oturum-koruma';
import { senkronKaydet, senkronYukle } from '@/lib/senkron';
import { supabase, supabaseHazir } from '@/lib/supabase';

export type Kullanici = {
  id: string;
  email: string | null;
  /** Giriş yöntemi: 'apple' | 'email' | 'google' … (app_metadata.provider). Apple ile girenlerde
   *  isim Apple'dan gelir → onboarding isim SORMAZ (App Store Guideline 4). */
  saglayici: string | null;
  /** Apple/sosyal girişte sağlayıcının verdiği tam ad (user_metadata.full_name). İlk girişte gelir. */
  tamAd: string | null;
};

/** Supabase User → sade Kullanici (sağlayıcı + tam ad dahil). */
function kullaniciYap(u: { id: string; email?: string | null; app_metadata?: { provider?: string }; user_metadata?: Record<string, unknown> } | null | undefined): Kullanici | null {
  if (!u) return null;
  const ad = u.user_metadata?.full_name;
  return {
    id: u.id,
    email: u.email ?? null,
    saglayici: u.app_metadata?.provider ?? null,
    tamAd: typeof ad === 'string' && ad.trim() ? ad.trim() : null,
  };
}

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

  // OTURUM KORUMA bayrağı (açılışta bir kez, yerel önbellekten) + çevrimdışı açılış durumu:
  // oturum cihazda var ama anahtar yenilenemedi → kullanıcı içeride kalır; giriş sonrası işler
  // (tek-oturum denetimi, bulut senkron, profil) bağlantı gelince yapılır.
  const korumaRef = useRef(false);
  const cevrimdisiRef = useRef(false);
  const girisSonrasiRef = useRef<((yeniGiris: boolean, oturumKimligi?: string | null) => Promise<void>) | null>(null);

  // TEK OTURUM ihlali: başka cihaz sahiplenmiş → bu cihazın oturumunu kapat + kullanıcıya söyle.
  // Koruma açıkken yalnız BU cihaz kapanır (global çıkış, hesabı yeni sahiplenen cihazı da düşürüyordu).
  async function oturumuDusur(): Promise<void> {
    setOturumDustu(true);
    if (korumaRef.current) {
      cevrimdisiRef.current = false;
      await cikisYap('local');
      await yerelSahiplikTemizle();
    } else {
      await cikisYap();
    }
    setKullanici(null);
    setProfilTamam(null);
  }

  useEffect(() => {
    if (!supabaseHazir || !supabase) {
      setYukleniyor(false);
      return;
    }
    const sb = supabase;
    let yasiyor = true;
    // Girişten sonra: (0) tek-oturum, (1) silme talebi → REAKTİVASYON, (2) bulut senkron, (3) profil.
    // yeniGiris=true → bu cihaz hesabı SAHİPLENİR (diğer cihazlar düşer).
    // yeniGiris=false (oturum geri yükleme) → geçerlilik KONTROL edilir; başka cihaz sahiplendiyse düş.
    async function girisSonrasi(yeniGiris: boolean, oturumKimligi?: string | null) {
      if (yeniGiris) {
        setOturumDustu(false);
        await oturumSahiplen(oturumKimligi);
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
    girisSonrasiRef.current = girisSonrasi;

    // KORUMA: gelen SIGNED_IN gerçek yeni giriş mi, yoksa açılışta geri yüklenen oturum mu?
    // Yeni giriş = kullanıcı bu cihazda az önce giriş yaptı ya da Supabase oturum kimliği değişti.
    async function yeniGirisMi(oturumKimligi: string | null): Promise<boolean> {
      if (girisNiyetiTaze()) return true;
      const sahip = await sahipOturumKimligi();
      if (sahip) return !!oturumKimligi && oturumKimligi !== sahip;
      return !(await yerelSahiplikVarMi()); // bu cihaz hesabı hiç sahiplenmemiş → yeni giriş
    }

    function olayIsle(olay: AuthChangeEvent, session: Session | null) {
      const u = session?.user;
      if (!korumaRef.current) {
        // ESKİ DAVRANIŞ (bayrak kapalı) — birebir aynı.
        setKullanici(kullaniciYap(u));
        if (u && olay === 'SIGNED_IN') void girisSonrasi(true);
        return;
      }
      if (!u) {
        // Yalnız GERÇEK çıkışta kullanıcıyı düşür. INITIAL_SESSION'ın boş gelmesi geçici bir yenileme
        // hatası olabilir (internetsiz açılış) → karar açılıştaki getSession + cihazdaki oturumla verilir.
        if (olay === 'SIGNED_OUT') {
          cevrimdisiRef.current = false;
          setKullanici(null);
          setProfilTamam(null);
        }
        return;
      }
      setKullanici(kullaniciYap(u));
      if (olay === 'SIGNED_IN') {
        const sid = jwtOturumKimligi(session?.access_token);
        void (async () => {
          if (await yeniGirisMi(sid)) {
            girisNiyetiTemizle();
            cevrimdisiRef.current = false;
            await girisSonrasi(true, sid);
          } else if (cevrimdisiRef.current) {
            cevrimdisiRef.current = false;
            await girisSonrasi(false);
          }
          // Aksi hâlde: açılışta geri yüklenen oturum — denetimi açılış akışı zaten yapıyor, sahiplenme YOK.
        })();
      } else if (cevrimdisiRef.current && (olay === 'TOKEN_REFRESHED' || olay === 'INITIAL_SESSION')) {
        // Bağlantı geldi, anahtar yenilendi → ertelenen giriş sonrası işler (tek-oturum denetimi dahil).
        cevrimdisiRef.current = false;
        void girisSonrasi(false);
      }
    }

    // Olaylar bayrak okunana kadar (birkaç ms) sırada bekler → her olay doğru kipte işlenir.
    let bayrakHazir = false;
    const bekleyen: [AuthChangeEvent, Session | null][] = [];
    const { data: sub } = sb.auth.onAuthStateChange((olay, session) => {
      if (!bayrakHazir) {
        bekleyen.push([olay, session]);
        return;
      }
      olayIsle(olay, session);
    });

    void (async () => {
      const koruma = await oturumKorumaAcikMi();
      korumaRef.current = koruma;
      oturumKilidiKoruma(koruma);
      bayrakHazir = true;
      for (const [o, s] of bekleyen.splice(0)) olayIsle(o, s);
      // İlk oturumu oku.
      const { data, error } = await sb.auth.getSession();
      let u: Parameters<typeof kullaniciYap>[0] = data.session?.user ?? null;
      if (!u && koruma && geciciOturumHatasi(error)) {
        // İnternetsiz açılış: anahtar yenilenemedi ama oturum cihazda duruyor → çıkış SAYMA.
        const d = await depodakiOturumKullanicisi();
        if (d) {
          u = d;
          cevrimdisiRef.current = true;
        }
      }
      if (!yasiyor) return;
      setKullanici(kullaniciYap(u));
      setYukleniyor(false);
      if (u && !cevrimdisiRef.current) await girisSonrasi(false);
    })();
    return () => {
      yasiyor = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  // Uygulama ÖNE gelince tek-oturum kontrolü: başka cihaz giriş yaptıysa bu cihaz burada düşer.
  useEffect(() => {
    if (!supabaseHazir || !supabase) return;
    const sb = supabase;
    const sub = AppState.addEventListener('change', (durum) => {
      if (durum !== 'active') return;
      void (async () => {
        const { data } = await sb.auth.getSession();
        if (!data.session) return; // oturum yok ya da (koruma) anahtar hâlâ yenilenemiyor → dokunma
        if (korumaRef.current && cevrimdisiRef.current) {
          // Çevrimdışı açılmıştı, şimdi anahtar yenilenebildi → ertelenen işler (denetim dahil).
          cevrimdisiRef.current = false;
          setKullanici(kullaniciYap(data.session.user));
          await girisSonrasiRef.current?.(false);
          return;
        }
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
    if (korumaRef.current) {
      cevrimdisiRef.current = false;
      await cikisYap('local'); // yalnız bu cihaz
      await yerelSahiplikTemizle(); // bu cihazdaki sonraki giriş YENİ giriş sayılsın
    } else {
      await cikisYap();
    }
    setKullanici(null);
    setProfilTamam(null);
  }

  async function hesabiSil(): Promise<void> {
    await hesapSilmeTalebiKur(); // 30 günlük silme işareti
    await cikisYap(); // hesap silmede bütün cihazlar kapanır (global)
    if (korumaRef.current) {
      cevrimdisiRef.current = false;
      await yerelSahiplikTemizle();
    }
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
