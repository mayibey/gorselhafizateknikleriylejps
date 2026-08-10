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
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';

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

/** NABIZ: çocuğu 4 sn'de bir belli belirsiz büyütüp indirir (%2) — CTA mıknatısı. */
export function Nabiz({ children }: { children: ReactNode }) {
  const olcek = useSharedValue(1);
  useEffect(() => {
    olcek.value = withRepeat(
      withSequence(
        withTiming(1.02, { duration: 900, easing: Easing.inOut(Easing.sin) }),
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.sin) }),
        withDelay(2200, withTiming(1, { duration: 0 })),
      ),
      -1,
      false,
    );
  }, [olcek]);
  const stil = useAnimatedStyle(() => ({ transform: [{ scale: olcek.value }] }));
  return <Animated.View style={stil}>{children}</Animated.View>;
}

/** ÇAN SALLANMASI: aktifken 30 sn'de bir ~1 sn hafifçe çalar. */
export function Sallan({ aktif, children }: { aktif: boolean; children: ReactNode }) {
  const aci = useSharedValue(0);
  useEffect(() => {
    if (!aktif) {
      aci.value = 0;
      return;
    }
    aci.value = withRepeat(
      withSequence(
        withDelay(8000, withTiming(-12, { duration: 120 })),
        withTiming(10, { duration: 140 }),
        withTiming(-7, { duration: 130 }),
        withTiming(5, { duration: 120 }),
        withTiming(0, { duration: 140 }),
        withDelay(22000, withTiming(0, { duration: 0 })),
      ),
      -1,
      false,
    );
  }, [aci, aktif]);
  const stil = useAnimatedStyle(() => ({ transform: [{ rotate: `${aci.value}deg` }] }));
  return <Animated.View style={stil}>{children}</Animated.View>;
}

/**
 * UFUK SİLÜETİ — geri sayım bloğunun arkasında katmanlı dağ sırtları (11 Ağu,
 * başkanın "%100 aynısı" istediği ekran görüntüsünden). Fotoğraf değil SVG:
 * OTA-güvenli, zemin degradesiyle kaynaşan iki koyu sırt katmanı.
 */
export function UfukSiluet() {
  return (
    <View style={st.ufuk} pointerEvents="none">
      <Svg width="100%" height="100%" viewBox="0 0 100 32" preserveAspectRatio="none">
        <Path
          d="M0,22 L13,15 L24,20 L38,11 L52,19 L66,13 L80,18 L100,12 L100,32 L0,32 Z"
          fill="rgba(5,26,36,0.30)"
        />
        <Path
          d="M0,27 L16,22 L32,26 L50,19 L68,25 L84,21 L100,24 L100,32 L0,32 Z"
          fill="rgba(4,20,29,0.42)"
        />
      </Svg>
    </View>
  );
}

/**
 * EMİR HALKASI — Bugünün Emri kartındaki ilerleme çemberi ("2/8 tamamlandı").
 * tamam = bugün çalışılan kart, toplam = tamam + kalan zayıf mevzi (gün sonu hedefi).
 * Gerçek veriden; sahte sayı yok.
 */
export function EmirHalka({ tamam, toplam }: { tamam: number; toplam: number }) {
  const boyut = 104;
  const kalin = 7;
  const r = (boyut - kalin) / 2;
  const cevre = 2 * Math.PI * r;
  const oran = toplam > 0 ? Math.min(1, tamam / toplam) : 0;
  return (
    <View style={[st.halkaSar, { width: boyut, height: boyut }]}>
      <Svg width={boyut} height={boyut} style={StyleSheet.absoluteFill}>
        <Circle
          cx={boyut / 2}
          cy={boyut / 2}
          r={r}
          stroke="rgba(255,246,220,0.16)"
          strokeWidth={kalin}
          fill="rgba(5,26,36,0.35)"
        />
        <Circle
          cx={boyut / 2}
          cy={boyut / 2}
          r={r}
          stroke={Palette.altin}
          strokeWidth={kalin}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${cevre * oran} ${cevre}`}
          transform={`rotate(-90 ${boyut / 2} ${boyut / 2})`}
        />
      </Svg>
      <AppText variant="baslik" bold color="beyaz">
        {tamam} / {toplam}
      </AppText>
      <AppText variant="etiket" color="beyaz" style={st.halkaAlt}>
        tamamlandı
      </AppText>
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
    borderWidth: 1,
    borderColor: 'rgba(255,246,220,0.12)', // gece sayfasında panel kenarı hafif seçilsin
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
  ufuk: {
    position: 'absolute',
    left: -12, // gövde padding'ini taşarak kenardan kenara uzansın
    right: -12,
    bottom: 0,
    height: 120,
  },
  halkaSar: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  halkaAlt: {
    opacity: 0.85,
    marginTop: -2,
  },
});
