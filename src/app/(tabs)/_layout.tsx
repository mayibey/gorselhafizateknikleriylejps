import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { StyleSheet, View, type ColorValue } from 'react-native';

import { FontFamily, Palette } from '@/constants/theme';

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
});

/** Krom: krem zemin, aktif sekme lacivert, pasif soluk. */
export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Palette.lacivert,
        tabBarInactiveTintColor: Palette.solukMetin,
        tabBarStyle: {
          backgroundColor: Palette.kartKremi,
          borderTopColor: Palette.kenarlik,
        },
        tabBarLabelStyle: { fontFamily: FontFamily, fontWeight: '700' },
      }}>
      <Tabs.Screen name="index" options={{ title: 'Karargah', tabBarIcon: icon('home') }} />
      <Tabs.Screen
        name="mevzuat"
        options={{ title: 'Mevzuat', tabBarIcon: icon('book-open-variant') }}
      />
      <Tabs.Screen name="ara" options={{ title: 'Ara', tabBarIcon: icon('magnify') }} />
      {/* Talim (kanun bazlı deneme/alıştırma) — 25 müşterek kanunun küratörlü soruları.
          (Route adı 'tatbikat' içeride kaldı; görünen ad 'Talim'. İleride genel JSPS denemesi
          eklenince ayrı 'Tatbikat' sekmesi açılacak.) */}
      <Tabs.Screen
        name="tatbikat"
        options={{ title: 'Talim', tabBarIcon: icon('target') }}
      />
      <Tabs.Screen name="sicil" options={{ title: 'Evsaf', tabBarIcon: icon('account') }} />
    </Tabs>
  );
}
