/**
 * PARLAK YAY (native) — Skia ile ilerleme halkasının altın yayına gerçek IŞIMA.
 * Keskin yay SVG'de kalır (safak.tsx EmirHalka); bu katman yalnız altındaki
 * yumuşak parlamayı çizer. Web karşılığı (parlak-yay.tsx) null döndürür.
 * NOT: @shopify/react-native-skia build 71+ (runtime 1.0.44) — eski runtime'a basma.
 */
import { BlurMask, Canvas, Path as SkiaYol, Skia } from '@shopify/react-native-skia';
import { StyleSheet } from 'react-native';

export function ParlakYay({ boyut, kalin, oran }: { boyut: number; kalin: number; oran: number }) {
  if (oran <= 0) return null;
  const r = (boyut - kalin) / 2;
  const yol = Skia.Path.Make();
  yol.addArc(
    { x: boyut / 2 - r, y: boyut / 2 - r, width: 2 * r, height: 2 * r },
    -90,
    360 * Math.min(1, oran),
  );
  return (
    <Canvas style={[StyleSheet.absoluteFill, { width: boyut, height: boyut }]} pointerEvents="none">
      <SkiaYol
        path={yol}
        style="stroke"
        strokeWidth={kalin + 3}
        strokeCap="round"
        color="#F3C24A"
        opacity={0.6}>
        <BlurMask blur={7} style="normal" />
      </SkiaYol>
    </Canvas>
  );
}
