import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Palette, type PaletteColor, Radius, Spacing } from '@/constants/theme';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

type Aksiyon = { etiket: string; onPress: () => void };

type EmptyStateProps = {
  ikon?: IconName;
  ikonRenk?: PaletteColor;
  baslik: string;
  aciklama?: string;
  /** Opsiyonel birincil aksiyon butonu (dolu, lacivert). */
  buton?: Aksiyon;
  /** Opsiyonel ikincil aksiyon (metin/çerçeve buton). */
  ikincilButon?: Aksiyon;
};

/** Boş / hata / bitiş durumları için ortak, ortalı bilgi ekranı. */
export function EmptyState({
  ikon = 'inbox-outline',
  ikonRenk = 'solukMetin',
  baslik,
  aciklama,
  buton,
  ikincilButon,
}: EmptyStateProps) {
  return (
    <View style={styles.center}>
      <MaterialCommunityIcons name={ikon} size={64} color={Palette[ikonRenk]} />
      <AppText variant="baslik" bold style={styles.ortala}>
        {baslik}
      </AppText>
      {aciklama ? (
        <AppText variant="govde" color="solukMetin" style={styles.ortala}>
          {aciklama}
        </AppText>
      ) : null}
      {buton ? (
        <Pressable
          style={({ pressed }) => [styles.buton, pressed && styles.pressed]}
          onPress={buton.onPress}>
          <AppText variant="govde" color="beyaz" bold>
            {buton.etiket}
          </AppText>
        </Pressable>
      ) : null}
      {ikincilButon ? (
        <Pressable
          style={({ pressed }) => [styles.ikincil, pressed && styles.pressed]}
          onPress={ikincilButon.onPress}>
          <AppText variant="govde" color="lacivert" bold>
            {ikincilButon.etiket}
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
    minHeight: 240,
  },
  ortala: {
    textAlign: 'center',
  },
  buton: {
    backgroundColor: Palette.lacivert,
    borderRadius: Radius.m,
    paddingHorizontal: Spacing.five,
    paddingVertical: Spacing.three,
    marginTop: Spacing.one,
  },
  ikincil: {
    borderWidth: 1,
    borderColor: Palette.lacivert,
    borderRadius: Radius.m,
    paddingHorizontal: Spacing.five,
    paddingVertical: Spacing.three,
  },
  pressed: {
    opacity: 0.85,
  },
});
