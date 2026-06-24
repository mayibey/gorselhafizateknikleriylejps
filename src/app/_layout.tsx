import {
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/inter';
import { PlayfairDisplay_700Bold } from '@expo-google-fonts/playfair-display';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ErrorBoundary } from '@/components/ui/error-boundary';
import { Palette } from '@/constants/theme';
import { initDatabase } from '@/db/database';
import { AuthProvider } from '@/lib/auth-context';
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

  useEffect(() => {
    void initDatabase();
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
  const { brans, yukleniyor: bransYukleniyor } = useBrans();
  const { rutbe, yukleniyor: rutbeYukleniyor } = useRutbe();
  const segments = useSegments();
  const router = useRouter();

  const yukleniyor = bransYukleniyor || rutbeYukleniyor;
  // Onboarding branş + rütbe ister (ikisi de müfredat filtresi). İkisi de varsa içeri al.
  const eksik = !brans || !rutbe;

  // Guard: branş veya rütbe yoksa onboarding'e götür (uygulama tamamen offline çalışır).
  useEffect(() => {
    if (yukleniyor) return;
    const onboardingDe = segments[0] === 'onboarding';
    if (eksik && !onboardingDe) router.replace('/onboarding');
    else if (!eksik && onboardingDe) router.replace('/');
  }, [eksik, yukleniyor, segments, router]);

  // (Bildirim dinleyicisi v1'de kaldırıldı — expo-notifications çıkarıldı.)

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="akis" />
        <Stack.Screen name="quiz" />
        <Stack.Screen name="sesli-nobet" />
        <Stack.Screen name="patika" />
        <Stack.Screen name="geri-bildirim" />
        <Stack.Screen name="egitim-plani" />
        <Stack.Screen name="yasal" />
        <Stack.Screen name="ayarlar" />
        <Stack.Screen name="onboarding" />
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
