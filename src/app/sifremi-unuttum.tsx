/**
 * Şifremi Unuttum — KOD akışı (başkan kararı, 4 Tem): e-posta gir → maile 6 haneli kod gelir →
 * kodu gir → yeni şifreni belirle. Link tıklamaya göre her cihazda şaşmaz çalışır (deep-link
 * kırılganlığı yok); kod hangi e-postaya gönderildiyse YALNIZ o hesabı sıfırlar. Maildeki
 * yedek bağlantı da çalışmaya devam eder (sifre-yenile ekranı).
 * Kod doğrulanınca kurtarma oturumu açılır → şifre konunca kullanıcı zaten giriş yapmış olur.
 */
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AnaButon } from '@/components/auth/ana-buton';
import { AuthGirdi } from '@/components/auth/auth-girdi';
import { AppText } from '@/components/ui/app-text';
import { Screen } from '@/components/ui/screen';
import { Palette, Radius, Spacing } from '@/constants/theme';
import { sifreKoduDogrula, sifreSifirla, yeniSifreBelirle } from '@/lib/auth';
import { epostaHatasi, sifreHatasi } from '@/lib/dogrulama';

type Adim = 'eposta' | 'kod' | 'sifre' | 'bitti';

export default function SifremiUnuttumScreen() {
  const router = useRouter();
  const [adim, setAdim] = useState<Adim>('eposta');
  const [eposta, setEposta] = useState('');
  const [kod, setKod] = useState('');
  const [sifre, setSifre] = useState('');
  const [sifreTekrar, setSifreTekrar] = useState('');
  const [mesgul, setMesgul] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [sayac, setSayac] = useState(0); // kodu tekrar gönder bekleme (sn)

  useEffect(() => {
    if (sayac <= 0) return;
    const t = setTimeout(() => setSayac((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [sayac]);

  async function kodGonder() {
    const dHata = epostaHatasi(eposta);
    if (dHata) return setHata(dHata);
    setHata(null);
    setMesgul(true);
    try {
      await sifreSifirla(eposta);
      setAdim('kod');
      setSayac(60);
    } catch (e) {
      // Sunucu sıklık sınırı: aynı adrese en erken 12 dk'da bir mail (saatte 5 — kötüye kullanım önlemi)
      const m = e instanceof Error ? e.message : '';
      setHata(
        /security|rate|seconds|too many/i.test(m)
          ? 'Çok sık kod istedin — güvenlik için biraz bekle, birkaç dakika sonra tekrar dene.'
          : 'Gönderilemedi. E-posta adresini kontrol edip tekrar dene.',
      );
    } finally {
      setMesgul(false);
    }
  }

  async function kodDogrula() {
    if (kod.trim().length < 4) return setHata('Mailine gelen kodu gir.');
    setHata(null);
    setMesgul(true);
    try {
      await sifreKoduDogrula(eposta, kod);
      setAdim('sifre');
    } catch {
      setHata('Kod hatalı ya da süresi doldu. Maildeki kodu kontrol et veya yeni kod iste.');
    } finally {
      setMesgul(false);
    }
  }

  async function sifreKaydet() {
    const dHata = sifreHatasi(sifre);
    if (dHata) return setHata(dHata);
    if (sifre !== sifreTekrar) return setHata('Şifreler aynı değil.');
    setHata(null);
    setMesgul(true);
    try {
      await yeniSifreBelirle(sifre);
      setAdim('bitti');
    } catch {
      setHata('Şifre kaydedilemedi. Tekrar dene.');
    } finally {
      setMesgul(false);
    }
  }

  return (
    <Screen title="Şifremi Unuttum" onGeri={() => router.back()}>
      <View style={styles.form}>
        {adim === 'eposta' ? (
          <>
            <MaterialCommunityIcons name="lock-question" size={40} color={Palette.lacivert} style={styles.ikon} />
            <AppText variant="kucuk" color="solukMetin" style={styles.ortali}>
              Sorun değil — hesabının e-posta adresini yaz, sana 6 haneli bir sıfırlama kodu
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
            <AnaButon etiket="Kodu gönder" onPress={() => void kodGonder()} mesgul={mesgul} />
          </>
        ) : adim === 'kod' ? (
          <>
            <MaterialCommunityIcons name="email-fast-outline" size={40} color={Palette.lacivert} style={styles.ikon} />
            <AppText variant="kucuk" color="solukMetin" style={styles.ortali}>
              {eposta.trim()} adresine bir kod gönderdik. Maildeki kodu aşağıya yaz (gelmezse spam
              klasörünü kontrol et):
            </AppText>
            <AuthGirdi
              ikon="numeric"
              placeholder="Sıfırlama kodu"
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
            <AnaButon etiket="Kodu doğrula" onPress={() => void kodDogrula()} mesgul={mesgul} />
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
        ) : adim === 'sifre' ? (
          <>
            <MaterialCommunityIcons name="lock-reset" size={40} color={Palette.lacivert} style={styles.ikon} />
            <AppText variant="kucuk" color="solukMetin" style={styles.ortali}>
              Kod doğrulandı. Şimdi yeni şifreni belirle:
            </AppText>
            <AuthGirdi ikon="lock-outline" placeholder="Yeni şifre" value={sifre} onChangeText={setSifre} sifre />
            <AuthGirdi
              ikon="lock-check-outline"
              placeholder="Yeni şifre (tekrar)"
              value={sifreTekrar}
              onChangeText={setSifreTekrar}
              sifre
            />
            {hata ? (
              <AppText variant="kucuk" color="kirmizi" bold style={styles.ortali}>
                {hata}
              </AppText>
            ) : null}
            <AnaButon etiket="Şifreyi kaydet" onPress={() => void sifreKaydet()} mesgul={mesgul} />
          </>
        ) : (
          <View style={styles.sonucKart}>
            <MaterialCommunityIcons name="check-circle-outline" size={44} color={Palette.yesil} />
            <AppText variant="govde" bold style={styles.ortali}>
              Şifren güncellendi
            </AppText>
            <AppText variant="kucuk" color="solukMetin" style={styles.ortali}>
              Giriş de yapıldı — doğrudan çalışmaya devam edebilirsin.
            </AppText>
            <AnaButon etiket="Uygulamaya dön" onPress={() => router.replace('/')} />
          </View>
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
  sonucKart: {
    alignItems: 'center',
    gap: Spacing.three,
    backgroundColor: Palette.kartKremi,
    borderColor: Palette.kenarlik,
    borderWidth: 1,
    borderRadius: Radius.l,
    padding: Spacing.four,
  },
  ortali: {
    textAlign: 'center',
  },
});
