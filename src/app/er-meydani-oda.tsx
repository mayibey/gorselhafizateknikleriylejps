import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, Pressable, Share, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Screen } from '@/components/ui/screen';
import { Palette, Radius, Spacing } from '@/constants/theme';
import { odaDurum, odaIptal } from '@/lib/er-meydani';

/** ER MEYDANI — BEKLEME ODASI. Kuran, gerçek rakip gelene kadar bekler; gelince ikisi de maça girer. */
export default function ErMeydaniOdaScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ oda?: string; kod?: string }>();
  const odaId = params.oda ?? '';
  const kod = params.kod ?? '';
  const gittiRef = useRef(false);

  // Odayı poll et: rakip katılınca ('oynaniyor') maça geç; iptal olursa lobiye dön.
  useEffect(() => {
    if (!odaId) return;
    let durdur = false;
    const tik = async () => {
      if (durdur || gittiRef.current) return;
      const d = await odaDurum(odaId);
      if (durdur || gittiRef.current || !d) return;
      if (d.durum === 'oynaniyor' || d.durum === 'bitti') {
        gittiRef.current = true;
        router.replace({
          pathname: '/er-meydani-mac',
          params: {
            seed: String(d.seed),
            mod: 'oda',
            oda: odaId,
            soru: String(d.soru_sayisi),
            sure: String(d.sure_sn),
            ...(d.kanunlar && d.kanunlar.length ? { kanun: d.kanunlar.join(',') } : {}),
          },
        });
      } else if (d.durum === 'kapandi') {
        gittiRef.current = true;
        router.replace('/er-meydani');
      }
    };
    void tik();
    const t = setInterval(() => void tik(), 3000);
    return () => {
      durdur = true;
      clearInterval(t);
    };
  }, [odaId, router]);

  async function paylas() {
    try {
      await Share.share({
        message: `Er Meydanı'nda seni bekliyorum! Oda kodu: ${kod} — Mevzu (JSPS Hazırlık) uygulamasında bu kodla katıl, 10 soruda kapışalım! ⚔️`,
      });
    } catch {
      /* iptal */
    }
  }

  async function iptalEt() {
    gittiRef.current = true;
    await odaIptal(odaId);
    router.replace('/er-meydani');
  }

  return (
    <Screen title="Bekleme Odası" onGeri={() => void iptalEt()}>
      <View style={styles.merkez}>
        <ActivityIndicator size="large" color={Palette.altinKoyu} />
        <AppText variant="baslik" color="anaMetin" bold style={styles.ortala}>
          Rakip bekleniyor…
        </AppText>
        <AppText variant="kucuk" color="solukMetin" style={styles.ortala}>
          Arkadaşın bu kodla katılınca maç ikinizde de başlar.
        </AppText>

        <View style={styles.kodKutu}>
          <AppText variant="etiket" color="solukMetin" bold>ODA KODU</AppText>
          <AppText variant="dev" color="altinMetin" bold style={styles.kod}>{kod}</AppText>
        </View>

        <Pressable style={({ pressed }) => [styles.anaBtn, pressed && styles.basili]} onPress={() => void paylas()}>
          <MaterialCommunityIcons name="share-variant" size={22} color={Palette.beyaz} />
          <AppText variant="govde" color="beyaz" bold>Kodu Paylaş</AppText>
        </Pressable>
        <Pressable style={({ pressed }) => [styles.iptalBtn, pressed && styles.basili]} onPress={() => void iptalEt()}>
          <AppText variant="govde" color="kirmizi" bold>İptal Et</AppText>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  merkez: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.three, paddingBottom: Spacing.six },
  ortala: { textAlign: 'center' },
  kodKutu: {
    alignItems: 'center', gap: Spacing.one,
    backgroundColor: Palette.altinSolukYuzey, borderRadius: Radius.l,
    paddingVertical: Spacing.three, paddingHorizontal: Spacing.five, marginVertical: Spacing.two,
  },
  kod: { letterSpacing: 4 },
  anaBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.two,
    backgroundColor: Palette.lacivert, borderRadius: Radius.m, paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.five, minWidth: 220,
  },
  iptalBtn: {
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Palette.kenarlik, borderRadius: Radius.m,
    paddingVertical: Spacing.three, paddingHorizontal: Spacing.five, minWidth: 220,
  },
  basili: { opacity: 0.85 },
});
