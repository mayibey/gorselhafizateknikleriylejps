import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { StyleSheet, View, type ColorValue } from 'react-native';

import { FontFamily, Palette } from '@/constants/theme';
import { useKisiselOzellik } from '@/lib/ozellik';

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
  return (
    <Tabs
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
            }
          : {
              backgroundColor: Palette.kartKremi,
              borderTopColor: Palette.kenarlik,
            },
        tabBarLabelStyle: { fontFamily: FontFamily, fontWeight: '700' },
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
        options={{ title: 'Oyunlar', tabBarIcon: oyunlarIcon() }}
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
  );
}
