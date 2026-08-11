import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Screen } from '@/components/ui/screen';
import { Palette, Radius, Spacing } from '@/constants/theme';
import { girisDonusAdresi, type Profil, profilGetir } from '@/lib/auth';
import { useAuth } from '@/lib/auth-context';
import { useKisiselOzellik } from '@/lib/ozellik';

export default function GirisScreen() {
  const router = useRouter();
  const gece = useKisiselOzellik('talim-mevzuata');
  const { kullanici, hazir, girisYap, cikis, hesabiSil, reaktiveEdildi, reaktivasyonGizle } =
    useAuth();
  const [mesgul, setMesgul] = useState(false);
  const [hata, setHata] = useState<string | null>(null);
  const [profil, setProfil] = useState<Profil | null>(null);
  // Çıkış / hesap silme YARIŞ KORUMASI: biri başlayınca ikisi de kilitlenir (hızlı çift
  // dokunuşlar birbirini ezmesin — "çıkış+sil aynı anda" karmaşası kapanır).
  const [hesapIslemi, setHesapIslemi] = useState<'cikis' | 'sil' | null>(null);

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

  async function cikisYapGuvenli() {
    if (hesapIslemi) return; // zaten bir işlem sürüyor
    setHesapIslemi('cikis');
    try {
      await cikis();
    } finally {
      setHesapIslemi(null);
    }
  }

  function hesabiSilOnay() {
    if (hesapIslemi) return; // çıkış/silme sürerken ikinci işlem başlamasın
    Alert.alert(
      'Hesabını sil?',
      'Hesabın ve tüm verilerin silinmek üzere işaretlenir ve 30 gün içinde KALICI olarak silinir. ' +
        'Satın aldığın her şey (premium erişim) de kaybolur.',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Hesabı Sil',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              if (hesapIslemi) return;
              setHesapIslemi('sil');
              try {
                await hesabiSil();
                router.back();
              } catch (e) {
                setHata(e instanceof Error ? e.message : 'Hesap silinemedi');
              } finally {
                setHesapIslemi(null);
              }
            })();
          },
        },
      ],
    );
  }

  return (
    <Screen title="Giriş" onGeri={() => router.back()} koyu={gece} kompaktBaslik={gece}>
      <View style={styles.marka}>
        <MaterialCommunityIcons
          name="shield-account"
          size={56}
          color={gece ? Palette.altinParlak : Palette.lacivert}
        />
        <AppText variant="baslik" bold color={gece ? 'beyaz' : 'lacivert'}>
          MEVZU · JSPS
        </AppText>
        <AppText variant="kucuk" color={gece ? 'kartMetinIkincil' : 'solukMetin'} style={styles.ortali}>
          Hesabınla ilerlemen güvende olur; cihaz değiştirsen de kaybolmaz ve ileride
          satın alımların hesabına bağlanır.
        </AppText>
      </View>

      {reaktiveEdildi ? (
        <View style={styles.reaktiveKart}>
          <MaterialCommunityIcons name="restore" size={22} color={Palette.yesil} />
          <AppText variant="kucuk" color={gece ? 'beyaz' : 'anaMetin'} style={styles.bilgiMetin}>
            Hoş geldin! Hesabın silinmek üzereydi — tekrar giriş yaptığın için geri getirildi.
          </AppText>
          <Pressable onPress={reaktivasyonGizle} hitSlop={8}>
            <MaterialCommunityIcons name="close" size={18} color={Palette.solukMetin} />
          </Pressable>
        </View>
      ) : null}

      {!hazir ? (
        // Supabase anahtarları girilmemiş → üyelik uykuda (uygulama offline tam çalışır).
        <View style={[styles.bilgiKart, gece && styles.kartGece]}>
          <MaterialCommunityIcons
            name="clock-outline"
            size={22}
            color={gece ? Palette.altinParlak : Palette.amber}
          />
          <AppText variant="kucuk" color={gece ? 'beyaz' : 'solukMetin'} style={styles.bilgiMetin}>
            Üyelik yakında açılacak. Şu an tüm özellikler girişsiz de kullanılabilir.
          </AppText>
        </View>
      ) : kullanici ? (
        // Oturum açık → hesap bilgisi + çıkış + hesabı sil.
        <>
          <View style={[styles.hesapKart, gece && styles.kartGece]}>
            <MaterialCommunityIcons name="check-circle" size={22} color={Palette.yesil} />
            <View style={styles.hesapMetin}>
              {profil?.ad || profil?.soyad ? (
                <AppText variant="govde" bold color={gece ? 'beyaz' : 'anaMetin'} numberOfLines={1}>
                  {`${profil.ad ?? ''} ${profil.soyad ?? ''}`.trim()}
                </AppText>
              ) : null}
              <AppText variant="kucuk" color={gece ? 'beyaz' : 'anaMetin'} numberOfLines={1}>
                {kullanici.email ?? 'Gmail hesabı'}
              </AppText>
              {profil?.telefon ? (
                <AppText variant="kucuk" color={gece ? 'kartMetinIkincil' : 'solukMetin'}>
                  {profil.telefon}
                </AppText>
              ) : null}
            </View>
            <Pressable
              disabled={!!hesapIslemi}
              style={({ pressed }) => [
                styles.cikisBtn,
                gece && styles.cikisBtnGece,
                pressed && styles.pressed,
                hesapIslemi && styles.pasif,
              ]}
              onPress={() => void cikisYapGuvenli()}>
              {hesapIslemi === 'cikis' ? (
                <ActivityIndicator size="small" color={gece ? Palette.kirmiziParlak : Palette.kirmizi} />
              ) : (
                <AppText variant="kucuk" color={gece ? 'kirmiziParlak' : 'kirmizi'} bold>
                  Çıkış
                </AppText>
              )}
            </Pressable>
          </View>
          <Pressable
            disabled={!!hesapIslemi}
            style={({ pressed }) => [
              styles.hesapSilBtn,
              pressed && styles.pressed,
              hesapIslemi && styles.pasif,
            ]}
            onPress={hesabiSilOnay}>
            {hesapIslemi === 'sil' ? (
              <ActivityIndicator size="small" color={gece ? Palette.kirmiziParlak : Palette.kirmizi} />
            ) : (
              <>
                <MaterialCommunityIcons
                  name="account-remove-outline"
                  size={18}
                  color={gece ? Palette.kirmiziParlak : Palette.kirmizi}
                />
                <AppText variant="kucuk" color={gece ? 'kirmiziParlak' : 'kirmizi'} bold>
                  Hesabı Sil
                </AppText>
              </>
            )}
          </Pressable>
        </>
      ) : (
        // Oturum yok → Gmail ile giriş.
        <>
          <Pressable
            disabled={mesgul}
            style={({ pressed }) => [
              styles.googleBtn,
              gece && styles.googleBtnGece,
              pressed && styles.pressed,
              mesgul && styles.pasif,
            ]}
            onPress={() => void giris()}>
            {mesgul ? (
              <ActivityIndicator color={gece ? Palette.altinParlak : Palette.lacivert} />
            ) : (
              <>
                <MaterialCommunityIcons
                  name="google"
                  size={22}
                  color={gece ? Palette.beyaz : Palette.lacivert}
                />
                <AppText variant="govde" bold color={gece ? 'beyaz' : 'lacivert'}>
                  Gmail ile giriş yap
                </AppText>
              </>
            )}
          </Pressable>

          {hata ? (
            <AppText variant="kucuk" color={gece ? 'kirmiziParlak' : 'kirmizi'} bold style={styles.ortali}>
              {__DEV__ ? `Hata: ${hata}` : 'Giriş yapılamadı, tekrar dene.'}
            </AppText>
          ) : null}

          <AppText variant="etiket" color={gece ? 'kartMetinIkincil' : 'solukMetin'} style={styles.ortali}>
            Giriş yaparak{' '}
            <AppText
              variant="etiket"
              color={gece ? 'altinParlak' : 'lacivert'}
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
        <AppText variant="kucuk" color={gece ? 'kartMetinIkincil' : 'solukMetin'} bold>
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
  // Gece dili (bayraklı)
  kartGece: {
    backgroundColor: 'rgba(3,47,69,0.88)',
    borderColor: 'rgba(126,205,218,0.5)',
  },
  cikisBtnGece: {
    backgroundColor: 'rgba(3,40,56,0.9)',
    borderColor: 'rgba(240,68,56,0.55)',
  },
  googleBtnGece: {
    backgroundColor: 'rgba(3,40,56,0.9)',
    borderColor: '#F3C24A',
  },
});
