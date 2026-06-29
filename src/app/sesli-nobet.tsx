import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { StudyCard } from '@/components/card-flow/study-card';
import { AppText } from '@/components/ui/app-text';
import { EmptyState } from '@/components/ui/empty-state';
import { Loading } from '@/components/ui/loading';
import { CardFlowMaxWidth, Palette, Radius, Spacing } from '@/constants/theme';
import { getCardsByLaw } from '@/db/database';
import { useSesliNobet } from '@/hooks/use-sesli-nobet';
import { useEkranKoruma } from '@/lib/ekran-koruma';
import type { QueueCard } from '@/lib/queue';
import { sesliKartlar } from '@/lib/sesli-nobet';

export default function SesliNobetScreen() {
  // İçerik koruması: kart görseli görünür → ekran görüntüsü/kaydı engellenir.
  useEkranKoruma();
  const router = useRouter();
  const { lawId } = useLocalSearchParams<{ lawId?: string }>();
  const [kartlar, setKartlar] = useState<QueueCard[] | null>(null);
  const [hata, setHata] = useState(false);

  const yukle = useCallback(() => {
    setHata(false);
    setKartlar(null);
    if (lawId == null || lawId === '') {
      setHata(true);
      return;
    }
    void getCardsByLaw(Number(lawId))
      .then((cards) => setKartlar(sesliKartlar(cards)))
      .catch(() => setHata(true));
  }, [lawId]);

  useEffect(() => {
    yukle();
  }, [yukle]);

  // Hook koşulsuz çağrılır; liste yüklenene kadar boş.
  const nobet = useSesliNobet(kartlar ?? []);
  const { aktifKart, index, toplam, oynuyor, yukleniyor, oynatDurdur, sonraki, onceki } = nobet;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <MaterialCommunityIcons name="close" size={26} color={Palette.beyaz} />
        </Pressable>
        <View style={styles.headerMeta}>
          <AppText variant="govde" color="beyaz" bold>
            {kartlar && kartlar.length > 0 ? `Sesli Nöbet · ${index + 1} / ${toplam}` : 'Sesli Nöbet'}
          </AppText>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      {hata ? (
        <View style={styles.kolon}>
          <EmptyState
            ikon="alert-circle-outline"
            ikonRenk="kirmizi"
            baslik="Yüklenemedi"
            aciklama="Sesli nöbet yüklenemedi."
            buton={{ etiket: 'Tekrar dene', onPress: yukle }}
          />
        </View>
      ) : kartlar === null ? (
        <View style={styles.kolon}>
          <Loading metin="Yükleniyor…" />
        </View>
      ) : kartlar.length === 0 ? (
        <View style={styles.kolon}>
          <EmptyState
            ikon="headphones"
            baslik="Sesli anlatım yok"
            aciklama="Bu kanunda sesli anlatım yakında eklenecek."
            buton={{ etiket: 'Geri dön', onPress: () => router.back() }}
          />
        </View>
      ) : aktifKart ? (
        <View style={styles.kolon}>
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
            <StudyCard card={aktifKart} />
          </ScrollView>

          {/* Oynatıcı kontrolleri — kolonun altına sabit */}
          <View style={styles.kontroller}>
            <KontrolButon
              ikon="skip-previous"
              onPress={onceki}
              disabled={index === 0}
            />
            <Pressable
              style={({ pressed }) => [styles.oynat, pressed && styles.pressed]}
              onPress={oynatDurdur}
              accessibilityRole="button"
              accessibilityLabel={oynuyor ? 'Duraklat' : 'Oynat'}>
              {yukleniyor ? (
                <ActivityIndicator color={Palette.beyaz} />
              ) : (
                <MaterialCommunityIcons
                  name={oynuyor ? 'pause' : 'play'}
                  size={36}
                  color={Palette.beyaz}
                />
              )}
            </Pressable>
            <KontrolButon
              ikon="skip-next"
              onPress={sonraki}
              disabled={index >= toplam - 1}
            />
          </View>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

function KontrolButon({
  ikon,
  onPress,
  disabled,
}: {
  ikon: keyof typeof MaterialCommunityIcons.glyphMap;
  onPress: () => void;
  disabled: boolean;
}) {
  return (
    <Pressable
      disabled={disabled}
      style={({ pressed }) => [styles.kontrol, disabled && styles.kontrolPasif, pressed && styles.pressed]}
      onPress={onPress}>
      <MaterialCommunityIcons name={ikon} size={30} color={Palette.lacivert} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Palette.kremZemin,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Palette.lacivert,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  headerSpacer: {
    width: 26,
  },
  headerMeta: {
    flex: 1,
    alignItems: 'center',
  },
  kolon: {
    flex: 1,
    width: '100%',
    maxWidth: CardFlowMaxWidth,
    alignSelf: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: Spacing.three,
    justifyContent: 'center',
  },
  kontroller: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.five,
    paddingVertical: Spacing.four,
  },
  kontrol: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Palette.kartKremi,
    borderColor: Palette.kenarlik,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kontrolPasif: {
    opacity: 0.4,
  },
  oynat: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Palette.lacivert,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.85,
  },
});
