# FINAL İŞ PLANI — 3 Temmuz gecesi (başkan uyurken otonom)

> Başkan uzun bir final iş listesi verdi + "yatıyorum, hepsini hallet, build al, kapalı teste yükle".
> Bu dosya = fazların canlı takibi. Oturum kesilirse buradan devam. Bitince PROJE_DURUM'a özet.

## FAZLAR ve DURUM

- [x] **F1. Genel deneme verisi** — `scripts/genel-deneme-uret.mjs` + `npm run genel:uret` → `src/assets/genel-denemeler.ts` (3 deneme × 50 soru = 150, çakışma yok). GenelSoru: id/soru/siklar/dogru/aciklama/kaynak/zorluk/kartId.
- [ ] **F2. Sınav mantığı — genel deneme + 2 PUAN** — `sinav.ts`: getGenelDeneme(no)/getGenelDenemeSorulari; `puanlaSinav` → puan (2×doğru) alanı; `sinav.tsx` genel mod (param `genel=1/2/3`, tüm kartlar), skor "X/100 puan".
- [ ] **F3. Hatalı soru özeti + çözüm/açıklama + kart yönlendirme** — sonuç ekranında yanlış sorular listesi; her birinde doğru cevap + açıklama; "ilgili kartı çalış" → `/akis?kart=<id>` (kaynak_madde/kartId ile eşleşen kart).
- [ ] **F4. Zayıf mevzi AYRIMI (Talim vs Tatbikat)** — `kart_performans.kaynak` enum'a `'talim'`+`'tatbikat'` (SCHEMA_VERSION 25, 4-dosya senkron + migration). Sınav yanlışı kaynağı moda göre. `getZayifKuyruk(kaynak?)`. Karargah/Etüt/Talim/Tatbikat ayrı listeler + kart yönlendirme.
- [ ] **F5. Talim/Tatbikat ekran ayrımı** — `tatbikat.tsx` (Talim ekranı): müşterek/branş ALTINA "Talim" (kanun denemeleri) / "Tatbikat" (Genel Deneme 1/2/3) seçimi. Tatbikat listesi → genel deneme başlatır.
- [ ] **F6. Kilit AKTİF + kilit simgeleri** — `KILIT_AKTIF=true`; kilit çipleri/paywall doğru; satın alınca kalkar (uyelik-context zaten kategori-bazlı).
- [ ] **F7. Branş "çok çok yakında" + %50 indirim ibaresi** — mevzuat/tatbikat/paywall branş: "çok yakında" + "şimdi al %50 indirimli, yayında tam fiyat" mesajı.
- [ ] **F8. Kalan UX** — (3) bildirim ikonu app.json; (7) indirme %→MB; (5) tutorial spotlight [BÜYÜK, zaman kalırsa].
- [ ] **F9. Denetim + tsc 0 + build (vCode 15) + Play kapalı test yükleme (Brave).**

## BAŞKANDA (kod değil — ben yapamam, net rapor):
- **ÖDEME PROFİLİ DOĞRULAMA (ACİL):** hesap 31 Tem'de kalkacak — "Google satıcı ödeme yöntemini doğrulayamadı". payments.google.com + Gmail payments-noreply. Ürün satışı da buna bağlı.
- **Play ürün ekleme (1 TL):** musterek_omurboyu/yillik ID'leri. Lisans testi HALLEDİLDİ (test listesi eklendi).
- **Ekstre işyeri adı + fatura adresi** (Play ödeme profili — DSA).

## KARARLAR (teknik):
- Genel deneme = çok-kanun; kart eşleşmesi `getAllCards` + `eslesenKartIdleri(kaynak)`.
- 2 puan: `sinav_sonuclari` şeması dokunulmaz (dogru/toplam tutulur), puan = dogru×2 türetilir.
- Zayıf ayrımı: kaynak enum'a değer (schema v25). Etüt teyidi 'quiz' kalır (nötr çıkış).
- Simge: adaptive icon zaten düzeltildi (mevzu-icon-adaptive.png); Play store listing icon (512) ayrıca kontrol.
