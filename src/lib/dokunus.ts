/**
 * DOKUNMA HİSSİ (11 Ağu — 3D his paketi 1. ayak, build 71+ expo-haptics).
 * Web'de sessiz no-op; native'de hata olsa da uygulamayı asla düşürmez.
 * NOT: Bu modülü kullanan bundle YALNIZ runtime 1.0.44+ kanallarına basılmalı
 * (eski build'lerde expo-haptics native modülü yok).
 */
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/** Hafif tık — kart/satır dokunuşları. */
export function hafifDokun() {
  if (Platform.OS === 'web') return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

/** Orta vuruş — ana aksiyon (TAARRUZA BAŞLA gibi). */
export function ortaDokun() {
  if (Platform.OS === 'web') return;
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
}
