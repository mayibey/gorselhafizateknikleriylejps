import { Text, type TextStyle } from 'react-native';

import { AppText, type AppTextProps } from '@/components/ui/app-text';
import { Palette } from '@/constants/theme';
import { aciklamaAyir } from '@/lib/aciklama-bicim';

/**
 * Cevap açıklamasını vurgulu gösterir (başkan, 24 Eyl 2026) — soru ekranıyla aynı renk dili:
 *  künye ("m.17/2-c:") altın · süre/oran/sayı ve yetkili makam lacivert-mavi kalın ·
 *  istisna/yasak ("yapılamaz", "hariç") kırmızı. Veriye dokunulmaz.
 * Başkan onayıyla 24 Eyl 2026'da herkese açıldı.
 */
export function AciklamaMetni({ metin, gece, ...rest }: AppTextProps & { metin: string; gece?: boolean }) {
  const kalin: TextStyle = { fontFamily: 'Inter_700Bold' };
  const stil: Record<string, TextStyle> = {
    kunye: { ...kalin, color: gece ? Palette.altinParlak : Palette.altinMetin },
    sayi: { ...kalin, color: gece ? Palette.beyaz : Palette.lacivert2 },
    makam: { ...kalin, color: gece ? Palette.beyaz : Palette.lacivert2 },
    olumsuz: { ...kalin, color: gece ? Palette.kirmiziParlak : Palette.kirmizi },
  };
  return (
    <AppText {...rest}>
      {aciklamaAyir(metin).map((p, i) =>
        p.tur ? (
          <Text key={i} style={stil[p.tur]}>
            {p.metin}
          </Text>
        ) : (
          p.metin
        ),
      )}
    </AppText>
  );
}
