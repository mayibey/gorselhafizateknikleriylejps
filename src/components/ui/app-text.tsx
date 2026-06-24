import { Text, type TextProps } from 'react-native';

import { Palette, type PaletteColor, Type } from '@/constants/theme';

type Variant = keyof typeof Type;

export type AppTextProps = TextProps & {
  variant?: Variant;
  color?: PaletteColor;
  bold?: boolean;
};

// Variant → font ailesi (krem premium tipografi):
//  dev/baslik → Playfair Display 700 (büyük başlıklar) · altBaslik → Inter 800
//  govde → Inter 700 · kucuk → Inter 500 · etiket → Inter 600
const VARIANT_FONT: Record<Variant, string> = {
  dev: 'PlayfairDisplay_700Bold',
  baslik: 'PlayfairDisplay_700Bold',
  altBaslik: 'Inter_800ExtraBold',
  govde: 'Inter_700Bold',
  kucuk: 'Inter_500Medium',
  etiket: 'Inter_600SemiBold',
};

// bold → bir ağırlık yukarı (Inter variant'larında; Playfair tek ağırlık 700).
const VARIANT_FONT_BOLD: Record<Variant, string> = {
  dev: 'PlayfairDisplay_700Bold',
  baslik: 'PlayfairDisplay_700Bold',
  altBaslik: 'Inter_800ExtraBold',
  govde: 'Inter_800ExtraBold',
  kucuk: 'Inter_700Bold',
  etiket: 'Inter_700Bold',
};

/** Tüm uygulamada ortak metin bileşeni: variant → font/punto, color → Palette anahtarı. */
export function AppText({ variant = 'govde', color = 'anaMetin', bold, style, ...rest }: AppTextProps) {
  const fontFamily = (bold ? VARIANT_FONT_BOLD : VARIANT_FONT)[variant];
  return (
    <Text style={[{ fontSize: Type[variant], color: Palette[color], fontFamily }, style]} {...rest} />
  );
}
