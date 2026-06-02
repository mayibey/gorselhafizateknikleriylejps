import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Screen } from '@/components/ui/screen';
import { Palette, Radius, Spacing } from '@/constants/theme';
import { getBranches } from '@/db/database';
import type { Branch } from '@/db/schema';
import { useBrans } from '@/lib/brans-context';

export default function SicilScreen() {
  const router = useRouter();
  const { brans } = useBrans();
  const [branches, setBranches] = useState<Branch[] | null>(null);

  useEffect(() => {
    void getBranches().then(setBranches);
  }, []);

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

      <AppText variant="kucuk" color="solukMetin">
        İlerleme ve istatistikler yakında.
      </AppText>
    </Screen>
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
});
