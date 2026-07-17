import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Screen } from '@/components/ui/screen';
import { Palette, Radius, Spacing } from '@/constants/theme';
import { type DereceliDurum, dereceliDurumSorgu, dereceliGir, dereceliIptal } from '@/lib/er-meydani';

const ARAMA_SN = 60; // canlı arama (1 dk) — sonra HAVUZDA kalır (kayıt), rakip gelince bildirim.
// NOT: Havuza kayıt "Rakip Ara"ya basınca ANINDA sunucuda olur (kalıcı); bu sayaç yalnız ekrandaki
// canlı bekleme göstergesi. Arka plan/menü değişse de kayıt DURUR (yalnız "Aramayı iptal et" çıkarır).

/**
 * DERECELİ MAÇ — ASYNC (başkan kararı): sahte rakip YOK. Havuza kayıt olur; başkası kayıt olunca
 * eşleşir + BİLDİRİM ("maça başla"). Senkron değil — iki taraf bağımsız çözer, iki skor gelince sonuç.
 * Akış: aranıyor (120sn canlı) → eşleşti (oyna) / havuzda (kayıt oluştu) / sonuç bekleniyor / sonuç.
 */
export default function DereceliKuyrukScreen() {
  const router = useRouter();
  const [durum, setDurum] = useState<DereceliDurum | null>(null);
  const [kalanArama, setKalanArama] = useState(ARAMA_SN);
  const [havuzda, setHavuzda] = useState(false); // 120sn doldu, kalıcı havuzda bekliyor
  const gittiRef = useRef(false);

  // Eşleşti + henüz oynamadım → maç ekranına (async: rakibi beklemeden oyna).
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

  const isle = useCallback(
    (d: DereceliDurum | null) => {
      if (gittiRef.current || !d) return;
      setDurum(d);
      // Eşleşti + benim skorum yok → maça başla (oyna). Skorum varsa "sonuç bekleniyor" ekranı.
      if (d.durum === 'eslesti' && (d.benim_skor == null)) maca(d);
    },
    [maca],
  );

  // Kuyruğa gir + poll döngüsü (havuzda beklerken de eşleşmeyi yakalasın).
  useEffect(() => {
    let dur = false;
    void dereceliGir().then((d) => !dur && isle(d));
    const t = setInterval(() => {
      if (dur || gittiRef.current) return;
      void dereceliDurumSorgu().then((d) => !dur && isle(d));
    }, 3000);
    return () => {
      dur = true;
      clearInterval(t);
    };
  }, [isle]);

  // Canlı arama geri sayımı (araniyor'dayken). 0 → İPTAL ETME; havuzda kal (kayıt), bildirim beklenir.
  useEffect(() => {
    if (durum?.durum !== 'araniyor' || havuzda) return;
    const t = setInterval(() => {
      setKalanArama((s) => {
        if (s <= 1) {
          setHavuzda(true);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [durum?.durum, havuzda]);

  const donErMeydani = () => router.replace('/er-meydani');

  // ── HAVUZDA: kayıt oluştu, rakip bekleniyor ──
  if (havuzda && durum?.durum === 'araniyor') {
    return (
      <Screen title="Dereceli Maç" onGeri={donErMeydani} headerAltinCizgi>
        <View style={styles.orta}>
          <MaterialCommunityIcons name="clipboard-check-outline" size={56} color={Palette.yesil} />
          <AppText variant="baslik" color="anaMetin" bold style={styles.ortala}>
            Dereceli maç kaydın oluşturuldu ✓
          </AppText>
          <AppText variant="kucuk" color="solukMetin" style={styles.ortala}>
            Şu an başka arayan yok, seni havuza yazdım. Başka biri dereceli maç arayınca eşleşeceksin
            ve sana bildirim gelecek — o zaman girip maça başlarsın. Beklemene gerek yok.
          </AppText>
          <Pressable style={({ pressed }) => [styles.anaBtn, pressed && styles.basili]} onPress={donErMeydani}>
            <AppText variant="govde" color="beyaz" bold>Er Meydanı'na Dön</AppText>
          </Pressable>
        </View>
      </Screen>
    );
  }

  // ── SONUÇ BEKLENİYOR: ben oynadım, rakip henüz oynamadı ──
  if (durum?.durum === 'eslesti' && durum.benim_skor != null) {
    return (
      <Screen title="Dereceli Maç" onGeri={donErMeydani} headerAltinCizgi>
        <View style={styles.orta}>
          <MaterialCommunityIcons name="timer-sand" size={56} color={Palette.altinKoyu} />
          <AppText variant="baslik" color="anaMetin" bold style={styles.ortala}>Sonuç bekleniyor</AppText>
          <AppText variant="kucuk" color="solukMetin" style={styles.ortala}>
            Sen maçını tamamladın. {durum.rakip_rumuz ?? 'Rakibin'} da çözünce sonuç hesaplanacak ve
            sana bildirim gelecek.
          </AppText>
          <Pressable style={({ pressed }) => [styles.anaBtn, pressed && styles.basili]} onPress={donErMeydani}>
            <AppText variant="govde" color="beyaz" bold>Er Meydanı'na Dön</AppText>
          </Pressable>
        </View>
      </Screen>
    );
  }

  // ── SONUÇ: iki taraf da oynadı ──
  if (durum?.durum === 'bitti') {
    const kazandi = (durum.delta ?? 0) > 0;
    return (
      <Screen title="Dereceli Maç" onGeri={donErMeydani} headerAltinCizgi>
        <View style={styles.orta}>
          <MaterialCommunityIcons
            name={kazandi ? 'trophy' : 'flag-checkered'}
            size={56}
            color={kazandi ? Palette.altin : Palette.solukMetin}
          />
          <AppText variant="dev" color={kazandi ? 'altinMetin' : 'anaMetin'} bold style={styles.ortala}>
            {kazandi ? '🏆 Kazandın!' : 'Maç bitti'}
          </AppText>
          {durum.delta != null ? (
            <AppText variant="baslik" color={kazandi ? 'yesil' : 'kirmizi'} bold>
              {durum.delta > 0 ? '+' : ''}{durum.delta} puan
            </AppText>
          ) : null}
          {durum.yeni_rating != null ? (
            <AppText variant="kucuk" color="solukMetin">
              Yeni derecen: {durum.yeni_rating}{durum.kademe ? ` · ${durum.kademe}` : ''}
            </AppText>
          ) : null}
          <Pressable style={({ pressed }) => [styles.anaBtn, pressed && styles.basili]} onPress={donErMeydani}>
            <AppText variant="govde" color="beyaz" bold>Er Meydanı'na Dön</AppText>
          </Pressable>
        </View>
      </Screen>
    );
  }

  // ── ARANIYOR (canlı) ── Geri = havuzda KAL (kayıt sürer); yalnız "Aramayı iptal et" çıkarır.
  return (
    <Screen title="Dereceli Maç" onGeri={donErMeydani} headerAltinCizgi>
      <View style={styles.orta}>
        <ActivityIndicator size="large" color={Palette.altinKoyu} />
        <AppText variant="baslik" color="anaMetin" bold style={styles.ortala}>Rakip aranıyor…</AppText>
        <AppText variant="kucuk" color="solukMetin" style={styles.ortala}>
          Havuza kaydoldun (kaydın durur, çıksan da). Seninle aynı seviyede biri arayınca eşleşir ve
          sana bildirim gelir — beklemene gerek yok, çıkabilirsin.
        </AppText>
        <AppText variant="etiket" color="solukMetin">{kalanArama} sn</AppText>
        <Pressable
          style={({ pressed }) => [styles.anaBtn, pressed && styles.basili]}
          onPress={() => setHavuzda(true)}
          accessibilityRole="button">
          <MaterialCommunityIcons name="clipboard-check-outline" size={20} color={Palette.beyaz} />
          <AppText variant="govde" color="beyaz" bold>Beklemeden Havuza Kaydol</AppText>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.vazgecBtn, pressed && styles.basili]}
          onPress={() => { void dereceliIptal(); donErMeydani(); }}>
          <AppText variant="kucuk" color="solukMetin" bold>Aramayı iptal et (havuzdan çık)</AppText>
        </Pressable>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  orta: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.three, paddingBottom: Spacing.six, paddingHorizontal: Spacing.four },
  ortala: { textAlign: 'center' },
  anaBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: Spacing.two,
    backgroundColor: Palette.lacivert, borderRadius: Radius.m,
    paddingVertical: Spacing.three, paddingHorizontal: Spacing.six, marginTop: Spacing.two,
  },
  vazgecBtn: { paddingVertical: Spacing.two, paddingHorizontal: Spacing.four },
  basili: { opacity: 0.85 },
});
