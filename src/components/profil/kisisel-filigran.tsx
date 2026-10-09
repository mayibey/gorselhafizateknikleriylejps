import { memo } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';

/**
 * KİŞİSEL FİLİGRAN (9 Eki 2026, başkan: "uygulamadaki her içerikte kişiye özel filigran olsun, içeriği
 * dışarı çıkaranı görebilelim"). Bir kullanıcı Check-up sorusunun ekran görüntüsünü Telegram'a attı;
 * soru/PDF/oyun/deneme ekranlarının hiçbirinde iz yoktu (yalnız indirilen kart görselleri).
 *
 * Kök düzende (_layout) TÜM ekranların, WebView'lerin (Harekât Merkezi, PDF, oyunlar) üstünde tek katman.
 * pointerEvents="none" → dokunmayı engellemez. Gri + düşük opaklık: krem ve gece temasında da okunur,
 * okumayı bozmaz. Metin: 8 haneli kullanıcı kodu (sunucu görsel filigranıyla aynı: user.id ilk 8) +
 * geçerli ad varsa "Ahmet C.". Kod → hesap → IP/cihaz kaydı ile sızdıran tespit edilir.
 */
export const KisiselFiligran = memo(function KisiselFiligran({ metin }: { metin: string }) {
  const { width, height } = useWindowDimensions();
  const kenar = Math.ceil(Math.hypot(width, height)) + 80; // çapraz dönünce köşeler boş kalmasın
  const satir = Array(Math.ceil(kenar / (metin.length * 6 + 70)) + 1)
    .fill(metin)
    .join('        ');
  const satirSayisi = Math.ceil(kenar / 92);
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none" accessible={false} importantForAccessibility="no-hide-descendants">
      <View style={styles.merkez} pointerEvents="none">
        <View style={[styles.katman, { width: kenar, height: kenar }]} pointerEvents="none">
          {Array.from({ length: satirSayisi }).map((_, i) => (
            <Text key={i} style={[styles.metin, i % 2 ? styles.kaydir : null]} numberOfLines={1}>
              {satir}
            </Text>
          ))}
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  merkez: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  katman: { justifyContent: 'space-between', transform: [{ rotate: '-28deg' }] },
  metin: {
    color: 'rgba(128,128,128,0.16)',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  kaydir: { marginLeft: 90 },
});
