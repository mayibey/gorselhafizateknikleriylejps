import { useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Screen } from '@/components/ui/screen';
import { Palette, Spacing } from '@/constants/theme';

/**
 * BRANŞ PDF KİTAP GÖRÜNTÜLEYİCİ (stub → görev #25/#26'da doldurulacak).
 * Params: yol (pdf/{brans}/...pdf) + baslik. İmzalı-URL indir → cihazda çöz → WebView+PDF.js
 * ile göster (zoom/sayfa) + çizim/not katmanı (kişiye özel, kalıcı).
 */
export default function KitapScreen() {
  const { baslik } = useLocalSearchParams<{ yol?: string; baslik?: string }>();
  return (
    <Screen title={baslik ?? 'Kitap'} headerAltinCizgi>
      <View style={styles.orta}>
        <ActivityIndicator color={Palette.altinKoyu} />
        <AppText variant="kucuk" color="solukMetin" style={styles.metin}>
          Görüntüleyici hazırlanıyor…
        </AppText>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  orta: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.two },
  metin: { textAlign: 'center' },
});
