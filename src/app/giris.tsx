import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Screen } from '@/components/ui/screen';
import { Palette, Radius, Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth-context';

export default function GirisScreen() {
  const router = useRouter();
  const { kullanici, hazir, girisYap, cikis } = useAuth();
  const [mesgul, setMesgul] = useState(false);
  const [hata, setHata] = useState(false);

  async function giris() {
    setHata(false);
    setMesgul(true);
    try {
      await girisYap();
    } catch {
      setHata(true);
    } finally {
      setMesgul(false);
    }
  }

  return (
    <Screen title="Giriş" onGeri={() => router.back()}>
      <View style={styles.marka}>
        <MaterialCommunityIcons name="shield-account" size={56} color={Palette.lacivert} />
        <AppText variant="baslik" bold color="lacivert">
          MEVZU-JSPS
        </AppText>
        <AppText variant="kucuk" color="solukMetin" style={styles.ortali}>
          Giriş yapmak isteğe bağlıdır. Hesabınla ilerlemen güvende olur ve ileride
          satın alımların hesabına bağlanır.
        </AppText>
      </View>

      {!hazir ? (
        // Supabase anahtarları girilmemiş → üyelik uykuda (uygulama offline tam çalışır).
        <View style={styles.bilgiKart}>
          <MaterialCommunityIcons name="clock-outline" size={22} color={Palette.amber} />
          <AppText variant="kucuk" color="solukMetin" style={styles.bilgiMetin}>
            Üyelik yakında açılacak. Şu an tüm özellikler girişsiz de kullanılabilir.
          </AppText>
        </View>
      ) : kullanici ? (
        // Oturum açık → hesap bilgisi + çıkış.
        <View style={styles.hesapKart}>
          <MaterialCommunityIcons name="check-circle" size={22} color={Palette.yesil} />
          <View style={styles.hesapMetin}>
            <AppText variant="kucuk" color="solukMetin">
              Giriş yapıldı
            </AppText>
            <AppText variant="govde" bold numberOfLines={1}>
              {kullanici.email ?? 'Gmail hesabı'}
            </AppText>
          </View>
          <Pressable
            style={({ pressed }) => [styles.cikisBtn, pressed && styles.pressed]}
            onPress={() => void cikis()}>
            <AppText variant="kucuk" color="kirmizi" bold>
              Çıkış
            </AppText>
          </Pressable>
        </View>
      ) : (
        // Oturum yok → Gmail ile giriş.
        <>
          <Pressable
            disabled={mesgul}
            style={({ pressed }) => [styles.googleBtn, pressed && styles.pressed, mesgul && styles.pasif]}
            onPress={() => void giris()}>
            {mesgul ? (
              <ActivityIndicator color={Palette.lacivert} />
            ) : (
              <>
                <MaterialCommunityIcons name="google" size={22} color={Palette.lacivert} />
                <AppText variant="govde" bold color="lacivert">
                  Gmail ile giriş yap
                </AppText>
              </>
            )}
          </Pressable>

          {hata ? (
            <AppText variant="kucuk" color="kirmizi" bold style={styles.ortali}>
              Giriş yapılamadı, tekrar dene.
            </AppText>
          ) : null}

          <AppText variant="etiket" color="solukMetin" style={styles.ortali}>
            Giriş yaparak{' '}
            <AppText
              variant="etiket"
              color="lacivert"
              bold
              onPress={() => router.push({ pathname: '/yasal', params: { tip: 'gizlilik' } })}>
              Gizlilik Politikası ve Kullanım Şartları
            </AppText>
            'nı kabul etmiş olursun.
          </AppText>
        </>
      )}

      <Pressable
        style={({ pressed }) => [styles.misafirBtn, pressed && styles.pressed]}
        onPress={() => router.back()}>
        <AppText variant="kucuk" color="solukMetin" bold>
          {kullanici ? 'Kapat' : 'Şimdilik girişsiz devam et'}
        </AppText>
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  marka: {
    alignItems: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.four,
  },
  ortali: {
    textAlign: 'center',
  },
  bilgiKart: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: Palette.kartKremi,
    borderColor: Palette.kenarlik,
    borderWidth: 1,
    borderRadius: Radius.m,
    padding: Spacing.three,
  },
  bilgiMetin: {
    flex: 1,
  },
  hesapKart: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: Palette.kartKremi,
    borderColor: Palette.kenarlik,
    borderWidth: 1,
    borderRadius: Radius.m,
    padding: Spacing.three,
  },
  hesapMetin: {
    flex: 1,
    gap: Spacing.half,
  },
  cikisBtn: {
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: Radius.s,
    backgroundColor: Palette.kremZemin,
    borderColor: Palette.kenarlik,
    borderWidth: 1,
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    backgroundColor: Palette.kartKremi,
    borderColor: Palette.lacivert,
    borderWidth: 1.5,
    borderRadius: Radius.m,
    paddingVertical: Spacing.three,
  },
  pasif: {
    opacity: 0.6,
  },
  misafirBtn: {
    alignSelf: 'center',
    paddingVertical: Spacing.three,
  },
  pressed: {
    opacity: 0.85,
  },
});
