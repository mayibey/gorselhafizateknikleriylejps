import { StyleSheet, Text, type TextProps } from 'react-native';

import { FontFamily, Palette, type PaletteColor, Type } from '@/constants/theme';

type Variant = keyof typeof Type;

export type AppTextProps = TextProps & {
  variant?: Variant;
  color?: PaletteColor;
  bold?: boolean;
};

/** Tüm uygulamada tek font ailesi + büyük punto için ortak metin bileşeni. */
export function AppText({ variant = 'govde', color = 'lacivert', bold, style, ...rest }: AppTextProps) {
  return (
    <Text
      style={[
        styles.base,
        { fontSize: Type[variant], color: Palette[color] },
        bold && styles.bold,
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    fontFamily: FontFamily,
    fontWeight: '600',
  },
  bold: {
    fontWeight: '800',
  },
});
