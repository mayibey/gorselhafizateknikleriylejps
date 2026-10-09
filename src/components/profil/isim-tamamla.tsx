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
import { profilKaydet } from '@/lib/auth';
import { isimBicimle, isimSorunu } from '@/lib/isim-dogrula';

/**
 * AD SOYAD TAMAMLAMA KAPISI (9 Eki 2026, başkan). Profilinde ad/soyad boş ya da uydurma olan
 * kullanıcıya uygulamaya girmeden ÖNCE bir kez çıkar; geçerli ad soyad yazmadan geçilmez (çıkış
 * yapılabilir). Amaç ekranda açıkça yazılı: başarı belgesi, ödül-ceza sistemi, kişiye özel içerik
 * güvenliği. Denetim kuralları: lib/isim-dogrula.
 */
export function IsimTamamla({
  ilkAd,
  ilkSoyad,
  onTamam,
  onCikis,
}: {
  ilkAd: string | null;
  ilkSoyad: string | null;
  onTamam: (ad: string, soyad: string) => void;
  onCikis: () => void;
}) {
  // Uydurma değerleri ön-doldurma (kullanıcı silmekle uğraşmasın); geçerli parça varsa kalsın.
  const [ad, setAd] = useState(() => (ilkAd && !/\d/.test(ilkAd) ? ilkAd : ''));
  const [soyad, setSoyad] = useState(() => (ilkSoyad && !/\d/.test(ilkSoyad) ? ilkSoyad : ''));
  const [hata, setHata] = useState<string | null>(null);
  const [kaydediliyor, setKaydediliyor] = useState(false);

  async function kaydet() {
    const sorun = isimSorunu(ad, soyad);
    if (sorun) {
      setHata(sorun);
      return;
    }
    const a = isimBicimle(ad);
    const s = isimBicimle(soyad);
    setKaydediliyor(true);
    setHata(null);
    try {
      await profilKaydet({ ad: a, soyad: s });
      onTamam(a, s);
    } catch {
      setHata('Kaydedilemedi. İnternet bağlantınızı kontrol edip tekrar deneyin.');
    } finally {
      setKaydediliyor(false);
    }
  }

  return (
    <SafeAreaView style={styles.kok}>
      <KeyboardAvoidingView style={styles.kok} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.icerik} keyboardShouldPersistTaps="handled">
          <AppText variant="baslik" color="lacivert">
            Ad soyadınızı tamamlayın
          </AppText>
          <AppText variant="govde" color="anaMetin" style={styles.aciklama}>
            Adınız ve soyadınız başarı belgelerinize yazılır, ödül-ceza sisteminde ve size özel içerik
            güvenliğinde kullanılır. Lütfen gerçek adınızı ve soyadınızı yazın.
          </AppText>

          <AppText variant="etiket" color="solukMetin" style={styles.etiket}>
            AD
          </AppText>
          <TextInput
            value={ad}
            onChangeText={(t) => {
              setAd(t);
              setHata(null);
            }}
            placeholder="Adınız"
            placeholderTextColor={Palette.solukMetin}
            autoCapitalize="words"
            autoComplete="given-name"
            textContentType="givenName"
            maxLength={40}
            style={styles.girdi}
            returnKeyType="next"
          />
          <AppText variant="etiket" color="solukMetin" style={styles.etiket}>
            SOYAD
          </AppText>
          <TextInput
            value={soyad}
            onChangeText={(t) => {
              setSoyad(t);
              setHata(null);
            }}
            placeholder="Soyadınız"
            placeholderTextColor={Palette.solukMetin}
            autoCapitalize="words"
            autoComplete="family-name"
            textContentType="familyName"
            maxLength={40}
            style={styles.girdi}
            returnKeyType="done"
            onSubmitEditing={() => void kaydet()}
          />

          {hata ? (
            <AppText variant="kucuk" color="kirmizi" style={styles.hata}>
              {hata}
            </AppText>
          ) : null}

          <Pressable
            onPress={() => void kaydet()}
            disabled={kaydediliyor}
            style={({ pressed }) => [styles.buton, (pressed || kaydediliyor) && styles.basili]}
            accessibilityRole="button">
            {kaydediliyor ? (
              <ActivityIndicator color={Palette.beyaz} />
            ) : (
              <AppText variant="govde" bold color="beyaz">
                Kaydet ve devam et
              </AppText>
            )}
          </Pressable>

          <View style={styles.alt}>
            <Pressable onPress={onCikis} hitSlop={10} accessibilityRole="button">
              <AppText variant="kucuk" color="solukMetin" style={styles.cikis}>
                Hesaptan çık
              </AppText>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  kok: { flex: 1, backgroundColor: Palette.kremZemin },
  icerik: { padding: Spacing.four, paddingTop: Spacing.five, gap: Spacing.two, maxWidth: 520, width: '100%', alignSelf: 'center' },
  aciklama: { marginTop: Spacing.two, marginBottom: Spacing.three, lineHeight: 22 },
  etiket: { marginTop: Spacing.two, letterSpacing: 1 },
  girdi: {
    borderWidth: 1,
    borderColor: Palette.kenarlik,
    backgroundColor: Palette.kartKremi,
    borderRadius: Radius.m,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    fontSize: 17,
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
  alt: { alignItems: 'center', marginTop: Spacing.four },
  cikis: { textDecorationLine: 'underline' },
});
