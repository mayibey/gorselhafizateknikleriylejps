import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { EmptyState } from '@/components/ui/empty-state';
import { Loading } from '@/components/ui/loading';
import { Screen } from '@/components/ui/screen';
import { Palette, Radius, Spacing } from '@/constants/theme';
import { getBolumler, getCardsByBolum } from '@/db/database';
import type { Bolum } from '@/db/schema';
import { bolumIlerleme } from '@/lib/patika';

type BolumDugum = { bolum: Bolum; calisilan: number; toplam: number; oran: number };
const TAMAM_YESIL = '#16a34a';

export default function PatikaScreen() {
  const router = useRouter();
  const { lawId } = useLocalSearchParams<{ lawId?: string }>();
  // null = yükleniyor; bolumsuz = kanunun bölümü yok (tek düğüm).
  const [dugumler, setDugumler] = useState<BolumDugum[] | null>(null);
  const [bolumsuz, setBolumsuz] = useState(false);
  const [hata, setHata] = useState(false);

  const yukle = useCallback(() => {
    setHata(false);
    if (lawId == null || lawId === '') {
      setHata(true);
      return;
    }
    const id = Number(lawId);
    void getBolumler(id)
      .then(async (bolumler) => {
        if (bolumler.length === 0) {
          setBolumsuz(true);
          setDugumler([]);
          return;
        }
        const dugum = await Promise.all(
          bolumler.map(async (b): Promise<BolumDugum> => {
            const kartlar = await getCardsByBolum(b.id);
            return { bolum: b, ...bolumIlerleme(kartlar) };
          }),
        );
        setBolumsuz(false);
        setDugumler(dugum);
      })
      .catch(() => setHata(true));
  }, [lawId]);

  useFocusEffect(yukle);

  // "aktif" (altın vurgu) = ilk çalışılabilir ama bitmemiş madde (kartı olan, tamamlanmamış).
  // Kartı olmayan madde düğümleri (kapsam iskeleti) aktif sayılmaz.
  const aktifIndex = dugumler
    ? dugumler.findIndex((d) => d.toplam > 0 && d.calisilan < d.toplam)
    : -1;

  return (
    <Screen title="Patika" onGeri={() => router.back()}>
      {hata ? (
        <EmptyState
          ikon="alert-circle-outline"
          ikonRenk="kirmizi"
          baslik="Yüklenemedi"
          aciklama="Patika yüklenemedi."
          buton={{ etiket: 'Tekrar dene', onPress: yukle }}
        />
      ) : dugumler === null ? (
        <Loading metin="Yükleniyor…" />
      ) : bolumsuz ? (
        // Bölümü olmayan kanun (TCK gibi) → tek varsayılan düğüm → düz akış.
        <TekDugum onPress={() => router.push({ pathname: '/akis', params: { lawId: String(lawId) } })} />
      ) : (
        <View style={styles.patika}>
          {/* Soluk merkez omurga (düğümler bunun üstünde sola-sağa çıkar) */}
          <View style={styles.omurga} pointerEvents="none" />
          {dugumler.map((d, i) => (
            <BolumDugumu
              key={d.bolum.id}
              dugum={d}
              index={i}
              aktif={i === aktifIndex}
              onPress={() =>
                router.push({ pathname: '/akis', params: { bolumId: String(d.bolum.id) } })
              }
            />
          ))}
        </View>
      )}
    </Screen>
  );
}

function TekDugum({ onPress }: { onPress: () => void }) {
  return (
    <View style={styles.tekSatir}>
      <Pressable
        style={({ pressed }) => [styles.dugumKutu, pressed && styles.pressed]}
        onPress={onPress}>
        <View style={[styles.daire, styles.daireBaslanmis]}>
          <MaterialCommunityIcons name="cards-outline" size={28} color={Palette.beyaz} />
        </View>
        <AppText variant="kucuk" bold style={styles.dugumAd}>
          Tüm Kartlar
        </AppText>
        <AppText variant="etiket" color="solukMetin">
          Bu kanunu çalış
        </AppText>
      </Pressable>
    </View>
  );
}

function BolumDugumu({
  dugum,
  index,
  aktif,
  onPress,
}: {
  dugum: BolumDugum;
  index: number;
  aktif: boolean;
  onPress: () => void;
}) {
  const { bolum, calisilan, toplam } = dugum;
  const kartVar = toplam > 0; // bu maddeye bağlı kart var mı (yoksa kapsam iskeleti)
  const tamam = kartVar && calisilan === toplam;
  // Daire içi kısa etiket: "Madde 5"→"5", "Ek Madde 7"→"Ek 7", "Geçici Madde 2"→"Geç.2".
  const kisa = bolum.ad
    .replace('Geçici Madde ', 'Geç.')
    .replace('Ek Madde ', 'Ek ')
    .replace('Madde ', '');

  return (
    <View style={[styles.dugumSatir, { alignSelf: index % 2 === 0 ? 'flex-start' : 'flex-end' }]}>
      <Pressable style={({ pressed }) => [styles.dugumKutu, pressed && styles.pressed]} onPress={onPress}>
        <View
          style={[
            styles.daire,
            tamam ? styles.daireTamam : kartVar ? styles.daireBaslanmis : styles.daireBos,
            aktif && styles.daireAktif,
          ]}>
          {tamam ? (
            <MaterialCommunityIcons name="check-bold" size={28} color={Palette.beyaz} />
          ) : (
            <AppText variant="kucuk" color={kartVar ? 'beyaz' : 'solukMetin'} bold>
              {kisa}
            </AppText>
          )}
        </View>
        <AppText variant="etiket" bold style={styles.dugumAd} numberOfLines={1}>
          {bolum.ad}
        </AppText>
        {kartVar ? (
          <AppText variant="etiket" color="solukMetin">
            {calisilan}/{toplam}
          </AppText>
        ) : null}
      </Pressable>
    </View>
  );
}

const NODE = 84;

const styles = StyleSheet.create({
  patika: {
    position: 'relative',
    paddingVertical: Spacing.three,
    gap: Spacing.four,
  },
  omurga: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '50%',
    width: 3,
    marginLeft: -1.5,
    backgroundColor: Palette.kenarlik,
    opacity: 0.5,
  },
  dugumSatir: {
    width: '55%',
    alignItems: 'center',
  },
  tekSatir: {
    alignSelf: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.five,
  },
  dugumKutu: {
    alignItems: 'center',
    gap: Spacing.one,
    maxWidth: 160,
  },
  pressed: {
    opacity: 0.8,
  },
  daire: {
    width: NODE,
    height: NODE,
    borderRadius: NODE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
  },
  daireTamam: {
    backgroundColor: TAMAM_YESIL,
    borderColor: TAMAM_YESIL,
  },
  daireBaslanmis: {
    backgroundColor: Palette.lacivert,
    borderColor: Palette.lacivert,
  },
  daireBos: {
    backgroundColor: Palette.kartKremi,
    borderColor: Palette.kenarlik,
  },
  daireAktif: {
    borderColor: Palette.altin,
    borderWidth: 4,
  },
  dugumAd: {
    textAlign: 'center',
  },
});
