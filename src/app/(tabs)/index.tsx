import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Screen } from '@/components/ui/screen';
import { Palette, Radius, Spacing } from '@/constants/theme';
import { getCardCount, getDailyQueue, getStudyCards, getStudyDays } from '@/db/database';
import type { QueueCard } from '@/lib/queue';
import { bugunISO } from '@/lib/srs';
import { hesaplaIstatistik, hesaplaStreak } from '@/lib/stats';

export default function KarargahScreen() {
  const router = useRouter();
  const [queue, setQueue] = useState<QueueCard[] | null>(null);
  const [hazirlik, setHazirlik] = useState<number | null>(null);
  const [streak, setStreak] = useState<number | null>(null);

  // Ekrana her dönüldüğünde (akıştan sonra) kuyruğu + hazırlık % + nöbet serisini tazele.
  useFocusEffect(
    useCallback(() => {
      void getDailyQueue().then(setQueue);
      void Promise.all([getStudyCards(), getCardCount()]).then(([studied, toplam]) =>
        setHazirlik(hesaplaIstatistik(studied, toplam).hazirlikYuzde),
      );
      void getStudyDays().then((gunler) => setStreak(hesaplaStreak(gunler, bugunISO())));
    }, []),
  );

  const tekrarSayisi = queue?.filter((c) => !c.yeni).length ?? 0;
  const yeniSayisi = queue?.filter((c) => c.yeni).length ?? 0;
  const bos = queue !== null && queue.length === 0;

  return (
    <Screen title="Karargah">
      {/* Devam Et — kuyruk doluysa akışa götürür; boşsa "bugünlük bitti" */}
      {bos ? (
        <View style={[styles.devamEt, styles.devamEtBitti]}>
          <View style={styles.devamEtMetin}>
            <AppText variant="etiket" color="altin" bold>
              BUGÜNLÜK BİTTİ
            </AppText>
            <AppText variant="altBaslik" color="beyaz" bold>
              Tebrikler
            </AppText>
            <AppText variant="kucuk" color="kenarlik">
              Yarın yeni tekrarlar gelecek
            </AppText>
          </View>
          <MaterialCommunityIcons name="check-decagram" size={48} color={Palette.altin} />
        </View>
      ) : (
        <Pressable
          style={({ pressed }) => [styles.devamEt, pressed && styles.pressed]}
          onPress={() => router.push('/akis')}>
          <View style={styles.devamEtMetin}>
            <AppText variant="etiket" color="altin" bold>
              DEVAM ET
            </AppText>
            <AppText variant="altBaslik" color="beyaz" bold>
              Kart Akışı
            </AppText>
            <AppText variant="kucuk" color="kenarlik">
              {tekrarSayisi + yeniSayisi > 0
                ? `${tekrarSayisi + yeniSayisi} kart seni bekliyor`
                : 'Kaldığın yerden çalış'}
            </AppText>
          </View>
          <MaterialCommunityIcons name="play-circle" size={48} color={Palette.altin} />
        </Pressable>
      )}

      {/* Bugünün Görevi — sayılar kuyruktan türetilir */}
      <Card>
        <AppText variant="etiket" color="solukMetin" bold>
          BUGÜNÜN GÖREVİ
        </AppText>
        <View style={styles.gorevSatir}>
          <Gorev sayi={tekrarSayisi} etiket="Tekrar" />
          <Gorev sayi={yeniSayisi} etiket="Yeni" />
          <Gorev sayi={1} etiket="Mini Tatbikat" />
        </View>
      </Card>

      {/* Metrik kartları */}
      <View style={styles.metrikSatir}>
        <Metrik deger={hazirlik === null ? '—' : `%${hazirlik}`} etiket="Hazırlık" />
        {/* Nöbet serisi: kesintisiz çalışılan gün. 0 (veya kırık seri) → "—". */}
        <Metrik deger={streak === null || streak === 0 ? '—' : `${streak}`} etiket="Nöbet serisi" />
      </View>

      {/* Günün Maddesi */}
      <Card>
        <AppText variant="etiket" color="solukMetin" bold>
          GÜNÜN MADDESİ
        </AppText>
        <AppText variant="altBaslik" bold>
          TCK m.86 — Kasten Yaralama
        </AppText>
        <AppText variant="kucuk" color="solukMetin">
          Yer tutucu özet metni.
        </AppText>
      </Card>
    </Screen>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

function Gorev({ sayi, etiket }: { sayi: number; etiket: string }) {
  return (
    <View style={styles.gorev}>
      <AppText variant="baslik" bold>
        {sayi}
      </AppText>
      <AppText variant="etiket" color="solukMetin">
        {etiket}
      </AppText>
    </View>
  );
}

function Metrik({ deger, etiket }: { deger: string; etiket: string }) {
  return (
    <View style={[styles.card, styles.metrik]}>
      <AppText variant="dev" bold>
        {deger}
      </AppText>
      <AppText variant="kucuk" color="solukMetin">
        {etiket}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.85,
  },
  devamEt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Palette.lacivert,
    borderRadius: Radius.l,
    padding: Spacing.four,
  },
  devamEtBitti: {
    opacity: 0.9,
  },
  devamEtMetin: {
    gap: Spacing.half,
  },
  card: {
    backgroundColor: Palette.kartKremi,
    borderColor: Palette.kenarlik,
    borderWidth: 1,
    borderRadius: Radius.m,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  gorevSatir: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gorev: {
    alignItems: 'center',
    flex: 1,
  },
  metrikSatir: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  metrik: {
    flex: 1,
    alignItems: 'center',
  },
});
