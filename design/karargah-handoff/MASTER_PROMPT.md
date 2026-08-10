# MEVZU · JSPS — KARARGÂH PIXEL-PERFECT IMPLEMENTATION MASTER PROMPT v2

## 1. Amaç
Mevcut Mevzu · JSPS React Native + Expo uygulamasında Karargâh ekranını `reference.png` görseline mümkün olduğunca birebir uygula. Bu bir redesign görevi değildir. `reference.png` nihai görsel source-of-truth'tur.

## 2. Zorunlu çalışma yöntemi
1. Önce mevcut projeyi incele: navigation, SafeArea, fontlar, icon sistemi, theme/token'lar ve mevcut reusable componentleri bul.
2. `reference.png` boyutu: **853 × 1844 px**. Bu oranı baseline kabul et.
3. Önce büyük geometriyi eşleştir; sonra spacing/hizalama; sonra tipografi; sonra renk/gradient; en son ikon ve mikro-detay.
4. Aynı viewport/oran ile screenshot üret.
5. Screenshot'ı `reference.png` ile side-by-side ve mümkünse %50 alpha overlay/diff ile karşılaştır.
6. Görsel farkları iteratif düzelt. “Benzer oldu” seviyesinde durma.
7. İlgisiz ekranlara veya business logic'e dokunma.

## 3. Kaynakların rolü — çok önemli
- `reference.png`: **layout + içerik + hiyerarşi + tipografi + kart yapısı + semantic renkler için tek ana görsel kaynak.**
- `background_color_reference.jpeg`: **sadece background blue/petrol renk ailesi, ışık ve atmosfer için yardımcı kaynak.** Bu dosyadan kart/layout/metin/icon kopyalama.
- Bu iki görsel çelişirse `reference.png` kazanır.

## 4. Ekranda bulunması gereken içerik
### Header
- KARARGÂH
- Duyurular

### Sınav alanı
- SINAV TAKVİMİ
- Başvurular açık
- 3 – 23 Ağustos
- Detaylar
- 19 EYLÜL 2026
- 40
- GÜN
- JSPS SINAVI
- Sınava kalan süre

### Ana görev / Zayıf Mevziler
- BUGÜNÜN EMRİ
- ZAYIF MEVZİLER
- ZAYIF 8 MEVZİNİ GÜÇLENDİR
- 2 / 8
- tamamlandı
- 8 dk
- Son konu: TCK m.5
- TAARRUZA BAŞLA

### Tekrar uyarısı
- TEKRAR ZAMANI
- Paslanma riski: 1 kanun

**Reference'taki semantic uygulama:** `TEKRAR ZAMANI`, alarm ikonu, sağ chevron ve `1 kanun` kırmızı. `Paslanma riski:` ana metni açık/beyazdır. Referans görseldeki bu dağılımı aynen koru. Tüm satırı kırmızıya çevirme.

### Alt aksiyonlar
- TATBİKAT
- Karma sınavlarla kendini sına.
- ER MEYDANI
- Bilgini düelloda dene.
- Rakibin seni bekliyor.

### Bottom nav
- Karargâh — active
- Mevzuat
- Oyunlar
- Evsaf

## 5. Bilgi mimarisi — değiştirme
- “ZAYIF 8 MEVZİNİ GÜÇLENDİR” zaten Zayıf Mevziler akışıdır. İkinci bir Zayıf Mevziler alanı oluşturma.
- Eski `Kaldığın Yer / 5237 / Devam Et` alanı **KESİNLİKLE YOK**. Bu bilerek kaldırıldı; ikinci çalışma CTA'sı yaratma.
- `Tekrar Zamanı / Paslanma riski: 1 kanun` ayrı bir review-risk uyarısı olarak kalacak.
- `Tatbikat` ve `Er Meydanı` yalnızca ikincil aksiyonlardır.
- Tatbikat ve Er Meydanı kartlarının içinde soluk watermark/arma/hedef/kalkan gibi dekoratif semboller **OLMAYACAK**. Yalnız ana ikonları olacak.

## 6. Görsel karakter
Premium, yetişkin, kurumsal, disiplinli. Askerî kimlik var ama oyun HUD'ı, casino/lüks saat estetiği veya çocukça gamification yok.

- Zemin: petrol/teal-deep-blue.
- Ana metin: kırık beyaz.
- Altın: yalnız önemli vurgu, aktif durum ve CTA.
- Kırmızı: yalnız risk/uyarı (`Tekrar Zamanı`) ve Zayıf Mevziler badge'i.
- Kartlar zeminden sadece bir ton ayrışsın; gereksiz glow yok.
- İnce cyan/teal border kullanılabilir.

## 7. Tipografi
Mevcut projede uygun font varsa onu kullan. Görsele yaklaşan font zaten bundle'daysa yeni bağımlılık ekleme.

- Display serif: `KARARGÂH`, `Başvurular açık`, `40`, `GÜN`, ana görev başlığı.
- Modern sans: label, metadata, CTA, nav, açıklamalar.
- `ZAYIF 8 MEVZİNİ GÜÇLENDİR` çok güçlü ve üç satırlı display kompozisyonudur.
- `MEVZİNİ` altın; `ZAYIF 8` ve `GÜÇLENDİR` kırık beyaz.
- Türkçe karakterleri aynen koru.

## 8. Ana mission kartı
- Ekranın en güçlü interactive surface'i.
- Üstte hedef ikonu + `BUGÜNÜN EMRİ` + polished kırmızı `ZAYIF MEVZİLER` badge.
- Badge sıradan flat pill gibi değil; rafine kırmızı enamel/metal hissi, kontrollü gradient ve ince highlight olabilir.
- Sağda circular progress: `2 / 8`, altında `tamamlandı`.
- Metadata: `8 dk · Son konu: TCK m.5`.
- CTA: kartın altına yakın, geniş, mat/controlled altın gradient; koyu petrol text; sağ arrow.

## 9. Review risk satırı
- Mission kartından sonra kompakt full-width row.
- Alarm/clock icon kırmızı.
- `TEKRAR ZAMANI` kırmızı.
- `Paslanma riski:` kırık beyaz.
- `1 kanun` kırmızı.
- Sağ chevron kırmızı.
- Büyük hero card gibi görünmemeli.

## 10. Tatbikat + Er Meydanı
- Eşit genişlikte iki kart.
- Tatbikat: yalnız main target icon, title, kısa açıklama, küçük altın chevron.
- Er Meydanı: yalnız crossed swords main icon, title, iki satır açıklama, küçük altın chevron.
- İçeride soluk dekoratif watermark yok.
- Mission kartından belirgin biçimde ikincil.

## 11. Bottom nav
- 4 eşit tab.
- Karargâh: altın icon + altın label + tek restrained active indicator.
- Diğerleri cool off-white/gray.
- Birden fazla redundant active marker kullanma.
- Safe area/home indicator'a uy.

## 12. Component önerisi
Kod tabanına uygun isimlere uyarlayabilirsin:
- `KarargahScreen`
- `KarargahHeader`
- `ExamHero`
- `DailyMissionCard`
- `WeakAreasBadge`
- `CircularMissionProgress`
- `ReviewRiskRow`
- `QuickActionCard`
- mevcut bottom tab navigator

Pixel matching'i zorlaştıracak aşırı abstraction yapma.

## 13. Responsive kuralları
- Reference ratio baseline; common iPhone widths'te hierarchy korunacak.
- SafeAreaView / useSafeAreaInsets kullan.
- Text overlap yok.
- Tatbikat ve Er Meydanı side-by-side kalmalı; çok dar viewport'ta önce spacing/font/padding azalt, stacking son çare.
- Display numerals ve headline için min/max clamp mantığı kullan.

## 14. Kesin yasaklar
- `5237`, `Kaldığın Yer`, `Devam Et` ekleme.
- İkinci study CTA ekleme.
- Tatbikat/Er Meydanı içine background watermark koyma.
- `reference.png` dışında yeni dekoratif motif icat etme.
- Badge'i gold yapma; ZAYIF MEVZİLER kırmızı badge.
- `Paslanma riski:` metnini referanstan farklı şekilde tüm satır kırmızı yapma.
- Referansta olmayan progress bar/card/section ekleme.
- Kendi “UX improvement” yorumunla layout değiştirme.

## 15. Kabul kriteri
`QA_CHECKLIST.md` tamamlanmadan işi bitmiş sayma. Finalde hangi dosyaları değiştirdiğini ve yalnızca varsa font/asset kaynaklı kalan görsel farkları kısa şekilde bildir.
