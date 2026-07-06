/**
 * Giriş sağlayıcı butonları: Google (her platform) + Apple (YALNIZ iOS — App Store Guideline 4.8:
 * Google sunuluyorsa Apple da eşdeğer seçenek olarak zorunlu). Apple butonu Apple'ın kendi native
 * bileşeni (tasarım kuralı gereği); yalnız iOS'ta render edilir → Android/web'de hiç görünmez.
 */
import * as AppleAuthentication from 'expo-apple-authentication';
import { Image } from 'expo-image';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

import { GOOGLE_LOGO } from '../../assets/auth-gorselleri';
import { AppText } from '@/components/ui/app-text';
import { Palette, Radius, Spacing } from '@/constants/theme';

export function SaglayiciButonlari({
  onGoogle,
  onApple,
  mesgul,
  kayit,
}: {
  onGoogle: () => void;
  /** iOS'ta Apple ile giriş/kaydol. Verilmezse Apple butonu gösterilmez (Android/web). */
  onApple?: () => void;
  mesgul?: boolean;
  /** true → "…ile kaydol" (kayıt modu), false/undefined → "…ile giriş yap". */
  kayit?: boolean;
}) {
  const eylem = kayit ? 'kaydol' : 'giriş yap';
  return (
    <View style={styles.kok}>
      <Pressable
        disabled={mesgul}
        accessibilityRole="button"
        accessibilityLabel={`Google ile ${eylem}`}
        style={({ pressed }) => [styles.btn, pressed && styles.pressed, mesgul && styles.pasif]}
        onPress={onGoogle}>
        <Image source={GOOGLE_LOGO} style={styles.logo} contentFit="contain" />
        <AppText variant="govde" bold color="anaMetin">
          Google ile {eylem}
        </AppText>
      </Pressable>
      {Platform.OS === 'ios' && onApple ? (
        <AppleAuthentication.AppleAuthenticationButton
          buttonType={
            kayit
              ? AppleAuthentication.AppleAuthenticationButtonType.SIGN_UP
              : AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN
          }
          buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
          cornerRadius={Radius.m}
          style={[styles.appleBtn, mesgul && styles.pasif]}
          onPress={() => {
            if (!mesgul) onApple();
          }}
        />
      ) : null}
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
    height: 54,
    shadowColor: Palette.kartGolge,
    shadowOpacity: 1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  logo: {
    width: 34,
    height: 34,
  },
  appleBtn: {
    height: 54,
    width: '100%',
  },
  pressed: {
    opacity: 0.85,
  },
  pasif: {
    opacity: 0.6,
  },
});
