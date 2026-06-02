import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/app-text';
import { CardFlowMaxWidth, Palette, Radius, Spacing } from '@/constants/theme';
import { getBranches } from '@/db/database';
import type { Branch } from '@/db/schema';

type Props = {
  baslik: string;
  altyazi?: string;
  seciliSlug?: string | null;
  onSelect: (slug: string) => void;
};

/** Branş seçim ekranı — hem onboarding hem branş değiştirme kullanır. */
export function BransSecici({ baslik, altyazi, seciliSlug, onSelect }: Props) {
  const [branches, setBranches] = useState<Branch[] | null>(null);

  useEffect(() => {
    void getBranches().then(setBranches);
  }, []);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.kolon}>
        <View style={styles.header}>
          <AppText variant="baslik" color="beyaz" bold>
            {baslik}
          </AppText>
          {altyazi ? (
            <AppText variant="kucuk" color="kenarlik">
              {altyazi}
            </AppText>
          ) : null}
        </View>

        <ScrollView contentContainerStyle={styles.liste}>
          {branches?.map((b) => {
            const secili = b.slug === seciliSlug;
            return (
              <Pressable
                key={b.id}
                style={({ pressed }) => [
                  styles.satir,
                  secili && styles.satirSecili,
                  pressed && styles.pressed,
                ]}
                onPress={() => onSelect(b.slug)}>
                <AppText variant="govde" color={secili ? 'beyaz' : 'lacivert'} bold style={styles.satirAd}>
                  {b.ad}
                </AppText>
                {secili ? (
                  <MaterialCommunityIcons name="check-bold" size={20} color={Palette.altin} />
                ) : (
                  <MaterialCommunityIcons name="chevron-right" size={20} color={Palette.solukMetin} />
                )}
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Palette.kremZemin,
  },
  kolon: {
    flex: 1,
    width: '100%',
    maxWidth: CardFlowMaxWidth,
    alignSelf: 'center',
  },
  header: {
    backgroundColor: Palette.lacivert,
    paddingHorizontal: Spacing.four,
    paddingVertical: Spacing.four,
    gap: Spacing.one,
  },
  liste: {
    padding: Spacing.three,
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
  satirSecili: {
    backgroundColor: Palette.lacivert,
    borderColor: Palette.lacivert,
  },
  satirAd: {
    flex: 1,
  },
  pressed: {
    opacity: 0.75,
  },
});
