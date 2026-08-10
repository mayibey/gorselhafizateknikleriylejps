/**
 * EVSAF KATEGORİSİ — ortak akordeon kart (10 Ağu). Yuvarlak ikon + başlık +
 * özet altyazı + ok; dokununca içerik aşağı açılır. sicil.tsx'teki yerel kopya
 * buraya taşındı ki yeni analiz kategorileri de aynı bileşeni kullansın.
 */
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { type ReactNode, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Palette, Radius, Spacing } from '@/constants/theme';

export function EvsafKategori({
  ikon,
  baslik,
  altYazi,
  children,
}: {
  ikon: keyof typeof MaterialCommunityIcons.glyphMap;
  baslik: string;
  altYazi?: string;
  children: ReactNode;
}) {
  const [acik, setAcik] = useState(false);
  return (
    <View style={st.kart}>
      <Pressable
        style={st.baslik}
        onPress={() => setAcik((v) => !v)}
        accessibilityRole="button"
        accessibilityLabel={`${baslik} bölümünü aç/kapat`}>
        <View style={st.ikon}>
          <MaterialCommunityIcons name={ikon} size={22} color={Palette.lacivert} />
        </View>
        <View style={st.ad}>
          <AppText variant="govde" bold color="lacivert" numberOfLines={1}>
            {baslik}
          </AppText>
          {altYazi ? (
            <AppText variant="etiket" color="solukMetin" numberOfLines={1}>
              {altYazi}
            </AppText>
          ) : null}
        </View>
        <MaterialCommunityIcons
          name={acik ? 'chevron-up' : 'chevron-down'}
          size={22}
          color={Palette.solukMetin}
        />
      </Pressable>
      {acik ? children : null}
    </View>
  );
}

const st = StyleSheet.create({
  kart: {
    backgroundColor: Palette.kartKremi,
    borderColor: Palette.kenarlik,
    borderWidth: 1,
    borderRadius: Radius.m,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  baslik: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  ikon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Palette.altinSolukYuzey,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ad: {
    flex: 1,
    gap: 1,
  },
});
