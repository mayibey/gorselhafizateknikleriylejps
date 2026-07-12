import { Redirect, useLocalSearchParams } from 'expo-router';

/**
 * Derin bağlantı: https://mevzujsps.com/oda/4271 (ya da mevzu://oda/4271) → Er Meydanı lobisine
 * katılım koduyla yönlendirir; lobi kodu görünce katılım onay ekranını açar.
 */
export default function OdaDeepLink() {
  const { kod } = useLocalSearchParams<{ kod?: string }>();
  return <Redirect href={{ pathname: '/er-meydani', params: kod ? { katilKod: kod } : {} }} />;
}
