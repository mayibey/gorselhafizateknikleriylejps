import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { EmptyState } from '@/components/ui/empty-state';
import { Screen } from '@/components/ui/screen';
import { Palette, Spacing } from '@/constants/theme';
import { maddeMetni } from '@/db/madde-metinleri';

export default function MaddeMetniScreen() {
  const router = useRouter();
  const { madde_no, baslik } = useLocalSearchParams<{ madde_no?: string; baslik?: string }>();
  const metin = madde_no ? maddeMetni(madde_no) : null;

  return (
    <Screen title="Madde Metni" onGeri={() => router.back()}>
      {metin ? (
        <View style={styles.kutu}>
          <AppText variant="altBaslik" bold>
            {madde_no}
          </AppText>
          {baslik ? (
            <AppText variant="kucuk" color="solukMetin">
              {baslik}
            </AppText>
          ) : null}
          <AppText variant="govde" style={styles.metin}>
            {metin}
          </AppText>
        </View>
      ) : (
        <EmptyState
          ikon="file-document-outline"
          baslik="Madde metni yakında"
          aciklama={`${madde_no ?? 'Bu madde'} için resmî metin yakında eklenecek.`}
          buton={{ etiket: 'Geri dön', onPress: () => router.back() }}
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  kutu: {
    backgroundColor: Palette.kartKremi,
    borderColor: Palette.kenarlik,
    borderWidth: 1,
    borderRadius: 14,
    padding: Spacing.four,
    gap: Spacing.two,
  },
  metin: {
    // Yorgun gözle uzun metin için rahat satır yüksekliği.
    lineHeight: 28,
  },
});
