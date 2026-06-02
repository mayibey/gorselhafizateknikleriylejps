import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AudioBar } from '@/components/card-flow/audio-bar';
import { StudyCard } from '@/components/card-flow/study-card';
import { AppText } from '@/components/ui/app-text';
import { Palette, Radius, Spacing } from '@/constants/theme';
import { getStudyCards, recordReview } from '@/db/database';
import type { CardWithSrs } from '@/db/schema';
import type { SrsCevap } from '@/lib/srs';

export default function AkisScreen() {
  const router = useRouter();
  const [cards, setCards] = useState<CardWithSrs[] | null>(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    void getStudyCards().then(setCards);
  }, []);

  async function cevapla(cevap: SrsCevap) {
    if (!cards) return;
    const card = cards[index];
    await recordReview(card.id, card.kutu, cevap);
    setIndex((i) => i + 1);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      {/* Üst krom: kapat + ilerleme */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <MaterialCommunityIcons name="close" size={26} color={Palette.beyaz} />
        </Pressable>
        {cards && index < cards.length ? (
          <AppText variant="govde" color="beyaz" bold>
            {index + 1} / {cards.length}
          </AppText>
        ) : (
          <View />
        )}
        <View style={styles.headerSpacer} />
      </View>

      {!cards ? (
        <View style={styles.center}>
          <ActivityIndicator color={Palette.lacivert} />
        </View>
      ) : index >= cards.length ? (
        <Bitti
          onRestart={() => {
            void getStudyCards().then(setCards);
            setIndex(0);
          }}
        />
      ) : (
        <View style={styles.body}>
          {/* İlerleme çubuğu */}
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${((index + 1) / cards.length) * 100}%` }]} />
          </View>

          <StudyCard card={cards[index]} />
          <AudioBar />

          <View style={styles.spacer} />

          {/* Cevap butonları */}
          <View style={styles.butonSatir}>
            <Buton renk={Palette.yesil} etiket="Biliyorum" onPress={() => void cevapla('biliyorum')} />
            <Buton renk={Palette.amber} etiket="Tekrar" onPress={() => void cevapla('tekrar')} />
            <Buton renk={Palette.kirmizi} etiket="Zor" onPress={() => void cevapla('zor')} />
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

function Buton({ renk, etiket, onPress }: { renk: string; etiket: string; onPress: () => void }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.buton, { backgroundColor: renk }, pressed && styles.pressed]}
      onPress={onPress}>
      <AppText variant="govde" color="beyaz" bold>
        {etiket}
      </AppText>
    </Pressable>
  );
}

function Bitti({ onRestart }: { onRestart: () => void }) {
  return (
    <View style={styles.center}>
      <MaterialCommunityIcons name="check-decagram" size={64} color={Palette.yesil} />
      <AppText variant="baslik" bold>
        Tur tamamlandı
      </AppText>
      <Pressable
        style={({ pressed }) => [styles.restart, pressed && styles.pressed]}
        onPress={onRestart}>
        <AppText variant="govde" color="beyaz" bold>
          Baştan başla
        </AppText>
      </Pressable>
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
  body: {
    flex: 1,
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
  spacer: {
    flex: 1,
  },
  butonSatir: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  buton: {
    flex: 1,
    borderRadius: Radius.m,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.85,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
  },
  restart: {
    backgroundColor: Palette.lacivert,
    borderRadius: Radius.m,
    paddingHorizontal: Spacing.five,
    paddingVertical: Spacing.three,
  },
});
