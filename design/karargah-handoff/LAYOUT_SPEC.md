# LAYOUT SPEC — reference baseline 853 × 1844 px

Bu değerler referans ekran üzerinden ölçüye yakın tahmini kılavuzdur. Mutlak gerçeklik `reference.png` görüntüsüdür; screenshot overlay ile refine et.

## Global grid
- Canvas: 853 W × 1844 H
- Major left/right outer gutter: yaklaşık **30–42 px** (3.5–5.0% W)
- Main content left edge: yaklaşık x=30–40
- Main content right edge: yaklaşık x=813–823
- Card radius: yaklaşık 20–26 px
- Major section gap: yaklaşık 18–26 px
- Internal card padding: yaklaşık 28–40 px

## 1) Status + header
Approx region: y=0–215
- Status row center y: ~45
- KARARGÂH baseline area: x~40–425, y~112–165
- Duyurular group: x~615–805, y~110–160
- Decorative line + small shield under KARARGÂH: y~174–205

## 2) Exam hero / calendar + countdown
Approx region: y=215–650
Two columns with separator around x~408–420.

### Left calendar block
- x~40–360
- top icon/label: y~285–365
- `Başvurular açık`: y~395–445
- `3 – 23 Ağustos`: y~463–500
- divider: y~520
- `Detaylar`: y~545–585

### Right countdown block
- x~455–795
- `19 EYLÜL 2026`: y~225–275
- `40`: dominant, approx y~285–450
- `GÜN`: y~445–515
- gold rule + shield: y~520–565
- `JSPS SINAVI`: y~565–605
- `Sınava kalan süre`: y~600–635

Important: countdown is dominant but must not touch edges; left calendar and right countdown should feel optically balanced, not 50/50 mechanically.

## 3) Main mission card
Approx box:
- x~30
- y~650
- w~793
- h~545
- bottom ~1195

Internal:
- top label row: y~675–760
- main headline block: x~85–470, y~765–965
- circular progress: center approx x~665, y~860, diameter ~190–220
- metadata row: y~1000–1050
- CTA: x~78–770, y~1080–1165, h~80–90

Headline visual line logic:
- line 1: `ZAYIF 8`
- line 2: `MEVZİNİ` (gold)
- line 3: `GÜÇLENDİR`

## 4) Review risk row
Approx box:
- x~30
- y~1210
- w~793
- h~130
- bottom ~1340

Icon group left ~60–140.
Text begins ~170.
Chevron near x~760.
Keep compact; do not vertically center with excessive dead space.

## 5) Quick action row
Approx region: y~1360–1630
- Left card Tatbikat: x~30–405
- Gap: ~18–24
- Right card Er Meydanı: x~425–823
- Card h: ~250–270

Main icons near top-left inside each card.
Descriptions aligned consistently.
Chevron bottom-right-ish, not vertically huge.
No watermark behind text.

## 6) Bottom navigation
Approx region: y~1650–1844
- top border/surface begins ~1650–1670
- four equal tab centers around x~115, 320, 525, 725
- icon row around y~1685–1740
- labels ~1740–1785
- single active underline for Karargâh around y~1790–1800
- iOS home indicator around y~1820–1832

## Spacing rhythm
Use a small spacing scale rather than random values:
- XS ~8
- S ~12
- M ~18
- L ~24
- XL ~32
- 2XL ~40

Reference fidelity overrides the scale when necessary.

## Optical rules
- Do not perfectly center every text mathematically; match optical alignment from reference.
- Big `40` and mission headline are optical anchors.
- The red badge is a secondary focal point, not equal to the `40` or CTA.
- Keep CTA width large but with visible side margins.
- Bottom cards must be clearly subordinate to mission card.
