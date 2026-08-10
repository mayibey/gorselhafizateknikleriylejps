/**
 * PARLAK YAY (web fallback) — Skia web'de canvaskit ister; web'de ışıma katmanı
 * çizilmez (keskin SVG yay zaten görünüyor). Metro platform uzantısıyla seçer.
 */
export function ParlakYay(_: { boyut: number; kalin: number; oran: number }) {
  return null;
}
