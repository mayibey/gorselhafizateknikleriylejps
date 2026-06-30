import {
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/inter';
import { PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import { setAudioModeAsync } from 'expo-audio';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { AppState, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ErrorBoundary } from '@/components/ui/error-boundary';
import { Palette } from '@/constants/theme';
import { initDatabase } from '@/db/database';
import { AuthProvider, useAuth } from '@/lib/auth-context';
import { getAyar, planla } from '@/lib/bildirim';
import { useEkranKoruma } from '@/lib/ekran-koruma';
import { indirmeDurumYukle } from '@/lib/indirme';
import { senkronKaydet } from '@/lib/senkron';
import { BransProvider, useBrans } from '@/lib/brans-context';
import { RutbeProvider, useRutbe } from '@/lib/rutbe-context';

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

  // Açılışta günlük bildirimleri (ayara göre) yeniden planla — kalıcı hatırlatmalar için.
  // (Web'de + google-services.json yoksa no-op; bkz. lib/bildirim.ts.)
  useEffect(() => {
    void getAyar().then(planla);
  }, []);

  // İndirilmiş kanun listesini belleğe al → görsel çözümleyici yerel dosyaları görsün.
  useEffect(() => {
    void indirmeDurumYukle();
  }, []);

  // Ses ARKA PLANDA ÇALMASIN — app arka plana/ekran kapanınca anlatım dursun. Böylece
  // foreground-service iznine gerek kalmaz (Play "ön plan hizmeti izinleri" beyanı gerekmez).
  useEffect(() => {
    void setAudioModeAsync({ shouldPlayInBackground: false });
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

  return (
    // GestureHandlerRootView: gesture-handler jestleri (görsel zoom pinch/pan) için şart.
    <GestureHandlerRootView style={styles.kok}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <AuthProvider>
          <BransProvider>
            <RutbeProvider>
              <ErrorBoundary>
                <RootNavigator />
              </ErrorBoundary>
            </RutbeProvider>
          </BransProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function RootNavigator() {
  const { yukleniyor: bransYukleniyor } = useBrans();
  const { yukleniyor: rutbeYukleniyor } = useRutbe();
  const { kullanici, hazir, yukleniyor: authYukleniyor, profilTamam } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  const yukleniyor = bransYukleniyor || rutbeYukleniyor || authYukleniyor;
  // Giriş ZORUNLU: Supabase yapılandırıldıysa (hazir) ve oturum yoksa giriş ister.
  // (hazir=false ise — anahtar yok — gate kapanır, uygulama girişsiz çalışır: güvenli fallback.)
  const girisGerek = hazir && !kullanici;
  // Giriş var ama profil tamlığı henüz bilinmiyor → bekle (yanlış yönlendirme olmasın).
  const profilBekle = !!kullanici && profilTamam === null;
  // Onboarding: ZORUNLU giriş + tek-seferlik profil kurulumu (kişisel + branş/rütbe profilde).
  const eksik = girisGerek || profilTamam === false;

  // Guard: giriş/profil/branş/rütbe eksikse onboarding'e götür.
  useEffect(() => {
    if (yukleniyor || profilBekle) return;
    if (segments[0] === 'sifre-yenile') return; // şifre kurtarma akışı kendi oturumunu kurar
    const onboardingDe = segments[0] === 'onboarding';
    if (eksik && !onboardingDe) router.replace('/onboarding');
    else if (!eksik && onboardingDe) router.replace('/');
  }, [eksik, yukleniyor, profilBekle, segments, router]);

  // (Bildirim dinleyicisi v1'de kaldırıldı — expo-notifications çıkarıldı.)

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="akis" />
        <Stack.Screen name="sinav" />
        <Stack.Screen name="sesli-nobet" />
        <Stack.Screen name="patika" />
        <Stack.Screen name="geri-bildirim" />
        <Stack.Screen name="egitim-plani" />
        <Stack.Screen name="yasal" />
        <Stack.Screen name="ayarlar" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="sifre-yenile" />
        <Stack.Screen name="brans-sec" options={{ presentation: 'modal' }} />
        <Stack.Screen name="rutbe-sec" options={{ presentation: 'modal' }} />
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
