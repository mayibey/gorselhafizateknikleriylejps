/**
 * Şifre yenileme — şifre sıfırlama e-postasındaki link buraya döner (`mevzu://sifre-yenile?code=...`).
 * Akış: PKCE code'unu oturuma çevir → yeni şifre + tekrarını al → kaydet → uygulamaya gir.
 * Gate istisnası: _layout, bu rotada giriş kontrolünü atlar (kurtarma oturumu burada kurulur).
 */
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/app-text';
import { MaxContentWidth, Palette, Radius, Spacing } from '@/constants/theme';
import { kurtarmaKoduDegistir, yeniSifreBelirle } from '@/lib/auth';
import { sifreHatasi } from '@/lib/dogrulama';
import { sifreSizmisMi } from '@/lib/sifre-guvenlik';

type Durum = 'isleniyor' | 'form' | 'gecersiz';

export default function SifreYenileScreen() {
  const router = useRouter();
  const { code } = useLocalSearchParams<{ code?: string }>();
  const [durum, setDurum] = useState<Durum>('isleniyor');
  const [sifre, setSifre] = useState('');
  const [tekrar, setTekrar] = useState('');
  const [mesgul, setMesgul] = useState(false);
  const [hata, setHata] = useState<string | null>(null);

  useEffect(() => {
    if (!code) {
      setDurum('gecersiz');
      return;
    }
    void kurtarmaKoduDegistir(code)
      .then(() => setDurum('form'))
      .catch(() => setDurum('gecersiz'));
  }, [code]);

  async function kaydet() {
    const sHata = sifreHatasi(sifre);
    if (sHata) {
      setHata(sHata);
      return;
    }
    if (sifre !== tekrar) {
      setHata('Şifreler aynı değil.');
      return;
    }
    setHata(null);
    setMesgul(true);
    try {
      if (await sifreSizmisMi(sifre)) {
        setHata('Bu şifre bilinen veri ihlallerinde görülmüş. Lütfen başka bir şifre seç.');
        return;
      }
      await yeniSifreBelirle(sifre);
      router.replace('/'); // oturum açık → gate geçer, uygulamaya girer
    } catch (e) {
      setHata(e instanceof Error ? e.message : 'Şifre güncellenemedi.');
    } finally {
      setMesgul(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <ScrollView contentContainerStyle={styles.icerik}>
        <View style={styles.marka}>
          <MaterialCommunityIcons name="lock-reset" size={48} color={Palette.lacivert} />
          <AppText variant="baslik" bold color="lacivert">
            Yeni Şifre
          </AppText>
        </View>

        {durum === 'isleniyor' ? (
          <View style={styles.merkez}>
            <ActivityIndicator color={Palette.lacivert} />
            <AppText variant="kucuk" color="solukMetin">
              Bağlantı doğrulanıyor…
            </AppText>
          </View>
        ) : durum === 'gecersiz' ? (
          <View style={styles.merkez}>
            <AppText variant="kucuk" color="solukMetin" style={styles.ortali}>
              Bağlantı geçersiz veya süresi dolmuş. Giriş ekranından "Şifremi unuttum" ile yeni bir
              bağlantı iste.
            </AppText>
            <Pressable
              style={({ pressed }) => [styles.anaBtn, pressed && styles.pressed]}
              onPress={() => router.replace('/')}>
              <AppText variant="govde" bold color="beyaz">
                Giriş ekranına dön
              </AppText>
            </Pressable>
          </View>
        ) : (
          <>
            <AppText variant="kucuk" color="solukMetin" style={styles.ortali}>
              Yeni şifreni belirle (en az 6 karakter).
            </AppText>
            <TextInput
              style={styles.girdi}
              placeholder="Yeni şifre"
              placeholderTextColor={Palette.solukMetin}
              value={sifre}
              onChangeText={setSifre}
              secureTextEntry
              autoCapitalize="none"
            />
            <TextInput
              style={styles.girdi}
              placeholder="Yeni şifre (tekrar)"
              placeholderTextColor={Palette.solukMetin}
              value={tekrar}
              onChangeText={setTekrar}
              secureTextEntry
              autoCapitalize="none"
            />
            <Pressable
              disabled={mesgul}
              style={({ pressed }) => [styles.anaBtn, pressed && styles.pressed, mesgul && styles.pasif]}
              onPress={() => void kaydet()}>
              {mesgul ? (
                <ActivityIndicator color={Palette.beyaz} />
              ) : (
                <AppText variant="govde" bold color="beyaz">
                  Şifreyi kaydet
                </AppText>
              )}
            </Pressable>
            {hata ? (
              <AppText variant="kucuk" color="kirmizi" bold style={styles.ortali}>
                {hata}
              </AppText>
            ) : null}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Palette.kremZemin,
  },
  icerik: {
    flexGrow: 1,
    justifyContent: 'center',
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    padding: Spacing.four,
    gap: Spacing.three,
  },
  marka: {
    alignItems: 'center',
    gap: Spacing.one,
  },
  merkez: {
    alignItems: 'center',
    gap: Spacing.three,
  },
  ortali: {
    textAlign: 'center',
  },
  girdi: {
    backgroundColor: Palette.kartKremi,
    borderColor: Palette.kenarlik,
    borderWidth: 1,
    borderRadius: Radius.m,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    fontSize: 16,
    color: Palette.anaMetin,
  },
  anaBtn: {
    backgroundColor: Palette.lacivert,
    borderRadius: Radius.m,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  pressed: {
    opacity: 0.85,
  },
  pasif: {
    opacity: 0.6,
  },
});
