import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Screen } from '@/components/ui/screen';
import { Palette, Radius, Spacing } from '@/constants/theme';
import { type DereceliDurum, dereceliDurumSorgu, dereceliGir, dereceliHazir, dereceliIptal } from '@/lib/er-meydani';

const ARAMA_SN = 120; // rakip arama süresi (2 dk) — sonra "rakip bulunamadı"
const HAZIR_SN = 20; // ready-check geri sayımı

/** DERECELİ MAÇ — CANLI KUYRUK + HAZIR-KONTROLÜ (LoL mantığı). aranıyor → eşleşti(hazır) → oynanıyor. */
export default function DereceliKuyrukScreen() {
  const router = useRouter();
  const [durum, setDurum] = useState<DereceliDurum | null>(null);
  const [kalanArama, setKalanArama] = useState(ARAMA_SN);
  const [kalanHazir, setKalanHazir] = useState(HAZIR_SN);
  const [bulunamadi, setBulunamadi] = useState(false);
  const gittiRef = useRef(false);
  const hazirBastimRef = useRef(false);

  const cik = useCallback(() => {
    if (gittiRef.current) return;
    gittiRef.current = true;
    void dereceliIptal();
    router.replace('/er-meydani');
  }, [router]);

  // Maça geç: oynanıyor olunca maç ekranına (dereceli mod). Rakip adını da taşı (maç üstünde göster).
  const maca = useCallback(
    (d: DereceliDurum) => {
      if (gittiRef.current || !d.seed) return;
      gittiRef.current = true;
      router.replace({
        pathname: '/er-meydani-mac',
        params: { seed: String(d.seed), mod: 'dereceli', rakip_rumuz: d.rakip_rumuz ?? 'Rakip' },
      });
    },
    [router],
  );

  // 1) Kuyruğa gir + poll döngüsü.
  useEffect(() => {
    let dur = false;
    const isle = (d: DereceliDurum | null) => {
      if (dur || gittiRef.current || !d) return;
      setDurum(d);
      if (d.durum === 'oynaniyor' && d.seed) maca(d);
      else if (d.durum === 'iptal') setBulunamadi(true); // rakip ayrıldı → "rakip yok" ekranı
    };
    void dereceliGir().then(isle);
    const t = setInterval(() => {
      if (dur || gittiRef.current) return;
      void dereceliDurumSorgu().then(isle);
    }, 2000);
    return () => {
      dur = true;
      clearInterval(t);
    };
  }, [maca]);

  // 2) Arama geri sayımı (araniyor'dayken). 0 → rakip bulunamadı.
  useEffect(() => {
    if (durum?.durum !== 'araniyor' || bulunamadi) return;
    const t = setInterval(() => {
      setKalanArama((s) => {
        if (s <= 1) {
          void dereceliIptal();
          setBulunamadi(true);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [durum?.durum, bulunamadi]);

  // 3) Ready-check geri sayımı (eşleşti'yken). 0 → basmadıysa iptal.
  useEffect(() => {
    if (durum?.durum !== 'eslesti') {
      setKalanHazir(HAZIR_SN);
      return;
    }
    const t = setInterval(() => {
      setKalanHazir((s) => {
        if (s <= 1) {
          if (!hazirBastimRef.current) cik(); // hazır basmadan süre doldu → iptal
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [durum?.durum, cik]);

  async function hazirBas() {
    hazirBastimRef.current = true;
    const d = await dereceliHazir();
    if (d) {
      setDurum(d);
      if (d.durum === 'oynaniyor' && d.seed) maca(d);
    }
  }

  // ── RAKİP BULUNAMADI ──
  if (bulunamadi) {
    return (
      <Screen title="Dereceli Maç" onGeri={() => router.replace('/er-meydani')}>
        <View style={styles.orta}>
          <MaterialCommunityIcons name="account-search-outline" size={56} color={Palette.solukMetin} />
          <AppText variant="baslik" color="anaMetin" bold style={styles.ortala}>Rakip bulunamadı</AppText>
          <AppText variant="kucuk" color="solukMetin" style={styles.ortala}>
            Şu an dereceli maç arayan başka oyuncu yok. Biraz sonra tekrar dene.
          </AppText>
          <Pressable style={({ pressed }) => [styles.anaBtn, pressed && styles.basili]} onPress={() => router.replace('/er-meydani')}>
            <AppText variant="govde" color="beyaz" bold>Er Meydanı'na Dön</AppText>
          </Pressable>
        </View>
      </Screen>
    );
  }

  // ── EŞLEŞTİ: HAZIR-KONTROLÜ ──
  if (durum?.durum === 'eslesti') {
    return (
      <Screen title="Rakip Bulundu!" onGeri={cik} headerAltinCizgi>
        <View style={styles.orta}>
          <MaterialCommunityIcons name="sword-cross" size={56} color={Palette.altin} />
          <AppText variant="dev" color="altinMetin" bold style={styles.ortala}>⚔️ Rakip bulundu!</AppText>
          <View style={styles.rakipKutu}>
            <MaterialCommunityIcons name="account" size={20} color={Palette.lacivert} />
            <AppText variant="govde" color="anaMetin" bold>{durum.rakip_rumuz ?? 'Rakip'}</AppText>
            {durum.rakip_elo != null ? <AppText variant="etiket" color="solukMetin">· {durum.rakip_elo} puan</AppText> : null}
          </View>
          <AppText variant="baslik" color={kalanHazir <= 5 ? 'kirmizi' : 'lacivert'} bold>{kalanHazir}</AppText>

          {hazirBastimRef.current ? (
            <View style={styles.bekleSatir}>
              <ActivityIndicator size="small" color={Palette.altinKoyu} />
              <AppText variant="kucuk" color="solukMetin">Rakibin hazır olması bekleniyor…</AppText>
            </View>
          ) : (
            <Pressable style={({ pressed }) => [styles.hazirBtn, pressed && styles.basili]} onPress={() => void hazirBas()}>
              <MaterialCommunityIcons name="check-bold" size={22} color={Palette.beyaz} />
              <AppText variant="govde" color="beyaz" bold>HAZIRIM</AppText>
            </Pressable>
          )}
          <Pressable style={({ pressed }) => [styles.vazgecBtn, pressed && styles.basili]} onPress={cik}>
            <AppText variant="kucuk" color="solukMetin" bold>Vazgeç</AppText>
          </Pressable>
        </View>
      </Screen>
    );
  }

  // ── ARANIYOR ──
  return (
    <Screen title="Dereceli Maç" onGeri={cik} headerAltinCizgi>
      <View style={styles.orta}>
        <ActivityIndicator size="large" color={Palette.altinKoyu} />
        <AppText variant="baslik" color="anaMetin" bold style={styles.ortala}>Rakip aranıyor…</AppText>
        <AppText variant="kucuk" color="solukMetin" style={styles.ortala}>
          Seninle aynı seviyede, dereceli maç arayan gerçek bir oyuncu bulunuyor.
        </AppText>
        <AppText variant="etiket" color="solukMetin">{kalanArama} sn</AppText>
        <Pressable style={({ pressed }) => [styles.vazgecBtn, pressed && styles.basili]} onPress={cik}>
          <AppText variant="kucuk" color="solukMetin" bold>Aramayı iptal et</AppText>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  orta: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.three, paddingBottom: Spacing.six },
  ortala: { textAlign: 'center' },
  rakipKutu: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.two,
    backgroundColor: Palette.altinSolukYuzey, borderRadius: Radius.m,
    paddingHorizontal: Spacing.four, paddingVertical: Spacing.two,
  },
  bekleSatir: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  hazirBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.two,
    backgroundColor: Palette.yesil, borderRadius: Radius.m,
    paddingVertical: Spacing.three, paddingHorizontal: Spacing.six,
  },
  anaBtn: {
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: Palette.lacivert, borderRadius: Radius.m,
    paddingVertical: Spacing.three, paddingHorizontal: Spacing.six, marginTop: Spacing.two,
  },
  vazgecBtn: { paddingVertical: Spacing.two, paddingHorizontal: Spacing.four },
  basili: { opacity: 0.85 },
});
