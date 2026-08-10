/**
 * TOPÇU ATEŞİ (native, 11 Ağu — başkan: "dağda bombalar patlayabilir ama gerçeklikten
 * uzaklaşmadan"). Uzak gece bombardımanı: dağ sırtındaki sabit noktalarda SEYREK,
 * kısa, sıcak ışık patlaması (çift atım + yavaş sönüş). Skia radyal ışıma —
 * build 71+ (runtime 1.0.44); web karşılığı null döndürür.
 */
import { BlurMask, Canvas, Circle, RadialGradient, vec } from '@shopify/react-native-skia';
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

/* Sabit atış noktaları: [sol%, üst%, çap, ilk gecikme ms, periyot ms].
   Üst %19-23 = kırpılmış görselde dağ sırtı hattı. Periyotlar asal-ımsı →
   aynı anda patlamazlar, ritim makineleşmez. */
const NOKTALAR: [number, number, number, number, number][] = [
  [16, 21, 46, 6000, 26000],
  [57, 19.5, 58, 15000, 37000],
  [79, 22.5, 42, 27000, 45000],
];

function Patlama({ boy, gecikme, periyot }: { boy: number; gecikme: number; periyot: number }) {
  const o = useSharedValue(0);
  useEffect(() => {
    // Her turda: periyot kadar sessizlik → ani parlama → çift atım → yavaş sönüş.
    o.value = withDelay(
      gecikme,
      withRepeat(
        withSequence(
          withDelay(periyot, withTiming(0.9, { duration: 70 })),
          withTiming(0.3, { duration: 110 }),
          withTiming(0.75, { duration: 90 }),
          withTiming(0, { duration: 700, easing: Easing.out(Easing.quad) }),
        ),
        -1,
        false,
      ),
    );
  }, [o, gecikme, periyot]);
  const stil = useAnimatedStyle(() => ({
    opacity: o.value,
    transform: [{ scale: 0.7 + o.value * 0.45 }],
  }));
  return (
    <Animated.View style={[{ width: boy, height: boy }, stil]}>
      <Canvas style={StyleSheet.absoluteFill}>
        <Circle cx={boy / 2} cy={boy / 2} r={boy / 2 - 2}>
          <RadialGradient
            c={vec(boy / 2, boy / 2)}
            r={boy / 2}
            colors={['rgba(255,238,196,0.95)', 'rgba(255,178,92,0.40)', 'rgba(255,150,70,0)']}
          />
          <BlurMask blur={4} style="normal" />
        </Circle>
      </Canvas>
    </Animated.View>
  );
}

export function TopcuAtesi() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {NOKTALAR.map(([x, y, boy, gecikme, periyot], i) => (
        <View
          key={i}
          style={{ position: 'absolute', left: `${x}%`, top: `${y}%`, marginLeft: -boy / 2, marginTop: -boy / 2 }}>
          <Patlama boy={boy} gecikme={gecikme} periyot={periyot} />
        </View>
      ))}
    </View>
  );
}
