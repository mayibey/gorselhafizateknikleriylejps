import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
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
    <SafeAreaProvider>
      <StatusBar style="light" />
      <BransProvider>
        <ErrorBoundary>
          <RootNavigator />
        </ErrorBoundary>
      </BransProvider>
    </SafeAreaProvider>
  );
}

function RootNavigator() {
  const { brans, yukleniyor } = useBrans();
  const segments = useSegments();
  const router = useRouter();

  // Guard: branş yoksa onboarding'e, branş varken onboarding'deyse ana ekrana yönlendir.
  useEffect(() => {
    if (yukleniyor) return;
    const onboardingDe = segments[0] === 'onboarding';
    if (!brans && !onboardingDe) router.replace('/onboarding');
    else if (brans && onboardingDe) router.replace('/');
  }, [brans, yukleniyor, segments, router]);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="akis" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="brans-sec" options={{ presentation: 'modal' }} />
      </Stack>
      {/* Branş okunana kadar krom rengi overlay (flash önleme). */}
      {yukleniyor ? <View style={[StyleSheet.absoluteFill, styles.splash]} /> : null}
    </>
  );
}

const styles = StyleSheet.create({
  splash: {
    backgroundColor: Palette.lacivert,
  },
});
