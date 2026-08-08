import {
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/inter';
import { PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import { setAudioModeAsync } from 'expo-audio';
import * as Linking from 'expo-linking';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { AppState, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ErrorBoundary } from '@/components/ui/error-boundary';
import { Palette } from '@/constants/theme';
import { initDatabase } from '@/db/database';
import { oauthUrlIsle, tanitimSunucudanOku, tanitimSunucuyaYaz } from '@/lib/auth';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import { bildirimTiklamaDinle, getAyar, planla } from '@/lib/bildirim';
import { pushTokenGuncelle } from '@/lib/er-meydani';
import { istemciSurumBildir } from '@/lib/istemci-surum';
import { tanitimTamamla, tanitimTamamMi } from '@/lib/ipuclari';
import { UygulamaTuru } from '@/components/tanitim/uygulama-turu';
import { OtaYukleniyor } from '@/components/guncelleme/ota-yukleniyor';
import { ZorunluGuncelleme } from '@/components/guncelleme/zorunlu-guncelleme';
import { zorunluGuncellemeGerekli } from '@/lib/guncelleme';
import { otaGuncellemeUygula } from '@/lib/ota';
import { useEkranKoruma } from '@/lib/ekran-koruma';
import { indirmeDurumYukle } from '@/lib/indirme';
import { senkronKaydet } from '@/lib/senkron';
import { takipIzniVeMetaBaslat } from '@/lib/takip-izni';
import { BransProvider, useBrans } from '@/lib/brans-context';
import { RutbeProvider, useRutbe } from '@/lib/rutbe-context';
import { UyelikProvider } from '@/lib/uyelik-context';

// Fontlar yüklenene kadar splash açık kalsın (yanıp sönme/FOUT önlenir).
void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    PlayfairDisplay_700Bold,
  });

  // Ekran görüntüsü + VİDEO KAYDI engeli — GLOBAL (tüm ekranlar; Android FLAG_SECURE).
  // (Önce sadece /akis + sesli-nöbette'ydi; içerik arama/sheet'lerde de görünüyor → app geneli.)
  useEkranKoruma();

  useEffect(() => {
    void initDatabase();
  }, []);

  // OTA: güncelleme varsa AÇILIŞTA indirip uygulamayı yeniden başlat (bkz. lib/ota.ts).
  // Olmazsa yeni içerik ancak İKİNCİ açılışta görünüyordu — yeni indiren kullanıcı oyunları
  // ilk girişte göremiyordu. `otaCalisiyor` true iken bekleme ekranı gösterilir; yeniden
  // başlatma tetiklenirse zaten bu ekran yaşamını orada bitirir.
  // 'yok' → normal açılış · 'iniyor' → indirme sürüyor · 'hazir' → indi, kullanıcı başlatacak
  const [otaDurum, setOtaDurum] = useState<'yok' | 'iniyor' | 'hazir'>('yok');
  useEffect(() => {
    let iptal = false;
    void otaGuncellemeUygula(
      () => { if (!iptal) setOtaDurum('iniyor'); },
      () => { if (!iptal) setOtaDurum('hazir'); },
    ).then((indi) => {
      // İndirme başarısızsa normal açılışa dön; başarılıysa 'hazir' ekranında kal.
      if (!iptal && !indi) setOtaDurum('yok');
    });
    return () => {
      iptal = true;
    };
  }, []);

  // ATT izni (iOS) + Meta SDK başlatma — izin popup'ı splash kapandıktan sonra görünsün
  // diye kısa gecikmeli. Apple kuralı: takip verisi toplanmadan ÖNCE sorulmalı (bkz. takip-izni.ts).
  useEffect(() => {
    const t = setTimeout(() => void takipIzniVeMetaBaslat(), 1200);
    return () => clearTimeout(t);
  }, []);

  // Açılışta günlük bildirimleri (ayara göre) yeniden planla — kalıcı hatırlatmalar için.
  // (Web'de + google-services.json yoksa no-op; bkz. lib/bildirim.ts.)
  useEffect(() => {
    void getAyar().then(planla);
  }, []);

  // Açılışta uzak push token'ı kaydet (oda dolunca/katılınca bildirim için). Oturum yoksa no-op.
  useEffect(() => {
    void pushTokenGuncelle();
  }, []);

  // Açılışta "hangi sürüm / hangi güncelleme paketi" bildir → OTA'yı kaç kişinin aldığını sayabilelim.
  useEffect(() => {
    void istemciSurumBildir();
  }, []);

  // İndirilmiş kanun listesini belleğe al → görsel çözümleyici yerel dosyaları görsün.
  useEffect(() => {
    void indirmeDurumYukle();
  }, []);

  // GOOGLE GİRİŞ DÖNÜŞÜ (deep-link): Android'de OAuth redirect app'e `mevzu://?code=...` deep-link
  // olarak düşebilir (WebBrowser oturumu 'dismiss' döner). Burada yakalayıp code'u oturuma çeviririz
  // → giriş tamamlanır (şifre-yenileme HARİÇ; o kendi ekranında). Soğuk açılış için getInitialURL.
  useEffect(() => {
    const sub = Linking.addEventListener('url', ({ url }) => {
      void oauthUrlIsle(url);
    });
    void Linking.getInitialURL().then((url) => {
      if (url) void oauthUrlIsle(url);
    });
    return () => sub.remove();
  }, []);

  // Ses ARKA PLANDA ÇALMASIN — app arka plana/ekran kapanınca anlatım dursun. Böylece
  // foreground-service iznine gerek kalmaz (Play "ön plan hizmeti izinleri" beyanı gerekmez).
  // playsInSilentMode: iOS'ta telefon SESSİZ MODDAYKEN de uygulama sesi çalsın (kullanıcılar
  // "ses yok" sanıyordu; iOS varsayılanı sessiz modda susar). Android'de bu alan etkisiz.
  useEffect(() => {
    void setAudioModeAsync({ shouldPlayInBackground: false, playsInSilentMode: true });
  }, []);

  // Uygulama arka plana alınınca ilerlemeyi buluta yaz (giriş yoksa no-op).
  useEffect(() => {
    const sub = AppState.addEventListener('change', (durum) => {
      if (durum === 'background' || durum === 'inactive') void senkronKaydet();
    });
    return () => sub.remove();
  }, []);

  // Fontlar yüklenince (ya da yüklenemezse de) splash'i gizle.
  useEffect(() => {
    if (fontsLoaded || fontError) void SplashScreen.hideAsync();
  }, [fontsLoaded, fontError]);

  // Fontlar gelene kadar render etme (splash görünür kalır).
  if (!fontsLoaded && !fontError) return null;

  // OTA indiriliyorken ya da indirilmiş güncelleme uygulanmayı beklerken hiçbir şeye
  // başlanmasın — yarım güncellemeyle gezilmesin. 'hazir' ekranında yeniden başlatma
  // düğmesi var; kullanıcı basmadan devam edilmiyor (başkan isteği: otomatik kapanma yok).
  if (otaDurum !== 'yok') {
    return (
      <GestureHandlerRootView style={styles.kok}>
        <SafeAreaProvider>
          <StatusBar style="dark" />
          <OtaYukleniyor hazir={otaDurum === 'hazir'} />
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

  return (
    // GestureHandlerRootView: gesture-handler jestleri (görsel zoom pinch/pan) için şart.
    <GestureHandlerRootView style={styles.kok}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <AuthProvider>
          <UyelikProvider>
            <BransProvider>
              <RutbeProvider>
                <ErrorBoundary>
                  <RootNavigator />
                </ErrorBoundary>
              </RutbeProvider>
            </BransProvider>
          </UyelikProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function RootNavigator() {
  const { brans, yukleniyor: bransYukleniyor } = useBrans();
  const { rutbe, yukleniyor: rutbeYukleniyor } = useRutbe();
  const { kullanici, hazir, yukleniyor: authYukleniyor } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  // Uygulama turu: HESABA bağlı (sunucu esas) — her hesap bir kez görür; cihaz değişse de takip
  // edilir. Girişsiz/offline durumda cihaz-yerel bayrak geçerli (fail-open). null = henüz okunmadı.
  const [tanitimTamam, setTanitimTamam] = useState<boolean | null>(null);
  // ZORUNLU GÜNCELLEME: sunucu min sürüm > cihaz sürümü → her şeyden önce kapatılamaz güncelle ekranı.
  const [guncelleGerek, setGuncelleGerek] = useState(false);
  useEffect(() => {
    let iptal = false;
    void zorunluGuncellemeGerekli().then((v) => {
      if (!iptal) setGuncelleGerek(v);
    });
    return () => {
      iptal = true;
    };
  }, []);
  useEffect(() => {
    if (authYukleniyor) return;
    let iptal = false;
    void (async () => {
      const yerel = await tanitimTamamMi();
      if (!kullanici) {
        if (!iptal) setTanitimTamam(yerel);
        return;
      }
      const sunucu = await tanitimSunucudanOku();
      if (iptal) return;
      if (sunucu === true) {
        if (!yerel) void tanitimTamamla(); // cihaz bayrağını sunucuya eşitle
        setTanitimTamam(true);
      } else if (sunucu === null) {
        setTanitimTamam(yerel); // sunucu okunamadı (offline) → cihazdaki geçerli
      } else {
        setTanitimTamam(false); // hesap turu görmemiş → göster (cihaz görmüş olsa bile)
      }
    })();
    return () => {
      iptal = true;
    };
  }, [kullanici, authYukleniyor]);

  const yukleniyor = bransYukleniyor || rutbeYukleniyor || authYukleniyor;
  // Giriş ZORUNLU: Supabase yapılandırıldıysa (hazir) ve oturum yoksa giriş ister.
  // (hazir=false ise — anahtar yok — gate kapanır, uygulama girişsiz çalışır: güvenli fallback.)
  const girisGerek = hazir && !kullanici;
  // Görev bilgisi (branş/rütbe) yalnız CİHAZDA tutuluyor. Uygulama silinip yeniden kurulunca
  // branş/rütbe boş kalır → onboarding'e götürürüz (orada seçilir).
  const gorevEksik = !brans || !rutbe;
  // Onboarding: ZORUNLU giriş + görev (branş/rütbe) seçimi. Kişisel profil alanları Apple gereği
  // OPSİYONEL olduğundan kapı artık sunucu profil tamlığına (profilTamam) bağlı DEĞİL.
  const eksik = girisGerek || (!!kullanici && gorevEksik);

  // Guard: giriş/profil/branş/rütbe eksikse onboarding'e götür. (Tur beklenmez — ÖNCE profil/görev
  // tamamlanır, tur en SONA alındı; bkz. aşağıdaki "EN ÜST KAPI".)
  useEffect(() => {
    if (yukleniyor) return;
    // Girişsiz de erişilebilen hesap-kurtarma/giriş rotaları — guard bunları GERİ ATMASIN
    // (şifremi-unuttum'a basınca onboarding'e fırlatma bulgusu).
    if (['sifre-yenile', 'sifremi-unuttum', 'telefon-giris'].includes(segments[0] ?? '')) return;
    const onboardingDe = segments[0] === 'onboarding';
    if (eksik && !onboardingDe) router.replace('/onboarding');
    else if (!eksik && onboardingDe) router.replace('/');
  }, [eksik, yukleniyor, tanitimTamam, segments, router]);

  // Bildirime tıklayınca uygulama açılıp Karargah'a gitsin (uygulama kapalıyken açılış dahil).
  useEffect(() => {
    return bildirimTiklamaDinle(() => router.replace('/'));
  }, [router]);

  // EN ÜST KAPI: zorunlu güncelleme varsa HER ŞEYDEN önce (giriş/tur/profil dahil) kapatılamaz ekran.
  if (guncelleGerek) {
    return <ZorunluGuncelleme />;
  }

  // SON ADIM (uygulamaya girmeden ÖNCE): profil/görev TAMAMLANDIYSA (!eksik) ve tur görülmediyse
  // uygulama turunu göster. Böylece sıra: giriş → profil → görev → TUR → ana ekran. Tamamlanınca
  // kalıcı işaretlenir → bir daha çıkmaz. (Giriş/profil eksikken tur AÇILMAZ; önce onboarding.)
  if (tanitimTamam === false && !eksik && !yukleniyor) {
    return (
      <UygulamaTuru
        onTamam={() => {
          void tanitimTamamla(); // cihaz bayrağı
          void tanitimSunucuyaYaz(); // hesap bayrağı (girişliyse; değilse sessiz no-op)
          setTanitimTamam(true);
        }}
      />
    );
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="kanun-sec" />
        <Stack.Screen name="zor-detay" />
        <Stack.Screen name="akis" />
        <Stack.Screen name="sinav" />
        <Stack.Screen name="sesli-nobet" />
        <Stack.Screen name="patika" />
        <Stack.Screen name="geri-bildirim" />
        <Stack.Screen name="egitim-plani" />
        <Stack.Screen name="duyurular" />
        <Stack.Screen name="destek" />
        <Stack.Screen name="promo-kod" />
        <Stack.Screen name="admin" />
        <Stack.Screen name="paywall" />
        <Stack.Screen name="yasal" />
        <Stack.Screen name="ayarlar" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="sifre-yenile" />
        <Stack.Screen name="sifremi-unuttum" />
        <Stack.Screen name="telefon-giris" />
        <Stack.Screen name="tanitim" />
        <Stack.Screen name="brans-sec" options={{ presentation: 'modal' }} />
        <Stack.Screen name="rutbe-sec" options={{ presentation: 'modal' }} />
        <Stack.Screen name="telegram-baglan" />
        <Stack.Screen name="giris" options={{ presentation: 'modal' }} />
      </Stack>
      {/* Branş okunana kadar krom rengi overlay (flash önleme). */}
      {yukleniyor ? (
        <View style={[StyleSheet.absoluteFill, styles.splash]} />
      ) : null}
    </>
  );
}

const styles = StyleSheet.create({
  kok: {
    flex: 1,
  },
  splash: {
    backgroundColor: Palette.lacivert,
  },
});
