/**
 * App Tracking Transparency (ATT) izni + Meta SDK başlatma.
 *
 * Apple 1.0.41'i reddetti (Guideline 2.1): binary'de ATT çerçevesi var (Meta SDK)
 * ama izin popup'ı hiç gösterilmiyordu. Kural: takip verisi TOPLANMADAN ÖNCE izin sorulmalı.
 *
 * Bu yüzden app.json'da fbsdk isAutoInitEnabled/autoLogAppEvents/advertiserIDCollection
 * KAPALI başlar; SDK yalnız buradan, izin cevabına göre başlatılır:
 *  - iOS: önce ATT popup'ı → izne göre advertiser tracking açık/kapalı.
 *    (İzin yoksa Meta SKAdNetwork/aggregate ölçümüyle sınırlı çalışır — Apple uyumlu.)
 *  - Android: ATT yok → SDK doğrudan açılır.
 *  - Web/Expo Go: fbsdk native modülü yok → sessizce atlanır.
 */

import { Platform } from 'react-native';
import Constants from 'expo-constants';

export async function takipIzniVeMetaBaslat(): Promise<void> {
  if (Platform.OS === 'web') return;
  // OTA KORUMASI: expo-tracking-transparency native modülü yalnız 1.0.42+ binary'lerde var.
  // Eski binary'ye (1.0.40/1.0.41) OTA ile inen bu kod o modülü çağırırsa uygulama ÇÖKEBİLİYOR
  // (31 Tem canlı vaka). Runtime sürümü 1.0.42'den küçükse hiç dokunma.
  const surum = Constants.expoConfig?.version ?? '';
  if (surum < '1.0.42') return;
  try {
    const { Settings } = await import('react-native-fbsdk-next');
    if (Platform.OS === 'ios') {
      const { requestTrackingPermissionsAsync } = await import('expo-tracking-transparency');
      const { status } = await requestTrackingPermissionsAsync();
      const izin = status === 'granted';
      Settings.initializeSDK();
      await Settings.setAdvertiserTrackingEnabled(izin);
      Settings.setAdvertiserIDCollectionEnabled(izin);
      Settings.setAutoLogAppEventsEnabled(true);
    } else {
      Settings.initializeSDK();
      Settings.setAdvertiserIDCollectionEnabled(true);
      Settings.setAutoLogAppEventsEnabled(true);
    }
  } catch {
    // Ölçüm hiçbir zaman uygulamayı düşürmesin (Expo Go / eksik native modül vb.).
  }
}
