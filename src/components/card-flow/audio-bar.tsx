import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Palette, Radius, Spacing } from '@/constants/theme';
import { useKartSesi } from '@/hooks/use-kart-sesi';

/**
 * Aktif kartın sesli anlatım kontrolü. Ses varsa Dinle/Duraklat, yoksa soluk "yakında".
 * Otomatik başlamaz (yalnız butona basınca). Ses içeriği gelene kadar çoğu kart sessizdir.
 */
export function AudioBar({ sesYolu }: { sesYolu: string | null | undefined }) {
  const { varMi, oynuyor, yukleniyor, calistirDurdur } = useKartSesi(sesYolu);

  if (!varMi) {
    return (
      <View style={[styles.bar, styles.barPasif]}>
        <View style={[styles.play, styles.playPasif]}>
          <MaterialCommunityIcons name="volume-off" size={22} color={Palette.solukMetin} />
        </View>
        <AppText variant="kucuk" color="solukMetin">
          Sesli anlatım yakında
        </AppText>
      </View>
    );
  }

  return (
    <Pressable
      style={({ pressed }) => [styles.bar, pressed && styles.pressed]}
      onPress={calistirDurdur}
      accessibilityRole="button"
      accessibilityLabel={oynuyor ? 'Duraklat' : 'Dinle'}>
      <View style={styles.play}>
        {yukleniyor ? (
          <ActivityIndicator color={Palette.beyaz} />
        ) : (
          <MaterialCommunityIcons
            name={oynuyor ? 'pause' : 'play'}
            size={24}
            color={Palette.beyaz}
          />
        )}
      </View>
      <AppText variant="kucuk" color="lacivert" bold>
        {oynuyor ? 'Duraklat' : 'Sesli anlatımı dinle'}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    backgroundColor: Palette.kartKremi,
    borderColor: Palette.kenarlik,
    borderWidth: 1,
    borderRadius: Radius.m,
    padding: Spacing.two,
  },
  barPasif: {
    opacity: 0.55,
  },
  pressed: {
    opacity: 0.8,
  },
  play: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Palette.lacivert,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playPasif: {
    backgroundColor: Palette.kenarlik,
  },
});
