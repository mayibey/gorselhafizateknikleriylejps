/**
 * "Yakında" — branş içeriği henüz hazır olmayan ekranlar için premium boş-durum kartı.
 * Gizlenmez (kullanıcı uygulamanın kapsamının geniş olduğunu görsün); altın "YAKINDA" rozeti +
 * marka tonuyla "geliyor" hissi verir. Salt görsel.
 */

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Palette, Radius, Spacing } from '@/constants/theme';

export function Yakinda({
  ikon,
  baslik,
  aciklama,
}: {
  ikon: keyof typeof MaterialCommunityIcons.glyphMap;
  baslik: string;
  aciklama: string;
}) {
  return (
    <View style={styles.kart}>
      <View style={styles.rozet}>
        <MaterialCommunityIcons name="clock-outline" size={13} color={Palette.altinKoyu} />
        <AppText variant="etiket" bold color="altinKoyu" style={styles.rozetMetin}>
          YAKINDA
        </AppText>
      </View>
      <MaterialCommunityIcons name={ikon} size={48} color={Palette.altinKoyu} />
      <AppText variant="altBaslik" bold color="lacivert" style={styles.baslik}>
        {baslik}
      </AppText>
      <AppText variant="kucuk" color="solukMetin" style={styles.aciklama}>
        {aciklama}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  kart: {
    backgroundColor: Palette.kartKremi,
    borderColor: Palette.kenarlik,
    borderWidth: 1,
    borderRadius: Radius.l,
    paddingVertical: Spacing.five,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
    gap: Spacing.two,
  },
  rozet: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.half,
    backgroundColor: Palette.altinSolukYuzey,
    borderRadius: Radius.l,
    paddingVertical: Spacing.half,
    paddingHorizontal: Spacing.two,
  },
  rozetMetin: {
    letterSpacing: 1.5,
  },
  baslik: {
    textAlign: 'center',
  },
  aciklama: {
    textAlign: 'center',
    maxWidth: 320,
    lineHeight: 20,
  },
});
