/**
 * KIŞLA PANOSU ŞERİDİ (başkan, 10 Ağu: köşe rozeti "amatör" — bunun yerine):
 * YALNIZ okunmamış duyuru varken, başlığın altında ince altın şerit belirir ve
 * duyurunun GERÇEK başlığını gösterir ("📌 Yeni duyuru — …"). Dokununca /duyurular
 * açılır; orada görüldü işaretlenir → ekrana dönünce şerit kendiliğinden kaybolur.
 * Okunmamış yokken HİÇ yer kaplamaz. (Bayraklı görünümde kullanılır.)
 */
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Palette, Radius, Spacing } from '@/constants/theme';
import { type Duyuru, duyurulariGetir, okunmamisVarMi } from '@/lib/duyuru';
import { useUyelik } from '@/lib/uyelik-context';

export function DuyuruPanosu() {
  const router = useRouter();
  const { premium } = useUyelik();
  const [yeni, setYeni] = useState<Duyuru | null>(null);

  useFocusEffect(
    useCallback(() => {
      let iptal = false;
      void (async () => {
        const liste = await duyurulariGetir(premium);
        if (iptal) return;
        if (await okunmamisVarMi(liste)) {
          // En yeni duyurunun başlığı şeride yazılır (liste created_at azalan geliyor;
          // değilse de en yeniyi kendimiz seçiyoruz — sıralamaya güvenme).
          const enYeni = [...liste].sort(
            (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
          )[0];
          setYeni(enYeni ?? null);
        } else {
          setYeni(null);
        }
      })();
      return () => {
        iptal = true;
      };
    }, [premium]),
  );

  if (!yeni) return null;
  return (
    <Pressable
      onPress={() => router.push('/duyurular')}
      style={({ pressed }) => [st.serit, pressed && st.basili]}
      accessibilityRole="button"
      accessibilityLabel="Yeni duyuruyu oku">
      <MaterialCommunityIcons name="pin" size={15} color={Palette.altinKoyu} />
      <AppText variant="etiket" bold color="altinMetin">
        Yeni duyuru
      </AppText>
      <AppText variant="etiket" color="anaMetin" numberOfLines={1} style={st.baslik}>
        — {yeni.baslik}
      </AppText>
      <MaterialCommunityIcons name="chevron-right" size={17} color={Palette.solukMetin} />
    </Pressable>
  );
}

const st = StyleSheet.create({
  serit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    backgroundColor: Palette.altinSolukYuzey,
    borderColor: Palette.altin,
    borderWidth: 1,
    borderRadius: Radius.m,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
  },
  basili: { opacity: 0.85 },
  baslik: { flexShrink: 1, flex: 1 },
});
