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

export function TelegramKatil({ boyut = 15 }: { boyut?: number }) {
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
      <AppText variant="etiket" bold color="altinAcik2">
        KATIL
      </AppText>
    </Pressable>
  );
}

const st = StyleSheet.create({
  hap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 3,
    paddingHorizontal: 9,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(201,162,39,0.55)',
  },
  basili: { opacity: 0.7 },
});
