import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ErrorBoundary } from '@/components/ui/error-boundary';
import { Palette } from '@/constants/theme';
import { initDatabase } from '@/db/database';
import { BransProvider, useBrans } from '@/lib/brans-context';

export default function RootLayout() {
  useEffect(() => {
    void initDatabase();
  }, []);

  return (
    // GestureHandlerRootView: gesture-handler jestleri (görsel zoom pinch/pan) için şart.
    <GestureHandlerRootView style={styles.kok}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <BransProvider>
          <ErrorBoundary>
            <RootNavigator />
          </ErrorBoundary>
        </BransProvider>
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

  // İçtima bildirimine dokununca akışa (günlük kuyruk) götür. Web'de / modül yoksa no-op.
  useEffect(() => {
    if (Platform.OS === 'web') return;
    let sub: { remove: () => void } | undefined;
    void (async () => {
      try {
        const N = await import('expo-notifications');
        sub = N.addNotificationResponseReceivedListener(() => router.push('/akis'));
      } catch {
        // bildirim modülü yüklenemezse sessiz geç
      }
    })();
    return () => sub?.remove();
  }, [router]);

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
