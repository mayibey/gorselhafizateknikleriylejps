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

export function useEkranKoruma() {
  useEffect(() => {
    if (Platform.OS === 'web') return;
    void ScreenCapture.preventScreenCaptureAsync().catch(() => {});
    return () => {
      void ScreenCapture.allowScreenCaptureAsync().catch(() => {});
    };
  }, []);
}
