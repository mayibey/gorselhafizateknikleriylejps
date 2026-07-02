/**
 * Auth ekranları için yumuşak dekoratif arka plan — köşelerde krem/altın bloblar + ince
 * altın noktalar (referans tasarımdaki köşe süslemelerinin marka-uyumlu hali). Çok hafif,
 * içeriği bozmaz; absolute fill, dokunmayı geçirir.
 */
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, { Circle, Ellipse } from 'react-native-svg';

import { Palette } from '@/constants/theme';

export function DekoratifArkaplan() {
  const { width, height } = useWindowDimensions();
  return (
    <View
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      <Svg width={width} height={height}>
        {/* Sol üst yumuşak altın blob */}
        <Circle cx={-10} cy={70} r={110} fill={Palette.altinSolukYuzey} opacity={0.4} />
        <Circle cx={40} cy={20} r={60} fill={Palette.altinSolukYuzey} opacity={0.25} />
        {/* Sağ üst */}
        <Circle cx={width + 20} cy={-10} r={90} fill={Palette.altinSolukYuzey} opacity={0.3} />
        {/* Alt sol geniş blob (referanstaki yaprak kümesi bölgesi) */}
        <Ellipse cx={0} cy={height + 30} rx={150} ry={110} fill={Palette.altinSolukYuzey} opacity={0.35} />
        {/* Alt sağ ince */}
        <Circle cx={width + 10} cy={height - 30} r={80} fill={Palette.altinSolukYuzey} opacity={0.22} />
        {/* Serpiştirilmiş altın noktalar (ince premium dokunuş) */}
        <Circle cx={width - 36} cy={150} r={4} fill={Palette.altin} opacity={0.5} />
        <Circle cx={width - 60} cy={180} r={3} fill={Palette.altin} opacity={0.35} />
        <Circle cx={28} cy={height - 140} r={4} fill={Palette.altin} opacity={0.45} />
        <Circle cx={52} cy={height - 170} r={2.5} fill={Palette.altin} opacity={0.3} />
        <Circle cx={width - 30} cy={height - 200} r={3} fill={Palette.altin} opacity={0.3} />
      </Svg>
    </View>
  );
}
