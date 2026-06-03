import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ImageZoom } from '@likashefqet/react-native-image-zoom';
import { type ImageSourcePropType, Pressable, StyleSheet, View } from 'react-native';

import { Palette, Spacing } from '@/constants/theme';

/**
 * Tam ekran görsel inceleme overlay'i (pinch + pan + double-tap zoom).
 * RN Modal DEĞİL → absoluteFill overlay (ekran içinde; ekran unmount olmaz → ses kesilmez).
 * @likashefqet/react-native-image-zoom (gesture-handler + reanimated üstüne, pure-JS).
 */
export function GorselZoom({
  gorsel,
  gorunur,
  onKapat,
}: {
  gorsel: ImageSourcePropType;
  gorunur: boolean;
  onKapat: () => void;
}) {
  if (!gorunur) return null;
  return (
    <View style={styles.overlay}>
      <ImageZoom
        source={gorsel}
        style={styles.gorsel}
        resizeMode="contain"
        minScale={1}
        maxScale={6}
        doubleTapScale={3}
        isDoubleTapEnabled
        isPinchEnabled
        isPanEnabled
      />
      <Pressable
        style={({ pressed }) => [styles.kapat, pressed && styles.pressed]}
        onPress={onKapat}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel="Kapat">
        <MaterialCommunityIcons name="close" size={28} color={Palette.beyaz} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(15, 20, 30, 0.97)',
    zIndex: 1000,
    elevation: 1000,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gorsel: {
    width: '100%',
    height: '100%',
  },
  kapat: {
    position: 'absolute',
    top: Spacing.four,
    right: Spacing.three,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.8,
  },
});
