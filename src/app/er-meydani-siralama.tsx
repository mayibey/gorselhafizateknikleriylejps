import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Screen } from '@/components/ui/screen';
import { Palette, Radius, Spacing } from '@/constants/theme';
import {
  type LiderlikSatir,
  type Sampiyon,
  type Siram,
  gecenHaftaSampiyon,
  liderlikGetir,
  siramGetir,
  sikayetEt,
} from '@/lib/er-meydani';

/** ER MEYDANI — HAFTALIK SIRALAMA. İlk N + senin sıran + geçen haftanın şampiyonu. Pazartesi sıfırlanır. */
export default function ErMeydaniSiralamaScreen() {
  const router = useRouter();
  const [liste, setListe] = useState<LiderlikSatir[] | null>(null);
  const [siram, setSiram] = useState<Siram | null>(null);
  const [sampiyon, setSampiyon] = useState<Sampiyon | null>(null);

  useFocusEffect(
    useCallback(() => {
      let iptal = false;
      void (async () => {
        const [l, s, c] = await Promise.all([liderlikGetir(50), siramGetir(), gecenHaftaSampiyon()]);
        if (iptal) return;
        setListe(l);
        setSiram(s);
        setSampiyon(c);
      })();
      return () => {
        iptal = true;
      };
    }, []),
  );

  const bendeListede = (liste ?? []).some((r) => r.ben);

  // Apple UGC şartı: uygunsuz takma adı şikayet et. (Rumuz görünen tek kullanıcı içeriği.)
  function sikayetSor(rumuz: string) {
    Alert.alert(
      'Takma adı şikayet et',
      `"${rumuz}" adını uygunsuz buluyorsan bize bildir; inceleyelim.`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Şikayet Et',
          style: 'destructive',
          onPress: () => {
            void sikayetEt(null, rumuz, 'uygunsuz rumuz')
              .then(() => Alert.alert('Teşekkürler', 'Şikayetin bize ulaştı, inceleyeceğiz.'))
              .catch(() => Alert.alert('Gönderilemedi', 'Lütfen sonra tekrar dene.'));
          },
        },
      ],
    );
  }

  return (
    <Screen title="Sıralama" onGeri={() => router.back()} headerAltinCizgi>
      <View style={styles.baslikSatir}>
        <MaterialCommunityIcons name="calendar-week" size={20} color={Palette.altinKoyu} />
        <AppText variant="kucuk" color="solukMetin" bold>
          Bu haftanın Er Meydanı sıralaması · Pazartesi sıfırlanır
        </AppText>
      </View>

      {sampiyon ? (
        <View style={styles.sampiyonKart}>
          <MaterialCommunityIcons name="crown" size={26} color={Palette.altin} />
          <View style={styles.sampiyonMetin}>
            <AppText variant="etiket" color="solukMetin" bold>GEÇEN HAFTANIN ŞAMPİYONU</AppText>
            <AppText variant="govde" color="anaMetin" bold numberOfLines={1}>
              {sampiyon.rumuz} · {sampiyon.puan} puan
            </AppText>
          </View>
        </View>
      ) : null}

      {siram ? (
        <View style={styles.siramKart}>
          <AppText variant="etiket" color="beyaz" bold>SENİN SIRAN</AppText>
          <View style={styles.siramSatir}>
            <AppText variant="dev" color="beyaz" bold>{siram.sira}.</AppText>
            <AppText variant="govde" color="beyaz">{siram.puan} puan · {siram.mac_sayisi} maç</AppText>
          </View>
        </View>
      ) : null}

      {liste === null ? (
        <ActivityIndicator color={Palette.lacivert} style={styles.yukleniyor} />
      ) : liste.length === 0 ? (
        <View style={styles.bos}>
          <MaterialCommunityIcons name="podium" size={44} color={Palette.solukMetin} />
          <AppText variant="govde" color="solukMetin" style={styles.ortala}>
            Bu hafta henüz kimse meydana çıkmadı. İlk sen ol — bir maç kazan, zirveye otur!
          </AppText>
        </View>
      ) : (
        <View style={styles.listeSarma}>
          {liste.map((r) => (
            <SiraSatiri key={`${r.sira}-${r.rumuz}`} satir={r} onSikayet={sikayetSor} />
          ))}
          {!bendeListede && siram === null ? (
            <AppText variant="kucuk" color="solukMetin" style={styles.ipucu}>
              Sıralamaya girmek için bir maç oyna ve puan topla.
            </AppText>
          ) : null}
        </View>
      )}
    </Screen>
  );
}

function SiraSatiri({ satir, onSikayet }: { satir: LiderlikSatir; onSikayet: (rumuz: string) => void }) {
  const madalya = satir.sira <= 3;
  const madalyaRenk = satir.sira === 1 ? Palette.altin : satir.sira === 2 ? '#B8B8C0' : '#C08A5E';
  return (
    <View style={[styles.satir, satir.ben && styles.satirBen]}>
      <View style={[styles.siraNo, madalya && { backgroundColor: madalyaRenk }]}>
        {madalya ? (
          <MaterialCommunityIcons name="trophy" size={16} color={Palette.beyaz} />
        ) : (
          <AppText variant="kucuk" color="lacivert" bold>{satir.sira}</AppText>
        )}
      </View>
      <View style={styles.satirOrta}>
        <AppText variant="govde" color="anaMetin" bold numberOfLines={1}>
          {satir.rumuz}{satir.ben ? ' (sen)' : ''}
        </AppText>
        <AppText variant="etiket" color="solukMetin">{satir.mac_sayisi} maç</AppText>
      </View>
      <AppText variant="altBaslik" color="altinMetin" bold>{satir.puan}</AppText>
      {!satir.ben ? (
        <Pressable
          hitSlop={10}
          onPress={() => onSikayet(satir.rumuz)}
          accessibilityRole="button"
          accessibilityLabel={`${satir.rumuz} takma adını şikayet et`}>
          <MaterialCommunityIcons name="dots-vertical" size={20} color={Palette.solukMetin} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  ortala: { textAlign: 'center' },
  baslikSatir: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  sampiyonKart: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.three,
    backgroundColor: Palette.altinSolukYuzey, borderRadius: Radius.l, padding: Spacing.three,
  },
  sampiyonMetin: { flex: 1, gap: 2 },
  siramKart: {
    backgroundColor: Palette.lacivert, borderRadius: Radius.l, padding: Spacing.three, gap: Spacing.one,
  },
  siramSatir: { flexDirection: 'row', alignItems: 'baseline', gap: Spacing.two },
  yukleniyor: { marginVertical: Spacing.five },
  bos: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.two, paddingVertical: Spacing.six },
  listeSarma: { gap: Spacing.two },
  satir: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.three,
    backgroundColor: Palette.kartKremi, borderWidth: 1, borderColor: Palette.kenarlik,
    borderRadius: Radius.m, padding: Spacing.three,
  },
  satirBen: { borderColor: Palette.altin, backgroundColor: Palette.altinSolukYuzey },
  siraNo: {
    width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Palette.altinSolukYuzey,
  },
  satirOrta: { flex: 1, gap: 2 },
  ipucu: { textAlign: 'center', marginTop: Spacing.two },
});
