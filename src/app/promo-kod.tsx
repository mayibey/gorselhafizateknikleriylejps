import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Screen } from '@/components/ui/screen';
import { Palette, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';
import { promoKodKullan } from '@/lib/promo';
import { useUyelik } from '@/lib/uyelik-context';

/** Promosyon kodu ekranı — kod gir → premium aç. Sunucu doğrular, başarılıysa üyelik yenilenir. */
export default function PromoKodScreen() {
  const router = useRouter();
  const { kullanici } = useAuth();
  const { yenile } = useUyelik();

  const [kod, setKod] = useState('');
  const [gonderiliyor, setGonderiliyor] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [basarili, setBasarili] = useState(false);

  async function kullan() {
    const temiz = kod.trim().toUpperCase();
    if (!temiz || gonderiliyor) return;
    setGonderiliyor(true);
    setHata(null);
    const sonuc = await promoKodKullan(temiz);
    if (sonuc.ok) {
      await yenile(); // premium hemen açılsın
      setBasarili(true);
    } else {
      setHata(sonuc.mesaj);
    }
    setGonderiliyor(false);
  }

  // Giriş yoksa: kod kullanmak için hesap gerekir.
  if (!kullanici) {
    return (
      <Screen title="Promosyon Kodu" onGeri={() => router.back()}>
        <View style={styles.merkez}>
          <MaterialCommunityIcons name="account-lock-outline" size={56} color={Palette.solukMetin} />
          <AppText variant="govde" color="solukMetin" style={styles.ortala}>
            Kodu kullanmak için önce giriş yapmalısın.
          </AppText>
          <Pressable style={styles.buton} onPress={() => router.push('/giris')}>
            <AppText variant="govde" color="beyaz" bold>
              Giriş Yap
            </AppText>
          </Pressable>
        </View>
      </Screen>
    );
  }

  // Başarı ekranı.
  if (basarili) {
    return (
      <Screen title="Promosyon Kodu" onGeri={() => router.back()}>
        <View style={styles.merkez}>
          <MaterialCommunityIcons name="check-decagram" size={64} color={Palette.yesil} />
          <AppText variant="baslik" bold style={styles.ortala}>
            Kod kabul edildi 🎖️
          </AppText>
          <AppText variant="govde" color="solukMetin" style={styles.ortala}>
            Erişimin açıldı. İyi çalışmalar!
          </AppText>
          <Pressable style={styles.buton} onPress={() => router.back()}>
            <AppText variant="govde" color="beyaz" bold>
              Tamam
            </AppText>
          </Pressable>
        </View>
      </Screen>
    );
  }

  const pasif = kod.trim().length === 0 || gonderiliyor;

  return (
    <Screen title="Promosyon Kodu" onGeri={() => router.back()}>
      <AppText variant="govde" color="solukMetin">
        Elindeki promosyon kodunu gir, erişimin anında açılsın.
      </AppText>

      <TextInput
        style={styles.giris}
        value={kod}
        onChangeText={(t) => {
          setKod(t.toUpperCase());
          if (hata) setHata(null);
        }}
        placeholder="ÖRN: JSPS2026"
        placeholderTextColor={Palette.solukMetin}
        autoCapitalize="characters"
        autoCorrect={false}
        autoComplete="off"
        maxLength={40}
        editable={!gonderiliyor}
        returnKeyType="done"
        onSubmitEditing={() => void kullan()}
      />

      {hata ? (
        <AppText variant="kucuk" color="kirmizi" bold>
          {hata}
        </AppText>
      ) : null}

      <Pressable style={[styles.buton, pasif && styles.butonPasif]} disabled={pasif} onPress={() => void kullan()}>
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
});
