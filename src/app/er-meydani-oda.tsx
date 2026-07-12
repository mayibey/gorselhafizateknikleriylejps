import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, Share, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Screen } from '@/components/ui/screen';
import { Palette, Radius, Spacing } from '@/constants/theme';
import { type OdaDurum, odaBaslat, odaDavetMetni, odaDurum, odaIptal } from '@/lib/er-meydani';

/** ER MEYDANI — BEKLEME ODASI (çok-oyunculu). Oyuncular toplanır; kuran "Başlat"a basınca herkes oynar. */
export default function ErMeydaniOdaScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ oda?: string; kod?: string }>();
  const odaId = params.oda ?? '';
  const [durum, setDurum] = useState<OdaDurum | null>(null);
  const [baslatiliyor, setBaslatiliyor] = useState(false);
  const gittiRef = useRef(false);

  // Odayı poll et: başlayınca herkes maça geçer; kapanınca lobiye döner.
  useEffect(() => {
    if (!odaId) return;
    let dur = false;
    const tik = async () => {
      if (dur || gittiRef.current) return;
      const d = await odaDurum(odaId);
      if (dur || gittiRef.current || !d) return;
      setDurum(d);
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
      dur = true;
      clearInterval(t);
    };
  }, [odaId, router]);

  const kod = durum?.kod ?? params.kod ?? '';
  const oyuncular = durum?.oyuncular ?? [];
  const benKuran = durum?.ben_kuran ?? false;
  const maxO = durum?.max_oyuncu ?? 5;

  async function paylas() {
    try {
      await Share.share({
        message: odaDavetMetni(kod),
      });
    } catch {
      /* iptal */
    }
  }

  const baslat = useCallback(async () => {
    if (baslatiliyor) return;
    setBaslatiliyor(true);
    await odaBaslat(odaId); // başlayınca poll 'oynaniyor' görüp maça geçirir
    setBaslatiliyor(false);
  }, [odaId, baslatiliyor]);

  async function iptalEt() {
    gittiRef.current = true;
    await odaIptal(odaId);
    router.replace('/er-meydani');
  }

  // Geri: odayı KAPATMADAN çık (Odalarım'dan geri dönülebilir).
  function geriCik() {
    gittiRef.current = true;
    router.replace('/er-meydani');
  }

  return (
    <Screen title="Bekleme Odası" onGeri={geriCik} headerAltinCizgi>
      <View style={styles.kodKutu}>
        <AppText variant="etiket" color="solukMetin" bold>ODA KODU</AppText>
        <AppText variant="dev" color="altinMetin" bold style={styles.kod}>{kod}</AppText>
        <Pressable style={({ pressed }) => [styles.paylasBtn, pressed && styles.basili]} onPress={() => void paylas()}>
          <MaterialCommunityIcons name="share-variant" size={18} color={Palette.lacivert} />
          <AppText variant="kucuk" color="lacivert" bold>Kodu Paylaş</AppText>
        </Pressable>
      </View>

      <View style={styles.oyuncuBaslik}>
        <MaterialCommunityIcons name="account-group" size={20} color={Palette.altinKoyu} />
        <AppText variant="etiket" color="solukMetin" bold>OYUNCULAR ({oyuncular.length}/{maxO})</AppText>
      </View>

      {durum === null ? (
        <ActivityIndicator color={Palette.lacivert} style={styles.yukleniyor} />
      ) : (
        oyuncular.map((o, i) => (
          <View key={i} style={[styles.oyuncuSatir, o.ben && styles.oyuncuBen]}>
            <MaterialCommunityIcons
              name={i === 0 ? 'crown' : 'account'}
              size={18}
              color={i === 0 ? Palette.altin : Palette.solukMetin}
            />
            <AppText variant="govde" color="anaMetin" bold style={styles.oyuncuAd} numberOfLines={1}>
              {o.rumuz}{o.ben ? ' (sen)' : ''}{i === 0 ? ' · kurucu' : ''}
            </AppText>
          </View>
        ))
      )}

      {oyuncular.length < maxO ? (
        <View style={styles.bekleSatir}>
          <ActivityIndicator size="small" color={Palette.solukMetin} />
          <AppText variant="kucuk" color="solukMetin">Yeni oyuncular bekleniyor…</AppText>
        </View>
      ) : null}

      {benKuran ? (
        <>
          <Pressable
            disabled={oyuncular.length < 2 || baslatiliyor}
            style={({ pressed }) => [styles.anaBtn, (oyuncular.length < 2 || baslatiliyor) && styles.pasif, pressed && styles.basili]}
            onPress={() => void baslat()}>
            <MaterialCommunityIcons name="flag-checkered" size={22} color={Palette.beyaz} />
            <AppText variant="govde" color="beyaz" bold>
              {oyuncular.length < 2 ? 'En az 2 oyuncu gerek' : baslatiliyor ? 'Başlatılıyor…' : 'Maçı Başlat'}
            </AppText>
          </Pressable>
          <Pressable style={({ pressed }) => [styles.iptalBtn, pressed && styles.basili]} onPress={() => void iptalEt()}>
            <AppText variant="govde" color="kirmizi" bold>Odayı İptal Et</AppText>
          </Pressable>
        </>
      ) : (
        <View style={styles.bekleKuran}>
          <ActivityIndicator size="small" color={Palette.altinKoyu} />
          <AppText variant="kucuk" color="solukMetin" style={styles.ortala}>
            Kurucunun maçı başlatması bekleniyor…
          </AppText>
        </View>
      )}

      <AppText variant="etiket" color="solukMetin" style={styles.geriNot}>
        Geri çıkarsan oda kapanmaz; "Odalarım"dan geri dönebilirsin.
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  ortala: { textAlign: 'center' },
  kodKutu: {
    alignItems: 'center', gap: Spacing.one,
    backgroundColor: Palette.altinSolukYuzey, borderRadius: Radius.l, padding: Spacing.three,
  },
  kod: { letterSpacing: 4 },
  paylasBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.one,
    marginTop: Spacing.one, paddingHorizontal: Spacing.three, paddingVertical: Spacing.one,
    backgroundColor: Palette.kartKremi, borderWidth: 1, borderColor: Palette.kenarlik, borderRadius: Radius.m,
  },
  oyuncuBaslik: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, marginTop: Spacing.two },
  yukleniyor: { marginVertical: Spacing.three },
  oyuncuSatir: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.two,
    backgroundColor: Palette.kartKremi, borderWidth: 1, borderColor: Palette.kenarlik,
    borderRadius: Radius.m, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two,
  },
  oyuncuBen: { borderColor: Palette.altin, backgroundColor: Palette.altinSolukYuzey },
  oyuncuAd: { flex: 1 },
  bekleSatir: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two, paddingVertical: Spacing.one },
  anaBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.two,
    backgroundColor: Palette.lacivert, borderRadius: Radius.m, paddingVertical: Spacing.three, marginTop: Spacing.two,
  },
  iptalBtn: {
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: Palette.kenarlik, borderRadius: Radius.m, paddingVertical: Spacing.three,
  },
  bekleKuran: {
    alignItems: 'center', gap: Spacing.two,
    backgroundColor: Palette.kartKremi, borderWidth: 1, borderColor: Palette.kenarlik,
    borderRadius: Radius.m, padding: Spacing.three, marginTop: Spacing.two,
  },
  geriNot: { textAlign: 'center', marginTop: Spacing.one },
  pasif: { opacity: 0.45 },
  basili: { opacity: 0.85 },
});
