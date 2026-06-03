import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Palette, Spacing } from '@/constants/theme';

/** Ortalı, tema renkli yükleme göstergesi (+ opsiyonel metin). Tüm ekranlar bunu kullanır. */
export function Loading({ metin }: { metin?: string }) {
  return (
    <View style={styles.center}>
      <ActivityIndicator color={Palette.lacivert} />
      {metin ? (
        <AppText variant="kucuk" color="solukMetin">
          {metin}
        </AppText>
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
    minHeight: 200,
  },
});
