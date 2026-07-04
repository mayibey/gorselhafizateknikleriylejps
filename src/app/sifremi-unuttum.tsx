/**
 * Şifremi Unuttum — AYRI, temiz ekran (giriş ekranındaki kutuya bağımlılık kaldırıldı).
 * Kullanıcı e-postasını burada yazar → sıfırlama maili gönderilir (Türkçe şablon, sunucuda).
 * Maildeki bağlantı `mevzu://sifre-yenile` ile uygulamaya döner → yeni şifre ekranı.
 */
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AnaButon } from '@/components/auth/ana-buton';
import { AuthGirdi } from '@/components/auth/auth-girdi';
import { AppText } from '@/components/ui/app-text';
import { Screen } from '@/components/ui/screen';
import { Palette, Radius, Spacing } from '@/constants/theme';
import { sifreSifirla } from '@/lib/auth';
import { epostaHatasi } from '@/lib/dogrulama';

export default function SifremiUnuttumScreen() {
  const router = useRouter();
  const [eposta, setEposta] = useState('');
  const [mesgul, setMesgul] = useState(false);
  const [gonderildi, setGonderildi] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  async function gonder() {
    const dHata = epostaHatasi(eposta);
    if (dHata) return setHata(dHata);
    setHata(null);
    setMesgul(true);
    try {
      await sifreSifirla(eposta);
      setGonderildi(true);
    } catch {
      setHata('Gönderilemedi. E-posta adresini kontrol edip tekrar dene.');
    } finally {
      setMesgul(false);
    }
  }

  return (
    <Screen title="Şifremi Unuttum" onGeri={() => router.back()}>
      {gonderildi ? (
        <View style={styles.sonucKart}>
          <MaterialCommunityIcons name="email-check-outline" size={40} color={Palette.yesil} />
          <AppText variant="govde" bold style={styles.ortali}>
            Sıfırlama bağlantısı gönderildi
          </AppText>
          <AppText variant="kucuk" color="solukMetin" style={styles.ortali}>
            {eposta.trim()} adresine bir e-posta gönderdik. İçindeki bağlantıya dokununca yeni
            şifreni belirleyeceğin ekran açılır. E-posta birkaç dakika içinde gelmezse gereksiz
            (spam) klasörünü kontrol et.
          </AppText>
          <AnaButon etiket="Giriş ekranına dön" onPress={() => router.back()} />
        </View>
      ) : (
        <View style={styles.form}>
          <MaterialCommunityIcons
            name="lock-question"
            size={40}
            color={Palette.lacivert}
            style={styles.ikon}
          />
          <AppText variant="kucuk" color="solukMetin" style={styles.ortali}>
            Sorun değil — hesabının e-posta adresini yaz, sana yeni şifre belirleme bağlantısı
            gönderelim.
          </AppText>
          <AuthGirdi
            ikon="email-outline"
            placeholder="E-posta adresi"
            value={eposta}
            onChangeText={setEposta}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            inputMode="email"
          />
          {hata ? (
            <AppText variant="kucuk" color="kirmizi" bold style={styles.ortali}>
              {hata}
            </AppText>
          ) : null}
          <AnaButon etiket="Sıfırlama bağlantısı gönder" onPress={() => void gonder()} mesgul={mesgul} />
        </View>
      )}
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
  sonucKart: {
    alignItems: 'center',
    gap: Spacing.three,
    backgroundColor: Palette.kartKremi,
    borderColor: Palette.kenarlik,
    borderWidth: 1,
    borderRadius: Radius.l,
    padding: Spacing.four,
    marginTop: Spacing.four,
  },
  ortali: {
    textAlign: 'center',
  },
});
