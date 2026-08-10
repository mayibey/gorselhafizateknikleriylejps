/**
 * YILDIZ KATMANI — tüm ekrana serilen CANLI gece dokusu (10-11 Ağu gece).
 * Efekt paketi (başkan onaylı): yıldızlar üç faz grubunda göz kırpar; 2-3 dakikada
 * bir kayan yıldız geçer; UfukNefesi denizin ortasındaki ışığı yavaşça soluturur.
 * Hepsi OTA-güvenli (yalnız reanimated + linear-gradient).
 */
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

/* Deterministik yıldız haritası (x%, y%, boyut, parlaklık) — her açılışta aynı gökyüzü. */
const YILDIZLAR: [number, number, number, number][] = [
  [6, 4, 2, 0.45], [14, 12, 1.5, 0.3], [22, 7, 2.5, 0.5], [30, 18, 1.5, 0.25],
  [38, 9, 2, 0.4], [47, 15, 1.5, 0.3], [55, 5, 3, 0.5], [64, 12, 1.5, 0.3],
  [72, 8, 2, 0.35], [81, 16, 2, 0.45], [90, 6, 1.5, 0.3], [95, 20, 2, 0.4],
  [8, 28, 1.5, 0.25], [25, 33, 2, 0.35], [44, 30, 1.5, 0.2], [63, 35, 2, 0.3],
  [82, 29, 1.5, 0.25], [12, 46, 2, 0.3], [33, 50, 1.5, 0.2], [58, 47, 2, 0.3],
  [78, 52, 1.5, 0.25], [93, 44, 2, 0.35], [18, 63, 1.5, 0.2], [42, 68, 2, 0.3],
  [68, 64, 1.5, 0.2], [88, 70, 2, 0.3], [10, 80, 1.5, 0.25], [35, 84, 2, 0.3],
  [60, 81, 1.5, 0.2], [85, 87, 2, 0.3], [24, 93, 1.5, 0.25], [50, 95, 2, 0.3],
];

/** Tek faz grubunun "nefes" çarpanı: 0.55↔1.0 arasında salınır. */
function useGozKirp(sureMs: number, gecikmeMs: number) {
  const deger = useSharedValue(1);
  useEffect(() => {
    deger.value = withDelay(
      gecikmeMs,
      withRepeat(
        withSequence(
          withTiming(0.55, { duration: sureMs, easing: Easing.inOut(Easing.sin) }),
          withTiming(1, { duration: sureMs, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        false,
      ),
    );
  }, [deger, sureMs, gecikmeMs]);
  return useAnimatedStyle(() => ({ opacity: deger.value }));
}

/** 2,5 dakikada bir çapraz geçen kayan yıldız. */
function KayanYildiz() {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withRepeat(
      withSequence(
        withDelay(45000, withTiming(0, { duration: 0 })),
        withTiming(1, { duration: 1100, easing: Easing.out(Easing.quad) }),
        withDelay(110000, withTiming(1, { duration: 0 })),
      ),
      -1,
      false,
    );
  }, [t]);
  const stil = useAnimatedStyle(() => ({
    opacity: t.value <= 0.02 || t.value >= 0.98 ? 0 : 0.8 * (1 - t.value * 0.6),
    transform: [
      { translateX: -80 + t.value * 500 },
      { translateY: 40 + t.value * 260 },
      { rotate: '28deg' },
    ],
  }));
  return (
    <Animated.View style={[st.kayan, stil]} pointerEvents="none">
      <LinearGradient
        colors={['rgba(255,246,220,0)', 'rgba(255,246,220,0.9)']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={st.kayanIz}
      />
    </Animated.View>
  );
}

export function YildizKatmani() {
  // Üç faz grubu — komşu yıldızlar farklı ritimde kırpar, gökyüzü "yaşar".
  const faz0 = useGozKirp(2600, 0);
  const faz1 = useGozKirp(3800, 900);
  const faz2 = useGozKirp(5100, 1700);
  const fazlar = [faz0, faz1, faz2];
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {YILDIZLAR.map(([x, y, boyut, parlak], i) => (
        <Animated.View
          key={i}
          style={[
            {
              position: 'absolute',
              left: `${x}%`,
              top: `${y}%`,
            },
            fazlar[i % 3],
          ]}>
          <View
            style={{
              width: boyut,
              height: boyut,
              borderRadius: boyut / 2,
              opacity: parlak,
              backgroundColor: '#FFF6DC',
            }}
          />
        </Animated.View>
      ))}
      <KayanYildiz />
    </View>
  );
}

/** Ufuk nefesi: denizin ortasındaki aydınlık 7 sn ritmiyle güçlenip söner. */
export function UfukNefesi() {
  const nefes = useSharedValue(0);
  useEffect(() => {
    nefes.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 7000, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 7000, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    );
  }, [nefes]);
  const stil = useAnimatedStyle(() => ({ opacity: 0.1 + nefes.value * 0.22 }));
  return (
    <Animated.View style={[StyleSheet.absoluteFill, stil]} pointerEvents="none">
      <LinearGradient
        colors={['rgba(120,190,230,0)', 'rgba(120,190,230,0.35)', 'rgba(120,190,230,0)']}
        start={{ x: 0.5, y: 0.15 }}
        end={{ x: 0.5, y: 0.75 }}
        style={StyleSheet.absoluteFill}
      />
    </Animated.View>
  );
}

const st = StyleSheet.create({
  kayan: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  kayanIz: {
    width: 64,
    height: 2,
    borderRadius: 1,
  },
});
