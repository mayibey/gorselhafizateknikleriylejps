/**
 * Kanun indirme butonu (Mevzuat satırı) — durum: İndir / %X iniyor / İndirildi (+ sil).
 * İndirilen kanun çalışırken yerelden okunur (anında + offline). Yalnız uzak kaynak (ICERIK_TABANI)
 * + indirme-destekli platformda görünür; yerel/gömülü modda gizli (gerek yok).
 */
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  type GestureResponderEvent,
  Pressable,
  StyleSheet,
  View,
} from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { ICERIK_TABANI } from '@/constants/config';
import { Palette, Radius, Spacing } from '@/constants/theme';
import { indirmeDestekli, kanunIndir, kanunIndirilmisMi, kanunSil } from '@/lib/indirme';

type Durum = 'yok' | 'iniyor' | 'indirildi';

export function KanunIndirButon({ klasor }: { klasor: string }) {
  const [durum, setDurum] = useState<Durum>(() => (kanunIndirilmisMi(klasor) ? 'indirildi' : 'yok'));
  const [yuzde, setYuzde] = useState(0);

  if (!indirmeDestekli || !ICERIK_TABANI) return null;

  async function indir(e?: GestureResponderEvent) {
    e?.stopPropagation();
    setDurum('iniyor');
    setYuzde(0);
    try {
      await kanunIndir(klasor, (p) => setYuzde(p.yuzde));
      setDurum('indirildi');
    } catch (e) {
      setDurum('yok');
      Alert.alert('İndirilemedi', e instanceof Error ? e.message : 'Bağlantını kontrol et, tekrar dene.');
    }
  }

  function silSor(e?: GestureResponderEvent) {
    e?.stopPropagation();
    Alert.alert('İndirilen içeriği sil', 'Bu kanunun indirilen görselleri cihazdan silinecek. Tekrar çalışmak için yeniden indirmen gerekir.', [
      { text: 'Vazgeç', style: 'cancel' },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: () => {
          void kanunSil(klasor).then(() => setDurum('yok'));
        },
      },
    ]);
  }

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
      <Pressable style={[styles.kutu, styles.indirildi]} onPress={silSor} hitSlop={6}>
        <MaterialCommunityIcons name="check-circle" size={16} color={Palette.yesil} />
        <AppText variant="etiket" bold color="yesil">
          İndirildi
        </AppText>
        <MaterialCommunityIcons name="trash-can-outline" size={15} color={Palette.solukMetin} />
      </Pressable>
    );
  }

  return (
    <Pressable style={[styles.kutu, styles.indir]} onPress={(e) => void indir(e)} hitSlop={6}>
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
