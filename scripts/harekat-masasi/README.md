# Harekât Masası (başkanın çalışma masası + eksik taraması)

- `sablon.html`: sayfanın TAMAMI (analiz.js ve tarama.js zaten İÇİNE işlenmiş; yama_*.py tarihçe içindir, tekrar çalıştırma).
- Veri: `veri.json` (repo'da yok, 1,7 MB) — `scripts/altin-ozet/icerik/ozet_A..D.md` + `src/assets/kart-sorulari.ts` + `premium-denemeler.ts`'den üretilir.
- Yayın: sablon.html içindeki `__VERI__` → veri.json (`</` → `<\/`) = artifact sayfası; başına doctype/head sarılıp
  Supabase `icerik/tarama/masa.html`'e yüklenir (uygulama `/masa` ekranı bunu okur, OTA gerekmez).
- Uygulama girişi: Karargâh, `eksik-tarama` kişisel bayrağı (29 Eyl 2026: yalnız başkan).
