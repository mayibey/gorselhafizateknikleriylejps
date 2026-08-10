/**
 * ŞAFAK NÖBETİ DOKUSU (10 Ağu gece — başkanın 9 referanstan damıtılan tarzı):
 * "yıldızlı lacivert gece + akan altın ışık + tek kahraman + insan sıcaklığı".
 *  - YildizliZemin: düz lacivert değil, yıldız serpili gece göğü (Ref 9).
 *  - IsiltiSerit: soldan sağa süpüren altın parlama — "şarj oluyor" hissi (Ref 2).
 *  - GunHalkalari: haftalık ✓ daireleri (Ref 6, Calm).
 *  - DalgaGecis: laciverttten kreme kavisli dikiş (Ref 8, Glovo).
 * Hepsi OTA-güvenli: yalnız mevcut paketler (linear-gradient, svg, reanimated).
 */
import { LinearGradient } from 'expo-linear-gradient';
import { type ReactNode, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { AppText } from '@/components/ui/app-text';
import { Palette, Radius, Spacing } from '@/constants/theme';

/* Deterministik yıldız haritası (x%, y%, boyut, parlaklık) — her açılışta aynı gökyüzü. */
const YILDIZLAR: [number, number, number, number][] = [
  [6, 12, 2, 0.5], [14, 34, 1.5, 0.3], [22, 8, 2.5, 0.6], [28, 52, 1.5, 0.25],
  [34, 22, 2, 0.4], [43, 66, 1.5, 0.3], [48, 14, 3, 0.55], [55, 40, 1.5, 0.3],
  [61, 74, 2, 0.35], [67, 10, 2, 0.45], [72, 30, 1.5, 0.25], [78, 58, 2.5, 0.5],
  [84, 18, 1.5, 0.3], [90, 44, 2, 0.4], [95, 70, 1.5, 0.3], [10, 78, 2, 0.35],
  [38, 86, 1.5, 0.25], [58, 90, 2, 0.3], [88, 84, 1.5, 0.35], [18, 60, 1.5, 0.2],
];

/** Yıldız serpili lacivert gece göğü — sahnenin zemini. dalgali=alt köşeler düz (DalgaGecis'e diş). */
export function YildizliZemin({ children, dalgali }: { children: ReactNode; dalgali?: boolean }) {
  return (
    <View style={[st.gok, dalgali && st.gokDalgali]}>
      <LinearGradient
        colors={[Palette.lacivert2, Palette.lacivert]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {YILDIZLAR.map(([x, y, boyut, parlak], i) => (
        <View
          key={i}
          pointerEvents="none"
          style={[
            st.yildiz,
            {
              left: `${x}%`,
              top: `${y}%`,
              width: boyut,
              height: boyut,
              borderRadius: boyut / 2,
              opacity: parlak,
            },
          ]}
        />
      ))}
      <View style={st.gokIcerik}>{children}</View>
    </View>
  );
}

/** Soldan sağa periyodik süpüren ışıltı — kapsayıcının ÜSTÜNE serilir (overflow hidden şart). */
export function IsiltiSerit({ egik = true }: { egik?: boolean }) {
  const [genislik, setGenislik] = useState(0);
  const x = useSharedValue(-120);

  useEffect(() => {
    if (genislik <= 0) return;
    x.value = -120;
    // 2.6 sn'de bir süpür: 1.1 sn süpürme + bekleme (withDelay) — göz yormadan "yaşıyor" hissi.
    x.value = withRepeat(
      withDelay(1500, withTiming(genislik + 120, { duration: 1100, easing: Easing.inOut(Easing.quad) })),
      -1,
      false,
    );
  }, [genislik, x]);

  const stil = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));

  return (
    <View
      pointerEvents="none"
      style={StyleSheet.absoluteFill}
      onLayout={(e) => setGenislik(e.nativeEvent.layout.width)}>
      <Animated.View style={[st.isilti, egik && st.isiltiEgik, stil]}>
        <LinearGradient
          colors={['rgba(255,255,255,0)', 'rgba(255,244,214,0.55)', 'rgba(255,255,255,0)']}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={st.isiltiDolgu}
        />
      </Animated.View>
    </View>
  );
}

/** Haftalık gün halkaları: tamamlanan gün altın dolgu + ✓ (koyu zemin için). */
export function GunHalkalari({ gunler }: { gunler: { harf: string; tamam: boolean }[] }) {
  return (
    <View style={st.halkaSatir}>
      {gunler.map((g, i) => (
        <View key={i} style={st.halkaKol}>
          <View style={[st.halka, g.tamam && st.halkaTamam]}>
            {g.tamam ? (
              <AppText variant="etiket" bold color="lacivert">
                ✓
              </AppText>
            ) : null}
          </View>
          <AppText variant="etiket" color="kenarlik">
            {g.harf}
          </AppText>
        </View>
      ))}
    </View>
  );
}

/** Lacivert sahneden krem gövdeye kavisli dalga dikişi. */
export function DalgaGecis() {
  return (
    <View style={st.dalgaSar} pointerEvents="none">
      <Svg width="100%" height="26" viewBox="0 0 100 26" preserveAspectRatio="none">
        <Path d="M0,0 L100,0 L100,8 C72,26 28,26 0,8 Z" fill={Palette.lacivert} />
      </Svg>
    </View>
  );
}

const st = StyleSheet.create({
  gok: {
    borderRadius: Radius.l,
    overflow: 'hidden',
  },
  gokDalgali: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  yildiz: {
    position: 'absolute',
    backgroundColor: '#FFF6DC',
  },
  gokIcerik: {
    padding: Spacing.four,
    gap: Spacing.three,
  },
  isilti: {
    position: 'absolute',
    top: -20,
    bottom: -20,
    width: 90,
  },
  isiltiEgik: {
    transform: [{ skewX: '-18deg' }],
  },
  isiltiDolgu: {
    flex: 1,
  },
  halkaSatir: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halkaKol: {
    alignItems: 'center',
    gap: 3,
  },
  halka: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    borderColor: 'rgba(255,246,220,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  halkaTamam: {
    backgroundColor: Palette.altin,
    borderColor: Palette.altin,
  },
  dalgaSar: {
    marginTop: -1, // sahnenin dibine dişsiz kenetlensin
  },
});
