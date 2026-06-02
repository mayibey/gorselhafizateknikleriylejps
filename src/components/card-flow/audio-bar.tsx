import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Palette, Radius, Spacing } from '@/constants/theme';

/** Yer tutucu ses çubuğu: play butonu + waveform placeholder + süre. Gerçek ses sonra. */
export function AudioBar() {
  const [caliyor, setCaliyor] = useState(false);

  return (
    <View style={styles.bar}>
      <Pressable
        style={({ pressed }) => [styles.play, pressed && styles.pressed]}
        onPress={() => setCaliyor((v) => !v)}>
        <MaterialCommunityIcons name={caliyor ? 'pause' : 'play'} size={24} color={Palette.beyaz} />
      </Pressable>

      {/* Waveform placeholder */}
      <View style={styles.waveform}>
        {WAVE.map((h, i) => (
          <View key={i} style={[styles.cubuk, { height: h }]} />
        ))}
      </View>

      <AppText variant="kucuk" color="solukMetin">
        0:42
      </AppText>
    </View>
  );
}

const WAVE = [8, 16, 10, 22, 14, 26, 12, 20, 9, 18, 24, 11, 17, 13, 21, 10];

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
  waveform: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    height: 28,
  },
  cubuk: {
    flex: 1,
    backgroundColor: Palette.kenarlik,
    borderRadius: 2,
  },
});
