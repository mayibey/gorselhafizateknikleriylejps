/**
 * Kilitli içerik kartı — premium gerektiren bir kanun/bölüm açılmak istendiğinde gösterilir.
 * Altın kilit + kısa açıklama + "Kilidi Aç" (paywall'a gider). TCK'nın ücretsiz olduğunu hatırlatır.
 * Kilit ana şalteri `KILIT_AKTIF` (constants/urunler.ts) kapalıyken bu ekran HİÇ görünmez.
 */
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AnaButon } from '@/components/auth/ana-buton';
import { AppText } from '@/components/ui/app-text';
import { Palette, Radius, Spacing } from '@/constants/theme';

export function KilitKarti({ kanunAd }: { kanunAd?: string | null }) {
  const router = useRouter();
  return (
    <View style={styles.kart}>
      <View style={styles.daire}>
        <MaterialCommunityIcons name="lock" size={34} color={Palette.altinKoyu} />
      </View>
      <AppText variant="altBaslik" bold color="lacivert" style={styles.ortali}>
        Bu içerik kilitli
      </AppText>
      <AppText variant="kucuk" color="solukMetin" style={styles.ortali}>
        {kanunAd ? `“${kanunAd}” ` : 'Bu bölüm '}
        premium erişim gerektiriyor. Kilidi açınca tüm kanun kartları, sesli anlatım ve deneme
        sınavları senin olur.
      </AppText>
      <View style={styles.buton}>
        <AnaButon etiket="Kilidi Aç" onPress={() => router.push('/paywall')} />
      </View>
      <AppText variant="etiket" color="solukMetin" style={styles.ortali}>
        TCK ve denemesi her zaman ücretsiz.
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  kart: {
    backgroundColor: Palette.kartKremi,
    borderColor: Palette.altin,
    borderWidth: 1.5,
    borderRadius: Radius.l,
    padding: Spacing.four,
    alignItems: 'center',
    gap: Spacing.two,
  },
  daire: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Palette.altinSolukYuzey,
    borderWidth: 1.5,
    borderColor: Palette.altin,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.one,
  },
  ortali: {
    textAlign: 'center',
  },
  buton: {
    alignSelf: 'stretch',
    marginTop: Spacing.two,
  },
});
