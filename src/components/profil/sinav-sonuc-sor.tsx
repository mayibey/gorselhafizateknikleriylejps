import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/app-text';
import { Palette, Radius, Spacing } from '@/constants/theme';
import { SEED_BRANCHES } from '@/db/seed';
import { RUTBELER, type Rutbe } from '@/lib/rutbe-store';
import { puanCoz, puanYaz, RUTBE_BRANSLARI, sinavSonucuKaydet } from '@/lib/sinav-sonuc';

const BRANS_AD: Record<string, string> = Object.fromEntries(SEED_BRANCHES.map((b) => [b.slug, b.ad]));

/**
 * SINAV SONUCU KAPISI (2 Kas 2026, başkan): 10 Ekim 2026 JSPS sonucunu sorar. Uygulamaya girmeden
 * önce bir kez çıkar; puan yazmadan ya da "Sınava girmedim" demeden geçilmez. Branş/rütbe cihazdaki
 * seçimle gelir, yanlışsa burada değiştirilebilir (yalnız bu kayıt için; uygulama ayarına dokunmaz).
 * `duzenleme`: Evsaf'tan sonradan düzeltme — önceki cevap dolu gelir, "Vazgeç" ile kapanır.
 */
export function SinavSonucSor({
  ilkBrans,
  ilkRutbe,
  ilkGirmedi,
  ilkPuan,
  duzenleme = false,
  onTamam,
  onVazgec,
}: {
  ilkBrans: string | null;
  ilkRutbe: Rutbe | null;
  ilkGirmedi?: boolean;
  ilkPuan?: number | null;
  duzenleme?: boolean;
  onTamam: () => void;
  onVazgec?: () => void;
}) {
  const [rutbe, setRutbe] = useState<Rutbe | null>(ilkRutbe);
  const [brans, setBrans] = useState<string | null>(() =>
    ilkRutbe && ilkBrans && RUTBE_BRANSLARI[ilkRutbe].includes(ilkBrans) ? ilkBrans : null,
  );
  const [secim, setSecim] = useState<'puan' | 'girmedi' | null>(
    ilkGirmedi ? 'girmedi' : ilkPuan != null ? 'puan' : null,
  );
  const [puanMetin, setPuanMetin] = useState(ilkPuan != null ? puanYaz(ilkPuan) : '');
  const [hata, setHata] = useState<string | null>(null);
  const [kaydediliyor, setKaydediliyor] = useState(false);

  function rutbeSec(r: Rutbe) {
    setRutbe(r);
    setHata(null);
    const izinli = RUTBE_BRANSLARI[r];
    if (!brans || !izinli.includes(brans)) setBrans(izinli.length === 1 ? izinli[0] : null);
  }

  async function gonder() {
    if (!rutbe) return setHata('Rütbenizi seçin.');
    if (!brans) return setHata('Branşınızı seçin.');
    if (!secim) return setHata('Puanınızı yazın ya da "Sınava girmedim" seçeneğini işaretleyin.');
    const puan = secim === 'puan' ? puanCoz(puanMetin) : null;
    if (secim === 'puan' && puan === null) return setHata('Puanınızı 0 ile 100 arasında yazın (örn. 59,59).');
    setKaydediliyor(true);
    setHata(null);
    try {
      await sinavSonucuKaydet({ rutbe, brans, girmedi: secim === 'girmedi', puan });
      onTamam();
    } catch {
      setHata('Gönderilemedi. İnternet bağlantınızı kontrol edip tekrar deneyin.');
    } finally {
      setKaydediliyor(false);
    }
  }

  return (
    <SafeAreaView style={styles.kok}>
      <KeyboardAvoidingView style={styles.kok} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.icerik} keyboardShouldPersistTaps="handled">
          <AppText variant="etiket" color="altinKoyu" style={styles.ust}>
            JSPS · 10 EKİM 2026
          </AppText>
          <AppText variant="baslik" color="lacivert">
            {duzenleme ? 'Sınav sonucunuzu düzenleyin' : 'Sınav sonucunuzu bizimle paylaşmak ister misiniz?'}
          </AppText>
          <AppText variant="govde" color="anaMetin" style={styles.aciklama}>
            {duzenleme
              ? 'Yanlış girdiyseniz düzeltip kaydedin; önceki cevabınızın yerine geçer.'
              : 'Kaç aldığınızı paylaşırsanız hazırlık içeriklerimizi buna göre geliştireceğiz. Bilgileriniz yalnızca istatistik için kullanılır, adınız hiçbir yerde yayınlanmaz.'}
          </AppText>

          <AppText variant="etiket" color="solukMetin" style={styles.etiket}>
            RÜTBE
          </AppText>
          <View style={styles.cipler}>
            {RUTBELER.map((r) => (
              <Cip key={r.slug} ad={r.ad} secili={rutbe === r.slug} onPress={() => rutbeSec(r.slug)} />
            ))}
          </View>

          <AppText variant="etiket" color="solukMetin" style={styles.etiket}>
            BRANŞ
          </AppText>
          {rutbe ? (
            <View style={styles.cipler}>
              {RUTBE_BRANSLARI[rutbe].map((b) => (
                <Cip
                  key={b}
                  ad={BRANS_AD[b] ?? b}
                  secili={brans === b}
                  onPress={() => {
                    setBrans(b);
                    setHata(null);
                  }}
                />
              ))}
            </View>
          ) : (
            <AppText variant="kucuk" color="solukMetin">
              Önce rütbenizi seçin.
            </AppText>
          )}

          <AppText variant="etiket" color="solukMetin" style={styles.etiket}>
            SONUCUNUZ
          </AppText>
          <Pressable
            onPress={() => {
              setSecim('puan');
              setHata(null);
            }}
            style={[styles.secenek, secim === 'puan' && styles.secenekSecili]}
            accessibilityRole="radio"
            accessibilityState={{ checked: secim === 'puan' }}>
            <Isaret secili={secim === 'puan'} />
            <AppText variant="govde" color="anaMetin" style={styles.secenekYazi}>
              Puanımı yazayım
            </AppText>
          </Pressable>
          {secim === 'puan' ? (
            <TextInput
              value={puanMetin}
              onChangeText={(t) => {
                setPuanMetin(t.replace(/[^0-9.,]/g, ''));
                setHata(null);
              }}
              placeholder="Örn. 59,59"
              placeholderTextColor={Palette.solukMetin}
              keyboardType="decimal-pad"
              maxLength={6}
              autoFocus={!duzenleme}
              style={styles.girdi}
              returnKeyType="done"
              onSubmitEditing={() => void gonder()}
            />
          ) : null}
          <Pressable
            onPress={() => {
              setSecim('girmedi');
              setHata(null);
            }}
            style={[styles.secenek, secim === 'girmedi' && styles.secenekSecili]}
            accessibilityRole="radio"
            accessibilityState={{ checked: secim === 'girmedi' }}>
            <Isaret secili={secim === 'girmedi'} />
            <AppText variant="govde" color="anaMetin" style={styles.secenekYazi}>
              Sınava girmedim
            </AppText>
          </Pressable>

          {hata ? (
            <AppText variant="kucuk" color="kirmizi" style={styles.hata}>
              {hata}
            </AppText>
          ) : null}

          <Pressable
            onPress={() => void gonder()}
            disabled={kaydediliyor}
            style={({ pressed }) => [styles.buton, (pressed || kaydediliyor) && styles.basili]}
            accessibilityRole="button">
            {kaydediliyor ? (
              <ActivityIndicator color={Palette.beyaz} />
            ) : (
              <AppText variant="govde" bold color="beyaz">
                {duzenleme ? 'Kaydet' : 'Gönder ve devam et'}
              </AppText>
            )}
          </Pressable>
          {duzenleme && onVazgec ? (
            <Pressable onPress={onVazgec} disabled={kaydediliyor} style={styles.vazgec} accessibilityRole="button">
              <AppText variant="govde" color="solukMetin">
                Vazgeç
              </AppText>
            </Pressable>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Cip({ ad, secili, onPress }: { ad: string; secili: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.cip, secili && styles.cipSecili]}
      accessibilityRole="radio"
      accessibilityState={{ checked: secili }}>
      <AppText variant="kucuk" bold color={secili ? 'beyaz' : 'anaMetin'}>
        {ad}
      </AppText>
    </Pressable>
  );
}

function Isaret({ secili }: { secili: boolean }) {
  return <View style={[styles.isaret, secili && styles.isaretSecili]}>{secili ? <View style={styles.isaretIc} /> : null}</View>;
}

const styles = StyleSheet.create({
  kok: { flex: 1, backgroundColor: Palette.kremZemin },
  icerik: { padding: Spacing.four, paddingTop: Spacing.five, gap: Spacing.two, maxWidth: 520, width: '100%', alignSelf: 'center' },
  ust: { letterSpacing: 1.5 },
  aciklama: { marginTop: Spacing.two, marginBottom: Spacing.two, lineHeight: 22 },
  etiket: { marginTop: Spacing.three, letterSpacing: 1 },
  cipler: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  cip: {
    borderWidth: 1,
    borderColor: Palette.kenarlik,
    backgroundColor: Palette.kartKremi,
    borderRadius: Radius.s,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two + 2,
  },
  cipSecili: { backgroundColor: Palette.lacivert2, borderColor: Palette.lacivert2 },
  secenek: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderWidth: 1,
    borderColor: Palette.kenarlik,
    backgroundColor: Palette.kartKremi,
    borderRadius: Radius.m,
    padding: Spacing.three,
  },
  secenekSecili: { borderColor: Palette.lacivert2, borderWidth: 2 },
  secenekYazi: { flex: 1 },
  isaret: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Palette.solukMetin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  isaretSecili: { borderColor: Palette.lacivert2 },
  isaretIc: { width: 11, height: 11, borderRadius: 6, backgroundColor: Palette.lacivert2 },
  girdi: {
    borderWidth: 1,
    borderColor: Palette.kenarlik,
    backgroundColor: Palette.kartKremi,
    borderRadius: Radius.m,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    fontSize: 20,
    color: Palette.anaMetin,
  },
  hata: { marginTop: Spacing.two },
  buton: {
    marginTop: Spacing.four,
    backgroundColor: Palette.lacivert,
    borderRadius: Radius.m,
    paddingVertical: Spacing.three,
    alignItems: 'center',
  },
  basili: { opacity: 0.7 },
  vazgec: { alignItems: 'center', paddingVertical: Spacing.three },
});
