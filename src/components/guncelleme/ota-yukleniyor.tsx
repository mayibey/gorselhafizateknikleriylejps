import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/app-text';
import { MaxContentWidth, Palette, Radius, Spacing } from '@/constants/theme';
import { otaYenidenBaslat } from '@/lib/ota';

/**
 * OTA güncelleme ekranı — iki hâli var:
 *  · `hazir=false` → indiriliyor (beklemeli gösterge)
 *  · `hazir=true`  → indi, KULLANICI başlatacak
 *
 * 🔴 NEDEN KULLANICI BAŞLATIYOR (başkan bildirdi, 8 Ağu 2026): uygulama kendi kendine
 * yeniden başlatınca ekran SİYAH KALIYOR, kullanıcı "çöktü/kapandı" sanıyordu. Artık ne
 * olduğunu yazan bir ekran çıkıyor ve kararı kullanıcı veriyor. Düğme, kapatıp açma işini
 * onun yerine yapıyor; düğme bir sebeple işe yaramazsa elle kapatma yönergesi de duruyor.
 * Ekran kapatılamaz ve altında başka bir şeye dokunulamaz — yarım güncellemeyle gezilmesin.
 */
export function OtaYukleniyor({ hazir = false }: { hazir?: boolean }) {
  const [basildi, setBasildi] = useState(false);

  async function yenidenBaslat() {
    setBasildi(true);
    const oldu = await otaYenidenBaslat();
    // Başarılıysa uygulama zaten yeniden başlar; başarısızsa düğmeyi geri aç ki
    // kullanıcı elle kapatma yönergesini görsün ve tekrar deneyebilsin.
    if (!oldu) setBasildi(false);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom', 'left', 'right']}>
      <View style={styles.icerik}>
        {hazir ? (
          <>
            <View style={styles.rozet}>
              <MaterialCommunityIcons name="check-bold" size={34} color={Palette.beyaz} />
            </View>
            <AppText variant="altBaslik" bold color="lacivert" style={styles.ortali}>
              Güncelleme hazır
            </AppText>
            <AppText variant="kucuk" color="anaMetin" style={styles.ortali}>
              Yenilikleri görmek için uygulamanın yeniden başlaması gerekiyor. Verilerin ve
              ilerlemen olduğu gibi kalır.
            </AppText>

            <Pressable
              style={({ pressed }) => [styles.btn, pressed && styles.basili, basildi && styles.pasif]}
              onPress={() => void yenidenBaslat()}
              disabled={basildi}
              accessibilityRole="button"
              accessibilityLabel="Uygulamayı yeniden başlat">
              {basildi ? (
                <ActivityIndicator color={Palette.beyaz} />
              ) : (
                <MaterialCommunityIcons name="restart" size={20} color={Palette.beyaz} />
              )}
              <AppText variant="govde" color="beyaz" bold>
                {basildi ? 'Başlatılıyor…' : 'YENİDEN BAŞLAT'}
              </AppText>
            </Pressable>

            <AppText variant="etiket" color="solukMetin" style={styles.ortali}>
              Düğme işe yaramazsa uygulamayı tamamen kapatıp yeniden aç — aynı sonucu verir.
            </AppText>
          </>
        ) : (
          <>
            <ActivityIndicator size="large" color={Palette.lacivert} />
            <AppText variant="altBaslik" bold color="lacivert" style={styles.ortali}>
              Güncelleme indiriliyor
            </AppText>
            <AppText variant="kucuk" color="solukMetin" style={styles.ortali}>
              Birkaç saniye sürecek.
            </AppText>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Palette.kremZemin },
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
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: Palette.yesil,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ortali: { textAlign: 'center' },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    backgroundColor: Palette.lacivert,
    borderRadius: Radius.m,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.four,
    width: '100%',
    marginTop: Spacing.two,
  },
  basili: { opacity: 0.85 },
  pasif: { opacity: 0.6 },
});
