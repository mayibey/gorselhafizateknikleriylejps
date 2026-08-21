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

import { kisiselOzellikAcikMi } from '@/lib/ozellik';
import { ayarOku } from '@/lib/uzak-ayar';

// KİŞİYE ÖZEL MUAFİYET (21 Ağu 2026, başkan isteği): ekran görüntüsü yasağı HERKESTE
// açık kalsın ama başkan + Kemalettin ekran görüntüsü alabilsin (tanıtım/geri bildirim
// için lazım). Eskiden tek şalter vardı (`ekran_koruma` 0/1) → açınca HERKESE açılıyordu.
// Muaf kişiler: uygulama_ayar.ozellik_kisi → { "<user_id>": ["ekran-goruntusu-serbest"] }
// ⚠️ BU BAYRAK ASLA YAYIN_BAYRAKLARI'NA EKLENMEZ — herkese açılırsa içerik koruması biter.
// NOT: bayrak adı ÇAĞRIDA düz metin yazılır — `npm run bayrak:denetle` sabitleri değil
// düz metinleri tarıyor; sabit kullanınca denetimin kör noktası oluyordu.

// TEST ŞALTERİ (derleme zamanı): otomatik test build'lerinde ekran görüntüsü gerekir
// (emülatör turu FLAG_SECURE yüzünden kör kalıyordu). ÜRETİM build'lerinde bu env
// ASLA set edilmez → koruma aynen aktif. (bash: EXPO_PUBLIC_TEST_MODU=1 ./gradlew …)
const TEST_MODU = (process.env.EXPO_PUBLIC_TEST_MODU ?? '') === '1';

export function useEkranKoruma() {
  useEffect(() => {
    if (Platform.OS === 'web' || TEST_MODU) return;
    let iptal = false;
    // Uzak bayrak 'ekran_koruma'='0' → koruma KAPALI (TestFlight'ta screenshot alınabilsin).
    // ÜRETİM ÖNCESİ bu bayrağı '1'e çek (yoksa canlıda içerik koruması kalkar).
    void (async () => {
      const v = await ayarOku('ekran_koruma');
      if (iptal || v === '0') return; // global şalter kapalı → koruma yok
      // Kişiye özel muafiyet: hata olursa (ağ yok / oturum yok) false döner → koruma AÇIK kalır.
      if (await kisiselOzellikAcikMi('ekran-goruntusu-serbest')) return;
      if (iptal) return;
      void ScreenCapture.preventScreenCaptureAsync().catch(() => {});
    })();
    return () => {
      iptal = true;
      void ScreenCapture.allowScreenCaptureAsync().catch(() => {});
    };
  }, []);
}
