import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Palette } from '@/constants/theme';
import { duyurulariGetir, okunmamisVarMi } from '@/lib/duyuru';
import { useUyelik } from '@/lib/uyelik-context';

/**
 * Karargah başlığındaki duyuru ikonu (eski çan yerine). Okunmamış duyuru varsa
 * sağ üstte kırmızı nokta. Dokununca /duyurular açılır (orada okundu işaretlenir →
 * ekrana geri dönünce useFocusEffect nokta yok olur).
 */
export function DuyuruIkonu({ boyut = 22 }: { boyut?: number }) {
  const router = useRouter();
  const { premium } = useUyelik();
  const [okunmamis, setOkunmamis] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let iptal = false;
      void (async () => {
        const liste = await duyurulariGetir(premium);
        if (!iptal) setOkunmamis(await okunmamisVarMi(liste));
      })();
      return () => {
        iptal = true;
      };
    }, [premium]),
  );

  return (
    <Pressable
      onPress={() => router.push('/duyurular')}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel="Duyurular"
    >
      <MaterialCommunityIcons name="bullhorn-outline" size={boyut} color={Palette.altin} />
      {okunmamis ? <View style={styles.nokta} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  nokta: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: Palette.kirmizi,
    borderWidth: 1,
    borderColor: Palette.lacivert,
  },
});
