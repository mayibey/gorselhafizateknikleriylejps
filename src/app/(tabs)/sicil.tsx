import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Screen } from '@/components/ui/screen';
import { Palette, Radius, Spacing } from '@/constants/theme';
import { getBranches, getCardCount, getStudyCards } from '@/db/database';
import type { Branch } from '@/db/schema';
import { useBrans } from '@/lib/brans-context';
import { hesaplaIstatistik, type Istatistik, type KutuDagilimi, MAKS_KUTU, OGRENILDI_KUTU } from '@/lib/stats';

export default function SicilScreen() {
  const router = useRouter();
  const { brans } = useBrans();
  const [branches, setBranches] = useState<Branch[] | null>(null);
  const [ist, setIst] = useState<Istatistik | null>(null);

  // Odağa her gelindiğinde (çalışmadan dönünce) branş + istatistikleri tazele.
  useFocusEffect(
    useCallback(() => {
      void getBranches().then(setBranches);
      void Promise.all([getStudyCards(), getCardCount()]).then(([studied, toplam]) =>
        setIst(hesaplaIstatistik(studied, toplam)),
      );
    }, []),
  );

  const bransAd = branches?.find((b) => b.slug === brans)?.ad ?? '—';

  return (
    <Screen title="Sicil">
      <Pressable
        style={({ pressed }) => [styles.bransKart, pressed && styles.pressed]}
        onPress={() => router.push('/brans-sec')}>
        <View style={styles.bransMetin}>
          <AppText variant="etiket" color="solukMetin" bold>
            BRANŞIN
          </AppText>
          <AppText variant="altBaslik" bold>
            {bransAd}
          </AppText>
        </View>
        <View style={styles.degistir}>
          <AppText variant="kucuk" color="beyaz" bold>
            Değiştir
          </AppText>
          <MaterialCommunityIcons name="swap-horizontal" size={18} color={Palette.beyaz} />
        </View>
      </Pressable>

      {ist === null ? (
        <AppText variant="kucuk" color="solukMetin">
          İstatistikler yükleniyor…
        </AppText>
      ) : (
        <>
          {/* İlerleme özeti */}
          <View style={styles.istatistikKart}>
            <AppText variant="etiket" color="solukMetin" bold>
              İLERLEME
            </AppText>
            <View style={styles.statSatir}>
              <Stat deger={`${ist.calisilanKart}/${ist.toplamKart}`} etiket="Çalışılan" />
              <Stat deger={`${ist.ogrenilenKart}`} etiket="Öğrenilen" />
              <Stat deger={`%${ist.hazirlikYuzde}`} etiket="Hazırlık" />
            </View>
          </View>

          {/* Kutu dağılımı (Leitner) */}
          <View style={styles.istatistikKart}>
            <AppText variant="etiket" color="solukMetin" bold>
              KUTU DAĞILIMI
            </AppText>
            <KutuGrafik dagilim={ist.kutuDagilimi} />
            <AppText variant="etiket" color="solukMetin">
              Kutu {OGRENILDI_KUTU}+ = öğrenildi
            </AppText>
          </View>
        </>
      )}
    </Screen>
  );
}

function Stat({ deger, etiket }: { deger: string; etiket: string }) {
  return (
    <View style={styles.stat}>
      <AppText variant="baslik" bold>
        {deger}
      </AppText>
      <AppText variant="etiket" color="solukMetin">
        {etiket}
      </AppText>
    </View>
  );
}

/** Kutu 1..6 için basit dikey çubuk grafiği. Öğrenilen kutular (≥OGRENILDI_KUTU) yeşil. */
function KutuGrafik({ dagilim }: { dagilim: KutuDagilimi }) {
  const kutular = Array.from({ length: MAKS_KUTU }, (_, i) => i + 1);
  const maks = Math.max(1, ...kutular.map((k) => dagilim[k] ?? 0));

  return (
    <View style={styles.kutuSatir}>
      {kutular.map((k) => {
        const adet = dagilim[k] ?? 0;
        const yukseklik = adet === 0 ? 4 : Math.round((adet / maks) * 52) + 12;
        const ogrenildi = k >= OGRENILDI_KUTU;
        return (
          <View key={k} style={styles.kutuSutun}>
            <AppText variant="etiket" color="solukMetin">
              {adet}
            </AppText>
            <View style={styles.kutuRay}>
              <View
                style={[
                  styles.kutuBar,
                  {
                    height: yukseklik,
                    backgroundColor:
                      adet === 0 ? Palette.kenarlik : ogrenildi ? Palette.yesil : Palette.amber,
                  },
                ]}
              />
            </View>
            <AppText variant="etiket" color={ogrenildi ? 'yesil' : 'solukMetin'} bold>
              {k}
            </AppText>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bransKart: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Palette.kartKremi,
    borderColor: Palette.kenarlik,
    borderWidth: 1,
    borderRadius: Radius.m,
    padding: Spacing.three,
  },
  bransMetin: {
    gap: Spacing.half,
  },
  degistir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    backgroundColor: Palette.lacivert,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.s,
  },
  pressed: {
    opacity: 0.85,
  },
  istatistikKart: {
    backgroundColor: Palette.kartKremi,
    borderColor: Palette.kenarlik,
    borderWidth: 1,
    borderRadius: Radius.m,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  statSatir: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stat: {
    alignItems: 'center',
    flex: 1,
  },
  kutuSatir: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  kutuSutun: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.one,
  },
  kutuRay: {
    height: 64,
    width: '60%',
    justifyContent: 'flex-end',
  },
  kutuBar: {
    width: '100%',
    borderRadius: Radius.s,
  },
});
