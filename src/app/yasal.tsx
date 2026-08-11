import { useLocalSearchParams, useRouter } from 'expo-router';
import { Linking, Platform, Pressable, ScrollView, StyleSheet } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Screen } from '@/components/ui/screen';
import { GIZLILIK_URL, SARTLAR_URL } from '@/constants/config';
import { Palette, Spacing } from '@/constants/theme';
import { GIZLILIK_METNI, SARTLAR_METNI } from '@/constants/yasal-metin';
import { useKisiselOzellik } from '@/lib/ozellik';

export default function YasalScreen() {
  const router = useRouter();
  const gece = useKisiselOzellik('talim-mevzuata');
  const { tip } = useLocalSearchParams<{ tip?: string }>();
  const sartlar = tip === 'sartlar';
  const hamMetin = sartlar ? SARTLAR_METNI : GIZLILIK_METNI;
  // Metinler Android-first yazıldı ("Google Play"). iOS'ta mağaza App Store → uyarlanır.
  const metin = Platform.OS === 'ios' ? hamMetin.split('Google Play').join('App Store') : hamMetin;
  const url = sartlar ? SARTLAR_URL : GIZLILIK_URL;
  const baslik = sartlar ? 'Kullanım Şartları' : 'Gizlilik Politikası';

  return (
    <Screen title={baslik} onGeri={() => router.back()} koyu={gece} kompaktBaslik={gece}>
      <ScrollView contentContainerStyle={styles.icerik}>
        <AppText variant="kucuk" style={[styles.metin, gece && styles.metinGece]}>
          {metin}
        </AppText>
        {url ? (
          <Pressable onPress={() => void Linking.openURL(url)}>
            <AppText variant="etiket" color={gece ? 'altinParlak' : 'altin'} bold style={styles.link}>
              Tam/güncel sürümü web'de aç
            </AppText>
          </Pressable>
        ) : null}
        <Pressable
          onPress={() =>
            router.replace({ pathname: '/yasal', params: { tip: sartlar ? 'gizlilik' : 'sartlar' } })
          }>
          <AppText variant="etiket" color={gece ? 'altinParlak' : 'lacivert'} bold style={styles.link}>
            {sartlar ? '→ Gizlilik Politikası' : '→ Kullanım Şartları'}
          </AppText>
        </Pressable>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  icerik: {
    paddingBottom: Spacing.five,
    gap: Spacing.three,
  },
  metin: {
    color: Palette.lacivert,
    lineHeight: 21,
  },
  metinGece: {
    color: Palette.beyaz,
    opacity: 0.92,
  },
  link: {
    textAlign: 'center',
    paddingVertical: Spacing.two,
  },
});
