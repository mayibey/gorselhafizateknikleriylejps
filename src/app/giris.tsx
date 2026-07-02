import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Screen } from '@/components/ui/screen';
import { Palette, Radius, Spacing } from '@/constants/theme';
import { girisDonusAdresi, type Profil, profilGetir } from '@/lib/auth';
import { useAuth } from '@/lib/auth-context';

export default function GirisScreen() {
  const router = useRouter();
  const { kullanici, hazir, girisYap, cikis, hesabiSil, reaktiveEdildi, reaktivasyonGizle } =
    useAuth();
  const [mesgul, setMesgul] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [profil, setProfil] = useState<Profil | null>(null);

  // Hesap bilgilerini (ad/soyad/telefon) göster — giriş yapıldıysa çek.
  useEffect(() => {
    if (!kullanici) {
      setProfil(null);
      return;
    }
    void profilGetir().then(setProfil);
  }, [kullanici]);

  async function giris() {
    setHata(null);
    setMesgul(true);
    try {
      await girisYap();
    } catch (e) {
      setHata(e instanceof Error ? e.message : 'Bilinmeyen hata');
    } finally {
      setMesgul(false);
    }
  }

  function hesabiSilOnay() {
    Alert.alert(
      'Hesabını sil?',
      'Hesabın silinmek üzere işaretlenecek. 30 gün içinde tekrar giriş yaparsan otomatik geri ' +
        'gelir; bu süre dolunca KALICI silinir.\n\nSatın aldığın her şey (premium erişim) kaybolur.',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Hesabı Sil',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              try {
                await hesabiSil();
                router.back();
              } catch (e) {
                setHata(e instanceof Error ? e.message : 'Hesap silinemedi');
              }
            })();
          },
        },
      ],
    );
  }

  return (
    <Screen title="Giriş" onGeri={() => router.back()}>
      <View style={styles.marka}>
        <MaterialCommunityIcons name="shield-account" size={56} color={Palette.lacivert} />
        <AppText variant="baslik" bold color="lacivert">
          MEVZU · JSPS
        </AppText>
        <AppText variant="kucuk" color="solukMetin" style={styles.ortali}>
          Hesabınla ilerlemen güvende olur; cihaz değiştirsen de kaybolmaz ve ileride
          satın alımların hesabına bağlanır.
        </AppText>
      </View>

      {reaktiveEdildi ? (
        <View style={styles.reaktiveKart}>
          <MaterialCommunityIcons name="restore" size={22} color={Palette.yesil} />
          <AppText variant="kucuk" color="anaMetin" style={styles.bilgiMetin}>
            Hoş geldin! Hesabın silinmek üzereydi — tekrar giriş yaptığın için geri getirildi.
          </AppText>
          <Pressable onPress={reaktivasyonGizle} hitSlop={8}>
            <MaterialCommunityIcons name="close" size={18} color={Palette.solukMetin} />
          </Pressable>
        </View>
      ) : null}

      {!hazir ? (
        // Supabase anahtarları girilmemiş → üyelik uykuda (uygulama offline tam çalışır).
        <View style={styles.bilgiKart}>
          <MaterialCommunityIcons name="clock-outline" size={22} color={Palette.amber} />
          <AppText variant="kucuk" color="solukMetin" style={styles.bilgiMetin}>
            Üyelik yakında açılacak. Şu an tüm özellikler girişsiz de kullanılabilir.
          </AppText>
        </View>
      ) : kullanici ? (
        // Oturum açık → hesap bilgisi + çıkış + hesabı sil.
        <>
          <View style={styles.hesapKart}>
            <MaterialCommunityIcons name="check-circle" size={22} color={Palette.yesil} />
            <View style={styles.hesapMetin}>
              {profil?.ad || profil?.soyad ? (
                <AppText variant="govde" bold numberOfLines={1}>
                  {`${profil.ad ?? ''} ${profil.soyad ?? ''}`.trim()}
                </AppText>
              ) : null}
              <AppText variant="kucuk" color="anaMetin" numberOfLines={1}>
                {kullanici.email ?? 'Gmail hesabı'}
              </AppText>
              {profil?.telefon ? (
                <AppText variant="kucuk" color="solukMetin">
                  {profil.telefon}
                </AppText>
              ) : null}
            </View>
            <Pressable
              style={({ pressed }) => [styles.cikisBtn, pressed && styles.pressed]}
              onPress={() => void cikis()}>
              <AppText variant="kucuk" color="kirmizi" bold>
                Çıkış
              </AppText>
            </Pressable>
          </View>
          <Pressable
            style={({ pressed }) => [styles.hesapSilBtn, pressed && styles.pressed]}
            onPress={hesabiSilOnay}>
            <MaterialCommunityIcons name="account-remove-outline" size={18} color={Palette.kirmizi} />
            <AppText variant="kucuk" color="kirmizi" bold>
              Hesabı Sil
            </AppText>
          </Pressable>
        </>
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
              {__DEV__ ? `Hata: ${hata}` : 'Giriş yapılamadı, tekrar dene.'}
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

      {__DEV__ && hazir ? (
        // TEŞHİS (yalnız geliştirme): Supabase Redirect URLs'e eklenmesi gereken dönüş adresi.
        <View style={styles.teshisKart}>
          <AppText variant="etiket" color="solukMetin" bold>
            TEŞHİS — dönüş adresi (Supabase Redirect URLs listesinde OLMALI):
          </AppText>
          <AppText variant="etiket" color="lacivert" bold selectable>
            {girisDonusAdresi()}
          </AppText>
        </View>
      ) : null}

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
  reaktiveKart: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    backgroundColor: 'rgba(46,125,50,0.08)',
    borderColor: Palette.yesil,
    borderWidth: 1,
    borderRadius: Radius.m,
    padding: Spacing.three,
  },
  hesapSilBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.one,
    paddingVertical: Spacing.two,
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
  teshisKart: {
    gap: Spacing.one,
    backgroundColor: Palette.kremZemin,
    borderColor: Palette.kenarlik,
    borderWidth: 1,
    borderRadius: Radius.s,
    padding: Spacing.two,
  },
  misafirBtn: {
    alignSelf: 'center',
    paddingVertical: Spacing.three,
  },
  pressed: {
    opacity: 0.85,
  },
});
