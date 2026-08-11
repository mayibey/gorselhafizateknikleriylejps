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
import { useKisiselOzellik } from '@/lib/ozellik';

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
  // Gece dili (bayraklı): kabuk kendi bayrağını okur — her kategori tek hamlede kararır.
  const gece = useKisiselOzellik('talim-mevzuata');
  return (
    <View style={[st.kart, gece && st.kartGece]}>
      <Pressable
        style={st.baslik}
        onPress={() => setAcik((v) => !v)}
        accessibilityRole="button"
        accessibilityLabel={`${baslik} bölümünü aç/kapat`}>
        <View style={[st.ikon, gece && st.ikonGece]}>
          <MaterialCommunityIcons
            name={ikon}
            size={22}
            color={gece ? Palette.altinParlak : Palette.lacivert}
          />
        </View>
        <View style={st.ad}>
          <AppText variant="govde" bold color={gece ? 'beyaz' : 'lacivert'} numberOfLines={1}>
            {baslik}
          </AppText>
          {altYazi ? (
            <AppText
              variant="etiket"
              bold={gece}
              color={gece ? 'beyaz' : 'solukMetin'}
              style={gece && st.geceSoluk}
              numberOfLines={1}>
              {altYazi}
            </AppText>
          ) : null}
        </View>
        <MaterialCommunityIcons
          name={acik ? 'chevron-up' : 'chevron-down'}
          size={22}
          color={gece ? 'rgba(226,236,240,0.75)' : Palette.solukMetin}
        />
      </Pressable>
      {acik ? children : null}
    </View>
  );
}

const st = StyleSheet.create({
  kartGece: {
    backgroundColor: 'rgba(3,47,69,0.88)',
    borderColor: 'rgba(126,205,218,0.5)',
  },
  ikonGece: {
    backgroundColor: 'rgba(3,40,56,0.7)',
    borderWidth: 1,
    borderColor: 'rgba(126,205,218,0.3)',
  },
  geceSoluk: {
    opacity: 0.85,
  },
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
