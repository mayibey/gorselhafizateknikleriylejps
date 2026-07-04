/**
 * Kanun SEÇİM ekranı — Mevzuat'ta bir kanuna tıklayınca araya girer (kilit/indirme kapısı
 * Mevzuat'ta zaten geçildi). İki mod sunar:
 *  (1) Görsel Konu Anlatımı → mevcut kart akışı (/patika → /akis; öğrendim/zor + SRS).
 *  (2) Zor Detay Kartları → SALT GÖRÜNTÜLEME görselleri (/zor-detay; buton/SRS yok).
 */
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Screen } from '@/components/ui/screen';
import { Palette, Radius, Spacing } from '@/constants/theme';

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

export default function KanunSecScreen() {
  const router = useRouter();
  const { lawId, ad } = useLocalSearchParams<{ lawId?: string; ad?: string }>();

  return (
    <Screen title={ad || 'Kanun'} onGeri={() => router.back()}>
      <AppText variant="kucuk" color="solukMetin" style={styles.aciklama}>
        Nasıl çalışmak istersin?
      </AppText>

      <SecimKart
        ikon="movie-open-play-outline"
        baslik="Görsel Konu Anlatımı"
        altyazi="Maddeleri hafıza teknikleriyle baştan öğren"
        onPress={() =>
          router.push({ pathname: '/patika', params: lawId ? { lawId } : {} })
        }
      />

      <SecimKart
        ikon="lightbulb-on-outline"
        baslik="Zor Detay Kartları"
        altyazi="Kritik Ayrıntıları Kodla"
        onPress={() =>
          router.push({ pathname: '/zor-detay', params: { lawId: lawId ?? '', ad: ad ?? '' } })
        }
      />
    </Screen>
  );
}

function SecimKart({
  ikon,
  baslik,
  altyazi,
  onPress,
}: {
  ikon: IconName;
  baslik: string;
  altyazi: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.kart, pressed && styles.pressed]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${baslik} — ${altyazi}`}>
      <View style={styles.ikonKutu}>
        <MaterialCommunityIcons name={ikon} size={26} color={Palette.altinKoyu} />
      </View>
      <View style={styles.metin}>
        <AppText variant="govde" bold color="lacivert">
          {baslik}
        </AppText>
        <AppText variant="kucuk" color="solukMetin">
          {altyazi}
        </AppText>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={24} color={Palette.solukMetin} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  aciklama: {
    marginTop: Spacing.two,
    marginBottom: Spacing.one,
  },
  kart: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    backgroundColor: Palette.kartKremi,
    borderColor: Palette.kenarlik,
    borderWidth: 1,
    borderRadius: Radius.l,
    padding: Spacing.three,
    marginTop: Spacing.two,
  },
  ikonKutu: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Palette.altinSolukYuzey,
    borderWidth: 1,
    borderColor: Palette.altin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metin: {
    flex: 1,
    gap: Spacing.half,
  },
  pressed: {
    opacity: 0.85,
  },
});
