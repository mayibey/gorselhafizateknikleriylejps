import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Linking, Modal, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/app-text';
import { MaxContentWidth, Palette, Radius, Spacing } from '@/constants/theme';

const PLAY_URL = 'https://play.google.com/store/apps/details?id=app.mevzujsps.android';

/**
 * KAPATILAMAZ zorunlu güncelleme ekranı. Sunucu min sürüm > cihaz sürümü olunca _layout kök kapısı
 * bunu gösterir → kullanıcı güncellemeden (Play'e gidip) devam EDEMEZ. Geri tuşu da kapatmaz.
 */
export function ZorunluGuncelleme() {
  return (
    <Modal visible animationType="fade" onRequestClose={() => {}} statusBarTranslucent>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom', 'left', 'right']}>
        <View style={styles.icerik}>
          <View style={styles.rozet}>
            <MaterialCommunityIcons name="rocket-launch-outline" size={40} color={Palette.beyaz} />
          </View>
          <AppText variant="baslik" bold color="lacivert" style={styles.ortali}>
            Yeni Sürüm Gerekli
          </AppText>
          <AppText variant="govde" color="anaMetin" style={styles.ortali}>
            Uygulamanın yeni bir sürümü yayınlandı. Devam edebilmek için lütfen uygulamayı güncelle.
          </AppText>
          <Pressable
            style={({ pressed }) => [styles.btn, pressed && styles.basili]}
            onPress={() => void Linking.openURL(PLAY_URL)}>
            <MaterialCommunityIcons name="google-play" size={20} color={Palette.beyaz} />
            <AppText variant="govde" color="beyaz" bold>
              Güncelle
            </AppText>
          </Pressable>
          <AppText variant="etiket" color="solukMetin" style={styles.ortali}>
            Güncelledikten sonra uygulamayı yeniden aç.
          </AppText>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Palette.kremZemin,
  },
  icerik: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  rozet: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: Palette.lacivert,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.two,
  },
  ortali: {
    textAlign: 'center',
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    backgroundColor: Palette.lacivert,
    borderRadius: Radius.m,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    marginTop: Spacing.two,
    alignSelf: 'stretch',
  },
  basili: {
    opacity: 0.85,
  },
});
