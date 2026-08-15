import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useKisiselOzellik } from '@/lib/ozellik';
import { useCallback, useState, useMemo } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Screen } from '@/components/ui/screen';
import { Palette, Radius, Spacing } from '@/constants/theme';
import { type GecmisMac, gecmisOzet, macGecmisi, modAdi } from '@/lib/er-meydani';

/**
 * ER MEYDANI — GEÇMİŞ MAÇLAR.
 * Kayıtlar zaten `er_meydani_mac` tablosunda tutuluyordu; eksik olan görüntüleyen ekrandı.
 * Oda maçlarında tek bir rakip yok (çok oyuncu) → orada rakip skoru yerine kendi skorun gösterilir.
 */
export default function ErMeydaniGecmisScreen() {
  // GECE TEMASI (bayraklı, 15 Ağu): yalnız başkan + Kemalettin. Bayrak kapalıysa
  // ekran BİREBİR eskisi gibi kalır — orijinal renklere dokunulmadı.
  const gece = useKisiselOzellik('gece-er-meydani');
  const styles = useMemo(() => stilOlustur(gece), [gece]);
  const router = useRouter();
  const [liste, setListe] = useState<GecmisMac[] | null>(null);

  useFocusEffect(
    useCallback(() => {
      let iptal = false;
      void macGecmisi(60).then((m) => {
        if (!iptal) setListe(m);
      });
      return () => {
        iptal = true;
      };
    }, []),
  );

  const ozet = liste ? gecmisOzet(liste) : null;
  const oran = ozet && ozet.toplam ? Math.round((ozet.galibiyet / ozet.toplam) * 100) : 0;

  return (
    <Screen koyu={gece} title="Geçmiş Maçlar" onGeri={() => router.back()} headerAltinCizgi>
      <View style={styles.baslikSatir}>
        <MaterialCommunityIcons name="history" size={20} color={Palette.altinKoyu} />
        <AppText variant="kucuk" color={gece ? 'kartMetinIkincil' : 'solukMetin'} bold>
          Son 60 maçın · en yeni üstte
        </AppText>
      </View>

      {ozet && ozet.toplam > 0 ? (
        <View style={styles.ozetKart}>
          <View style={styles.ozetKutu}>
            <AppText variant="altBaslik" color="beyaz" bold>{ozet.toplam}</AppText>
            <AppText variant="etiket" color="beyaz">MAÇ</AppText>
          </View>
          <View style={styles.ozetAyirac} />
          <View style={styles.ozetKutu}>
            <AppText variant="altBaslik" color="beyaz" bold>
              {ozet.galibiyet}–{ozet.maglubiyet}
            </AppText>
            <AppText variant="etiket" color="beyaz">G – M</AppText>
          </View>
          <View style={styles.ozetAyirac} />
          <View style={styles.ozetKutu}>
            <AppText variant="altBaslik" color="beyaz" bold>%{oran}</AppText>
            <AppText variant="etiket" color="beyaz">KAZANMA</AppText>
          </View>
          <View style={styles.ozetAyirac} />
          <View style={styles.ozetKutu}>
            <AppText variant="altBaslik" color="beyaz" bold>{ozet.enYuksek}</AppText>
            <AppText variant="etiket" color="beyaz">EN YÜKSEK</AppText>
          </View>
        </View>
      ) : null}

      {liste === null ? (
        <ActivityIndicator color={gece ? Palette.kartMetinAcik : Palette.lacivert} style={styles.yukleniyor} />
      ) : liste.length === 0 ? (
        <View style={styles.bos}>
          <MaterialCommunityIcons name="sword-cross" size={44} color={gece ? Palette.kartMetinIkincil : Palette.solukMetin} />
          <AppText variant="govde" color={gece ? 'kartMetinIkincil' : 'solukMetin'} style={styles.ortala}>
            Henüz maç oynamadın. Meydana çık — buradan tüm maçlarını takip edebilirsin.
          </AppText>
        </View>
      ) : (
        <View style={styles.listeSarma}>
          {liste.map((m) => (
            <MacSatiri key={m.id} mac={m} />
          ))}
          {liste.length >= 60 ? (
            <AppText variant="kucuk" color={gece ? 'kartMetinIkincil' : 'solukMetin'} style={styles.ortala}>
              Yalnız son 60 maç gösteriliyor.
            </AppText>
          ) : null}
        </View>
      )}
    </Screen>
  );
}

/** "3 Ağu 21:45" — yıl aynıysa yazmaya gerek yok, satır zaten dar. */
function tarihYaz(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const ay = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'][d.getMonth()];
  const ss = String(d.getHours()).padStart(2, '0');
  const dd = String(d.getMinutes()).padStart(2, '0');
  const yil = d.getFullYear() === new Date().getFullYear() ? '' : ` ${d.getFullYear()}`;
  return `${d.getDate()} ${ay}${yil} · ${ss}:${dd}`;
}

function MacSatiri({ mac }: { mac: GecmisMac }) {
  const gece = useKisiselOzellik('gece-er-meydani');
  const styles = useMemo(() => stilOlustur(gece), [gece]);
  const oda = mac.mod === 'oda';
  const kazandi = mac.kazandim;
  const rakip = mac.rakip_rumuz?.trim() || (mac.golge ? 'Gölge rakip' : 'Rakip');
  return (
    <View style={[styles.satir, kazandi ? styles.satirGalip : styles.satirMaglup]}>
      <View style={[styles.rozet, { backgroundColor: kazandi ? Palette.yesil : Palette.kirmizi }]}>
        <AppText variant="etiket" color="beyaz" bold>{kazandi ? 'G' : 'M'}</AppText>
      </View>

      <View style={styles.satirOrta}>
        <AppText variant="govde" color={gece ? 'kartMetinAcik' : 'anaMetin'} bold numberOfLines={1}>
          {oda ? modAdi(mac.mod) : rakip}
        </AppText>
        <AppText variant="etiket" color={gece ? 'kartMetinIkincil' : 'solukMetin'} numberOfLines={1}>
          {oda ? tarihYaz(mac.created_at) : `${modAdi(mac.mod)}${mac.golge ? ' · bot' : ''} · ${tarihYaz(mac.created_at)}`}
        </AppText>
      </View>

      {/* Oda maçında tek rakip yok (çok oyuncu) → yalnız kendi skorun anlamlı. */}
      {oda ? (
        <AppText variant="altBaslik" color={gece ? 'altinParlak' : 'altinMetin'} bold>{mac.benim_puan}</AppText>
      ) : (
        <View style={styles.skorSatir}>
          <AppText variant="altBaslik" color={kazandi ? 'yesil' : 'anaMetin'} bold>
            {mac.benim_puan}
          </AppText>
          <AppText variant="kucuk" color={gece ? 'kartMetinIkincil' : 'solukMetin'}>–</AppText>
          <AppText variant="altBaslik" color={kazandi ? 'anaMetin' : 'kirmizi'} bold>
            {mac.rakip_puan}
          </AppText>
        </View>
      )}
    </View>
  );
}

const stilOlustur = (gece: boolean) => StyleSheet.create({
  ortala: { textAlign: 'center' },
  baslikSatir: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  ozetKart: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Palette.lacivert, borderRadius: Radius.l, padding: Spacing.three,
  },
  ozetKutu: { flex: 1, alignItems: 'center', gap: 2 },
  ozetAyirac: { width: 1, alignSelf: 'stretch', backgroundColor: 'rgba(255,255,255,0.18)' },
  yukleniyor: { marginVertical: Spacing.five },
  bos: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.two, paddingVertical: Spacing.six },
  listeSarma: { gap: Spacing.two },
  satir: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.three,
    backgroundColor: Palette.kartKremi, borderWidth: 1, borderRadius: Radius.m, padding: Spacing.three,
  },
  satirGalip: { borderColor: Palette.kenarlik, borderLeftWidth: 4, borderLeftColor: Palette.yesil },
  satirMaglup: { borderColor: Palette.kenarlik, borderLeftWidth: 4, borderLeftColor: Palette.kirmizi },
  rozet: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  satirOrta: { flex: 1, gap: 2 },
  skorSatir: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
});
