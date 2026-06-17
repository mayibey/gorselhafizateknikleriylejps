import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import * as Sentry from '@sentry/react-native';

import { ErrorBoundary } from '@/components/ui/error-boundary';
import { SENTRY_DSN } from '@/constants/config';
import { Palette } from '@/constants/theme';
import { initDatabase } from '@/db/database';
import { AuthProvider } from '@/lib/auth-context';
import { BransProvider, useBrans } from '@/lib/brans-context';

// TEŞHİS: DSN doluysa çökmeleri Sentry'ye yolla (native+JS). Boşsa no-op.
if (SENTRY_DSN) {
  Sentry.init({ dsn: SENTRY_DSN, debug: false, tracesSampleRate: 0 });
}

function RootLayout() {
  useEffect(() => {
    void initDatabase();
  }, []);

  return (
    // GestureHandlerRootView: gesture-handler jestleri (görsel zoom pinch/pan) için şart.
    <GestureHandlerRootView style={styles.kok}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <AuthProvider>
          <BransProvider>
            <ErrorBoundary>
              <RootNavigator />
            </ErrorBoundary>
          </BransProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function RootNavigator() {
  const { brans, yukleniyor } = useBrans();
  const segments = useSegments();
  const router = useRouter();

  // Guard: branş yoksa onboarding'e götür (uygulama tamamen offline çalışır).
  useEffect(() => {
    if (yukleniyor) return;
    const onboardingDe = segments[0] === 'onboarding';
    if (!brans && !onboardingDe) router.replace('/onboarding');
    else if (brans && onboardingDe) router.replace('/');
  }, [brans, yukleniyor, segments, router]);

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
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="brans-sec" options={{ presentation: 'modal' }} />
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

// Sentry.wrap → çökme/performans izleme için kökü sarar (DSN boşken zararsız).
export default Sentry.wrap(RootLayout);
