import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { GorselZoom } from '@/components/card-flow/gorsel-zoom';
import { Watermark } from '@/components/card-flow/watermark';
import { AppText } from '@/components/ui/app-text';
import { Palette, Radius, Spacing } from '@/constants/theme';
import type { CardWithSrs } from '@/db/schema';
import { useCihazKimlik } from '@/hooks/use-cihaz-kimlik';
import { bugunISO } from '@/lib/srs';
// Üretilen registry src/assets altında; '@/assets/*' alias'ı gerçek assets/ klasörüne
// gittiği için göreli import kullanıyoruz.
import { KART_GORSELLERI } from '../../assets/kart-gorselleri';

/** Tek bir kart: görseli varsa tek kare görsel, yoksa 2x2 yer tutucu ızgara. */
export function StudyCard({ card }: { card: CardWithSrs }) {
  const gorsel = card.gorsel_yolu ? KART_GORSELLERI[card.gorsel_yolu] : undefined;
  const { kimlik } = useCihazKimlik();
  const [zoomAcik, setZoomAcik] = useState(false);
  // Forensic filigran: kimlik yüklenince render edilir (yoksa overlay yok).
  const filigran = kimlik ? <Watermark metin={`JSPS • ${kimlik} • ${bugunISO()}`} /> : null;

  // Görselli mod: kart kendi künyesini içerir → uygulama şeritleri gösterilmez.
  // Görsele dokununca tam ekran zoom overlay açılır (ses çalıyorsa kesilmez — ekran unmount olmaz).
  if (gorsel !== undefined) {
    return (
      <>
        <Pressable style={styles.card} onPress={() => setZoomAcik(true)}>
          {/* TEK TİP STANDART: sabit kare alan + cover → her kart aynı boyut, tam genişlik
              dolar (yan boşluk yok), alttaki Sesli Anlatım + Madde Metni hep sığar. Kare
              olmayan görsel merkezden kırpılır; tam hali görsele dokununca (zoom) görünür. */}
          <Image source={gorsel} style={styles.gorsel} contentFit="cover" />
          {filigran}
        </Pressable>
        <GorselZoom gorsel={gorsel} gorunur={zoomAcik} onKapat={() => setZoomAcik(false)} />
      </>
    );
  }

  // Yer tutucu mod (görselsiz kartlar için fallback).
  return (
    <View style={styles.card}>
      {/* Kırmızı başlık şeridi */}
      <View style={styles.baslikSerit}>
        <AppText variant="altBaslik" color="beyaz" bold>
          {card.baslik}
        </AppText>
      </View>

      {/* 2x2 kare panel ızgarası (gerçek karikatür sonra gelecek) */}
      <View style={styles.izgara}>
        {[0, 1, 2, 3].map((i) => (
          <View key={i} style={styles.panel}>
            <MaterialCommunityIcons name="image-outline" size={36} color={Palette.solukMetin} />
            <AppText variant="etiket" color="solukMetin">
              Panel {i + 1}
            </AppText>
          </View>
        ))}
      </View>

      {/* Lacivert künye şeridi */}
      <View style={styles.kunye}>
        <AppText variant="kucuk" color="beyaz" bold>
          {card.madde_no}
        </AppText>
        {card.blok === 'müşterek' ? (
          <View style={styles.rozet}>
            <AppText variant="etiket" color="lacivert" bold>
              Müşterek
            </AppText>
          </View>
        ) : (
          <AppText variant="etiket" color="kenarlik">
            {card.law_ad}
          </AppText>
        )}
      </View>
      {filigran}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    backgroundColor: Palette.kartKremi,
    borderColor: Palette.kenarlik,
    borderWidth: 1,
    borderRadius: Radius.m,
    overflow: 'hidden',
  },
  gorsel: {
    width: '100%',
    // Sabit kare oran → tüm kartlar tek tip; portre görseller kontrolleri aşağı itmez.
    aspectRatio: 1,
  },
  baslikSerit: {
    backgroundColor: Palette.kirmizi,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  izgara: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: Spacing.two,
    gap: Spacing.two,
  },
  panel: {
    width: '48%',
    aspectRatio: 1,
    backgroundColor: Palette.ten,
    borderRadius: Radius.s,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
  },
  kunye: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Palette.lacivert,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  rozet: {
    backgroundColor: Palette.altin,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.half,
    borderRadius: Radius.s,
  },
});
