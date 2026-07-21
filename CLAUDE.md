# Görsel Hafıza Teknikleriyle JSPS

Türk Jandarma/Sahil Güvenlik personeli için JSPS sınav hazırlık uygulaması. Ana fark: her kanun maddesi için **tek görsel bir hafıza infografiği** (başlık + tematik sahne/metafor + etiketli çıkarımlar + "AKLINA ÇİVİLE" özet satırı) + aralıklı tekrar (SRS). (NOT: "4 panelli karikatür/comic" formatı TERK EDİLDİ — öyle görsel YOK, artık tek görsel infografik var. Erken aşamadaki "Jandarma Cüneyt" maskotu da TERK EDİLDİ — öyle bir karakter yok.)

## Stack & komutlar
- Expo SDK 54, TypeScript (strict), expo-router, expo-sqlite (native), AsyncStorage (branş kaydı)
- `npx expo start` (yerel) · `npx expo start --web` (tarayıcı) · `npx tsc --noEmit` (tip denetimi) · `npm run gorsel:uret` (görsel registry codegen)
- Repo: github.com/mayibey/gorselhafizateknikleriylejps · branch: **sadece master** · Local: D:\GorselHafizaTeknikleriyleJSPS

## Mimari değişmezler (BOZMA)
- **Veri katmanı platforma bölük**: `database.web.ts` (MemoryBackend, bellek-içi) / `database.native.ts` (SqliteBackend, kalıcı). Metro platform uzantısıyla seçer. Web'de expo-sqlite'a HİÇBİR import girmemeli.
- **4-dosya senkron kuralı**: yeni public DB fonksiyonu eklenince DÖRDÜ birden güncellenir → `types.ts` (Backend arayüzü) + `database.d.ts` (public tip) + `database.native.ts` + `database.web.ts`. Web ve native AYNI sonucu üretmeli.
- **Saf mantık dosyaları (dokunma)**: `lib/srs.ts` (Leitner), `lib/queue.ts` (gunlukKuyruk), `lib/kanun-kartlari.ts` (kanunKuyrugu), `bugunISO()`. Hem web hem native bu saf fonksiyonları çağırır → parite garantisi.
- **İki çalışma modu**: Karargah "Etüt" = `getZayifKuyruk` (**ZAYIF HAVUZ** = tekrar-hatırlat'lanan + denemede yanlış yapılan kartlar; eksik/zorlandıklarını düzeltme bölümü). Mevzuat → kanun = `getCardsByLaw` (o kanunun TÜM kartları; **yeni öğrenme burada**). Karıştırma. (Zayıf havuz `performans.ts zayifKartlar`: kötü yapılınca girer, ÇIKIŞ için son 2 deneme iyi olmalı. `getDailyQueue`/Leitner-due ARTIK Etüt'ü beslemiyor — srs kutu motoru yalnız ödül-sicil için görünmez çalışıyor.)
- **Görsel sistemi**: `assets/kartlar/{kanun}/{kanun}_m{no}.png` (temiz ASCII, boşluk/Türkçe karakter YOK). Registry `src/assets/kart-gorselleri.ts` codegen ile üretilir, ELLE düzenlenmez. DB `cards.gorsel_yolu` = anahtar (örn. `tck_m1`). Görsel varsa StudyCard tek görsel (şeritsiz), yoksa 2x2 placeholder fallback.
- **SRS = kullanıcının ilerlemesi, kutsal**. Migration kullanıcı verisini (srs) KORUR; referans veri (laws/cards/branches) idempotent (INSERT OR IGNORE/REPLACE) yüklenir. DB göçü `PRAGMA user_version` runner ile.

## Kurallar
- **MUTLAK KURAL**: her değişiklikten ÖNCE keşif prompt'u (kod değiştirmez, sadece rapor) → SONRA fix. Keşifsiz fix YOK.
- **Otomatik build/start YAPMA**: sadece dosyaları yaz; kullanıcı kendi `npx expo start` ile bakar. Gereksiz build döngüsü yok.
- **İçerik ÜRETME**: gerçek kanun metni/görsel placeholder kalsın; içerik ayrı iş.
- **Commit disiplini**: her başarılı iş açıklayıcı Türkçe mesajla commit + master'a push. Mantıken ayrı işler ayrı commit. Geçmiş okunaklı kalsın.
- **Her iş/düzeltme sonrası `PROJE_DURUM.md` GÜNCELLE — FARZ.** (Ne yapıldı, hangi commit, yeni karar/sorun.)
- Doğrulama: bitince `npx tsc --noEmit` 0 hata + (gerekirse) web export + 4-dosya senkron teyidi.
- SÜRÜM SABİT: Proje Expo SDK 54'te sabittir (iPhone Expo Go uyumu için; Apple App Store'daki Expo Go en fazla SDK 54 destekliyor — **SDK 56'ya ÇIKMA**). expo / react-native / expo-router / reanimated gibi çekirdek sürümlerini DEĞİŞTİRME (downgrade/upgrade yapma). Sürüm değişikliği gerekiyorsa önce keşif + açık onay şart — yarım kalan bir SDK değişikliği VirtualView/codegen gibi runtime hatalarına yol açar. Çekirdek pinleri: expo ~54.0.35 · react-native 0.81.5 · react/react-dom 19.1.0 · expo-router ~6.0.24 · reanimated ~4.1.x · react-native-worklets 0.5.1 · typescript ~5.9.2.

## Tema (sabit marka — KREM PREMIUM, kanonik)
lacivert `#0B1F3A` (krom) · lacivert2 `#173B6B` · ana metin `#1B2A4A` · kırmızı `#C00000` (SADECE aksiyon/uyarı) · krem zemin `#F7F3EA` · kart kremi `#FFFCF5` · kenarlık `#E7DCC7` · ayırıcı `#EFE6D6` · soluk/ikincil metin `#6E6047` (WCAG AA; eski `#8A7D62` GEÇERSİZ) · altın `#C9A227` · altın koyu `#B88917` · altın soluk yüzey `#F3E7C1` · ilerleme dolu `#C9A227` / track `#EDE3CF` · kart gölge `rgba(11,31,58,0.08)` · ten `#E8C9A8` · yeşil `#2E7D32` · amber `#8A5A12` (eski `#B5791C` GEÇERSİZ) · beyaz `#FFFFFF`. **Fontlar (variant bazlı, `AppText`):** başlık `dev`/`baslik` → **Playfair Display 700**; `altBaslik` → **Inter 800**; `govde` → Inter 700; `kucuk` → Inter 500; `etiket` → Inter 600 (bold → bir ağırlık yukarı). `_layout.tsx` `useFonts` + `expo-splash-screen` ile yüklenir. Sabitler: `MaxContentWidth=800`, `CardFlowMaxWidth=460`. (Eski `#1F3864/#E6C24A/#F7F1E3` ARTIK GEÇERSİZ.)

## Ekranlar (terminoloji)
Karargah (ana) · Mevzuat (kanun listesi) · Tatbikat (sınav, placeholder) · Sicil (profil, placeholder) · Kart Akışı (`/akis`).
