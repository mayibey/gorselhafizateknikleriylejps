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
type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

const TAMAM_YESIL = '#16a34a';
/** Bölüm sırasına göre döngüsel generic ikonlar (veri değişmeden çeşitlilik). */
const BOLUM_IKONLARI: IconName[] = [
  'book-open-variant',
  'gavel',
  'shield-outline',
  'file-document-outline',
  'scale-balance',
  'clipboard-text-outline',
];

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

  // İlk tamamlanmamış düğüm = "aktif" (altın vurgu). Hepsi tamamsa -1.
  const aktifIndex = dugumler
    ? dugumler.findIndex((d) => !(d.toplam > 0 && d.calisilan === d.toplam))
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
  const { bolum, calisilan, toplam, oran } = dugum;
  const tamam = toplam > 0 && calisilan === toplam;
  const baslanmis = oran > 0 && !tamam;
  const ikon = BOLUM_IKONLARI[(bolum.sira - 1) % BOLUM_IKONLARI.length];
  const dolu = tamam || baslanmis; // ikon/numara beyaz mı soluk mu

  return (
    <View style={[styles.dugumSatir, { alignSelf: index % 2 === 0 ? 'flex-start' : 'flex-end' }]}>
      <Pressable style={({ pressed }) => [styles.dugumKutu, pressed && styles.pressed]} onPress={onPress}>
        <View
          style={[
            styles.daire,
            tamam ? styles.daireTamam : baslanmis ? styles.daireBaslanmis : styles.daireBos,
            aktif && styles.daireAktif,
          ]}>
          {tamam ? (
            <MaterialCommunityIcons name="check-bold" size={30} color={Palette.beyaz} />
          ) : (
            <>
              <MaterialCommunityIcons
                name={ikon}
                size={24}
                color={dolu ? Palette.beyaz : Palette.solukMetin}
              />
              <AppText variant="etiket" color={dolu ? 'beyaz' : 'solukMetin'} bold>
                {bolum.sira}
              </AppText>
            </>
          )}
        </View>
        <AppText variant="etiket" bold style={styles.dugumAd} numberOfLines={2}>
          {bolum.ad}
        </AppText>
        <AppText variant="etiket" color="solukMetin">
          {calisilan}/{toplam}
        </AppText>
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
