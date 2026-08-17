import { Redirect, useLocalSearchParams } from 'expo-router';

/**
 * Derin bağlantı: https://mevzujsps.com/oyun/<kod> (ya da mevzu://oyun/<kod>) → Oyun Merkezi'ne
 * `oyunKod` ile yönlendirir. Oyun Merkezi WebView yüklenince bu kodu içindeki oyun sayfasına
 * `injectJavaScript` ile iletir; oyun sayfası `meydanOku(kod)` ile aynı bölüm/soruları açar
 * (arkadaşın "meydan oku" linkiyle paylaştığı oyuna birebir aynı sorularla girilir).
 *
 * NOT: kod, oyun sayfasının ürettiği base64 (oyun+bölüm+skor+tohum) — burada çözülmez, olduğu
 * gibi WebView'a taşınır; çözme oyun sayfasının kendi mekanizmasında.
 */
export default function OyunDeepLink() {
  const { kod } = useLocalSearchParams<{ kod?: string }>();
  return <Redirect href={{ pathname: '/er-meydani', params: kod ? { oyunKod: kod } : {} }} />;
}
