/**
 * TELEGRAM KATIL — Karargâh sağ üstte, DUYURULAR'ın hemen ALTINDA (başkan, 23 Ağu 2026).
 *
 * NEDEN: Telegram grubu ikinci iletişim kanalımız — bildirim iznini kapatan, e-postayı
 * okumayan kullanıcıya oradan ulaşıyoruz. Uygulamada bir giriş vardı ama
 * Evsaf → Ayarlar → "Telegram'a Bağlan" diye ÜÇ TIK derinde; kimse bulmuyordu.
 * Başkan: "logosuyla görünsün, KATIL yazsın, tıklayınca kanal açılsın."
 *
 * Grup: t.me/mevzujsps (herkese açık kullanıcı adı — davet bağlantısı hash'i değil,
 * o değişebiliyor). Dışarı açılır (Linking); uygulama içinde WebView'e sokulmaz.
 */
import { FontAwesome } from '@expo/vector-icons';
import { Linking, Pressable, StyleSheet } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { Palette } from '@/constants/theme';

export const TELEGRAM_GRUP = 'https://t.me/mevzujsps';

export function TelegramKatil({ boyut = 19 }: { boyut?: number }) {
  return (
    <Pressable
      onPress={() => {
        Linking.openURL(TELEGRAM_GRUP).catch(() => {});
      }}
      hitSlop={8}
      style={({ pressed }) => [st.hap, pressed && st.basili]}
      accessibilityRole="link"
      accessibilityLabel="Telegram grubuna katıl">
      <FontAwesome name="telegram" size={boyut} color={Palette.altin} />
      <AppText variant="kucuk" bold color="altinAcik2" style={st.yazi}>
        KATIL
      </AppText>
    </Pressable>
  );
}

const st = StyleSheet.create({
  // 23 Ağu (başkan: "çok küçük kalmış"): ikon 15→19, yazı etiket→küçük, iç boşluk
  // ve çerçeve kalınlaştı, hafif altın zemin eklendi — DUYURULAR ile aynı ağırlıkta dursun.
  hap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: 'rgba(201,162,39,0.75)',
    backgroundColor: 'rgba(201,162,39,0.12)',
  },
  yazi: { letterSpacing: 0.5 },
  basili: { opacity: 0.7 },
});
