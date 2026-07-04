/**
 * ZOR DETAY görüntüleyici — salt görüntüleme. Bir kanunun {klasor}_zor_{n} görsellerini
 * yatay kaydırılan tam kartlar olarak gösterir. Öğrendim/zor YOK, SRS YOK, quiz YOK, zayıf
 * mevzi bağı YOK. Görsele dokununca tam-ekran pinch-zoom (mevcut GorselZoom).
 * Görsel yüklenmesi (indirilmiş-şifreli / uzak-imzalı / gömülü) StudyCard ile aynı boru hattı.
 */
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';

import { GorselZoom } from '@/components/card-flow/gorsel-zoom';
import { AppText } from '@/components/ui/app-text';
import { Screen } from '@/components/ui/screen';
import { CardFlowMaxWidth, Palette, Radius, Spacing } from '@/constants/theme';
import { KART_ZOR_ANAHTARLARI } from '../assets/kart-gorselleri';
import { LAW_KLASOR } from '@/db/seed';
import { useImzaliTazele } from '@/hooks/use-imzali-tazele';
import { cozHazir, gorselCoz } from '@/lib/gorsel-coz';
import { gorselBekliyorMu, gorselKaynak, indirilmisGorsel } from '@/lib/gorsel-kaynak';

/** {klasor}_zor_{n} anahtarlarını n'e göre SAYISAL sırala (string sort _10'u _2'den öne alırdı). */
function zorAnahtarlari(lawId: number): string[] {
  const klasor = LAW_KLASOR[lawId];
  if (!klasor) return [];
  const on = `${klasor}_zor_`;
  return KART_ZOR_ANAHTARLARI.filter((k) => k.startsWith(on)).sort((a, b) => {
    const na = Number(a.slice(on.length).split('_')[0]);
    const nb = Number(b.slice(on.length).split('_')[0]);
    return (Number.isFinite(na) ? na : 0) - (Number.isFinite(nb) ? nb : 0);
  });
}

export default function ZorDetayScreen() {
  const router = useRouter();
  const { lawId, ad } = useLocalSearchParams<{ lawId?: string; ad?: string }>();
  const { width } = useWindowDimensions();
  const [aktif, setAktif] = useState(0);

  const anahtarlar = useMemo(() => zorAnahtarlari(Number(lawId)), [lawId]);
  const sayfaGenislik = Math.min(width, CardFlowMaxWidth + Spacing.four * 2);

  if (anahtarlar.length === 0) {
    return (
      <Screen title={ad || 'Zor Detaylar'} onGeri={() => router.back()}>
        <View style={styles.bos}>
          <MaterialCommunityIcons name="lightbulb-on-outline" size={44} color={Palette.altinKoyu} />
          <AppText variant="baslik" bold color="lacivert" style={styles.ortali}>
            Zor detay kartları hazırlanıyor
          </AppText>
          <AppText variant="kucuk" color="solukMetin" style={styles.ortali}>
            Bu kanunun kritik ayrıntı kartları henüz eklenmedi. Yakında burada olacak — o zamana
            kadar Görsel Konu Anlatımı'ndan çalışabilirsin.
          </AppText>
        </View>
      </Screen>
    );
  }

  return (
    <Screen title={ad || 'Zor Detaylar'} onGeri={() => router.back()}>
      <AppText variant="kucuk" color="solukMetin" style={styles.ust}>
        Kritik ayrıntılar — kaydırarak gez, dokununca büyüt.
      </AppText>

      <FlatList
        data={anahtarlar}
        keyExtractor={(k) => k}
        horizontal
        // pagingEnabled ÇERÇEVE genişliğine snap eder; kart genişliği (sayfaGenislik) çerçeveden
        // dar olabildiğinden (geniş ekran) snapToInterval ile KART genişliğine snap ediyoruz →
        // sayfalar hizalı + "N/M" göstergesi doğru.
        snapToInterval={sayfaGenislik}
        snapToAlignment="start"
        disableIntervalMomentum
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) =>
          setAktif(Math.round(e.nativeEvent.contentOffset.x / sayfaGenislik))
        }
        getItemLayout={(_, i) => ({ length: sayfaGenislik, offset: sayfaGenislik * i, index: i })}
        renderItem={({ item }) => (
          <View style={[styles.sayfa, { width: sayfaGenislik }]}>
            <ZorGorsel anahtar={item} />
          </View>
        )}
      />

      <View style={styles.gosterge}>
        <AppText variant="kucuk" color="solukMetin" bold>
          {aktif + 1} / {anahtarlar.length}
        </AppText>
      </View>
    </Screen>
  );
}

/** Tek bir zor-detay görseli — şifreli indirilmişse çözer, dokununca zoom açar. */
function ZorGorsel({ anahtar }: { anahtar: string }) {
  useImzaliTazele();
  const sifreliYol = indirilmisGorsel(anahtar);
  const [cozulmus, setCozulmus] = useState<string | null>(() =>
    sifreliYol ? (cozHazir(sifreliYol) ?? null) : null,
  );
  useEffect(() => {
    if (!sifreliYol) return;
    const hazir = cozHazir(sifreliYol);
    if (hazir) {
      setCozulmus(hazir);
      return;
    }
    setCozulmus(null);
    let iptal = false;
    gorselCoz(sifreliYol)
      .then((d) => !iptal && setCozulmus(d))
      .catch(() => {});
    return () => {
      iptal = true;
    };
  }, [sifreliYol]);

  const gorsel = sifreliYol ? (cozulmus ? { uri: cozulmus } : undefined) : gorselKaynak(anahtar);
  const [zoomAcik, setZoomAcik] = useState(false);

  if ((sifreliYol && !cozulmus) || gorselBekliyorMu(anahtar)) {
    return (
      <View style={[styles.kart, styles.bekle]}>
        <ActivityIndicator size="large" color={Palette.altinKoyu} />
        <AppText variant="kucuk" color="solukMetin" style={styles.ortali}>
          Görsel hazırlanıyor… 🔒
        </AppText>
      </View>
    );
  }

  if (gorsel === undefined) {
    return (
      <View style={[styles.kart, styles.bekle]}>
        <MaterialCommunityIcons name="image-off-outline" size={36} color={Palette.solukMetin} />
        <AppText variant="kucuk" color="solukMetin">
          Görsel yüklenemedi
        </AppText>
      </View>
    );
  }

  return (
    <>
      <Pressable style={styles.kart} onPress={() => setZoomAcik(true)}>
        <Image source={gorsel} style={styles.gorsel} contentFit="contain" cachePolicy="memory-disk" transition={150} />
      </Pressable>
      <GorselZoom gorsel={gorsel} gorunur={zoomAcik} onKapat={() => setZoomAcik(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  ust: {
    marginTop: Spacing.one,
    marginBottom: Spacing.two,
    textAlign: 'center',
  },
  sayfa: {
    paddingHorizontal: Spacing.two,
    justifyContent: 'center',
  },
  kart: {
    width: '100%',
    aspectRatio: 3 / 4,
    backgroundColor: Palette.kartKremi,
    borderColor: Palette.kenarlik,
    borderWidth: 1,
    borderRadius: Radius.m,
    overflow: 'hidden',
  },
  gorsel: {
    width: '100%',
    height: '100%',
    backgroundColor: Palette.kremZemin,
  },
  bekle: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    padding: Spacing.four,
  },
  gosterge: {
    alignItems: 'center',
    paddingVertical: Spacing.two,
  },
  bos: {
    alignItems: 'center',
    gap: Spacing.three,
    paddingTop: Spacing.six,
    paddingHorizontal: Spacing.three,
  },
  ortali: {
    textAlign: 'center',
  },
});
