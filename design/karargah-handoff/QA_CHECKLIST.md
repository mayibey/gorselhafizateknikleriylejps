# PIXEL-PERFECT QA CHECKLIST

Run this after the first implementation pass and again after every major adjustment.

## A. Rendering setup
- [ ] Render at same or equivalently scaled aspect ratio as `reference.png` (853×1844).
- [ ] Safe area/status area is comparable.
- [ ] Capture a clean screenshot with no dev overlays.

## B. Overlay/diff loop
Create or use a simple comparison workflow:
1. scale implementation screenshot to exact reference size,
2. overlay at 50% alpha,
3. optionally create absolute-difference image,
4. inspect largest mismatches first.

Fix in this strict priority:
1. bounding boxes / section heights
2. left-right grid alignment
3. headline/countdown scale
4. card radius and padding
5. typography line breaks / line heights
6. colors and gradients
7. icons / micro-details

## C. Header
- [ ] KARARGÂH starts/ends at visually matching positions.
- [ ] Duyurular bell + dot is not oversized.
- [ ] Decorative line/shield geometry matches reference closely.

## D. Exam hero
- [ ] Left calendar and right countdown have matching visual balance.
- [ ] Vertical separator is subtle.
- [ ] `40` size and baseline match; no edge collision.
- [ ] `GÜN` sits under 40 with matching scale.
- [ ] `JSPS SINAVI` and subtitle align as in reference.
- [ ] No layout/content from `background_color_reference.jpeg` leaked into implementation.

## E. Main mission
- [ ] Main card occupies approximately same silhouette as reference.
- [ ] `BUGÜNÜN EMRİ` + target icon align.
- [ ] `ZAYIF MEVZİLER` badge is red, polished, clearly visible.
- [ ] Headline is exactly `ZAYIF 8 / MEVZİNİ / GÜÇLENDİR` with `MEVZİNİ` gold.
- [ ] Circular progress does not crowd headline.
- [ ] `2 / 8` and `tamamlandı` match reference hierarchy.
- [ ] Metadata reads `8 dk · Son konu: TCK m.5`.
- [ ] CTA width/height/radius match; gold is not over-saturated.

## F. Review alert
- [ ] `TEKRAR ZAMANI` red.
- [ ] Alarm icon red.
- [ ] `Paslanma riski:` off-white.
- [ ] `1 kanun` red.
- [ ] Right chevron red.
- [ ] Row remains compact.

## G. Secondary actions
- [ ] Tatbikat + Er Meydanı are equal peer cards.
- [ ] NO faint watermark/decorative symbol inside either card.
- [ ] Only main target / crossed-swords icons show.
- [ ] Descriptions match exact wording.

## H. Removed content
- [ ] No `5237`.
- [ ] No `Kaldığın Yer`.
- [ ] No `Devam Et` study block.
- [ ] No second Zayıf Mevziler CTA.
- [ ] No duplicated review action.

## I. Bottom nav
- [ ] 4 equal tabs.
- [ ] Only Karargâh active.
- [ ] Active state is not indicated redundantly more than needed.
- [ ] Home indicator/safe area is respected.

## J. Final visual acceptance
- [ ] At thumbnail size, silhouette looks essentially the same as reference.
- [ ] At 100% size, no major spacing mismatch is obvious.
- [ ] Turkish characters are correct.
- [ ] No accidental text wrapping.
- [ ] No unrequested visual element has been introduced.
- [ ] Final screenshot was compared after last code change.
