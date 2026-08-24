/**
 * PARLAK YAY (native) — Skia ile ilerleme halkasının altın yayına gerçek IŞIMA.
 * Keskin yay SVG'de kalır (safak.tsx EmirHalka); bu katman yalnız altındaki
 * yumuşak parlamayı çizer. Web karşılığı (parlak-yay.tsx) null döndürür.
 *
 * 24 Ağu 2026: Skia artık DOĞRUDAN import edilmiyor — `lib/skia-var` üzerinden
 * korumalı alınıyor. Eski binary'de (1.0.43) native RNSkia yok; statik import
 * uygulamayı açılışta düşürüyordu. Skia yoksa bu katman çizilmez, keskin SVG
 * yay aynen görünür.
 */
import { StyleSheet } from 'react-native';

import { Skia2, skiaVar } from '@/lib/skia-var';

export function ParlakYay({ boyut, kalin, oran }: { boyut: number; kalin: number; oran: number }) {
  if (oran <= 0 || !skiaVar) return null;
  const { BlurMask, Canvas, Path: SkiaYol, Skia } = Skia2;
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
