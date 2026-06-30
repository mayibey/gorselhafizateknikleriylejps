/**
 * Kanun indirme butonu (Mevzuat satırı) — durum: İndir / %X iniyor / İndirildi (+ sil).
 * KONTROLLÜ: state'i useKanunIndirme hook'undan alır (satır gate'i ile paylaşır).
 * Yalnız uzak kaynak (ICERIK_TABANI) + indirme-destekli platformda görünür.
 */
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ActivityIndicator, type GestureResponderEvent, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { ICERIK_TABANI } from '@/constants/config';
import { Palette, Radius, Spacing } from '@/constants/theme';
import type { IndirmeDurum } from '@/hooks/use-kanun-indirme';
import { indirmeDestekli } from '@/lib/indirme';

export function KanunIndirButon({
  durum,
  yuzde,
  onIndir,
  onSil,
}: {
  durum: IndirmeDurum;
  yuzde: number;
  onIndir: () => void;
  onSil: () => void;
}) {
  if (!indirmeDestekli || !ICERIK_TABANI) return null;

  const dur = (fn: () => void) => (e?: GestureResponderEvent) => {
    e?.stopPropagation();
    fn();
  };

  if (durum === 'iniyor') {
    return (
      <View style={[styles.kutu, styles.iniyor]}>
        <ActivityIndicator size="small" color={Palette.lacivert} />
        <AppText variant="etiket" bold color="lacivert">
          %{yuzde}
        </AppText>
      </View>
    );
  }

  if (durum === 'indirildi') {
    return (
      <Pressable style={[styles.kutu, styles.indirildi]} onPress={dur(onSil)} hitSlop={6}>
        <MaterialCommunityIcons name="check-circle" size={16} color={Palette.yesil} />
        <AppText variant="etiket" bold color="yesil">
          İndirildi
        </AppText>
        <MaterialCommunityIcons name="trash-can-outline" size={15} color={Palette.solukMetin} />
      </Pressable>
    );
  }

  return (
    <Pressable style={[styles.kutu, styles.indir]} onPress={dur(onIndir)} hitSlop={6}>
      <MaterialCommunityIcons name="download" size={16} color={Palette.lacivert} />
      <AppText variant="etiket" bold color="lacivert">
        İndir
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  kutu: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.one,
    borderRadius: Radius.s,
    borderWidth: 1,
  },
  indir: {
    backgroundColor: Palette.altinSolukYuzey,
    borderColor: Palette.altin,
  },
  iniyor: {
    backgroundColor: Palette.kartKremi,
    borderColor: Palette.kenarlik,
  },
  indirildi: {
    backgroundColor: Palette.kartKremi,
    borderColor: Palette.kenarlik,
  },
});
