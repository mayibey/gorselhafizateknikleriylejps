# COLOR / MATERIAL SPEC

`reference.png` is primary. Values below are starting tokens, not permission to ignore screenshot tuning.

## Background family
Target feeling: lighter deep petrol/teal-blue, not near-black navy.
Suggested starting gradient:
- top: `#064B62`
- upper-mid: `#075D72`
- mid: `#087087`
- lower: `#064E66`
- bottom: `#043C54`

Use subtle vertical/radial blending. The atmosphere can include very faint darker mountain/sea silhouettes and tiny specks, but never reduce text legibility.

## Card surfaces
- Primary card fill: `rgba(3, 48, 66, 0.78)` to `rgba(4, 57, 74, 0.88)`
- Secondary card fill: same family, slightly flatter/darker than page
- Cool border: `rgba(67, 203, 218, 0.70)` as a start; visually reduce if too neon
- Inner separators: `rgba(214, 236, 239, 0.16)`

## Typography
- Primary/off-white: `#F7F4EC`
- Secondary: `#D4DADD`
- Muted: `#AAB8BE`
- Deep CTA text: `#07334B`

## Gold
Use restrained warm gold, avoid orange casino look.
- base: `#E9AD28`
- bright: `#F3C24A`
- highlight: `#FFD56A`
- dark: `#B97C12`

Suggested CTA gradient start:
- left/top `#F5C34F`
- mid `#EFB12F`
- bottom/right `#E29B17`
Tune visually.

## Red semantic warning
- red base: `#F04438`
- bright red: `#FF4A3D`
- dark red: `#B92825`

### Exact semantic mapping from reference
- `ZAYIF MEVZİLER` badge: red enamel/gradient, white text.
- `TEKRAR ZAMANI`: red.
- alarm icon: red.
- review-row chevron: red.
- `Paslanma riski:`: off-white.
- `1 kanun`: red.
Do NOT make the whole `Paslanma riski: 1 kanun` line red; the screenshot does not.

## Gold semantic mapping
Gold is for:
- major accent rules/marks
- date accents
- `MEVZİNİ`
- CTA
- active nav
- quick action main icons
Do not turn all labels gold.

## Material/effects
- Shadows: soft, low-opacity, short spread.
- No strong outer glow.
- Borders should be visible but fine.
- Red badge can use subtle specular highlight and darker bottom edge to feel polished.
- `40` can use very subtle depth/shadow, but avoid metallic 3D casino rendering.
