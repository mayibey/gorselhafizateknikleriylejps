# ASSET / ICON / FONT RULES

## Priority
1. Reuse matching assets already in the project.
2. Reuse a single existing vector icon family.
3. If missing, create simple SVG/vector equivalents with consistent stroke/weight.
4. Do not mix multiple unrelated icon styles.

## Required icons
- Bell + small notification dot
- Calendar
- Small shield/star mark used in header/countdown
- Target/crosshair for Bugünün Emri
- Clock for `8 dk`
- Document/file for `Son konu: TCK m.5`
- Circular progress ring
- Alarm/review clock for Tekrar Zamanı
- Target for Tatbikat
- Crossed swords for Er Meydanı
- Bottom nav: home, book, gamepad, profile
- Chevron/right arrow

## Icon styling
- Main normal icons: gold or off-white according to reference.
- Warning row icon + chevron: red.
- Stroke weight visually consistent.
- Avoid cartoon fills and unnecessary 3D.
- Tatbikat and Er Meydanı cards: **NO faint background icon / watermark / crest**.

## Typography
Do not bundle/share external font files just for this handoff. Inspect the project's existing fonts first.

Desired categories:
- Editorial/high-contrast serif for display elements.
- Clean modern sans for UI.

If exact fonts are unavailable:
- choose closest bundled serif/sans,
- adjust font size/letter spacing/line height to match screenshot,
- note the font limitation only after implementation.

## Background asset rule
`background_color_reference.jpeg` is NOT an asset to place directly in the UI unless explicitly desired by the project. It is a color/atmosphere reference only.
The actual `reference.png` contains subtle mountains/atmosphere; reproduce that only if the existing project already has an appropriate lightweight asset or if a simple gradient + low-opacity silhouette can be implemented without adding visual noise.
