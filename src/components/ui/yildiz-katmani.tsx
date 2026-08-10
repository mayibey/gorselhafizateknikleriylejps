/**
 * YILDIZ KATMANI — tüm ekrana serilen sabit gece dokusu (10 Ağu gece; başkan:
 * "arka plan komple gece yıldızlı olmalı"). Kaydırmadan bağımsız, dokunuşları yutmaz.
 */
import { StyleSheet, View } from 'react-native';

/* Deterministik yıldız haritası (x%, y%, boyut, parlaklık) — her açılışta aynı gökyüzü. */
const YILDIZLAR: [number, number, number, number][] = [
  [6, 4, 2, 0.45], [14, 12, 1.5, 0.3], [22, 7, 2.5, 0.5], [30, 18, 1.5, 0.25],
  [38, 9, 2, 0.4], [47, 15, 1.5, 0.3], [55, 5, 3, 0.5], [64, 12, 1.5, 0.3],
  [72, 8, 2, 0.35], [81, 16, 2, 0.45], [90, 6, 1.5, 0.3], [95, 20, 2, 0.4],
  [8, 28, 1.5, 0.25], [25, 33, 2, 0.35], [44, 30, 1.5, 0.2], [63, 35, 2, 0.3],
  [82, 29, 1.5, 0.25], [12, 46, 2, 0.3], [33, 50, 1.5, 0.2], [58, 47, 2, 0.3],
  [78, 52, 1.5, 0.25], [93, 44, 2, 0.35], [18, 63, 1.5, 0.2], [42, 68, 2, 0.3],
  [68, 64, 1.5, 0.2], [88, 70, 2, 0.3], [10, 80, 1.5, 0.25], [35, 84, 2, 0.3],
  [60, 81, 1.5, 0.2], [85, 87, 2, 0.3], [24, 93, 1.5, 0.25], [50, 95, 2, 0.3],
];

export function YildizKatmani() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {YILDIZLAR.map(([x, y, boyut, parlak], i) => (
        <View
          key={i}
          style={{
            position: 'absolute',
            left: `${x}%`,
            top: `${y}%`,
            width: boyut,
            height: boyut,
            borderRadius: boyut / 2,
            opacity: parlak,
            backgroundColor: '#FFF6DC',
          }}
        />
      ))}
    </View>
  );
}
