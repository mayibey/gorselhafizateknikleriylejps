/**
 * Telefon ile giriş/kayıt — SMS tek kullanımlık kod (OTP). İki adım: numara → kod.
 * Yalnız uzak bayrak `telefon_giris` açıkken erişilir (auth ekranındaki buton bayrağa bağlı);
 * SMS'i sunucudaki sms-gonder köprüsü (MasGSM) yollar. Kod doğrulanınca oturum açılır,
 * yönlendirmeyi kök guard yapar (profil eksikse onboarding'e götürür).
 */
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AnaButon } from '@/components/auth/ana-buton';
import { AuthGirdi } from '@/components/auth/auth-girdi';
import { AppText } from '@/components/ui/app-text';
import { Screen } from '@/components/ui/screen';
import { Palette, Spacing } from '@/constants/theme';
import { telefonE164, telefonKodDogrula, telefonKodGonder } from '@/lib/auth';

export default function TelefonGirisScreen() {
  const router = useRouter();
  const [telefon, setTelefon] = useState('');
  const [kod, setKod] = useState('');
  const [adim, setAdim] = useState<'numara' | 'kod'>('numara');
  const [mesgul, setMesgul] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [sayac, setSayac] = useState(0); // tekrar gönder bekleme (sn)

  useEffect(() => {
    if (sayac <= 0) return;
    const t = setTimeout(() => setSayac((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [sayac]);

  const e164 = telefonE164(telefon);

  async function kodGonder() {
    if (!e164) return setHata('Geçerli bir telefon numarası gir (05xx xxx xx xx).');
    setHata(null);
    setMesgul(true);
    try {
      await telefonKodGonder(e164);
      setAdim('kod');
      setSayac(60);
    } catch {
      setHata('Kod gönderilemedi. Numaranı kontrol edip tekrar dene.');
    } finally {
      setMesgul(false);
    }
  }

  async function dogrula() {
    if (!e164 || kod.trim().length < 4) return setHata('SMS ile gelen kodu gir.');
    setHata(null);
    setMesgul(true);
    try {
      await telefonKodDogrula(e164, kod);
      router.back(); // oturum açıldı — yönlendirmeyi kök guard üstlenir
    } catch {
      setHata('Kod hatalı ya da süresi doldu. Tekrar dene.');
    } finally {
      setMesgul(false);
    }
  }

  return (
    <Screen title="Telefon ile Giriş" onGeri={() => router.back()}>
      <View style={styles.form}>
        <MaterialCommunityIcons
          name="cellphone-message"
          size={40}
          color={Palette.lacivert}
          style={styles.ikon}
        />
        {adim === 'numara' ? (
          <>
            <AppText variant="kucuk" color="solukMetin" style={styles.ortali}>
              Telefon numaranı yaz — SMS ile tek kullanımlık giriş kodu gönderelim. Hesabın yoksa
              otomatik oluşturulur.
            </AppText>
            <AuthGirdi
              ikon="phone-outline"
              placeholder="05xx xxx xx xx"
              value={telefon}
              onChangeText={setTelefon}
              keyboardType="phone-pad"
              autoCorrect={false}
              inputMode="tel"
            />
            {hata ? (
              <AppText variant="kucuk" color="kirmizi" bold style={styles.ortali}>
                {hata}
              </AppText>
            ) : null}
            <AnaButon etiket="Kodu SMS ile gönder" onPress={() => void kodGonder()} mesgul={mesgul} />
          </>
        ) : (
          <>
            <AppText variant="kucuk" color="solukMetin" style={styles.ortali}>
              {e164?.replace('+90', '0')} numarasına SMS ile bir kod gönderdik. Kodu aşağıya yaz:
            </AppText>
            <AuthGirdi
              ikon="numeric"
              placeholder="Doğrulama kodu"
              value={kod}
              onChangeText={setKod}
              keyboardType="number-pad"
              autoCorrect={false}
            />
            {hata ? (
              <AppText variant="kucuk" color="kirmizi" bold style={styles.ortali}>
                {hata}
              </AppText>
            ) : null}
            <AnaButon etiket="Doğrula ve giriş yap" onPress={() => void dogrula()} mesgul={mesgul} />
            <AppText
              variant="kucuk"
              color={sayac > 0 ? 'solukMetin' : 'lacivert'}
              bold
              style={styles.ortali}
              onPress={() => {
                if (sayac <= 0 && !mesgul) void kodGonder();
              }}>
              {sayac > 0 ? `Kodu tekrar gönder (${sayac} sn)` : 'Kodu tekrar gönder'}
            </AppText>
          </>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  form: {
    gap: Spacing.three,
    paddingTop: Spacing.four,
  },
  ikon: {
    alignSelf: 'center',
  },
  ortali: {
    textAlign: 'center',
  },
});
