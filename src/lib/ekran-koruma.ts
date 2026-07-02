/**
 * Ekran koruması hook'u — kart görseli (telifli içerik) görünen ekranlarda ekran görüntüsü/
 * kaydını engeller (Android FLAG_SECURE; iOS kayıt/yansıtmada karartma). Ekran kapanınca serbest
 * bırakılır → sicil/takdir/ayarlar gibi ekranlar normal screenshot'lanabilir kalır.
 *
 * Yalnız NATIVE; web'de expo-screen-capture API'si yok → guard + sessiz catch.
 */

import * as ScreenCapture from 'expo-screen-capture';
import { useEffect } from 'react';
import { Platform } from 'react-native';

// TEST ŞALTERİ (derleme zamanı): otomatik test build'lerinde ekran görüntüsü gerekir
// (emülatör turu FLAG_SECURE yüzünden kör kalıyordu). ÜRETİM build'lerinde bu env
// ASLA set edilmez → koruma aynen aktif. (bash: EXPO_PUBLIC_TEST_MODU=1 ./gradlew …)
const TEST_MODU = (process.env.EXPO_PUBLIC_TEST_MODU ?? '') === '1';

export function useEkranKoruma() {
  useEffect(() => {
    if (Platform.OS === 'web' || TEST_MODU) return;
    void ScreenCapture.preventScreenCaptureAsync().catch(() => {});
    return () => {
      void ScreenCapture.allowScreenCaptureAsync().catch(() => {});
    };
  }, []);
}
