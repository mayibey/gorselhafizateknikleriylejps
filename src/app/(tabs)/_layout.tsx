import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Tabs } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View, useWindowDimensions, type ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { FontFamily, Palette } from '@/constants/theme';
import { useKisiselOzellik } from '@/lib/ozellik';

/**
 * SİS PERDESİ (başkan, 11 Ağu: "önce sis çöküyor sonra perde aralanıyor gibi").
 * Sekme değişiminde: yumuşak turkuaz sis ekrana çöker (~220ms), sonra iki yarım
 * perde yanlara kayarak aralanır ve solar (~650ms). Dokunuşları engellemez.
 */
function SisPerdesi({ sinyal, ortada }: { sinyal: number; ortada: () => void }) {
  const { width: W, height: H } = useWindowDimensions();
  const yog = useSharedValue(0); // 0=açık gök, 1=tam sis
  useEffect(() => {
    if (!sinyal) return;
    yog.value = 0;
    yog.value = withSequence(
      withTiming(1, { duration: 380, easing: Easing.in(Easing.quad) }), // sis çöker
      withTiming(1, { duration: 140 }), // tam kapalı — menü bu kör anda değişir
      withTiming(0, { duration: 780, easing: Easing.out(Easing.quad) }), // sis dağılır
    );
    const t = setTimeout(ortada, 430);
    return () => clearTimeout(t);
  }, [sinyal, yog, ortada]);
  // Dört bulut katmanı: farklı hız çarpanları → perde değil SİS hissi (parallax).
  const bulut = (yonX: number, yonY: number, hiz: number) =>
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useAnimatedStyle(() => ({
      opacity: Math.min(1, yog.value * 1.25),
      transform: [
        { translateX: yonX * W * 0.62 * (1 - yog.value) * hiz },
        { translateY: yonY * H * 0.3 * (1 - yog.value) * hiz },
      ],
    }));
  const solUst = bulut(-1, -0.4, 1);
  const sagUst = bulut(1, -0.3, 0.75);
  const solAlt = bulut(-1, 0.35, 0.85);
  const sagAlt = bulut(1, 0.45, 1.1);
  const ortStil = useAnimatedStyle(() => ({ opacity: yog.value * 0.94 }));
  const katmanlar: [object, object][] = [
    [sisSt.solUst, solUst],
    [sisSt.sagUst, sagUst],
    [sisSt.solAlt, solAlt],
    [sisSt.sagAlt, sagAlt],
  ];
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {katmanlar.map(([yer, stil], i) => (
        <Animated.View key={i} style={[sisSt.bulut, yer, stil]}>
          <LinearGradient
            colors={['rgba(96,130,146,0.6)', 'rgba(70,104,122,0.45)', 'rgba(70,104,122,0)']}
            start={{ x: 0.5, y: 0.5 }}
            end={{ x: 1, y: 1 }}
            style={sisSt.bulutDolgu}
          />
        </Animated.View>
      ))}
      {/* Tepe yoğunlukta ekranı tamamen örten ince tül — geçiş bu örtünün ardında olur. */}
      <Animated.View style={[StyleSheet.absoluteFill, sisSt.tul, ortStil]} />
    </View>
  );
}

const sisSt = StyleSheet.create({
  bulut: {
    position: 'absolute',
    width: '85%',
    height: '60%',
    borderRadius: 999,
    overflow: 'hidden',
  },
  bulutDolgu: { flex: 1 },
  solUst: { left: '-20%', top: '-12%' },
  sagUst: { right: '-22%', top: '-8%' },
  solAlt: { left: '-18%', bottom: '-10%' },
  sagAlt: { right: '-20%', bottom: '-14%' },
  tul: {
    backgroundColor: 'rgb(13,44,58)', // gece sisi — koyu petrol, göz almaz
  },
});

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

function icon(name: IconName) {
  // Aktif sekmenin ÜSTÜnde ince altın çizgi (pasifte saydam → ikon konumu kaymaz).
  return ({ focused, color, size }: { focused: boolean; color: ColorValue; size: number }) => (
    <View style={ikonStil.sar}>
      <View style={[ikonStil.cizgi, focused && ikonStil.cizgiAktif]} />
      <MaterialCommunityIcons name={name} color={color} size={size} />
    </View>
  );
}

// OYUNLAR — ORTA sekme, altın vurgulu → göz oraya kayar. Er Meydanı bu bölümün İÇİNDE.
// Dosya adı 'er-meydani' KALDI: 10'dan fazla yerde router.replace('/er-meydani') var,
// derin bağlantı (/oda/KOD) da oraya düşüyor. Yalnız görünen ad ve ikon değişti.
function oyunlarIcon() {
  return ({ focused, size }: { focused: boolean; color: ColorValue; size: number }) => (
    <View style={ikonStil.sar}>
      <View style={[ikonStil.cizgi, focused && ikonStil.cizgiAktif]} />
      <View style={ikonStil.erDaire}>
        <MaterialCommunityIcons name="gamepad-variant" color={Palette.lacivert} size={size - 6} />
      </View>
    </View>
  );
}

const ikonStil = StyleSheet.create({
  sar: { alignItems: 'center' },
  cizgi: {
    height: 3,
    width: 28,
    borderRadius: 2,
    marginBottom: 4,
    backgroundColor: 'transparent',
  },
  cizgiAktif: { backgroundColor: Palette.altin },
  erDaire: {
    backgroundColor: Palette.altin,
    borderRadius: 14,
    padding: 3,
  },
});

/** Krom: krem zemin, aktif sekme lacivert, pasif soluk. Er Meydanı ortada, altın vurgulu. */
export default function TabsLayout() {
  // GECE KARARI K4 (kişiye özel deneme): dört sekme — Talim bardan kalkar, Mevzuat'ın
  // içinden ulaşılır. Bayrak yalnız başkanda açık; kapalıyken bugünkü beş sekme aynen.
  const talimMevzuata = useKisiselOzellik('talim-mevzuata');
  // KOMPAKT SEKME ÇUBUĞU (bayraklı, 17 Ağu — başkan: "alt taraftan tasarruf").
  // iPhone'da ev çizgisi güvenli alanı çubuğu şişiriyordu; ikon-yazı arası da genişti.
  const kompakt = useKisiselOzellik('gece-er-meydani');
  const kenar = useSafeAreaInsets();
  const [sisSinyal, setSisSinyal] = useState(0);
  const bekleyenGecis = useRef<(() => void) | null>(null);
  const sisOrtada = useCallback(() => {
    bekleyenGecis.current?.();
    bekleyenGecis.current = null;
  }, []);
  return (
    <View style={sisSt2.kap}>
    <Tabs
      screenListeners={({ navigation }) =>
        talimMevzuata
          ? {
              tabPress: (e: { target?: string; preventDefault: () => void }) => {
                const hedefKey = e.target;
                // Rota adını TAHMİN ETME — navigasyon kaydından birebir bul
                // (anahtar içinde tire olabiliyor; kırpma yöntemi 'sicil'i bozuyordu).
                const rota = hedefKey
                  ? navigation.getState().routes.find((r) => r.key === hedefKey)
                  : undefined;
                if (!rota) return; // çözülemezse sissiz normal geçiş — asla kilitlenme
                e.preventDefault();
                bekleyenGecis.current = () => navigation.navigate(rota.name as never);
                setSisSinyal((n) => n + 1);
              },
            }
          : {}
      }
      screenOptions={{
        headerShown: false,
        // 11 Ağu "%100 aynısı" (bayraklı): sekme çubuğu da gece — koyu petrol zemin,
        // aktif ALTIN, pasif kırık beyaz. Bayraksızda krem krom aynen.
        tabBarActiveTintColor: talimMevzuata ? Palette.altinParlak : Palette.lacivert,
        tabBarInactiveTintColor: talimMevzuata ? 'rgba(226,236,240,0.75)' : Palette.solukMetin,
        tabBarStyle: talimMevzuata
          ? {
              backgroundColor: '#04283A', // handoff: koyu petrol sekme çubuğu
              borderTopColor: 'rgba(126,205,218,0.2)',
              // Kompakt: çubuk 49 yerine 44, EV ÇİZGİSİ boşluğu yarıya — oyun alanı büyür.
              //
              // 🔴 21 Ağu 2026 DÜZELTME (Bünyamin Ak bildirdi, 1.0.46'yı indirdikten 2 dk sonra):
              // "alttaki butonlar telefonun ana butonlarıyla çakışıyor". Sebep: alt boşluğun
              // %55'ini almak YALNIZCA ince ev çizgisinde (kaydırmalı gezinme, ~20) doğru.
              // ÜÇ TUŞLU gezinmede alt boşluk ~48 olur; %55'i (~26) verince çubuk sistem
              // tuşlarının ALTINA giriyor → dokunulamıyor. Test edenlerin hepsi kaydırmalı
              // gezinme kullandığı için fark edilmemişti (orada fark 9 birim, göze batmıyor).
              // ÇÖZÜM: boşluk büyükse (üç tuşlu) TAMAMINI kullan, küçükse kırpmaya devam et.
              ...(kompakt
                ? kenar.bottom > 24
                  ? { height: 44 + kenar.bottom, paddingBottom: kenar.bottom, paddingTop: 3 }
                  : { height: 44 + Math.max(kenar.bottom * 0.55, 6), paddingTop: 3 }
                : null),
            }
          : {
              backgroundColor: Palette.kartKremi,
              borderTopColor: Palette.kenarlik,
            },
        tabBarLabelStyle: kompakt
          ? { fontFamily: FontFamily, fontWeight: '700', fontSize: 11, marginTop: -3 }
          : { fontFamily: FontFamily, fontWeight: '700' },
      }}>
      <Tabs.Screen
        name="index"
        options={{ title: talimMevzuata ? 'Karargâh' : 'Karargah', tabBarIcon: icon('home') }}
      />
      <Tabs.Screen
        name="mevzuat"
        options={{ title: 'Mevzuat', tabBarIcon: icon('book-open-variant') }}
      />
      {/* ORTA — Oyunlar (altın vurgulu). Er Meydanı bu bölümün ilk oyunu. */}
      <Tabs.Screen
        name="er-meydani"
        options={{
          title: 'Oyunlar',
          // Ref v5 (bayraklı): altın daire yok — diğer sekmelerle aynı sade ikon.
          tabBarIcon: talimMevzuata ? icon('gamepad-variant') : oyunlarIcon(),
        }}
      />
      {/* Talim (kanun bazlı deneme/alıştırma) — 25 müşterek kanunun küratörlü soruları.
          Bayrak açıkken bardan gizlenir (href:null) ama rota yaşar → Mevzuat'tan açılır. */}
      <Tabs.Screen
        name="tatbikat"
        options={
          talimMevzuata
            ? { href: null, title: 'Talim' }
            : { title: 'Talim', tabBarIcon: icon('target') }
        }
      />
      <Tabs.Screen name="sicil" options={{ title: 'Evsaf', tabBarIcon: icon('account') }} />
      {/* Ara — bar'dan gizli (href:null); üstteki büyüteç ikonundan açılır. */}
      <Tabs.Screen name="ara" options={{ href: null, title: 'Ara' }} />
    </Tabs>
    {talimMevzuata ? <SisPerdesi sinyal={sisSinyal} ortada={sisOrtada} /> : null}
    </View>
  );
}

const sisSt2 = StyleSheet.create({ kap: { flex: 1 } });
