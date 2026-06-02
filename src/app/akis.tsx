import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AudioBar } from '@/components/card-flow/audio-bar';
import { StudyCard } from '@/components/card-flow/study-card';
import { AppText } from '@/components/ui/app-text';
import { CardFlowMaxWidth, Palette, Radius, Spacing } from '@/constants/theme';
import { getDailyQueue, recordReview } from '@/db/database';
import type { QueueCard } from '@/lib/queue';
import type { SrsCevap } from '@/lib/srs';

type Cozulen = { tekrar: number; yeni: number };

export default function AkisScreen() {
  const router = useRouter();
  const [queue, setQueue] = useState<QueueCard[] | null>(null);
  const [index, setIndex] = useState(0);
  const [cozulen, setCozulen] = useState<Cozulen>({ tekrar: 0, yeni: 0 });

  useEffect(() => {
    void getDailyQueue().then(setQueue);
  }, []);

  async function cevapla(cevap: SrsCevap) {
    if (!queue) return;
    const card = queue[index];
    await recordReview(card.id, card.kutu, cevap);
    setCozulen((c) => (card.yeni ? { ...c, yeni: c.yeni + 1 } : { ...c, tekrar: c.tekrar + 1 }));
    setIndex((i) => i + 1);
  }

  const bitti = queue !== null && index >= queue.length;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      {/* Üst krom: kapat + ilerleme */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <MaterialCommunityIcons name="close" size={26} color={Palette.beyaz} />
        </Pressable>
        {queue && !bitti ? (
          <AppText variant="govde" color="beyaz" bold>
            {index + 1} / {queue.length}
          </AppText>
        ) : (
          <View />
        )}
        <View style={styles.headerSpacer} />
      </View>

      {!queue ? (
        <View style={styles.center}>
          <ActivityIndicator color={Palette.lacivert} />
        </View>
      ) : bitti ? (
        <View style={styles.kolon}>
          <Bitti cozulen={cozulen} bosBaslangic={queue.length === 0} onClose={() => router.back()} />
        </View>
      ) : (
        <View style={styles.kolon}>
          {/* Üst blok kaydırılabilir; kart ne kadar uzun olursa olsun butonlar pinli kalır */}
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${((index + 1) / queue.length) * 100}%` }]} />
            </View>

            <StudyCard card={queue[index]} />
            <AudioBar />
          </ScrollView>

          {/* Cevap butonları — ScrollView'ın dışında, kolonun altına sabit */}
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

function Bitti({
  cozulen,
  bosBaslangic,
  onClose,
}: {
  cozulen: Cozulen;
  bosBaslangic: boolean;
  onClose: () => void;
}) {
  return (
    <View style={styles.center}>
      <MaterialCommunityIcons name="check-decagram" size={64} color={Palette.yesil} />
      <AppText variant="baslik" bold>
        Bugünlük bitti
      </AppText>
      <AppText variant="govde" color="solukMetin">
        {bosBaslangic
          ? 'Bugün için vakti gelmiş kart yok.'
          : `Bugün ${cozulen.tekrar} tekrar · ${cozulen.yeni} yeni kart çalıştın.`}
      </AppText>
      <Pressable style={({ pressed }) => [styles.restart, pressed && styles.pressed]} onPress={onClose}>
        <AppText variant="govde" color="beyaz" bold>
          Karargah'a dön
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
  // Ortak "telefon kolonu": web'de ortalanır, dar ekranda tam en.
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
  butonSatir: {
    flexDirection: 'row',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.two,
    paddingBottom: Spacing.three,
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
    padding: Spacing.four,
  },
  restart: {
    backgroundColor: Palette.lacivert,
    borderRadius: Radius.m,
    paddingHorizontal: Spacing.five,
    paddingVertical: Spacing.three,
  },
});
