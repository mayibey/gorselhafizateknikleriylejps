import { Text } from 'react-native';

import { AppText, type AppTextProps } from '@/components/ui/app-text';
import { Palette } from '@/constants/theme';
import { useKisiselOzellik } from '@/lib/ozellik';
import { soruAyir, soruBicimle } from '@/lib/soru-bicim';

/**
 * Soru kökünü gösterir. Uzun (paragraf) sorularda asıl sorulan cümle alt satıra iner ve
 * altın renkte, kalın-italik yazılır; "yanlıştır / değildir / yer almaz" gibi olumsuz
 * kelimeler kırmızı ve altı çizili olur (gerçek kitapçıktaki gibi).
 * Şimdilik yalnız 'on-izleme' bayraklı kişilerde (başkan onayından sonra herkese).
 */
export function SoruMetni({ metin, gece, ...rest }: AppTextProps & { metin: string; gece?: boolean }) {
  const onIzleme = useKisiselOzellik('on-izleme');
  if (!onIzleme) return <AppText {...rest}>{soruBicimle(metin)}</AppText>;

  const { govde, soru } = soruAyir(metin);
  const vurgu = gece ? Palette.altinParlak : Palette.altinMetin;
  const olumsuz = gece ? Palette.kirmiziParlak : Palette.kirmizi;
  const soruKismi = soru.map((p, i) => (
    <Text
      key={i}
      style={
        p.olumsuz
          ? { color: olumsuz, textDecorationLine: 'underline' }
          : govde
            ? { color: vurgu, fontStyle: 'italic' }
            : undefined
      }>
      {p.metin}
    </Text>
  ));

  if (!govde) return <AppText {...rest}>{soruKismi}</AppText>;
  return (
    <AppText {...rest}>
      {govde}
      {'\n\n'}
      {soruKismi}
    </AppText>
  );
}
