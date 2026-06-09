import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Alert, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { EmptyState } from '@/components/ui/empty-state';
import { Screen } from '@/components/ui/screen';
import { Palette, Radius, Spacing } from '@/constants/theme';
import { cikisYap, hesabiSil } from '@/lib/auth';
import { useAuth } from '@/lib/auth-context';

export default function HesapScreen() {
  const router = useRouter();
  const { session, hazir } = useAuth();

  function silOnayi() {
    Alert.alert(
      'Hesabı Sil',
      'Hesabın ve tüm verilerin (mesajların dahil) KALICI olarak silinecek. Bu işlem geri alınamaz.',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Hesabı Sil',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              const sonuc = await hesabiSil();
              if (!sonuc.ok) Alert.alert('Silinemedi', sonuc.hata ?? 'Tekrar dene.');
              // Başarılıysa oturum kapanır → guard otomatik /giris'e götürür.
            })();
          },
        },
      ],
    );
  }

  if (!hazir || !session) {
    return (
      <Screen title="Hesap" onGeri={() => router.back()}>
        <EmptyState
          ikon="account-off-outline"
          baslik="Oturum yok"
          aciklama="Hesap ayarları için giriş yapmalısın."
        />
      </Screen>
    );
  }

  return (
    <Screen title="Hesap" onGeri={() => router.back()}>
      <View style={styles.kart}>
        <AppText variant="etiket" color="solukMetin" bold>
          OTURUM
        </AppText>
        <AppText variant="govde" bold>
          {session.user.email ?? '—'}
        </AppText>
      </View>

      <View style={styles.kart}>
        <Satir
          ikon="shield-lock-outline"
          ad="Gizlilik Politikası"
          onPress={() => router.push({ pathname: '/yasal', params: { tip: 'gizlilik' } })}
        />
        <View style={styles.ayrac} />
        <Satir
          ikon="file-document-outline"
          ad="Kullanım Şartları"
          onPress={() => router.push({ pathname: '/yasal', params: { tip: 'sartlar' } })}
        />
      </View>

      <Pressable
        style={({ pressed }) => [styles.cikis, pressed && styles.pressed]}
        onPress={() => void cikisYap()}>
        <MaterialCommunityIcons name="logout" size={20} color={Palette.lacivert} />
        <AppText variant="govde" color="lacivert" bold>
          Çıkış Yap
        </AppText>
      </Pressable>

      <Pressable
        style={({ pressed }) => [styles.sil, pressed && styles.pressed]}
        onPress={silOnayi}>
        <MaterialCommunityIcons name="delete-outline" size={20} color={Palette.beyaz} />
        <AppText variant="govde" color="beyaz" bold>
          Hesabı Sil
        </AppText>
      </Pressable>
      <AppText variant="etiket" color="solukMetin" style={styles.not}>
        Hesabını silmek tüm verilerini kalıcı olarak kaldırır.
      </AppText>
    </Screen>
  );
}

function Satir({
  ikon,
  ad,
  onPress,
}: {
  ikon: keyof typeof MaterialCommunityIcons.glyphMap;
  ad: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={({ pressed }) => [styles.satir, pressed && styles.pressed]} onPress={onPress}>
      <MaterialCommunityIcons name={ikon} size={20} color={Palette.lacivert} />
      <AppText variant="kucuk" bold style={styles.satirAd}>
        {ad}
      </AppText>
      <MaterialCommunityIcons name="open-in-new" size={18} color={Palette.solukMetin} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  kart: {
    backgroundColor: Palette.kartKremi,
    borderColor: Palette.kenarlik,
    borderWidth: 1,
    borderRadius: Radius.m,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  satir: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  satirAd: {
    flex: 1,
  },
  ayrac: {
    height: 1,
    backgroundColor: Palette.kenarlik,
  },
  cikis: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    backgroundColor: Palette.kartKremi,
    borderColor: Palette.kenarlik,
    borderWidth: 1,
    borderRadius: Radius.m,
    paddingVertical: Spacing.three,
  },
  sil: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    backgroundColor: Palette.kirmizi,
    borderRadius: Radius.m,
    paddingVertical: Spacing.three,
  },
  not: {
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.85,
  },
});
