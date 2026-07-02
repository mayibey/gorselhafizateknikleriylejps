# FINAL İŞ PLANI — 3 Temmuz gecesi (başkan uyurken otonom)

> Başkan uzun bir final iş listesi verdi + "yatıyorum, hepsini hallet, build al, kapalı teste yükle".
> Bu dosya = fazların canlı takibi. Oturum kesilirse buradan devam. Bitince PROJE_DURUM'a özet.

## FAZLAR ve DURUM

- [x] **F1. Genel deneme verisi** — `scripts/genel-deneme-uret.mjs` + `npm run genel:uret` → `src/assets/genel-denemeler.ts` (3 deneme × 50 soru = 150, çakışma yok). GenelSoru: id/soru/siklar/dogru/aciklama/kaynak/zorluk/kartId.
- [ ] **F2. Sınav mantığı — genel deneme + 2 PUAN** — `sinav.ts`: getGenelDeneme(no)/getGenelDenemeSorulari; `puanlaSinav` → puan (2×doğru) alanı; `sinav.tsx` genel mod (param `genel=1/2/3`, tüm kartlar), skor "X/100 puan".
- [ ] **F3. Hatalı soru özeti + çözüm/açıklama + kart yönlendirme** — sonuç ekranında yanlış sorular listesi; her birinde doğru cevap + açıklama; "ilgili kartı çalış" → `/akis?kart=<id>` (kaynak_madde/kartId ile eşleşen kart).
- [~] **F4. Zayıf mevzi AYRIMI (Talim vs Tatbikat)** — ⏳ ERTELENDİ (bir sonraki build). SCHEMA_VERSION 25 migration + 4-dosya senkron + performans + 3 ekran = gece sonu build'i riske atar. Genel deneme yanlışları ŞU AN tek zayıf havuza düşüyor (mevcut davranış korunur). Ayrı görünüm bir sonraki iterasyona.
- [x] **F5. Talim/Tatbikat ekran ayrımı** — tatbikat.tsx müşterek altına Talim/Tatbikat segment; Tatbikat → Genel Deneme 1/2/3 listesi (kilit + son puan) → /sinav?genel.
- [x] **F6. Kilit AKTİF** — `KILIT_AKTIF=true`. ⚠️ Testerların erişmesi için Play ürünleri + ödeme profili doğrulaması ŞART.
- [x] **F7. Branş "çok yakında" + %50 indirim** — mevzuat + tatbikat + paywall branş ibaresi.
- [~] **F8. Kalan UX** — (3) bildirim ikonu ✅ (bildirim-ikon.png beyaz silüet + app.json). (7) indirme %→MB ⏳ ERTELENDİ (indirme.ts byte akışı derin — bir sonraki). (5) tutorial spotlight ⏳ ERTELENDİ (BÜYÜK yeniden tasarım).
- [x] **F9. Denetim + tsc 0 + build (vCode 15) + Play kapalı test yükleme (Brave).** — ✅ vCode 15 (1.0.5) AAB alındı, doğrulandı (Genel Deneme + KILIT_AKTIF gömülü), Play Alpha kapalı teste yüklendi, İleri→Kaydet→incelemeye gönderildi. Durum: **"İncelenmekte olan değişiklikler"** (Google incelemesinde). 3 Tem gecesi.

## SABAHA KALAN (net — başkan karar/onay):
- **F4 zayıf ayrımı** (Talim vs Tatbikat ayrı liste) — schema v25, sağlam yapılmalı.
- **F8-7 indirme MB gösterimi** — indirme.ts byte akışı.
- **F8-5 tutorial spotlight** (gerçek ekranda vurgu + karartma) — büyük.
- **Play (başkanda):** ödeme profili doğrulama (31 Tem ACİL), 1 TL ürünler, ekstre/adres, fatura e-postası.

## BAŞKANDA (kod değil — ben yapamam, net rapor):
- **ÖDEME PROFİLİ DOĞRULAMA (ACİL):** hesap 31 Tem'de kalkacak — "Google satıcı ödeme yöntemini doğrulayamadı". payments.google.com + Gmail payments-noreply. Ürün satışı da buna bağlı.
- **Play ürün ekleme (1 TL):** musterek_omurboyu/yillik ID'leri. Lisans testi HALLEDİLDİ (test listesi eklendi).
- **Ekstre işyeri adı + fatura adresi** (Play ödeme profili — DSA).

## KARARLAR (teknik):
- Genel deneme = çok-kanun; kart eşleşmesi `getAllCards` + `eslesenKartIdleri(kaynak)`.
- 2 puan: `sinav_sonuclari` şeması dokunulmaz (dogru/toplam tutulur), puan = dogru×2 türetilir.
- Zayıf ayrımı: kaynak enum'a değer (schema v25). Etüt teyidi 'quiz' kalır (nötr çıkış).
- Simge: adaptive icon zaten düzeltildi (mevzu-icon-adaptive.png); Play store listing icon (512) ayrıca kontrol.
