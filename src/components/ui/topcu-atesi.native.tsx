/**
 * HAVA HAREKÂTI (native, 11 Ağu — başkan: "bombaları uçaklar gelip yağdırsın").
 * Her sorti: küçük uçak silüeti (yanıp sönen seyir feneriyle) göğü geçer →
 * hedefin üstünde bombayı bırakır → bomba yerçekimiyle düşer → dağ sırtında
 * patlama (Skia radyal ışıma). Patlama artık gökte değil, İNİŞ NOKTASINDA.
 * Zamanlama tek saatten türetilir (aynı gecikme/periyot) → uçak-bomba-patlama senkron.
 * Web karşılığı null döndürür.
 *
 * 24 Ağu 2026: Skia DOĞRUDAN import edilmiyor — `lib/skia-var` üzerinden korumalı
 * alınıyor (eski 1.0.43 binary'sinde native RNSkia yok, statik import uygulamayı
 * açılışta düşürüyordu). Skia yoksa yalnız patlama IŞIMASI çizilmez; uçak, bomba
 * ve tüm animasyonlar aynen çalışır.
 */
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { Skia2, skiaVar } from '@/lib/skia-var';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

/* ÜRÜN DOZU (11 Ağu sabaha): ilk sorti ~6. sn'de gelir (yeni bakan hemen görür),
   sonrası seyrek — 45/62 sn periyot. Test dozu gerekirse: 14000/19000. */
const SORTILER = [
  { hedefX: 57, sirtY: 27.5, ucakY: 12, sagdan: false, boy: 58, periyot: 45000, gecikme: 1000 },
  { hedefX: 22, sirtY: 29, ucakY: 10, sagdan: true, boy: 46, periyot: 62000, gecikme: 24000 },
];

const UCUS_MS = 5200; // göğü geçme süresi
const DUSME_MS = 750; // bombanın düşüşü

/** Patlamanın Skia ışıması — Skia yoksa (eski binary) hiç çizilmez. */
function PatlamaIsimasi({ boy }: { boy: number }) {
  if (!skiaVar) return null;
  const { BlurMask, Canvas, Circle, RadialGradient, vec } = Skia2;
  return (
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
  );
}

function Sorti({
  hedefX,
  sirtY,
  ucakY,
  sagdan,
  boy,
  periyot,
  gecikme,
}: (typeof SORTILER)[number]) {
  const { width: W, height: H } = useWindowDimensions();
  const basX = sagdan ? W + 70 : -70;
  const sonX = sagdan ? -70 : W + 70;
  const hedefPx = (hedefX / 100) * W;
  const ucakYPx = (ucakY / 100) * H;
  const sirtYPx = (sirtY / 100) * H;
  // Bombanın bırakılma ânı = uçağın hedefin üstünden geçtiği an.
  const birakMs = UCUS_MS * Math.min(0.92, Math.max(0.08, (hedefPx - basX) / (sonX - basX)));
  const patlamaMs = birakMs + DUSME_MS;

  const ucus = useSharedValue(0); // uçak yolculuğu 0→1
  const dusme = useSharedValue(0); // bomba 0→1
  const patla = useSharedValue(0); // patlama parlaklığı
  const fener = useSharedValue(0); // seyir feneri yanıp sönme

  useEffect(() => {
    ucus.value = withDelay(
      gecikme,
      withRepeat(
        withSequence(
          withTiming(1, { duration: UCUS_MS, easing: Easing.linear }),
          withDelay(periyot - UCUS_MS, withTiming(0, { duration: 0 })),
        ),
        -1,
        false,
      ),
    );
    dusme.value = withDelay(
      gecikme,
      withRepeat(
        withSequence(
          withDelay(birakMs, withTiming(1, { duration: DUSME_MS, easing: Easing.in(Easing.quad) })),
          withDelay(periyot - birakMs - DUSME_MS, withTiming(0, { duration: 0 })),
        ),
        -1,
        false,
      ),
    );
    patla.value = withDelay(
      gecikme,
      withRepeat(
        withSequence(
          withDelay(patlamaMs, withTiming(0.9, { duration: 70 })),
          withTiming(0.3, { duration: 110 }),
          withTiming(0.75, { duration: 90 }),
          withTiming(0, { duration: 650, easing: Easing.out(Easing.quad) }),
          withDelay(periyot - patlamaMs - 920, withTiming(0, { duration: 0 })),
        ),
        -1,
        false,
      ),
    );
    fener.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 80 }),
        withTiming(0, { duration: 120 }),
        withDelay(700, withTiming(0, { duration: 0 })),
      ),
      -1,
      false,
    );
  }, [ucus, dusme, patla, fener, gecikme, periyot, birakMs, patlamaMs]);

  const ucakStil = useAnimatedStyle(() => ({
    opacity: ucus.value <= 0.02 || ucus.value >= 0.98 ? 0 : 0.85,
    transform: [
      { translateX: basX + ucus.value * (sonX - basX) },
      { translateY: ucakYPx + Math.sin(ucus.value * Math.PI * 2) * 3 },
    ],
  }));
  const fenerStil = useAnimatedStyle(() => ({ opacity: fener.value * 0.9 }));
  const bombaStil = useAnimatedStyle(() => ({
    opacity: dusme.value <= 0.01 || dusme.value >= 0.99 ? 0 : 0.85,
    transform: [
      // Hafif ileri sürüklenme — dikey çubuk gibi durmasın.
      { translateX: hedefPx + (sagdan ? -1 : 1) * dusme.value * 16 - 1 },
      { translateY: ucakYPx + 8 + dusme.value * (sirtYPx - ucakYPx - 8) },
    ],
  }));
  const patlamaStil = useAnimatedStyle(() => ({
    opacity: patla.value,
    transform: [{ scale: 0.7 + patla.value * 0.45 }],
  }));

  return (
    <>
      {/* UÇAK: koyu silüet + yanıp sönen seyir feneri (gece asıl görünen budur). */}
      <Animated.View style={[st.ucak, ucakStil]}>
        <MaterialCommunityIcons
          name="airplane"
          size={17}
          color="rgba(205,222,232,0.95)"
          style={{ transform: [{ rotate: sagdan ? '225deg' : '45deg' }] }}
        />
        <Animated.View style={[st.fener, fenerStil]} />
      </Animated.View>
      {/* BOMBA: kısa sıcak ışık izi — yerçekimiyle hızlanarak düşer. */}
      <Animated.View style={[st.bomba, bombaStil]} />
      {/* PATLAMA: iniş noktasında (dağ sırtı) radyal ışıma, çift atım. */}
      <Animated.View
        style={[
          st.patlamaSar,
          { left: hedefPx - boy / 2, top: sirtYPx - boy / 2, width: boy, height: boy },
          patlamaStil,
        ]}>
        <PatlamaIsimasi boy={boy} />
      </Animated.View>
    </>
  );
}

export function TopcuAtesi() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {SORTILER.map((s, i) => (
        <Sorti key={i} {...s} />
      ))}
    </View>
  );
}

const st = StyleSheet.create({
  ucak: {
    position: 'absolute',
    left: 0,
    top: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fener: {
    position: 'absolute',
    top: 2,
    right: -2,
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#FFFFFF',
  },
  bomba: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 2.5,
    height: 11,
    borderRadius: 1.5,
    backgroundColor: 'rgba(255,220,160,0.9)',
  },
  patlamaSar: {
    position: 'absolute',
  },
});
