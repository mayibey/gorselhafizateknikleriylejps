/**
 * KIŞLA PANOSU ŞERİDİ (başkan, 10 Ağu — iki emirle şekillendi):
 * 1) Köşe rozeti "amatör" → başlık altında şerit.
 * 2) "Duyurular bölümü HEP kalsın, yeni duyuru gelirse ona göre belli olsun."
 * Yani şerit HER ZAMAN görünür: okunmamış YOKKEN sade soluk "Duyurular" satırı;
 * okunmamış VARKEN altın dolgulu "📌 Yeni duyuru — <başlığı>" hâline döner.
 * Dokununca /duyurular; okununca sade hâle geri döner.
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
          // En yeni duyurunun başlığı şeride yazılır (sıralamaya güvenme, kendin seç).
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

  return (
    <Pressable
      onPress={() => router.push('/duyurular')}
      style={({ pressed }) => [st.serit, yeni ? st.seritYeni : null, pressed && st.basili]}
      accessibilityRole="button"
      accessibilityLabel={yeni ? 'Yeni duyuruyu oku' : 'Duyurular'}>
      <MaterialCommunityIcons
        name={yeni ? 'pin' : 'bullhorn-outline'}
        size={15}
        color={yeni ? Palette.altinKoyu : Palette.solukMetin}
      />
      {yeni ? (
        <>
          <AppText variant="etiket" bold color="altinMetin">
            Yeni duyuru
          </AppText>
          <AppText variant="etiket" color="anaMetin" numberOfLines={1} style={st.baslik}>
            — {yeni.baslik}
          </AppText>
        </>
      ) : (
        <AppText variant="etiket" bold color="solukMetin" style={st.baslik}>
          Duyurular
        </AppText>
      )}
      <MaterialCommunityIcons name="chevron-right" size={17} color={Palette.solukMetin} />
    </Pressable>
  );
}

const st = StyleSheet.create({
  // Sade hâl: krem satır (duyuru yok) — hep görünür.
  serit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.one,
    backgroundColor: Palette.kartKremi,
    borderColor: Palette.kenarlik,
    borderWidth: 1,
    borderRadius: Radius.m,
    paddingHorizontal: Spacing.two,
    paddingVertical: Spacing.two,
  },
  // Yeni duyuru hâli: altın dolgu + altın kenarlık.
  seritYeni: {
    backgroundColor: Palette.altinSolukYuzey,
    borderColor: Palette.altin,
  },
  basili: { opacity: 0.85 },
  baslik: { flexShrink: 1, flex: 1 },
});
