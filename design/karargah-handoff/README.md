# Mevzu · JSPS — Karargâh Claude Code Handoff v2

Bu klasörü projenin köküne örneğin `design/karargah-handoff/` olarak kopyala.

Claude Code'a tek mesaj olarak şunu ver:

> `design/karargah-handoff/MASTER_PROMPT.md` dosyasını baştan sona oku. `reference.png` bu ekran için TEK görsel kaynak ve layout source-of-truth'tur. `background_color_reference.jpeg` YALNIZCA arka planın mavi/petrol renk ailesi ve atmosferi için yardımcı referanstır; ondan layout, içerik, kart, ikon veya tipografi kopyalama. Ardından `LAYOUT_SPEC.md`, `COLOR_SPEC.md`, `ASSET_RULES.md` ve `QA_CHECKLIST.md` dosyalarını uygula. Mevcut projeyi incele, ekranı implement et, aynı viewport'ta screenshot al, referansla overlay/diff karşılaştırması yap ve bariz farkları iteratif olarak düzelt. Referansı redesign etme.

## Dosyalar
- `reference.png` — **nihai hedef ekran**, en yüksek öncelik.
- `MASTER_PROMPT.md` — ana uygulama talimatı ve içerik kuralları.
- `LAYOUT_SPEC.md` — ölçü, grid, oran ve yerleşim rehberi.
- `COLOR_SPEC.md` — renk/gradient/semantic renk rehberi.
- `ASSET_RULES.md` — ikon, font ve görsel asset kuralları.
- `QA_CHECKLIST.md` — screenshot/overlay kalite kontrol döngüsü.
- `background_color_reference.jpeg` — yalnızca arka plan renk/atmosfer yardımcısı.

## Öncelik sırası
Çelişki olursa:
1. `reference.png`
2. Kullanıcının `MASTER_PROMPT.md` içindeki açık içerik kuralları
3. `LAYOUT_SPEC.md`
4. `COLOR_SPEC.md`
5. `ASSET_RULES.md`

`background_color_reference.jpeg` hiçbir zaman layout source-of-truth değildir.
