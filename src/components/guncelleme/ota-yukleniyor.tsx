import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/app-text';
import { MaxContentWidth, Palette, Spacing } from '@/constants/theme';

/**
 * OTA güncellemesi indirilirken gösterilen kısa bekleme ekranı (bkz. lib/ota.ts).
 * Bittiğinde uygulama kendini yeniden başlatır → kullanıcı ilk girişte güncel içeriği görür.
 * Kapatılamaz; ama en fazla ~40 sn sürer, sonra ota.ts vazgeçip normal açılışa döner.
 */
export function OtaYukleniyor() {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom', 'left', 'right']}>
      <View style={styles.icerik}>
        <ActivityIndicator size="large" color={Palette.lacivert} />
        <AppText variant="altBaslik" bold color="lacivert" style={styles.ortali}>
          Güncelleniyor
        </AppText>
        <AppText variant="kucuk" color="solukMetin" style={styles.ortali}>
          Yeni içerik yükleniyor, birkaç saniye sürecek.
        </AppText>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Palette.kremZemin },
  icerik: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  ortali: { textAlign: 'center' },
});
