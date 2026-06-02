import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Screen } from '@/components/ui/screen';
import { Palette, Radius, Spacing } from '@/constants/theme';

export default function KarargahScreen() {
  const router = useRouter();

  return (
    <Screen title="Karargah">
      {/* Devam Et — lacivert ana aksiyon kartı */}
      <Pressable
        style={({ pressed }) => [styles.devamEt, pressed && styles.pressed]}
        onPress={() => router.push('/akis')}>
        <View style={styles.devamEtMetin}>
          <AppText variant="etiket" color="altin" bold>
            DEVAM ET
          </AppText>
          <AppText variant="altBaslik" color="beyaz" bold>
            Kart Akışı
          </AppText>
          <AppText variant="kucuk" color="kenarlik">
            Kaldığın yerden çalış
          </AppText>
        </View>
        <MaterialCommunityIcons name="play-circle" size={48} color={Palette.altin} />
      </Pressable>

      {/* Bugünün Görevi */}
      <Card>
        <AppText variant="etiket" color="solukMetin" bold>
          BUGÜNÜN GÖREVİ
        </AppText>
        <View style={styles.gorevSatir}>
          <Gorev sayi="12" etiket="Tekrar" />
          <Gorev sayi="8" etiket="Yeni" />
          <Gorev sayi="1" etiket="Mini Tatbikat" />
        </View>
      </Card>

      {/* Metrik kartları */}
      <View style={styles.metrikSatir}>
        <Metrik deger="%38" etiket="Hazırlık" />
        <Metrik deger="14" etiket="Nöbet serisi" />
      </View>

      {/* Günün Maddesi */}
      <Card>
        <AppText variant="etiket" color="solukMetin" bold>
          GÜNÜN MADDESİ
        </AppText>
        <AppText variant="altBaslik" bold>
          TCK m.86 — Kasten Yaralama
        </AppText>
        <AppText variant="kucuk" color="solukMetin">
          Yer tutucu özet metni.
        </AppText>
      </Card>
    </Screen>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <View style={styles.card}>{children}</View>;
}

function Gorev({ sayi, etiket }: { sayi: string; etiket: string }) {
  return (
    <View style={styles.gorev}>
      <AppText variant="baslik" bold>
        {sayi}
      </AppText>
      <AppText variant="etiket" color="solukMetin">
        {etiket}
      </AppText>
    </View>
  );
}

function Metrik({ deger, etiket }: { deger: string; etiket: string }) {
  return (
    <View style={[styles.card, styles.metrik]}>
      <AppText variant="dev" bold>
        {deger}
      </AppText>
      <AppText variant="kucuk" color="solukMetin">
        {etiket}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.85,
  },
  devamEt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Palette.lacivert,
    borderRadius: Radius.l,
    padding: Spacing.four,
  },
  devamEtMetin: {
    gap: Spacing.half,
  },
  card: {
    backgroundColor: Palette.kartKremi,
    borderColor: Palette.kenarlik,
    borderWidth: 1,
    borderRadius: Radius.m,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  gorevSatir: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  gorev: {
    alignItems: 'center',
    flex: 1,
  },
  metrikSatir: {
    flexDirection: 'row',
    gap: Spacing.three,
  },
  metrik: {
    flex: 1,
    alignItems: 'center',
  },
});
