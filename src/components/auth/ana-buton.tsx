/**
 * Premium ana buton — lacivert degrade (lacivert2→lacivert) + glow gölge + opsiyonel ok.
 * Referansın "yüzeyden kalkan parlak buton" hissinin marka-uyumlu (lacivert/altın) hali.
 */
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, Pressable, StyleSheet } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Palette, Radius, Spacing } from '@/constants/theme';

export function AnaButon({
  etiket,
  onPress,
  mesgul,
  ok = true,
}: {
  etiket: string;
  onPress: () => void;
  mesgul?: boolean;
  ok?: boolean;
}) {
  return (
    <Pressable
      disabled={mesgul}
      onPress={onPress}
      style={({ pressed }) => [styles.sar, pressed && styles.basili, mesgul && styles.pasif]}>
      <LinearGradient
        colors={[Palette.lacivert2, Palette.lacivert]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.grad}>
        {mesgul ? (
          <ActivityIndicator color={Palette.beyaz} />
        ) : (
          <>
            <AppText variant="govde" bold color="beyaz">
              {etiket}
            </AppText>
            {ok ? (
              <MaterialCommunityIcons name="arrow-right" size={20} color={Palette.beyaz} />
            ) : null}
          </>
        )}
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  sar: {
    borderRadius: Radius.m,
    shadowColor: Palette.lacivert,
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  grad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    height: 54,
    borderRadius: Radius.m,
  },
  basili: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  pasif: {
    opacity: 0.6,
  },
});
