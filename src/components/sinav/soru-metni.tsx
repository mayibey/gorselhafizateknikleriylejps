import { Text } from 'react-native';

import { AppText, type AppTextProps } from '@/components/ui/app-text';
import { Palette } from '@/constants/theme';
import { soruAyir, soruBicimle } from '@/lib/soru-bicim';

/**
 * Soru kökünü renk hiyerarşisiyle gösterir (Ünal önerisi + başkan, 24 Eyl 2026):
 *  - Dayanak ("… Yönetmeliği'ne göre,")  → sabit ALTIN (her soruda aynı yer, aynı renk)
 *  - Asıl sorulan kısım (can alıcı yer)   → LACİVERT-MAVİ (lacivert2), kalın
 *  - "değildir / yanlıştır / yer almaz"   → KIRMIZI, altı çizili (gerçek kitapçıktaki gibi)
 *  - Olay/bilgi gövdesi                   → sakin kahve (solukMetin); öncüller normal renk
 * Veriye dokunulmaz. Başkan onayıyla 24 Eyl 2026'da herkese açıldı.
 */
export function SoruMetni({ metin, gece, ...rest }: AppTextProps & { metin: string; gece?: boolean }) {
  const { govdeKaynak, govde, soruKaynak, soru, sonra } = soruAyir(metin);
  if (!soru.length) return <AppText {...rest}>{soruBicimle(metin)}</AppText>;

  const renk = {
    kaynak: gece ? Palette.altinParlak : Palette.altinMetin,
    soru: gece ? Palette.beyaz : Palette.lacivert2,
    olumsuz: gece ? Palette.kirmiziParlak : Palette.kirmizi,
    govde: gece ? Palette.kartMetinIkincil : Palette.solukMetin,
  };

  return (
    <AppText {...rest}>
      {govdeKaynak ? <Text style={{ color: renk.kaynak }}>{govdeKaynak} </Text> : null}
      {govde ? <Text style={{ color: renk.govde }}>{govde}</Text> : null}
      {govdeKaynak || govde ? '\n\n' : null}
      {soruKaynak ? <Text style={{ color: renk.kaynak }}>{soruKaynak} </Text> : null}
      {soru.map((p, i) => (
        <Text
          key={i}
          style={
            p.olumsuz
              ? { color: renk.olumsuz, textDecorationLine: 'underline' }
              : p.bos
                ? { color: renk.kaynak }
                : { color: renk.soru }
          }>
          {p.metin}
        </Text>
      ))}
      {sonra ? `\n${sonra}` : null}
    </AppText>
  );
}
