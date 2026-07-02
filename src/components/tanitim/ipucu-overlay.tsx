/**
 * Bağlamsal ilk-kullanım ipucu katmanı — bir ekran ilk açıldığında üstüne biner, o ekrandaki
 * öğeleri (buton/hareket) kısa maddelerle anlatır, "Anladım" ile kapanır (bir daha çıkmaz).
 * Krem premium tema. Spotlight/ölçüm YOK (sağlam): açıklama kartı + madde listesi.
 */
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { CardFlowMaxWidth, Palette, Radius, Spacing } from '@/constants/theme';

export type IpucuMadde = {
  ikon: keyof typeof MaterialCommunityIcons.glyphMap;
  metin: string;
};

export function IpucuOverlay({
  baslik,
  altyazi,
  maddeler,
  onKapat,
}: {
  baslik: string;
  altyazi?: string;
  maddeler: IpucuMadde[];
  onKapat: () => void;
}) {
  return (
    <Modal transparent animationType="fade" onRequestClose={onKapat} statusBarTranslucent>
      <View style={styles.zemin}>
        <View style={styles.kart}>
          <View style={styles.baslikSar}>
            <MaterialCommunityIcons name="compass-outline" size={22} color={Palette.altinKoyu} />
            <AppText variant="altBaslik" bold color="lacivert">
              {baslik}
            </AppText>
          </View>
          {altyazi ? (
            <AppText variant="kucuk" color="solukMetin" style={styles.altyazi}>
              {altyazi}
            </AppText>
          ) : null}

          <View style={styles.maddeler}>
            {maddeler.map((m, i) => (
              <View key={i} style={styles.madde}>
                <View style={styles.maddeIkon}>
                  <MaterialCommunityIcons name={m.ikon} size={20} color={Palette.altinKoyu} />
                </View>
                <AppText variant="kucuk" color="anaMetin" style={styles.maddeMetin}>
                  {m.metin}
                </AppText>
              </View>
            ))}
          </View>

          <Pressable
            style={({ pressed }) => [styles.buton, pressed && styles.pressed]}
            onPress={onKapat}
            accessibilityRole="button"
            accessibilityLabel="Anladım, ipucunu kapat">
            <AppText variant="govde" bold color="beyaz">
              Anladım
            </AppText>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  zemin: {
    flex: 1,
    backgroundColor: 'rgba(11,31,58,0.55)', // lacivert yarı-saydam (odak dışı karartma)
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  kart: {
    width: '100%',
    maxWidth: CardFlowMaxWidth,
    backgroundColor: Palette.kartKremi,
    borderColor: Palette.kenarlik,
    borderWidth: 1,
    borderRadius: Radius.l,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  baslikSar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  altyazi: {
    lineHeight: 20,
  },
  maddeler: {
    gap: Spacing.three,
  },
  madde: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  maddeIkon: {
    width: 38,
    height: 38,
    borderRadius: Radius.m,
    backgroundColor: Palette.altinSolukYuzey,
    alignItems: 'center',
    justifyContent: 'center',
  },
  maddeMetin: {
    flex: 1,
    lineHeight: 20,
  },
  buton: {
    backgroundColor: Palette.lacivert,
    borderRadius: Radius.m,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    marginTop: Spacing.one,
  },
  pressed: {
    opacity: 0.85,
  },
});
