/**
 * Auth ekranı karakter figürü — teğmen görseli, KEMER ÜSTÜ kırpılmış (cover + üstten hizalı).
 * Sağ üstte dekoratif; dokunmayı engellemez.
 */
import { Image } from 'expo-image';
import { StyleSheet, View, type ViewStyle } from 'react-native';

import { TEGMEN } from '../../assets/auth-gorselleri';

export function KarakterFigur({ style }: { style?: ViewStyle }) {
  return (
    <View style={[styles.kap, style]} pointerEvents="none">
      <Image source={TEGMEN} style={styles.gorsel} contentFit="cover" contentPosition="top" />
    </View>
  );
}

const styles = StyleSheet.create({
  kap: {
    width: 148,
    height: 188, // yükseklik < görsel oranı → alt (bacaklar) kırpılır, kemer üstü görünür
    overflow: 'hidden',
  },
  gorsel: {
    width: '100%',
    height: '100%',
  },
});
