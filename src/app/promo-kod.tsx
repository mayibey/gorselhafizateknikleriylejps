import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Platform, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Screen } from '@/components/ui/screen';
import { Palette, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';
import { indirimKoduKullan } from '@/lib/indirim';
import { useKisiselOzellik } from '@/lib/ozellik';
import { promoKodKullan } from '@/lib/promo';
import { useUyelik } from '@/lib/uyelik-context';

/** Promosyon kodu ekranı — kod gir → premium aç. Sunucu doğrular, başarılıysa üyelik yenilenir. */
export default function PromoKodScreen() {
  const router = useRouter();
  const gece = useKisiselOzellik('talim-mevzuata');
  const { kullanici } = useAuth();
  const { yenile } = useUyelik();

  const [kod, setKod] = useState('');
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  // Başarı iki türlü: 'acildi' = bedava tam erişim; 'indirim' = yıllıkta %yuzde indirim tanımlandı.
  const [basari, setBasari] = useState<{ tip: 'acildi' } | { tip: 'indirim'; yuzde: number } | null>(null);

  // iOS'ta promo kod ERİŞİLEMEZ (Apple 3.1.1: içerik App Store dışı mekanizmayla açılamaz). Menü
  // linkleri zaten gizli; deep-link'le açılsa bile burada ana ekrana geri atılır → ekran inert.
  useEffect(() => {
    if (Platform.OS === 'ios') router.replace('/');
  }, [router]);
  if (Platform.OS === 'ios') return null;

  async function kullan() {
    const temiz = kod.trim().toUpperCase();
    if (!temiz || gonderiliyor) return;
    setGonderiliyor(true);
    setHata(null);
    // Önce BEDAVA erişim kodu dene; olmazsa İNDİRİM kodu dene (tek kutu, iki tür kod).
    const bedava = await promoKodKullan(temiz);
    if (bedava.ok) {
      await yenile(); // premium hemen açılsın
      setBasari({ tip: 'acildi' });
      setGonderiliyor(false);
      return;
    }
    const indirim = await indirimKoduKullan(temiz);
    if (indirim.ok) {
      setBasari({ tip: 'indirim', yuzde: indirim.yuzde });
      setGonderiliyor(false);
      return;
    }
    setHata(bedava.mesaj); // ikisi de olmadı → geçersiz kod mesajı
    setGonderiliyor(false);
  }

  // Giriş yoksa: kod kullanmak için hesap gerekir.
  if (!kullanici) {
    return (
      <Screen title="Promosyon Kodu" onGeri={() => router.back()} koyu={gece} kompaktBaslik={gece}>
        <View style={styles.merkez}>
          <MaterialCommunityIcons
            name="account-lock-outline"
            size={56}
            color={gece ? Palette.kartMetinIkincil : Palette.solukMetin}
          />
          <AppText variant="govde" color={gece ? 'kartMetinIkincil' : 'solukMetin'} style={styles.ortala}>
            Kodu kullanmak için önce giriş yapmalısın.
          </AppText>
          <Pressable style={[styles.buton, gece && styles.butonGece]} onPress={() => router.push('/giris')}>
            <AppText variant="govde" color="beyaz" bold>
              Giriş Yap
            </AppText>
          </Pressable>
        </View>
      </Screen>
    );
  }

  // Başarı ekranı — bedava erişim mi, indirim mi?
  if (basari) {
    const indirimMi = basari.tip === 'indirim';
    return (
      <Screen title="Promosyon Kodu" onGeri={() => router.back()} koyu={gece} kompaktBaslik={gece}>
        <View style={styles.merkez}>
          <MaterialCommunityIcons name="check-decagram" size={64} color={Palette.yesil} />
          <AppText variant="baslik" bold color={gece ? 'beyaz' : 'anaMetin'} style={styles.ortala}>
            {indirimMi ? `%${basari.yuzde} indirim tanımlandı` : 'Kod kabul edildi 🎖️'}
          </AppText>
          <AppText variant="govde" color={gece ? 'kartMetinIkincil' : 'solukMetin'} style={styles.ortala}>
            {indirimMi
              ? 'Yıllık ya da ömür boyu üyeliği seçtiğinde indirim fiyatına yansıyacak.'
              : 'Erişimin açıldı. İyi çalışmalar!'}
          </AppText>
          <Pressable
            style={[styles.buton, gece && styles.butonGece]}
            onPress={() => (indirimMi ? router.replace('/paywall') : router.back())}>
            <AppText variant="govde" color="beyaz" bold>
              {indirimMi ? 'Yıllık Planı Gör' : 'Tamam'}
            </AppText>
          </Pressable>
        </View>
      </Screen>
    );
  }

  const pasif = kod.trim().length === 0 || gonderiliyor;

  return (
    <Screen title="Promosyon Kodu" onGeri={() => router.back()} koyu={gece} kompaktBaslik={gece}>
      <AppText variant="govde" color={gece ? 'beyaz' : 'solukMetin'}>
        Elindeki promosyon veya indirim kodunu gir. Bedava erişim kodları anında açar; indirim
        kodları üyelik fiyatına yansır.
      </AppText>

      <TextInput
        style={[styles.giris, gece && styles.girisGece]}
        value={kod}
        onChangeText={(t) => {
          setKod(t.toUpperCase());
          if (hata) setHata(null);
        }}
        placeholder="ÖRN: JSPS2026"
        placeholderTextColor={gece ? 'rgba(226,236,240,0.5)' : Palette.solukMetin}
        autoCapitalize="characters"
        autoCorrect={false}
        autoComplete="off"
        maxLength={40}
        editable={!gonderiliyor}
        returnKeyType="done"
        onSubmitEditing={() => void kullan()}
      />

      {hata ? (
        <AppText variant="kucuk" color={gece ? 'kirmiziParlak' : 'kirmizi'} bold>
          {hata}
        </AppText>
      ) : null}

      <Pressable
        style={[styles.buton, gece && styles.butonGece, pasif && styles.butonPasif]}
        disabled={pasif}
        onPress={() => void kullan()}>
        {gonderiliyor ? (
          <ActivityIndicator color={Palette.beyaz} />
        ) : (
          <AppText variant="govde" color="beyaz" bold>
            Kodu Kullan
          </AppText>
        )}
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  giris: {
    backgroundColor: Palette.kartKremi,
    borderColor: Palette.kenarlik,
    borderWidth: 1,
    borderRadius: Radius.m,
    padding: Spacing.three,
    fontSize: 18,
    letterSpacing: 1,
    color: Palette.lacivert,
  },
  buton: {
    backgroundColor: Palette.lacivert,
    borderRadius: Radius.m,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    alignItems: 'center',
  },
  butonPasif: {
    opacity: 0.4,
  },
  merkez: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
    minHeight: 260,
  },
  ortala: {
    textAlign: 'center',
  },
  // Gece dili (bayraklı)
  girisGece: {
    backgroundColor: 'rgba(3,40,56,0.7)',
    borderColor: 'rgba(126,205,218,0.5)',
    color: Palette.beyaz,
  },
  butonGece: {
    backgroundColor: 'rgba(3,40,56,0.9)',
    borderWidth: 1,
    borderColor: '#F3C24A',
  },
});
