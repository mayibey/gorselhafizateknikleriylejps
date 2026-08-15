import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useKisiselOzellik } from '@/lib/ozellik';
import { useCallback, useState, useMemo } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Screen } from '@/components/ui/screen';
import { Palette, Radius, Spacing } from '@/constants/theme';
import { type LigDurum, type LigTabloSatir, ligDurum, ligTablo } from '@/lib/er-meydani';

/** ER MEYDANI — LİG TABLOSU. Kendi derecen (rating/kademe/sıra) + bu sezonun sıralaması. */
export default function ErMeydaniLigScreen() {
  // GECE TEMASI (bayraklı, 15 Ağu): yalnız başkan + Kemalettin. Bayrak kapalıysa
  // ekran BİREBİR eskisi gibi kalır — orijinal renklere dokunulmadı.
  const gece = useKisiselOzellik('gece-er-meydani');
  const styles = useMemo(() => stilOlustur(gece), [gece]);
  const router = useRouter();
  const [durum, setDurum] = useState<LigDurum | null>(null);
  const [tablo, setTablo] = useState<LigTabloSatir[] | null>(null);

  useFocusEffect(
    useCallback(() => {
      let iptal = false;
      void (async () => {
        const [d, t] = await Promise.all([ligDurum(), ligTablo(50)]);
        if (iptal) return;
        setDurum(d);
        setTablo(t);
      })();
      return () => {
        iptal = true;
      };
    }, []),
  );

  return (
    <Screen koyu={gece} title="Lig" onGeri={() => router.back()} headerAltinCizgi>
      <View style={styles.baslikSatir}>
        <MaterialCommunityIcons name="chevron-triple-up" size={20} color={Palette.altinKoyu} />
        <AppText variant="kucuk" color={gece ? 'kartMetinIkincil' : 'solukMetin'} bold>
          {durum ? `Sezon ${durum.sezon} · her ay sıfırlanır` : 'Dereceli lig · her ay sıfırlanır'}
        </AppText>
      </View>

      {/* Kendi derecen */}
      {durum ? (
        <View style={styles.durumKart}>
          <View style={styles.durumUst}>
            <View>
              <AppText variant="etiket" color="beyaz" bold>DERECEN</AppText>
              <AppText variant="dev" color="beyaz" bold>{durum.kademe}</AppText>
            </View>
            <View style={styles.durumSag}>
              <AppText variant="dev" color="beyaz" bold>{durum.puan}</AppText>
              <AppText variant="etiket" color="kenarlik">puan · {durum.sira}. sıra</AppText>
            </View>
          </View>
          <View style={styles.durumAlt}>
            <DurumIstat etiket="Maç" deger={durum.mac} />
            <DurumIstat etiket="Galibiyet" deger={durum.galip} />
            <DurumIstat etiket="Mağlubiyet" deger={durum.maglup} />
          </View>
        </View>
      ) : null}

      {/* Tablo */}
      {tablo === null ? (
        <ActivityIndicator color={gece ? Palette.kartMetinAcik : Palette.lacivert} style={styles.yukleniyor} />
      ) : tablo.length === 0 ? (
        <View style={styles.bos}>
          <MaterialCommunityIcons name="trophy-outline" size={44} color={gece ? Palette.kartMetinIkincil : Palette.solukMetin} />
          <AppText variant="govde" color={gece ? 'kartMetinIkincil' : 'solukMetin'} style={styles.ortala}>
            Bu sezon henüz dereceli maç oynanmadı. İlk dereceli maçı sen oyna, zirveye kur!
          </AppText>
        </View>
      ) : (
        <View style={styles.listeSarma}>
          {tablo.map((r) => (
            <View key={`${r.sira}-${r.rumuz}`} style={[styles.satir, r.ben && styles.satirBen]}>
              <View style={styles.siraNo}>
                <AppText variant="kucuk" color={gece ? 'kartMetinAcik' : 'lacivert'} bold>{r.sira}</AppText>
              </View>
              <View style={styles.satirOrta}>
                <AppText variant="govde" color={gece ? 'kartMetinAcik' : 'anaMetin'} bold numberOfLines={1}>
                  {r.rumuz}{r.ben ? ' (sen)' : ''}
                </AppText>
                <AppText variant="etiket" color={gece ? 'kartMetinIkincil' : 'solukMetin'}>
                  {r.kademe} · {r.mac} maç · {r.galip} galibiyet
                </AppText>
              </View>
              <AppText variant="altBaslik" color={gece ? 'altinParlak' : 'altinMetin'} bold>{r.puan}</AppText>
            </View>
          ))}
        </View>
      )}
    </Screen>
  );
}

function DurumIstat({ etiket, deger }: { etiket: string; deger: number }) {
  const gece = useKisiselOzellik('gece-er-meydani');
  const styles = useMemo(() => stilOlustur(gece), [gece]);
  return (
    <View style={styles.istat}>
      <AppText variant="altBaslik" color="beyaz" bold>{deger}</AppText>
      <AppText variant="etiket" color="kenarlik">{etiket}</AppText>
    </View>
  );
}

const stilOlustur = (gece: boolean) => StyleSheet.create({
  ortala: { textAlign: 'center' },
  baslikSatir: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  durumKart: { backgroundColor: Palette.lacivert, borderRadius: Radius.l, padding: Spacing.three, gap: Spacing.three },
  durumUst: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  durumSag: { alignItems: 'flex-end' },
  durumAlt: {
    flexDirection: 'row', justifyContent: 'space-around',
    borderTopWidth: 1, borderTopColor: Palette.kartKenarKoyu, paddingTop: Spacing.two,
  },
  istat: { alignItems: 'center' },
  yukleniyor: { marginVertical: Spacing.five },
  bos: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.two, paddingVertical: Spacing.six },
  listeSarma: { gap: Spacing.two },
  satir: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.three,
    backgroundColor: gece ? '#0B283A' : Palette.kartKremi, borderWidth: 1, borderColor: gece ? 'rgba(126,205,218,0.28)' : Palette.kenarlik,
    borderRadius: Radius.m, padding: Spacing.three,
  },
  satirBen: { borderColor: Palette.altin, backgroundColor: gece ? 'rgba(201,162,39,0.16)' : Palette.altinSolukYuzey },
  siraNo: {
    width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
    backgroundColor: gece ? 'rgba(201,162,39,0.16)' : Palette.altinSolukYuzey,
  },
  satirOrta: { flex: 1, gap: 2 },
});
