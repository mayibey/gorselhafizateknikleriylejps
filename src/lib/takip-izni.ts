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
  // 1) iOS: ATT iznini HER ŞEYDEN BAĞIMSIZ iste (1.0.42 reddi dersi: istek fbsdk import'una
  //    bağlıydı; fbsdk aksarsa izin de atlanıyordu. Artık izin önce ve kendi try'ında).
  let izin = false;
  if (Platform.OS === 'ios') {
    try {
      const { requestTrackingPermissionsAsync } = await import('expo-tracking-transparency');
      const { status } = await requestTrackingPermissionsAsync();
      izin = status === 'granted';
    } catch {
      // ATT modülü yoksa (Expo Go) izin false kalır; app düşmez.
    }
  }
  // 2) Meta SDK ayrı try'da: izne göre başlat.
  try {
    const { Settings } = await import('react-native-fbsdk-next');
    Settings.initializeSDK();
    if (Platform.OS === 'ios') {
      await Settings.setAdvertiserTrackingEnabled(izin);
      Settings.setAdvertiserIDCollectionEnabled(izin);
    } else {
      Settings.setAdvertiserIDCollectionEnabled(true);
    }
    Settings.setAutoLogAppEventsEnabled(true);
  } catch {
    // Ölçüm hiçbir zaman uygulamayı düşürmesin (Expo Go / eksik native modül vb.).
  }
}
