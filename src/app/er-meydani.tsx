import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, Share, StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Screen } from '@/components/ui/screen';
import { Palette, Radius, Spacing } from '@/constants/theme';
import { seedUret } from '@/lib/er-meydani-mantik';
import { rumuzAyarla, rumuzGetir } from '@/lib/er-meydani';

/** Tohum ↔ paylaşılabilir kısa kod (base36). */
function seedToKod(seed: number): string {
  return seed.toString(36).toUpperCase();
}
function kodToSeed(kod: string): number | null {
  const s = parseInt(kod.trim().toLowerCase(), 36);
  return Number.isFinite(s) && s > 0 ? s : null;
}

/** ER MEYDANI — LOBİ. Takma ad + hızlı eşleş + arkadaş kodu + sıralama. */
export default function ErMeydaniScreen() {
  const router = useRouter();
  const [rumuz, setRumuz] = useState<string | null>(null);
  const [yuklendi, setYuklendi] = useState(false);
  const [duzenle, setDuzenle] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let iptal = false;
      void rumuzGetir().then((r) => {
        if (iptal) return;
        setRumuz(r);
        setYuklendi(true);
      });
      return () => {
        iptal = true;
      };
    }, []),
  );

  const playAktif = !!rumuz;

  function hizliEslesme() {
    if (!playAktif) return;
    router.push({ pathname: '/er-meydani-mac', params: { seed: String(seedUret()), mod: 'hizli' } });
  }

  async function davetEt() {
    if (!playAktif) return;
    const seed = seedUret();
    try {
      await Share.share({
        message: `Seni Er Meydanı'na davet ediyorum! Kod: ${seedToKod(seed)} — Mevzu (JSPS Hazırlık) uygulamasında bu kodla aynı 10 soruda benimle yarış. Bakalım kim daha hızlı ve doğru! 💪`,
      });
    } catch {
      /* iptal */
    }
    router.push({ pathname: '/er-meydani-mac', params: { seed: String(seed), mod: 'arkadas' } });
  }

  return (
    <Screen title="Er Meydanı" onGeri={() => router.back()} headerAltinCizgi>
      <View style={styles.girisKart}>
        <MaterialCommunityIcons name="sword-cross" size={30} color={Palette.altinKoyu} />
        <AppText variant="kucuk" color="anaMetin" style={styles.girisMetin}>
          10 soru, tek rakip. En hızlı ve en doğru cevaplayan kazanır. Ücretsiz — arkadaşını çağır, meydana çık!
        </AppText>
      </View>

      {/* Takma ad */}
      {!yuklendi ? (
        <ActivityIndicator color={Palette.lacivert} style={styles.yukleniyor} />
      ) : rumuz && !duzenle ? (
        <View style={styles.rumuzOzet}>
          <MaterialCommunityIcons name="account-circle" size={22} color={Palette.lacivert} />
          <AppText variant="govde" color="anaMetin" bold style={styles.rumuzAd} numberOfLines={1}>
            {rumuz}
          </AppText>
          <Pressable hitSlop={10} onPress={() => setDuzenle(true)}>
            <AppText variant="kucuk" color="lacivert" bold>Değiştir</AppText>
          </Pressable>
        </View>
      ) : (
        <RumuzForm
          mevcut={rumuz}
          onKaydedildi={(yeni) => {
            setRumuz(yeni);
            setDuzenle(false);
          }}
          onVazgec={rumuz ? () => setDuzenle(false) : undefined}
        />
      )}

      {!playAktif && yuklendi ? (
        <AppText variant="kucuk" color="amber" bold style={styles.uyari}>
          Meydana çıkmadan önce bir takma ad seç (sıralamada bu görünecek).
        </AppText>
      ) : null}

      {/* Aksiyonlar */}
      <Pressable
        disabled={!playAktif}
        onPress={hizliEslesme}
        style={({ pressed }) => [styles.anaBtn, !playAktif && styles.pasif, pressed && styles.basili]}>
        <MaterialCommunityIcons name="flash" size={24} color={Palette.beyaz} />
        <View style={styles.btnMetin}>
          <AppText variant="govde" color="beyaz" bold>Hızlı Eşleş</AppText>
          <AppText variant="etiket" color="beyaz">Hemen bir rakiple 10 soru</AppText>
        </View>
      </Pressable>

      <Pressable
        disabled={!playAktif}
        onPress={davetEt}
        style={({ pressed }) => [styles.ikincilBtn, !playAktif && styles.pasif, pressed && styles.basili]}>
        <MaterialCommunityIcons name="account-multiple-plus" size={22} color={Palette.lacivert} />
        <View style={styles.btnMetin}>
          <AppText variant="govde" color="lacivert" bold>Arkadaşını Davet Et</AppText>
          <AppText variant="etiket" color="solukMetin">Kod paylaş, aynı sorularla yarışın</AppText>
        </View>
      </Pressable>

      <KodlaKatil aktif={playAktif} onKatil={(seed) => router.push({ pathname: '/er-meydani-mac', params: { seed: String(seed), mod: 'arkadas' } })} />

      <Pressable
        onPress={() => router.push('/er-meydani-siralama')}
        style={({ pressed }) => [styles.ikincilBtn, pressed && styles.basili]}>
        <MaterialCommunityIcons name="podium-gold" size={22} color={Palette.lacivert} />
        <View style={styles.btnMetin}>
          <AppText variant="govde" color="lacivert" bold>Haftalık Sıralama</AppText>
          <AppText variant="etiket" color="solukMetin">Zirveye kim oynuyor?</AppText>
        </View>
      </Pressable>
    </Screen>
  );
}

function RumuzForm({
  mevcut,
  onKaydedildi,
  onVazgec,
}: {
  mevcut: string | null;
  onKaydedildi: (yeni: string) => void;
  onVazgec?: () => void;
}) {
  const [deger, setDeger] = useState(mevcut ?? '');
  const [hata, setHata] = useState<string | null>(null);
  const [kaydediliyor, setKaydediliyor] = useState(false);

  async function kaydet() {
    const v = deger.trim();
    if (v.length < 3 || kaydediliyor) return;
    setKaydediliyor(true);
    setHata(null);
    const sonuc = await rumuzAyarla(v);
    setKaydediliyor(false);
    if (sonuc.ok) onKaydedildi(v);
    else setHata(sonuc.hata ?? 'Kaydedilemedi.');
  }

  return (
    <View style={styles.rumuzForm}>
      <AppText variant="etiket" color="solukMetin" bold>TAKMA AD (SIRALAMADA GÖRÜNÜR)</AppText>
      <TextInput
        style={styles.girdi}
        value={deger}
        onChangeText={setDeger}
        placeholder="Örn. Şahin34"
        placeholderTextColor={Palette.solukMetin}
        maxLength={16}
        autoCapitalize="words"
        editable={!kaydediliyor}
      />
      {hata ? (
        <AppText variant="kucuk" color="kirmizi" bold>{hata}</AppText>
      ) : (
        <AppText variant="etiket" color="solukMetin">3-16 karakter · harf, rakam, boşluk</AppText>
      )}
      <View style={styles.rumuzBtnSatir}>
        {onVazgec ? (
          <Pressable style={({ pressed }) => [styles.vazgecBtn, pressed && styles.basili]} onPress={onVazgec}>
            <AppText variant="govde" color="solukMetin" bold>Vazgeç</AppText>
          </Pressable>
        ) : null}
        <Pressable
          style={({ pressed }) => [styles.kaydetBtn, (deger.trim().length < 3 || kaydediliyor) && styles.pasif, pressed && styles.basili]}
          disabled={deger.trim().length < 3 || kaydediliyor}
          onPress={() => void kaydet()}>
          {kaydediliyor ? (
            <ActivityIndicator color={Palette.beyaz} />
          ) : (
            <AppText variant="govde" color="beyaz" bold>Kaydet</AppText>
          )}
        </Pressable>
      </View>
    </View>
  );
}

function KodlaKatil({ aktif, onKatil }: { aktif: boolean; onKatil: (seed: number) => void }) {
  const [ac, setAc] = useState(false);
  const [kod, setKod] = useState('');
  const [hata, setHata] = useState(false);

  if (!ac) {
    return (
      <Pressable
        disabled={!aktif}
        onPress={() => setAc(true)}
        style={({ pressed }) => [styles.ikincilBtn, !aktif && styles.pasif, pressed && styles.basili]}>
        <MaterialCommunityIcons name="key-variant" size={22} color={Palette.lacivert} />
        <View style={styles.btnMetin}>
          <AppText variant="govde" color="lacivert" bold>Kodla Katıl</AppText>
          <AppText variant="etiket" color="solukMetin">Arkadaşının kodunu gir</AppText>
        </View>
      </Pressable>
    );
  }

  function katil() {
    const seed = kodToSeed(kod);
    if (seed === null) {
      setHata(true);
      return;
    }
    onKatil(seed);
  }

  return (
    <View style={styles.kodForm}>
      <AppText variant="etiket" color="solukMetin" bold>ARKADAŞININ KODU</AppText>
      <TextInput
        style={styles.girdi}
        value={kod}
        onChangeText={(t) => {
          setKod(t);
          setHata(false);
        }}
        placeholder="Örn. K7QMX2"
        placeholderTextColor={Palette.solukMetin}
        autoCapitalize="characters"
        autoCorrect={false}
      />
      {hata ? <AppText variant="kucuk" color="kirmizi" bold>Geçersiz kod.</AppText> : null}
      <View style={styles.rumuzBtnSatir}>
        <Pressable style={({ pressed }) => [styles.vazgecBtn, pressed && styles.basili]} onPress={() => setAc(false)}>
          <AppText variant="govde" color="solukMetin" bold>Vazgeç</AppText>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.kaydetBtn, kod.trim().length === 0 && styles.pasif, pressed && styles.basili]}
          disabled={kod.trim().length === 0}
          onPress={katil}>
          <AppText variant="govde" color="beyaz" bold>Katıl</AppText>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  girisKart: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.three,
    backgroundColor: Palette.altinSolukYuzey, borderRadius: Radius.l, padding: Spacing.three,
  },
  girisMetin: { flex: 1, lineHeight: 21 },
  yukleniyor: { marginVertical: Spacing.three },
  rumuzOzet: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.two,
    backgroundColor: Palette.kartKremi, borderWidth: 1, borderColor: Palette.kenarlik,
    borderRadius: Radius.m, padding: Spacing.three,
  },
  rumuzAd: { flex: 1 },
  rumuzForm: {
    backgroundColor: Palette.kartKremi, borderWidth: 1, borderColor: Palette.kenarlik,
    borderRadius: Radius.m, padding: Spacing.three, gap: Spacing.two,
  },
  kodForm: {
    backgroundColor: Palette.kartKremi, borderWidth: 1, borderColor: Palette.kenarlik,
    borderRadius: Radius.m, padding: Spacing.three, gap: Spacing.two,
  },
  girdi: {
    backgroundColor: Palette.beyaz, borderColor: Palette.kenarlik, borderWidth: 1,
    borderRadius: Radius.m, padding: Spacing.three, fontSize: 16, color: Palette.anaMetin,
  },
  rumuzBtnSatir: { flexDirection: 'row', gap: Spacing.two, marginTop: Spacing.one },
  vazgecBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Palette.kremZemin, borderWidth: 1, borderColor: Palette.kenarlik,
    borderRadius: Radius.m, paddingVertical: Spacing.three,
  },
  kaydetBtn: {
    flex: 2, alignItems: 'center', justifyContent: 'center',
    backgroundColor: Palette.lacivert, borderRadius: Radius.m, paddingVertical: Spacing.three,
  },
  uyari: { textAlign: 'center' },
  anaBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.three,
    backgroundColor: Palette.lacivert, borderRadius: Radius.m, padding: Spacing.three,
  },
  ikincilBtn: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.three,
    backgroundColor: Palette.kartKremi, borderWidth: 1, borderColor: Palette.kenarlik,
    borderRadius: Radius.m, padding: Spacing.three,
  },
  btnMetin: { flex: 1, gap: 2 },
  pasif: { opacity: 0.45 },
  basili: { opacity: 0.85 },
});
