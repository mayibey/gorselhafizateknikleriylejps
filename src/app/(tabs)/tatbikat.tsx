import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { EmptyState } from '@/components/ui/empty-state';
import { Loading } from '@/components/ui/loading';
import { Screen } from '@/components/ui/screen';
import { Palette, Radius, Spacing } from '@/constants/theme';
import { getLaws } from '@/db/database';
import type { LawWithCount } from '@/db/schema';
import { useBrans } from '@/lib/brans-context';
import { MIN_HAVUZ } from '@/lib/quiz';

export default function TatbikatScreen() {
  const router = useRouter();
  const { brans } = useBrans();
  const [laws, setLaws] = useState<LawWithCount[] | null>(null);
  const [hata, setHata] = useState(false);

  const yukle = useCallback(() => {
    if (!brans) return;
    setHata(false);
    void getLaws(brans)
      .then(setLaws)
      .catch(() => setHata(true));
  }, [brans]);

  useFocusEffect(yukle);

  const musterek = laws?.filter((l) => l.blok === 'müşterek') ?? [];
  const bransKanunlari = laws?.filter((l) => l.blok === 'branş') ?? [];

  function quizeGit(law: LawWithCount) {
    router.push({ pathname: '/quiz', params: { lawId: String(law.id) } });
  }

  return (
    <Screen title="Tatbikat">
      {hata ? (
        <EmptyState
          ikon="alert-circle-outline"
          ikonRenk="kirmizi"
          baslik="Yüklenemedi"
          aciklama="Kanun listesi yüklenemedi."
          buton={{ etiket: 'Tekrar dene', onPress: yukle }}
        />
      ) : laws === null ? (
        <Loading metin="Yükleniyor…" />
      ) : laws.length === 0 ? (
        <EmptyState ikon="book-outline" baslik="Bu branşta kanun yok" />
      ) : (
        <>
          <AppText variant="kucuk" color="solukMetin">
            Bir kanun seç, o kanunun kartlarından deneme sınavı çöz.
          </AppText>
          <Bolum baslik="MÜŞTEREK" laws={musterek} onPress={quizeGit} />
          <Bolum baslik="BRANŞ" laws={bransKanunlari} onPress={quizeGit} />
        </>
      )}
    </Screen>
  );
}

function Bolum({
  baslik,
  laws,
  onPress,
}: {
  baslik: string;
  laws: LawWithCount[];
  onPress: (law: LawWithCount) => void;
}) {
  return (
    <View style={styles.bolum}>
      <AppText variant="etiket" color="solukMetin" bold>
        {baslik}
      </AppText>
      {laws.length === 0 ? (
        <AppText variant="kucuk" color="solukMetin">
          Bu bölümde kanun yok.
        </AppText>
      ) : (
        laws.map((law) => <KanunSatir key={law.id} law={law} onPress={onPress} />)
      )}
    </View>
  );
}

function KanunSatir({ law, onPress }: { law: LawWithCount; onPress: (law: LawWithCount) => void }) {
  const yeterli = law.kartSayisi >= MIN_HAVUZ;
  return (
    <Pressable
      disabled={!yeterli}
      style={({ pressed }) => [
        styles.satir,
        !yeterli && styles.satirPasif,
        pressed && yeterli && styles.pressed,
      ]}
      onPress={() => onPress(law)}>
      <AppText variant="govde" bold style={styles.satirAd}>
        {law.ad}
      </AppText>
      <View style={[styles.rozet, !yeterli && styles.rozetPasif]}>
        <AppText variant="etiket" color={yeterli ? 'beyaz' : 'solukMetin'} bold>
          {yeterli ? `${law.kartSayisi} kart` : 'yetersiz'}
        </AppText>
      </View>
      {yeterli ? (
        <MaterialCommunityIcons name="play-circle" size={22} color={Palette.lacivert} />
      ) : (
        <MaterialCommunityIcons name="lock-outline" size={20} color={Palette.solukMetin} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bolum: {
    gap: Spacing.two,
  },
  satir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: Palette.kartKremi,
    borderColor: Palette.kenarlik,
    borderWidth: 1,
    borderRadius: Radius.m,
    padding: Spacing.three,
  },
  satirPasif: {
    opacity: 0.55,
  },
  satirAd: {
    flex: 1,
  },
  rozet: {
    backgroundColor: Palette.lacivert,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Radius.s,
  },
  rozetPasif: {
    backgroundColor: Palette.kenarlik,
  },
  pressed: {
    opacity: 0.7,
  },
});
