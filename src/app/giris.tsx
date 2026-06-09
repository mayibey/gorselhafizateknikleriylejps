import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import {
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
import { MaxContentWidth, Palette, Radius, Spacing } from '@/constants/theme';
import { girisYap, kayitOl } from '@/lib/auth';

export default function GirisScreen() {
  const [kayitMi, setKayitMi] = useState(false);
  const [email, setEmail] = useState('');
  const [sifre, setSifre] = useState('');
  const [kullaniciAdi, setKullaniciAdi] = useState('');
  const [hata, setHata] = useState<string | null>(null);
  const [bilgi, setBilgi] = useState<string | null>(null);
  const [bekliyor, setBekliyor] = useState(false);

  async function gonder() {
    setHata(null);
    setBilgi(null);
    if (!email.trim() || sifre.length < 6) {
      setHata('E-posta gir ve şifre en az 6 karakter olsun.');
      return;
    }
    if (kayitMi && kullaniciAdi.trim().length < 3) {
      setHata('Kullanıcı adı en az 3 karakter olmalı.');
      return;
    }
    setBekliyor(true);
    const sonuc = kayitMi
      ? await kayitOl(email, sifre, kullaniciAdi)
      : await girisYap(email, sifre);
    setBekliyor(false);
    if (!sonuc.ok) {
      setHata(sonuc.hata ?? 'Bir hata oldu.');
      return;
    }
    // Başarılıysa: oturum açıldıysa auth-context otomatik ana ekrana götürür.
    // Kayıt + e-posta doğrulama açıksa oturum gelmez → bilgilendir.
    if (kayitMi) setBilgi('Kayıt alındı. E-posta doğrulaması gerekiyorsa gelen kutunu kontrol et.');
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.icerik} keyboardShouldPersistTaps="handled">
          <View style={styles.kolon}>
            <View style={styles.amblem}>
              <MaterialCommunityIcons name="shield-account" size={44} color={Palette.altin} />
            </View>
            <AppText variant="baslik" color="altin" bold style={styles.merkez}>
              MEVZU
            </AppText>
            <AppText variant="altBaslik" color="beyaz" bold style={styles.merkez}>
              {kayitMi ? 'Birliğe Katıl' : 'İçtimaya Giriş'}
            </AppText>
            <AppText variant="kucuk" color="kenarlik" style={styles.merkez}>
              {kayitMi
                ? 'Hesabını oluştur, sicilin sana özel olsun.'
                : 'Devam etmek için giriş yap.'}
            </AppText>

            <View style={styles.form}>
              {kayitMi ? (
                <Alan
                  ikon="account-outline"
                  placeholder="Kullanıcı adı"
                  value={kullaniciAdi}
                  onChangeText={setKullaniciAdi}
                  autoCapitalize="none"
                />
              ) : null}
              <Alan
                ikon="email-outline"
                placeholder="E-posta"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
              <Alan
                ikon="lock-outline"
                placeholder="Şifre (en az 6)"
                value={sifre}
                onChangeText={setSifre}
                autoCapitalize="none"
                secureTextEntry
              />

              {hata ? (
                <AppText variant="etiket" color="kirmizi" bold style={styles.merkez}>
                  {hata}
                </AppText>
              ) : null}
              {bilgi ? (
                <AppText variant="etiket" color="yesil" bold style={styles.merkez}>
                  {bilgi}
                </AppText>
              ) : null}

              <Pressable
                style={({ pressed }) => [styles.btn, pressed && styles.pressed, bekliyor && styles.pasif]}
                disabled={bekliyor}
                onPress={() => void gonder()}>
                <AppText variant="govde" color="beyaz" bold>
                  {bekliyor ? 'Lütfen bekle…' : kayitMi ? 'Kayıt Ol' : 'Giriş Yap'}
                </AppText>
              </Pressable>

              <Pressable
                onPress={() => {
                  setKayitMi((v) => !v);
                  setHata(null);
                  setBilgi(null);
                }}>
                <AppText variant="kucuk" color="altin" bold style={styles.merkez}>
                  {kayitMi ? 'Zaten hesabın var mı? Giriş yap' : 'Hesabın yok mu? Birliğe katıl'}
                </AppText>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Alan({
  ikon,
  ...rest
}: { ikon: keyof typeof MaterialCommunityIcons.glyphMap } & React.ComponentProps<typeof TextInput>) {
  return (
    <View style={styles.alan}>
      <MaterialCommunityIcons name={ikon} size={20} color={Palette.solukMetin} />
      <TextInput
        style={styles.input}
        placeholderTextColor={Palette.solukMetin}
        {...rest}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Palette.lacivert,
  },
  flex: {
    flex: 1,
  },
  icerik: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.four,
  },
  kolon: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    gap: Spacing.two,
  },
  amblem: {
    alignSelf: 'center',
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 2,
    borderColor: Palette.altin,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  merkez: {
    textAlign: 'center',
  },
  form: {
    marginTop: Spacing.three,
    gap: Spacing.two,
  },
  alan: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: Palette.beyaz,
    borderRadius: Radius.m,
    paddingHorizontal: Spacing.three,
  },
  input: {
    flex: 1,
    paddingVertical: Spacing.three,
    fontSize: 16,
    color: Palette.lacivert,
  },
  btn: {
    backgroundColor: Palette.kirmizi,
    borderRadius: Radius.m,
    paddingVertical: Spacing.three,
    alignItems: 'center',
    marginTop: Spacing.one,
  },
  pressed: {
    opacity: 0.85,
  },
  pasif: {
    opacity: 0.6,
  },
});
