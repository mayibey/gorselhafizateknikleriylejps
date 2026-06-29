/**
 * "Google ile devam et" + "Apple ile devam et" butonları (gerçek logolarla).
 * Google çalışır; Apple iOS fazında aktifleşecek → şimdilik bilgilendirme.
 */
import { Image } from 'expo-image';
import { Pressable, StyleSheet, View } from 'react-native';

import { APPLE_LOGO, GOOGLE_LOGO } from '../../assets/auth-gorselleri';
import { AppText } from '@/components/ui/app-text';
import { Palette, Radius, Spacing } from '@/constants/theme';

export function SaglayiciButonlari({
  onGoogle,
  onApple,
  mesgul,
}: {
  onGoogle: () => void;
  onApple: () => void;
  mesgul?: boolean;
}) {
  return (
    <View style={styles.kok}>
      <Pressable
        disabled={mesgul}
        style={({ pressed }) => [styles.btn, pressed && styles.pressed, mesgul && styles.pasif]}
        onPress={onGoogle}>
        <Image source={GOOGLE_LOGO} style={styles.logo} contentFit="contain" />
        <AppText variant="govde" bold color="anaMetin">
          Google ile devam et
        </AppText>
      </Pressable>
      <Pressable
        disabled={mesgul}
        style={({ pressed }) => [styles.btn, pressed && styles.pressed, mesgul && styles.pasif]}
        onPress={onApple}>
        <Image source={APPLE_LOGO} style={styles.logo} contentFit="contain" />
        <AppText variant="govde" bold color="anaMetin">
          Apple ile devam et
        </AppText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  kok: {
    gap: Spacing.two,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    backgroundColor: Palette.beyaz,
    borderColor: Palette.kenarlik,
    borderWidth: 1,
    borderRadius: Radius.m,
    height: 52,
  },
  logo: {
    width: 22,
    height: 22,
  },
  pressed: {
    opacity: 0.85,
  },
  pasif: {
    opacity: 0.6,
  },
});
