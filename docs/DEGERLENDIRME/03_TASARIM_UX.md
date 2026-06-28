# 03 — TASARIM & UX & GÖRSEL DİL

> Kapsam: tüm ekranların krem-premium tema tutarlılığı, görsel hiyerarşi, ritim, tipografi,
> renk-kontrast erişilebilirliği (WCAG), dokunma hedefi, navigasyon, boş/yükleme/hata
> durumları, mikro-etkileşim, tutarsızlıklar. Sonunda 2-3 alternatif tasarım yönü + skill
> önerisi. Kanıt: dosya:satır. Salt-okuma değerlendirme; kod değiştirilmedi.
> Mevcut planların (PROJE_DURUM.md UI yenileme turları, 00_DURUM.md) ÜZERİNE inşa edildi —
> tekrar yok; o turlarda kapatılan işler "yapıldı" kabul edilip yeni/atlanmış sorunlara odaklanıldı.

## Özet
- **Tema disiplini genel olarak güçlü.** Tek `theme.ts` palet + tek `AppText` (Playfair Display başlık / Inter gövde) + ortak `Screen`/`EmptyState`/`Loading` → editöryel, premium, askeri-tematik bir dil oturmuş. Marka kimliği net.
- **En ciddi sistemik kusur erişilebilirlik kontrastı:** `solukMetin (#8A7D62)` krem zemin üzerinde ~**3.67:1**, `altinKoyu (#B88917)` ~**2.87:1** ölçüldü — ikincil metin ve altın aksan etiketlerinin BÜYÜK çoğunluğu WCAG AA (4.5:1) eşiğinin ALTINDA. 13-15px puntoda yorgun gözle saha kullanımı için gerçek sorun. **P0/P1.**
- **Bileşen çoğullaması (drift riski):** `Monogram` 3 kez, yerel `DurumKutu` 3 kez, ilerleme `Bar`/`Halka`/track 4 ayrı uygulama, segmented Müşterek/Branş seçici 2 kez kopyalanmış. Görünüm zamanla sapacak (fix biri uygulanıp diğerine uygulanmıyor — kanıt aşağıda). **P1.**
- **Karargah'ta "Zayıf mevzi" 3 kez tekrarlanıyor** (hero alt başlık + BUGÜNÜN GÖREVİ + 3-kutu) → bilgi fazlalığı, hiyerarşi gürültüsü. **P1.**
- **Yarısı ölü navigasyon:** Mevzuat + Tatbikat'taki Müşterek/Branş segmented kontrolünün "Branş" yarısı her zaman "Çok yakında" → kullanıcı her açışta boş yarıya çarpıyor. **P1.**
- **İki zıt mod (krem app / koyu lacivert kart akışı)** bilinçli ve etkili ama uygulamanın tek koyu yüzeyi; ani bağlam sıçraması. Onboarding bunu önceden anlatmıyor. **P2.**
- Boş/hata durumları kapsamı İYİ (her ekran var); yükleme durumları tutarsız (spinner / sade metin / inline) ve skeleton yok. **P2.**

## Bulgular

### P0/P1 — Renk-kontrast erişilebilirlik (WCAG AA altı), sistemik
- **Ne:** Krem zemin üzerinde ikincil/aksan metin renkleri AA eşiğini geçemiyor.
- **Nerede:** `src/constants/theme.ts:23` `solukMetin:#8A7D62`, `:27` `altinKoyu:#B88917`, `:26` `amber:#B5791C`; kullanım her ekranda (`AppText color="solukMetin"` ve `color="altinKoyu"` yüzlerce kez).
- **Ölçüm (hesaplandı):** `solukMetin` / `kremZemin(#F7F3EA)` = **3.67:1**; `altinKoyu` / krem = **2.87:1**. AA normal metin 4.5:1, büyük metin (≥18px bold) 3:1 ister. `etiket`(13px) ve `kucuk`(15px) bu renklerde NORMAL metin sayılır → **geçemez**. `amber` pale-gold `altinSolukYuzey(#F3E7C1)` üzerinde daha da kötü (ör. `index.tsx:180` "TEKRAR ZAMANI").
- **Neden/etki:** `solukMetin` projedeki VARSAYILAN ikincil renk; "En son N gün önce çalıştın", kanun adı alt satırları, tüm etiketler, % değerleri bununla. Saha personeli (yorgun göz, güneş, ucuz panel) için okunabilirlik düşük. Mağaza erişilebilirlik denetimi de bunu işaretler.
- **Öneri:** İki token koyulaştır: `solukMetin → ~#6E6047` (≈4.6:1), `altinKoyu` METİN için ayrı bir `altinMetin → ~#8A6410` (≈4.0+:1) ya da metinde altın yerine `anaMetin`/`lacivert` kullan, altını yalnız ikon/dolgu/çizgide bırak. Ekip zaten bar dolgusunu bu yüzden `altinKoyu`'ya çekmiş (`mevzuat.tsx:823` yorumu) — aynı mantığı METİN tarafına da uygula. Tek noktadan (`theme.ts`) düzeltme tüm ekranlara yayılır.

### P1 — Bileşen çoğullaması ve görünüm sapması (zaten kanıtlı)
- **Ne:** Aynı görsel öğenin 3-4 ayrı kopyası; fix biri uygulanıp diğerine uygulanmıyor.
- **Nerede / kanıt:**
  - `Monogram`: `mevzuat.tsx:371`, `tatbikat.tsx:162`, `ara.tsx:242` (sikMono). Kanun no'nun kutuya sığması için `numberOfLines={1}+adjustsFontSizeToFit` **yalnız tatbikat (`:166`) ve ara (`:248`)** kopyasına eklenmiş; **`mevzuat.tsx` Monogram'da YOK** → Mevzuat'ta dar kutuda 4 haneli no taşma riski hâlâ açık (aynı bug iki yerde düzeltilip bir yerde kalmış).
  - Yerel `DurumKutu` (yükleme/hata/placeholder): `mevzuat.tsx:586`, `tatbikat.tsx:250`, `patika.tsx:598` — üçü neredeyse aynı, biri `kirmizi` ikon biri `solukMetin`. Üstelik paylaşılan `EmptyState`/`Loading` zaten VAR ve `sinav.tsx`/`index.tsx` onları kullanıyor → iki yarış.
  - İlerleme göstergesi: `index.tsx:388` SVG `Halka`, `mevzuat.tsx:394` flex `Bar`, `akis.tsx:275`/`sinav.tsx:167` `width:%` track — 4 farklı uygulama.
  - Segmented Müşterek/Branş: `mevzuat.tsx:619` ve `tatbikat.tsx:284` birebir aynı stil bloğu kopyalanmış.
- **Etki:** Her UI iyileştirmesi N yerde tekrar gerekiyor; tema tutarlılığı zamanla bozulur (yukarıdaki Monogram örneği bunun kanıtı).
- **Öneri:** `components/ui/` altına `Monogram`, `Progress` (svg halka + bar tek API), `DurumKutu`'yu `EmptyState`'e konsolide, `SegmentedTabs` çıkar. Davranış aynı kalır (saf görünüm refaktörü).

### P1 — Karargah bilgi fazlalığı ve hiyerarşi gürültüsü
- **Ne:** "Zayıf mevzi" sayısı üç ayrı blokta tekrarlanıyor; ekran çok bloklu.
- **Nerede:** `index.tsx` — hero alt başlık "Zayıf Mevziler / X zayıf mevzi seni bekliyor" (`:241-252`), "BUGÜNÜN GÖREVİ" içinde `Gorev sayi={tekrarSayisi} etiket="Zayıf mevzi"` (`:282`), 3-kutu içinde yine "Zayıf mevzi" Pressable (`:308-329`). Üçü de aynı `queue.length`.
- **Ayrıca:** Hero "Tahmini süre" = `${bekleyen} dk` (`:267`) — 1 kart=1 dk varsayımı sabit, gerçek olmayan bir metrik gibi görünüyor.
- **Etki:** Aynı veri 3 kez → kullanıcı "neyi tıklamalıyım" kararını zorlaştırır; premium his yerine pano-kalabalığı.
- **Öneri:** Zayıf mevziyi TEK güçlü giriş yap (hero veya tek kutu). 3-kutu satırını "İlerleme · Seri · (Günün maddesi kısayolu)" gibi farklı veriye ayır. "Tahmini süre"yi kaldır ya da gerçek ortalama süreyle besle.

### P1 — Yarısı "Çok yakında" olan segmented kontrol
- **Ne:** Mevzuat ve Tatbikat üst seçicisinde Branş sekmesi içerik olmadığı için her zaman placeholder.
- **Nerede:** `mevzuat.tsx:199-204`, `tatbikat.tsx:118-123`.
- **Etki:** Kullanıcının yarısı boşa çıkan bir kontrolle ilk teması olumsuz; "yarım ürün" hissi.
- **Öneri:** v1'de Branş'ı segmented'tan çıkar; tek bir "Branş içeriği yakında" satır-rozeti olarak en alta koy, ya da sekmeyi `disabled` görünür-pasif yap (tıklayınca placeholder yerine küçük tooltip). İçerik gelince segmented'ı geri aç.

### P1 — Onboarding ilk izlenimi zayıf (değer önermesi yok)
- **Ne:** İlk açılışta yalnız lacivert başlık + düz liste (branş, sonra rütbe). Uygulamanın ana farkı (görsel hafıza karikatürü + SRS) hiç anlatılmıyor.
- **Nerede:** `onboarding.tsx` → `brans-secici.tsx` (sade `ScrollView` + satırlar).
- **Etki:** "Görsel hafıza" vaadi ilk ekranda görünmüyor; mağazadan inen kullanıcı için kanca yok → ilk-açılış bırakma (drop-off) riski.
- **Öneri:** Branş seçiminden ÖNCE 1 ekranlık değer-önermesi (örnek karikatür kartı + "her maddeyi bir sahneyle hatırla" + SRS rozeti). Mevcut iki adım korunur, başına tek tanıtım kartı eklenir.

### P2 — Yükleme durumları tutarsız, skeleton yok
- **Ne:** Yükleme bazen `Loading` spinner (`index.tsx:141`, `sicil.tsx:104`), bazen spinnersız metin (`mevzuat.tsx:293` DurumKutu "Yükleniyor…"), bazen inline `ActivityIndicator` (`patika.tsx:291`).
- **Etki:** Ekranlar arası geçişte tutarsız "bekleme dili"; premium akıcılık kırılır. İçerik birden "pop" eder (layout shift).
- **Öneri:** Tek yükleme dili: kısa içerikte spinner+metin, liste ekranlarında basit skeleton (krem kart iskeletleri). En azından `mevzuat` spinnersız metnini `Loading`'e çevir.

### P2 — İki zıt mod ve placeholder tema ihlali
- **Ne:** Tüm app krem; yalnız Kart Akışı koyu lacivert (`akis.tsx` `kartZeminKoyu`). Bilinçli "çalışma modu" ama tek koyu yüzey → ani bağlam sıçraması; onboarding/Karargah bunu hazırlamıyor.
- **Ayrıca:** Görselsiz kart fallback'i dekoratif kırmızı başlık şeridi kullanıyor (`study-card.tsx:79,140` `Palette.kirmizi`) — tema kuralı "kırmızı SADECE aksiyon/uyarı" (CLAUDE.md) ile çelişir. (Pratikte 565/565 kart görselli olduğundan nadir görünür.)
- **Öneri:** Mod geçişini yumuşat (kart akışına girişte kısa fade/başlık). Fallback başlığını lacivert/altın yap. Ya da alternatif yönlerden "dark-first" (aşağıda) ile modları birleştir.

### P2 — Mikro-etkileşim ince ama dar
- **Ne:** `pressed` opaklığı tutarlı (0.7-0.85), Patika'da güzel giriş/pulse + bot izi animasyonu var (`patika.tsx:434`). Ama genel olarak haptik yok, ekran geçişleri varsayılan, cevap/ödül anlarında kutlama yok.
- **Etki:** "Doğru/Öğrendim" gibi ödül anları düz; oyunlaştırma (seri, sicil) varken his eksik.
- **Öneri:** Öğrendim/doğru cevapta hafif haptik + küçük altın "tik" animasyonu; seri artışında konfeti yerine ölçülü altın parıltı. Native-only `useNativeDriver` zaten patikada çözülmüş — aynı desen.

### P2 — Spacing ölçeği yanıltıcı adlandırma
- **Ne:** `Spacing` adları değerle örtüşmüyor: `one:4, two:8, three:16, four:24, five:32, six:64` (`theme.ts:70-78`). "three" = 16 (taban birim), "one" gerçek taban değil.
- **Etki:** Yeni kod yazarken yanlış boşluk seçimi kolay → ritim sapması.
- **Öneri:** İçerik işi değil; yorum/yeniden adlandırma (`xs/sm/md/lg/xl`) ileride. Şimdilik not.

## Hızlı kazanımlar
- `theme.ts`'te 2-3 token koyulaştır (`solukMetin`, metin-altını) → tüm app AA'ya yaklaşır, tek dosya. **(en yüksek getiri/efor)**
- `mevzuat.tsx` Monogram'a `numberOfLines={1}+adjustsFontSizeToFit` ekle → kalan taşma bug'ını kapat (diğer ikisiyle eşitle).
- Karargah'tan "Tahmini süre" sahte metriğini kaldır; "Zayıf mevzi" 3 tekrarını 1'e indir.
- Mevzuat yükleme "DurumKutu"sunu paylaşılan `Loading`'e çevir (tutarlılık).
- Branş segmented yarısını v1'de gizle/pasifleştir (boş "çok yakında" çarpışmasını kaldır).
- Fallback kartının kırmızı şeridini lacivert/altına çevir (tema kuralı).

## Riskler
- **Erişilebilirlik denetimi:** Düşük kontrast hem kullanıcı şikâyeti hem mağaza/erişilebilirlik incelemesi riski. Marka altın/krem dengesi korunarak çözülebilir (yalnız metin token'ları, yüzeyler değil).
- **Refaktör regresyonu:** Bileşen konsolidasyonu görsel parite gerektirir; "saf görünüm" kuralı (CLAUDE.md) ile uyumlu ama her ekranda göz teyidi şart (web+native).
- **Tema bölünmesi:** Krem/koyu ikiliği genişlerse (yeni koyu ekranlar) iki palet ayrı bakım ister; token isimlendirmesi (`kart*Koyu`) tek yerde toplu olduğu için yönetilebilir.
- **Alternatif yön maliyeti:** Aşağıdaki "dark-first" gibi köklü yön, oturmuş krem dile karşı yüksek iş; mockup'la doğrulanmadan girilmemeli.

## Alternatif tasarım yönleri (konsept → ne değişir → neden iyi → hangi ekranlar)

### Yön A — "Saha Dosyası" (Field Dossier) · EVRİM (önerilen)
- **Konsept:** Mevcut krem-premium + Playfair editöryel dili KORU, ama kontrastı düzelt, bileşenleri birleştir, Karargah'ı sadeleştir. Marka aynı, cila artar.
- **Ne değişir:** Token koyulaştırma; tek `Progress`/`Monogram`/`SegmentedTabs`/`DurumKutu→EmptyState`; Karargah tek odaklı hero + 2 (3 değil) net kutu; tutarlı yükleme dili + hafif skeleton; ödül anlarına haptik+altın tik.
- **Neden iyi:** En düşük risk/en yüksek getiri; oturmuş kimliği bozmadan "premium" iddiasını gerçeğe yaklaştırır; erişilebilirlik kapanır.
- **Hangi ekranlar:** Hepsi (özellikle Karargah, Mevzuat, Tatbikat, Evsaf, Onboarding).

### Yön B — "Komuta Konsolu" (Dark-First) · DEVRİM
- **Konsept:** Uygulamanın TAMAMINI, zaten Kart Akışı'nda kullanılan koyu lacivert premium yüzeye taşı; krem/altın aksan olur. Tek mod → kart akışındaki bağlam sıçraması kalkar.
- **Ne değişir:** `Screen`/kartlar koyu; altın+krem metin yüksek kontrast (koyu üzerinde altın AA'yı kolay geçer — mevcut kontrast sorununu KÖKTEN çözer); görseller koyu zeminde daha "parlak" durur (kart-merkezli ürün için avantaj). OLED'de pil dostu.
- **Neden iyi:** Tek tutarlı dünya; askeri "gece görüş / harekât" teması daha güçlü; görsel hafıza kartları öne çıkar. Kontrast sorununu tema değiştirerek çözer.
- **Risk/maliyet:** Tüm ekranların yeniden stillenmesi; krem marka kararından (CLAUDE.md "kanonik") sapma → başkan onayı şart.
- **Hangi ekranlar:** Tümü; en çok kazanan Karargah + Mevzuat liste + Evsaf.

### Yön C — "Görsel-Önce Deste" (Editorial Flashcard) · ODAK KAYDIRMA
- **Konsept:** Ana fark "görsel hafıza karikatürü" olduğundan, ev ve liste ekranlarını metin-yoğun panolardan GÖRSEL-önce büyük kart akışına çevir. Karargah'ta günün maddesinin karikatürü tam-genişlik hero kart olur; Mevzuat'ta kanunlar küçük görsel kapaklı dikey deste.
- **Ne değişir:** Karargah hero = büyük görsel kart + tek CTA; Mevzuat satırları görsel-kapaklı; Playfair başlıklar daha iri, daha az ikincil metin (kontrast yükü de azalır).
- **Neden iyi:** Ürünün asıl değerini (görsel) ilk saniyede gösterir; mağaza ekran görüntüleri çok daha çarpıcı; "başka SRS uygulamasından farkım ne" sorusunu görselle yanıtlar.
- **Risk:** Görsel performans/önyükleme (akış'ta çözülmüş prefetch deseni var, oraya dayanır); bilgi yoğunluğu düşer (bazı kullanıcılar veri-panosu sever).
- **Hangi ekranlar:** Karargah, Mevzuat, Ara sonuçları, Onboarding tanıtım kartı.

## Hangi tasarım-skill'i hangi iş için (sonraki faz: mockup üretimi)
- **`imagegen-frontend-mobile` → ana araç.** Mobil RN ekran konsepti/akış mockup'ları üretmek için doğru skill (telefon çerçevesi + çok-ekran tutarlılık + tema paleti). Yön A/B/C için Karargah, Mevzuat, Kart Akışı, Onboarding ekran görselleri burada üretilir. (Yalnız görsel üretir, kod yazmaz — değerlendirme için ideal.)
- **`brandkit` → marka panosu.** Krem-premium paletini (lacivert/altın/krem + Playfair/Inter) resmî bir brand board'a dökmek, ikon/monogram sistemi ve mağaza görsel dilini sabitlemek için. Token koyulaştırma kararını görselleştirir.
- **`design-taste-frontend` / `high-end-visual-design` → SINIRLI.** Bu ikisi web/landing odaklı (HTML/CSS/Tailwind, GSAP). RN uygulama ekranlarına doğrudan uymaz; YALNIZ ileride mağaza tanıtım/indirme **web landing sayfası** veya gizlilik/şartlar sayfaları için kullanılır (docs/ zaten HTML barındırıyor). Uygulama içi tasarım için kullanma.
- **Sıra önerisi:** (1) `brandkit` ile token/marka panosu sabitle → (2) `imagegen-frontend-mobile` ile Yön A mockup'ları (düşük risk) → başkan onayıyla istenirse Yön B/C karşılaştırma board'u.

## Karşı-görüş & doğrulama (çoklu göz)
- **Kontrast iddiası — doğrulandı (hesap):** Relative-luminance ile `solukMetin/krem=3.67:1`, `altinKoyu/krem=2.87:1`. AA normal-metin 4.5:1 altında. Karşı-görüş: "büyük başlık/anaMetin sorunsuz" — DOĞRU; sorun yalnız ikincil/aksan metin. Yüzeyler (lacivert üstü açık metin) zaten geçiyor.
- **"Branş yarısı ölü" — doğrulandı:** `mevzuat.tsx:199`, `tatbikat.tsx:118` placeholder dalları. Karşı-görüş: "yol haritası sinyali iyi olabilir" — kabul; bu yüzden silmek yerine pasif/rozet önerildi.
- **Monogram fix tutarsızlığı — doğrulandı:** tatbikat:166 + ara:248'de `adjustsFontSizeToFit` var, `mevzuat.tsx:371` Monogram'da YOK. Bu, bileşen-çoğullama riskinin somut kanıtı.
- **DOĞRULANMADI (cihazda göz teyidi gerekir):** Gerçek telefon ekranında güneş/parlama altında okunabilirlik; mod geçişinin "sarsıcı" hissi; skeleton ihtiyacının algısal şiddeti. Bunlar ölçümle değil kullanıcı testiyle netleşir.
- **Kapsam notu:** `ayarlar.tsx`, `egitim-plani.tsx`, `rutbe-sec.tsx`, `geri-bildirim.tsx`, `giris.tsx`, `yasal.tsx`, `sesli-nobet.tsx` ekranları yüzeysel tarandı (ana 9 ekran + paylaşılan UI derinlemesine okundu); bu yardımcı ekranlar aynı `Screen`/`AppText`/token sistemini kullandığından yukarıdaki sistemik bulgular (kontrast, bileşen birliği) onlara da aynen uygulanır.

---
## KARSI-GORUS & DOGRULAMA (kirmizi takim)

> İkinci gözle bağımsız kod doğrulaması. Ana raporun çoğu iddiası DOĞRU çıktı; birkaçı abartılı, birkaç önemli nokta atlanmış, bir önceliklendirme tartışmalı. Her ana iddiaya güven notu eklendi.

### Doğrulanan iddialar (güven: Yüksek)
- **Kontrast hesabı doğru (Yüksek).** Bağımsız yeniden hesapladım (sRGB relative-luminance, WCAG formülü): `solukMetin #8A7D62 / kremZemin #F7F3EA` = **3.65:1** (rapor 3.67 — yuvarlama farkı, aynı), `altinKoyu #B88917 / krem` = **2.86:1** (rapor 2.87). Token değerleri `theme.ts:23,27` ile birebir. etiket(13px)/kucuk(15px) NORMAL metindir, AA 4.5:1 gerektirir; hiçbiri WCAG "büyük metin" istisnasına (≥24px veya ≥18.66px bold) girmez — `study-card`/`app-text.tsx:21-22` font haritası teyit eder. İddia sağlam.
- **"Zayıf mevzi" 3 tekrar AYNI sayı (Yüksek).** `index.tsx:120-121` `tekrarSayisi = queue?.length ?? 0` ve `bekleyen = queue?.length ?? 0` — ikisi de birebir aynı `getZayifKuyruk` uzunluğu. Hero (`:249`), BUGÜNÜN GÖREVİ (`:282`), 3-kutu (`:323`) hepsi bu tek değeri gösteriyor. Rapor doğru.
- **"Tahmini süre = `${bekleyen} dk`" sahte metrik (Yüksek).** `index.tsx:267` doğrulandı; 1 kart=1 dk sabiti, türetilmemiş. Kaldır/gerçek ortalamayla besle önerisi yerinde.
- **Monogram fix tutarsızlığı (Yüksek).** `mevzuat.tsx:380-385` Monogram'da `numberOfLines/adjustsFontSizeToFit` YOK; `tatbikat.tsx:166-172` ve `ara.tsx` kopyalarında VAR. Bileşen-çoğullama drift'inin somut kanıtı, teyit edildi.
- **Branş sekmesi her zaman placeholder (Yüksek).** `mevzuat.tsx:199-204`, `tatbikat.tsx:118-123` `blok==='brans'` → `DurumKutu "Çok yakında"`. Doğru.
- **DurumKutu üçlemesi + paylaşılan EmptyState/Loading varken yarış (Yüksek).** `mevzuat.tsx:586`, `tatbikat.tsx`, `patika.tsx` yerel `DurumKutu`; buna karşılık `components/ui/empty-state.tsx` + `loading.tsx` mevcut ve `index.tsx:127,141` onları kullanıyor. İki desen gerçekten paralel.
- **Haptik yok (Yüksek).** `expo-haptics`/`Haptics` için tüm `src` taraması 0 sonuç. "Ödül anları düz" iddiası kanıtlı.
- **Kırmızı fallback şeridi tema ihlali (Yüksek ama düşük etki).** `study-card.tsx:140` `baslikSerit.backgroundColor: Palette.kirmizi`, CLAUDE.md "kırmızı SADECE aksiyon/uyarı" ile çelişir. Rapor kendi de "565/565 görselli → nadir" diye doğru hafifletmiş.

### İtirazlar / düzeltmeler
- **"Mağaza erişilebilirlik denetimi bunu işaretler" — ABARTILI (güven: Düşük).** `index.tsx` Bulgular `:25`. Ne Google Play ne App Store metin-kontrastı için OTOMATİK RED vermez; WCAG kontrastı her iki mağazada da zorunlu inceleme kriteri değil, kılavuz seviyesindedir. Kontrast gerçek bir KULLANILABİLİRLİK sorunudur (yorgun göz/güneş) ama "mağaza reddi riski" gerekçesi DOĞRULANMADI ve gereksiz aciliyet katıyor. Gerekçeyi "saha okunabilirliği"ne dayandır, mağazaya değil.
- **"P0/P1" etiketi fazla yüksek — P1 olmalı (güven: Orta).** Düşük kontrastlı İKİNCİL metin bir launch-blocker (P0) değildir; ana metin/başlıklar (`anaMetin #1B2A4A` koyu, krem üstünde ~10:1) sorunsuz okunuyor. Rapor zaten "P0/P1" diye ikircikli; net P1 demeli. Gerçek P0 yok denetimde.
- **Mevzuat Monogram "taşma riski hâlâ açık" — render edilmeden DOĞRULANMADI (güven: Orta).** Bug'ın iki yerde düzeltilip birinde kalması KESİN; ancak fiili taşmanın olup olmadığı `mevzuat.tsx` Monogram kutu genişliğine (`boyut` prop, `variant`) ve gerçek kanun-no uzunluğuna bağlı — cihazda görülmeden "taşıyor" denemez. Rapor "risk" diye doğru hedge'lemiş; somutlaştırma için: en uzun no'lu kanun (5237 vb. 4 hane) ile en küçük `boyut` kombinasyonunu test et.

### Atlanmış noktalar (rapor kapsamında "dokunma hedefi" yazıyor ama bulgu yok)
- **P2 — Dokunma hedefi (touch target) min boyutu HİÇ değerlendirilmemiş.** Kapsam cümlesi (satır 4) "dokunma hedefi" diyor ama tek bulgu yok. `index.tsx` 3-kutu `Pressable` ve `Gorev` kutuları, `unutSatir` (`:188`), segmented sekmeler sabit min-yükseklik garantisi taşımıyor; ≥44px (iOS) / 48dp (Android) teyidi gerekiyor. Header ikonları `hitSlop={10}` ile ~44px'e ulaşıyor (iyi), ama liste satırları DOĞRULANMADI. P2 olarak eklenmeli.
- **P2 — Dynamic Type / OS font ölçeği ile çakışma.** `app-text.tsx:36-40` `allowFontScaling`'i kapatmıyor (erişilebilirlik için İYİ — kullanıcı sistem yazı boyutunu büyütebilir), AMA sabit-boyutlu kutular (Monogram, `kutu`, segmented) + `adjustsFontSizeToFit` 200% font ölçeğinde kırpılma/bozulma yapabilir. `adjustsFontSizeToFit` ile dinamik ölçek birbirini bozar. En az %130 ölçekte ana ekranların göz teyidi şart. Raporun kontrast odağı bu eksenı kaçırmış.
- **P2 — Dekoratif ikonlarda ekran-okuyucu gürültüsü.** `accessibilityLabel` kapsamı dengesiz (`sinav.tsx`=1, `sicil.tsx`=3'e karşı `mevzuat.tsx`=17, `akis.tsx`=9). Yüzlerce dekoratif `MaterialCommunityIcons` (`Halka`, `Monogram` kitap ikonu, şerit ikonları) `importantForAccessibility="no"`/`accessibilityElementsHidden` taşımıyor → VoiceOver/TalkBack'te gereksiz duraklar. Rapor erişilebilirliği yalnız RENK ekseninde ele almış; ekran-okuyucu ekseni atlanmış.

### Önceliklendirme eleştirisi
- Rapor kontrastı **#1 sistemik kusur** sayıyor. Katılıyorum ki en YAYGIN olanı (her ekran), AMA iş etkisi açısından **"yarısı ölü Branş sekmesi" (P1) ve "onboarding değer-önermesi yok" (P1) mağaza dönüşümü/ilk-izlenim için daha sert vurur** — mağazadan inen kullanıcı ilk 10 saniyede boş "Çok yakında" yarısına çarpıp, ürünün ana farkını (görsel hafıza) hiç görmeden bırakabilir. Bunlar listede orta sıralarda; ben **onboarding değer-önermesini P1-üst**, kontrastı **P1 (saha okunabilirliği gerekçesiyle, mağaza değil)** olarak sıralardım. Hızlı kazanımlar bölümü doğru (token koyulaştırma = en yüksek getiri/efor), itiraz yok.

### Genel kanı
Rapor teknik olarak SAĞLAM ve kanıt-bağlı (dosya:satır referansları tutuyor, kontrast matematiği bağımsızca doğrulandı). Düzeltilmesi gereken tek somut yanlış: "mağaza reddi" gerekçesi (Düşük güven, çıkar). Eklenmesi gereken: dokunma-hedefi, dynamic-type, ekran-okuyucu eksenleri (üçü de P2). Alternatif yönler (A/B/C) ve skill önerileri isabetli; özellikle Yön A (evrim) düşük-risk/yüksek-getiri tespiti doğru.
