import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/app-text';
import { EmptyState } from '@/components/ui/empty-state';
import { Loading } from '@/components/ui/loading';
import { CardFlowMaxWidth, Palette, Radius, Spacing } from '@/constants/theme';
import { getCardsByLaw } from '@/db/database';
import { MIN_HAVUZ, puanla, type QuizSoru, quizUret, SECENEK_SAYISI } from '@/lib/quiz';

type Cevap = { soruIndex: number; secilenIndex: number };

/** Tek quiz'de en fazla soru (büyük kanunlar için tavan). */
const SORU_SAYISI_TAVAN = 10;
/** Quiz geri bildirim renkleri. */
const DOGRU_YESIL = '#16a34a';
const YANLIS_KIRMIZI = Palette.kirmizi;

export default function QuizScreen() {
  const router = useRouter();
  const { lawId } = useLocalSearchParams<{ lawId?: string }>();
  const [sorular, setSorular] = useState<QuizSoru[] | null>(null);
  const [hata, setHata] = useState(false);
  const [yetersiz, setYetersiz] = useState(false);
  const [index, setIndex] = useState(0);
  const [secilen, setSecilen] = useState<number | null>(null);
  const [cevaplar, setCevaplar] = useState<Cevap[]>([]);

  const yukle = useCallback(() => {
    setHata(false);
    setYetersiz(false);
    setSorular(null);
    setIndex(0);
    setSecilen(null);
    setCevaplar([]);
    if (lawId == null || lawId === '') {
      setHata(true);
      return;
    }
    void getCardsByLaw(Number(lawId))
      .then((cards) => {
        if (cards.length < MIN_HAVUZ) {
          setYetersiz(true);
          return;
        }
        setSorular(
          quizUret(cards, {
            soruSayisi: Math.min(SORU_SAYISI_TAVAN, cards.length),
            secenekSayisi: SECENEK_SAYISI,
          }),
        );
      })
      .catch(() => setHata(true));
  }, [lawId]);

  useEffect(() => {
    yukle();
  }, [yukle]);

  function sec(i: number) {
    if (secilen !== null) return; // soru zaten cevaplandı
    setSecilen(i);
  }

  function sonraki() {
    if (secilen === null) return;
    setCevaplar((c) => [...c, { soruIndex: index, secilenIndex: secilen }]);
    setSecilen(null);
    setIndex((i) => i + 1);
  }

  const bitti = sorular !== null && index >= sorular.length;
  const aktif = sorular !== null && !bitti;
  const soru = aktif ? sorular[index] : null;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      {/* Üst krom: kapat + ilerleme */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <MaterialCommunityIcons name="close" size={26} color={Palette.beyaz} />
        </Pressable>
        <View style={styles.headerMeta}>
          {aktif ? (
            <AppText variant="govde" color="beyaz" bold>
              Soru {index + 1} / {sorular!.length}
            </AppText>
          ) : (
            <AppText variant="govde" color="beyaz" bold>
              Tatbikat
            </AppText>
          )}
        </View>
        <View style={styles.headerSpacer} />
      </View>

      {hata ? (
        <View style={styles.kolon}>
          <EmptyState
            ikon="alert-circle-outline"
            ikonRenk="kirmizi"
            baslik="Yüklenemedi"
            aciklama="Quiz yüklenemedi."
            buton={{ etiket: 'Tekrar dene', onPress: yukle }}
          />
        </View>
      ) : yetersiz ? (
        <View style={styles.kolon}>
          <EmptyState
            ikon="clock-outline"
            baslik="Yeterli içerik yok"
            aciklama={`Bu kanunda quiz için yeterli kart yok (en az ${MIN_HAVUZ} gerekli).`}
            buton={{ etiket: 'Geri dön', onPress: () => router.back() }}
          />
        </View>
      ) : sorular === null ? (
        <View style={styles.kolon}>
          <Loading metin="Sorular hazırlanıyor…" />
        </View>
      ) : bitti ? (
        <Sonuc cevaplar={cevaplar} sorular={sorular} onTekrar={yukle} onBitir={() => router.back()} />
      ) : (
        <View style={styles.kolon}>
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
            <View style={styles.track}>
              <View
                style={[styles.fill, { width: `${((index + 1) / sorular.length) * 100}%` }]}
              />
            </View>

            <View style={styles.soruKart}>
              <AppText variant="altBaslik" bold>
                {soru!.soruMetni}
              </AppText>
            </View>

            <View style={styles.secenekler}>
              {soru!.secenekler.map((metin, i) => (
                <Secenek
                  key={i}
                  metin={metin}
                  durum={secenekDurum(i, secilen, soru!.dogruIndex)}
                  onPress={() => sec(i)}
                  disabled={secilen !== null}
                />
              ))}
            </View>
          </ScrollView>

          {/* Sonraki — yalnız cevaplandıktan sonra aktif */}
          <View style={styles.altBlok}>
            <Pressable
              disabled={secilen === null}
              style={({ pressed }) => [
                styles.sonraki,
                secilen === null && styles.sonrakiPasif,
                pressed && secilen !== null && styles.pressed,
              ]}
              onPress={sonraki}>
              <AppText variant="govde" color="beyaz" bold>
                {index + 1 >= sorular.length ? 'Sonucu gör' : 'Sonraki'}
              </AppText>
            </Pressable>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

type SecenekDurum = 'notr' | 'dogru' | 'yanlis' | 'soluk';

function secenekDurum(i: number, secilen: number | null, dogruIndex: number): SecenekDurum {
  if (secilen === null) return 'notr';
  if (i === dogruIndex) return 'dogru';
  if (i === secilen) return 'yanlis';
  return 'soluk';
}

function Secenek({
  metin,
  durum,
  onPress,
  disabled,
}: {
  metin: string;
  durum: SecenekDurum;
  onPress: () => void;
  disabled: boolean;
}) {
  const arka =
    durum === 'dogru' ? DOGRU_YESIL : durum === 'yanlis' ? YANLIS_KIRMIZI : Palette.kartKremi;
  const metinRenk = durum === 'dogru' || durum === 'yanlis' ? 'beyaz' : 'lacivert';
  return (
    <Pressable
      disabled={disabled}
      style={({ pressed }) => [
        styles.secenek,
        { backgroundColor: arka },
        durum === 'soluk' && styles.secenekSoluk,
        pressed && !disabled && styles.pressed,
      ]}
      onPress={onPress}>
      <AppText variant="govde" color={metinRenk} bold style={styles.secenekMetin}>
        {metin}
      </AppText>
      {durum === 'dogru' ? (
        <MaterialCommunityIcons name="check-circle" size={22} color={Palette.beyaz} />
      ) : durum === 'yanlis' ? (
        <MaterialCommunityIcons name="close-circle" size={22} color={Palette.beyaz} />
      ) : null}
    </Pressable>
  );
}

function Sonuc({
  cevaplar,
  sorular,
  onTekrar,
  onBitir,
}: {
  cevaplar: Cevap[];
  sorular: QuizSoru[];
  onTekrar: () => void;
  onBitir: () => void;
}) {
  const { dogru, toplam, yuzde } = puanla(cevaplar, sorular);
  return (
    <View style={styles.kolon}>
      <EmptyState
        ikon="trophy-outline"
        ikonRenk="altin"
        baslik={`Skorun: ${dogru}/${toplam}`}
        aciklama={`%${yuzde} doğru`}
        buton={{ etiket: 'Tekrar dene', onPress: onTekrar }}
        ikincilButon={{ etiket: 'Bitir', onPress: onBitir }}
      />
    </View>
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
    gap: Spacing.three,
  },
  track: {
    height: 8,
    borderRadius: 4,
    backgroundColor: Palette.kenarlik,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: Palette.lacivert,
  },
  soruKart: {
    backgroundColor: Palette.kartKremi,
    borderColor: Palette.kenarlik,
    borderWidth: 1,
    borderRadius: Radius.m,
    padding: Spacing.four,
  },
  secenekler: {
    gap: Spacing.two,
  },
  secenek: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
    borderColor: Palette.kenarlik,
    borderWidth: 1,
    borderRadius: Radius.m,
    padding: Spacing.three,
  },
  secenekSoluk: {
    opacity: 0.5,
  },
  secenekMetin: {
    flex: 1,
  },
  altBlok: {
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.three,
  },
  sonraki: {
    backgroundColor: Palette.lacivert,
    borderRadius: Radius.m,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  sonrakiPasif: {
    opacity: 0.4,
  },
  pressed: {
    opacity: 0.85,
  },
});
