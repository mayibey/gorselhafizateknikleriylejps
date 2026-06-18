import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import type { ColorValue } from 'react-native';

import { FontFamily, Palette } from '@/constants/theme';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

function icon(name: IconName) {
  return ({ color, size }: { color: ColorValue; size: number }) => (
    <MaterialCommunityIcons name={name} color={color} size={size} />
  );
}

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
      {/* Tatbikat (deneme/quiz) v1'de GİZLİ — içerik yok, boş sekme "yarım app" riski.
          href:null → sekme çubuğundan kalkar, rota+ekran v2 için kodda durur. */}
      <Tabs.Screen
        name="tatbikat"
        options={{ title: 'Tatbikat', tabBarIcon: icon('target'), href: null }}
      />
      <Tabs.Screen name="sicil" options={{ title: 'Evsaf', tabBarIcon: icon('account') }} />
    </Tabs>
  );
}
