# 00 — EKSİKLER, ÇELİŞKİLER & ÇAPRAZ-BAĞIMLILIK (Orkestratör Sentezi)

> Bu dosya 01–11 raporlarını (karşı-görüşler dahil) okuyup **üç soruyu** yanıtlar:
> (a) hangi ÖNEMLİ konu hiç ele alınmamış / sığ kalmış, (b) raporlar arası ÇELİŞKİ/çakışma,
> (c) çapraz-bağımlılık (ödeme ↔ auth ↔ anti-piracy ↔ asset) tutarlı mı.
> Salt-okuma. Uygulama koduna dokunulmadı. Yeni iddialar koddan doğrulandı; doğrulanmayan "DOĞRULANMADI".
> Tek tetik-noktası kod doğrulaması yapıldı (C1/C2): 7/7 `/akis` navigasyonu param taşıyor
> (`patika:299,392`, `ara:99`, `sicil:127,139`, `index:233,311`), param'sız giriş YOK → `gunlukSinirli`
> (`akis.tsx:165` default dal) erişilemez; `gunlukKart` yalnız orada tüketiliyor (`akis.tsx:56`).

## Özet
- **11 rapor teknik olarak sağlam ve büyük ölçüde tutarlı; ana zafiyet münferit raporlarda DEĞİL, ARALARINDA**: (1) sıra/bağımlılık tek yerde çizilmemiş, (2) "convergence" bileşenleri (imzalı-URL Edge Function, SRS-akış zinciri) her raporda parça parça, (3) birkaç doğrudan teknik çelişki çözümsüz.
- **En kritik içerik-mantık çelişkisi (C1): 01 "ölü `getDailyQueue` zincirini KALDIR" ↔ 05 "due tekrarı Etüt'e BAĞLA"** — aynı ölü zincir, zıt reçete. 05 kazanmalı: "kaldır" uygulanırsa SRS (ürünün ana vaadi) kalıcı gömülür.
- **C2 doğrulandı: "Eğitim Planı" ekranı TÜMÜYLE dekoratif.** 02 kendi kırmızı-takımı (K1) "kart-limiti kısmı çalışıyor" diyerek B1'i yumuşatmış; YANLIŞ — `gunlukKart` ölü dalda → hem bildirim hem kart-limiti ekseni no-op. B1'in "tümden sahte" çerçevesi DOĞRU.
- **En kritik mimari çelişki (C3): at-rest şifreli cache** — 10 "BİRİNCİL savunma" ↔ 11 "expo-image/audio şifreli dosya okuyamaz, P0/P1'de YAPMA". 11 kanıtlı, kazanır.
- **En büyük 3 GAP (hiçbir rapor sahiplenmiyor):** (E1) iOS gelir/Apple/App Attest yolu, (E2) misafir→hesap SRS göç + bulut-senkron çakışma çözümü, (E6) premium/ücretsiz içerik sınırının içerik-gerçeğiyle eşlenmemesi (branş 41 kanun boşken neyi paraya kapatıyorsun?).
- **Çapraz-bağımlılık SIRASI doğru ama HARD-GATE olarak yazılı değil:** gerçek koruma ⇐ içerik sunucuda (FAZ2) ⇐ entitlement (FAZ4) ⇐ üyelik+KVKK (FAZ3). "FAZ2 bitmeden ödeme kozmetik" üç raporda ima, hiçbirinde kilit-kural.
- **Meta: P0 enflasyonu** — 07/08/09/10/11'in P0'ları "v1-yayın-blokeri" DEĞİL, "üyelik-aktivasyon-blokeri". Bugün gerçek v1-blokerleri başka raporlarda (02/04/05/06) dağınık.

---

## Bulgular

### A) ATLANMIŞ / SIĞ KALMIŞ KONULAR (gaps)

**[E1 · P0-aktivasyon] iOS gelir yolu (StoreKit + App Attest + Apple Sign In) bütünsel olarak YOK**
- **Nerede:** 07 tamamen Android (`react-native-iap` + Play Developer API); 08 B6 Apple'ı "iOS'a çıkılırsa" diye şartlı; 09 KIRMIZI-6 işaret etmiş ama çözüm yok; 11 B7 yalnız Supabase/R2.
- **Neden:** CLAUDE.md proje SDK 54'e **iPhone Expo Go uyumu için** sabitli → iOS gerçek bir hedef, "belki" değil. Ama hiçbir rapor çift-platform entitlement (`premium_users.source = play|appstore`) + StoreKit makbuz doğrulama + App Attest'i sahiplenmiyor.
- **Etki:** v2 ödeme açılınca iOS kullanıcısı ya hiç ödeyemez ya da Android-only entitlement onu dışlar; Apple App Store 4.8 (Apple Sign In) + StoreKit zorunlulukları son anda red üretir.
- **Öneri:** 07'ye "iOS para yolu" alt-bölümü ekle; entitlement şemasını baştan `source` kolonuyla çift-platform kur (09 B5 tablo tek-platform tasarlanmış). iOS hedefi YOK ise CLAUDE.md/PROJE_DURUM'a açıkça "v1/v2 Android-only, iOS yalnız Expo Go test" yaz — bu karar hiçbir yerde net değil (08 B6 "DOĞRULANMADI").

**[E2 · P0-aktivasyon] Misafir→hesap SRS göçü + bulut-senkron çakışma çözümü tasarlanmamış**
- **Nerede:** 08 KIRMIZI-2 boşluğu işaret etmiş; 09 `user_progress` tablosunu (B1) bir cümlede geçiyor; 11 SRS senkronunu hiç işlemiyor.
- **Neden:** CLAUDE.md "SRS kutsal" + v1 misafir akışı (`giris.tsx:126` "girişsiz devam") → kullanıcı girişsiz SRS biriktirip sonra üye olunca lokal↔bulut **çakışma çözümü tanımsız** (lokal mi kazanır, bulut mu, birleştirme mi?).
- **Etki:** Üyelik açılınca ilerleme kaybı / çift-sayım / kullanıcı güveni. Bu, offline-v1 ↔ üyelik-v2 köprüsünün GÖBEĞİ ve sahipsiz.
- **Öneri:** Ayrı bir "SRS bulut-senkron + göç" tasarım notu: idempotent merge (kart bazında `max(kutu, son_tarih)`), tek-yön ilk-yükleme, RLS `own_rows`. Soft-gate (08 adım 1a) önerisi bu iş bitmeden verilmemeli.

**[E3 · P0-v1] "Yanıltıcı/işlevsiz özellik" sicili dağınık — birleşik iddia-gerçek denetimi yok**
- **Nerede:** 02 B1 (bildirim no-op), 05 P0-1 (SRS akışı sürmüyor ama "aralıklı tekrar" duyuruluyor), 03 (Karargah "Tahmini süre" sahte metrik), 02 B7 (rütbe filtresi dekoratif). Hepsi aynı Google "deceptive/non-functional feature" sınıfı.
- **Neden:** Her rapor kendi alanında buluyor; mağaza açıklaması (`docs/MAGAZA_LISTELEME.md`) ile çapraz denetim yapılmamış.
- **Etki:** Mağaza listesinde "SRS / aralıklı tekrar / bildirimli eğitim planı" yazıp uygulamada çalışmıyorsa → tek tek küçük, toplamda somut red gerekçesi.
- **Öneri:** Yayın öncesi tek "İddia ↔ Gerçek" tablosu: mağaza metnindeki her özellik vaadi → kodda çalışıyor mu? Çalışmayanı ya düzelt ya metinden çıkar. E4 ve C1/C2 ile birleşir.

**[E4 · P1] Bildirimin GERÇEK altyapısı (FCM / expo-notifications) hiçbir yerde planlanmadı**
- **Nerede:** 02 sahte özelliği teşhis etti (paket app.json+package.json'dan ÇIKARILMIŞ) ama gerçek yolu kimse tasarlamadı; MEMORY roadmap "bildirimler ⏳".
- **Etki:** SRS app'inde bildirim çekirdek beklenti; "yakında" diye gizlense bile v2'de gerçek FCM + (Supabase gelince) server-driven hatırlatma planı yok → tekrar yarım iş riski.
- **Öneri:** v2 backlog'una "expo-notifications + standalone FCM (`google-services.json`) + yerel `scheduleNotificationAsync`" tasarımı; Supabase varken sunucu-tetikli hatırlatma opsiyonu.

**[E5 · P1] Otomatik test (jest) yok — sistemik, tek rapor değindi**
- **Nerede:** Yalnız 01 P1. Ödeme/auth/entitlement/anti-piracy/asset-çözümleyici hepsi gelirken sıfır test.
- **Etki:** Parite ("web=native") ve "SRS kutsal" değişmezleri cihaz-içi tespite mahkûm; gelecek 6 fazın her biri regresyon riski taşıyor.
- **Öneri:** 01 KIRMIZI-3 ölçeği doğru — minimal yüksek-değerli set: web↔native parite smoke + SRS kutu-geçiş + (E2 gelince) merge testi. Tüm faz işleri bunun üstüne otursun.

**[E6 · P1] Premium/ücretsiz içerik SINIRI içerik-gerçeğiyle hiç eşlenmemiş (içerik ↔ ödeme kopuk)**
- **Nerede:** 05 P0-1/B "yalnız müşterek 25 kanun içerikli, branş 41 kanun (id 26–66) boş"; 07/10/11 premium gating planlıyor ama "premium ne, ücretsiz tadımlık ne" sorusu içerik tablosuyla eşlenmemiş.
- **Neden:** İçerik üretimi (05) ile monetizasyon (07) ayrı raporlarda; kesişim kimsenin değil.
- **Etki:** Branş boşken müştereki paraya kapatırsan ödeyen kullanıcı = herkesin gördüğü müşterek; "JSPS branş sınavı" vaadi ↔ içerik = mağaza dürüstlük riski (05 KIRMIZI-D). Gating mimarisi `is_free` bayrağına dayanıyor (09 B1) ama hangi kartların `is_free` olacağı tanımsız.
- **Öneri:** Ödeme fazından ÖNCE içerik-paketleme kararı: ücretsiz tadımlık kapsam (ör. her kanundan ilk N kart / 1 tam kanun) + premium = gerisi; branş içeriği gelene kadar mağaza kapsamını "müşterek mevzuat" diye net beyan et.

**[E7 · P1] WebP dönüşümü YARIM kalmış — neden durduğu araştırılmadı**
- **Nerede:** 11 KT1/KT2/atlanan-nokta: `assets/kartlar` = 371 PNG + 194 WebP (disk sayımı). Pipeline 194'te durmuş.
- **Etki:** 11 B9 "en büyük tek kazanım, ~0.5g" diyor ama sebep (kalite reddi? OOM? elle?) bilinmeden efor/risk biçilemez; karışık uzantı manifest+çözümleyiciyi kırar (11 KT3).
- **Öneri:** `scripts/`teki gorsel/webp boru hattını incele, neden durduğunu bul; codegen'den (B1) ÖNCE tüm görselleri tek formata normalize et (11 KIRMIZI sıra düzeltmesi).

**[E8 · P2] Offline ↔ sunucu-otorite ürün politikası SAHİPSİZ (3 yerde "açık bırakıldı")**
- **Nerede:** 10 Riskler, 11 B6, 07 — üçü de "ücretsiz offline, premium ilk-indirme-sonra-offline" diyor ama net karar/sahip yok.
- **Etki:** "%100 offline" mağaza beyanı ↔ sunucu-gating internet şartı çelişkisi; kışla/saha kitlesi için kötü offline = churn.
- **Öneri:** Tek ürün-politikası kararı (başkan onayı): hangi içerik offline-her-zaman, hangisi ilk-indirme-sonra-offline; gizlilik metni + Data Safety buna göre.

### B) RAPORLAR ARASI ÇELİŞKİLER

**[C1 · P0] 01 "ölü `getDailyQueue` zincirini KALDIR" ↔ 05 "due tekrarı Etüt'e BAĞLA" — ZIT reçete, aynı zincir**
- **Nerede:** 01 P1 (`akis.tsx:54-57,159-165` ölü → "kaldır ya da işaretle"); 05 P0-1 (`gunlukKuyruk` saf fonksiyonu hazır → "Etüt = due + zayıf birleşimi yap").
- **Doğrulama:** Zincir gerçekten erişilemez (7/7 param'lı `/akis`, doğrulandı). İki rapor AYNI ölü kodu görüp biri "sil" biri "dirilt" diyor.
- **Çözüm (orkestratör hükmü):** **05 kazanır.** SRS ürünün ana vaadi; "kaldır" uygulanırsa `gunlukKuyruk`/`getDailyQueue`/`YENI_LIMIT` silinince SRS'i diriltme mekanizması yok olur. Doğru iş: zinciri SİLME, `getDailyQueue`'yu `yeniLimit>0` ile + zayıf havuzla birleştirip Etüt'e bağla; yanıltıcı JSDoc'ları (`native.ts:644,662` "Etüt kuyruğu/akış getDailyQueue kullanır" — 01 KIRMIZI-5) düzelt.

**[C2 · P0] 02 K1 "Eğitim Planı kart-limiti GERÇEKTEN çalışıyor" ↔ 01/05 "param'sız dal ölü" — 02 K1 FAKTÜEL YANLIŞ**
- **Doğrulama:** `gunlukKart` yalnız `akis.tsx:56` `gunlukSinirli()`'de tüketiliyor; o da ölü default dalda (`akis.tsx:165`). Başka tüketici yok (grep: egitim-plani UI + bildirim.ts tip/varsayılan + akis.tsx:56). → stepper'ı değiştirmek **hiçbir erişilebilir davranışı etkilemiyor.**
- **Çözüm:** 02 K1'in "özellik tümden sahte değil" nüansı YANLIŞ; **B1'in "tümden no-op" çerçevesi DOĞRU** — hem bildirim hem kart-limiti ekseni ölü. Eğitim Planı ekranı bütünüyle dekoratif. (Not: C1'de zincir Etüt'e bağlanırsa `gunlukKart` o zaman canlanabilir → iki iş birlikte düşünülmeli.)

**[C3 · P0] At-rest şifreli cache: 10 [P0-2] "BİRİNCİL savunma" ↔ 11 [B8] "YAPMA (P0/P1)"**
- **Nerede:** 10 P0-2 "premium cache cihaza-özel şifreli = hedefin teknik çekirdeği"; 11 B8 "expo-image (`{uri:file://}`) ve expo-audio şifreli dosyayı OKUYAMAZ → decrypt-to-temp cache faydasını öldürür, geçici dosya yine düz sızar → P2/opsiyonel, P0/P1'de YOK".
- **Çözüm:** **11 kazanır** (teknik kanıt güçlü; 10 kendi KIRMIZI'sı da offline+anahtar-cihazda ⇒ rootlu sahip yine çözer diye P0-2'yi zayıflatıyor). Birincil savunma = private bucket + kısa-TTL imzalı URL + entitlement (RLS) + Play Integrity + mevcut forensic filigran. Şifreli cache yalnız "cache klasörünü başka cihaza kopyala" naif saldırısını kırar; v2'de yalnız-ses için opsiyonel.

**[C4 · P1] CDN-cache (11 B5) ↔ per-user imzalı URL (09 B2) — birbirini etkisizleştiriyor**
- **Nerede:** 11 B5 "Cloudflare/R2 cache egress'i ~sıfıra indirir, en yüksek kaldıraç"; 09 B2 "her çağrı per-user benzersiz 60sn imzalı URL". 09 KIRMIZI-1 kendi yakaladı: benzersiz query-string imza → CDN her istekte MISS → cache çalışmaz.
- **Çözüm:** İki rapor uzlaşmıyor; ayrı tasarım gerek — ya (a) path-bazlı stabil URL + Cloudflare signed-cookie/token-auth (Supabase imzalı-URL DEĞİL), ya (b) premium'da CDN-cache'ten vazgeçip yalnız app-seviye kota (09 KIRMIZI-2: Supabase zaten Cloudflare arkasında, ek CDN'in DDoS getirisi sınırlı) ile maliyeti yönet. Net karar gerekiyor; "en yüksek ROI" rozeti (11 B5) mevcut imzalı-URL tasarımıyla geçersiz.

**[C5 · P1] Ödeme kütüphanesi: 07 B1 "react-native-iap" ↔ 07 KIRMIZI-2 "expo-iap olmalı"**
- Rapor kendi içinde ters. Yazar `react-native-iap`'i Nitro'ya taşıdı, halef expo-iap; Expo SDK54 + config-plugin + yerel gradle için expo-iap daha uygun. **Çözüm:** POC ile kesinleştir, varsayılan **expo-iap**; hangisi olursa kesin sürüm pin + dev build doğrulaması (CLAUDE.md "SÜRÜM SABİT").

**[C6 · P1] Entitlement sağlayıcı: RevenueCat ↔ doğrudan Play Billing (doküman çelişkisi)**
- `YAYIN_DENETIM_GUVENLIK.md:53,58,72` RevenueCat; `YAYIN_IS_PLANI_V2.md:56` doğrudan `react-native-iap`/Play Billing (RevenueCat YOK). 09 ve 10 ikisi de gördü. **Çözüm:** V2 esas (doğrudan Billing) — sabitlenip `YAYIN_DENETIM_GUVENLIK.md` ilgili satırları "stale" işaretlenmeli (02'nin §1/§6 stale tespitiyle aynı bakım borcu).

**[C7 · P1] ODEME_AKTIF bağımsızlığı: 07 hızlı-kazanım ↔ 07 KIRMIZI-1**
- 07 "ODEME_AKTIF'i UYELIK_AKTIF'ten bağımsız ekle" der ama per-user entitlement (B5 `FK auth.users`) oturum olmadan imkânsız → **ODEME_AKTIF ⇒ UYELIK_AKTIF=true** sert bağımlılık. **Çözüm:** Bağımsız bayrak yanlış; ödeme açmak otomatik üyelik+KVKK+Data Safety+hesap-silmeyi (D2 paketi) tetikler. (Tek istisna Play-only restore modeli, o da self-restore'u çürütür.)

**[C8 · P1] Apple zorunluluğu: 08 B6 "zorunlu" ↔ 08 KIRMIZI "e-posta+şifre ile opsiyonel"**
- E1 (iOS yolu) ile birleşir; e-posta+şifre kendi hesap sistemi 4.8'i karşılayabilir → Apple Sign In opsiyonel olabilir. İlişki iki bulgu arasında kurulmamış. **Çözüm:** iOS kararı (E1) verilince netleşir.

**[C9 · P2] Cloudflare gerekliliği: 09 B3 "P0 öne koy" ↔ 09 KIRMIZI-2 "Supabase zaten arkasında, gereksiz"**
- Gerçek boşluk app-seviye per-user kota (09 `download_log`), DDoS değil. **Çözüm:** Cloudflare'i "en yüksek kaldıraç P0"dan indir; kota + spend-cap'i öne al (09 KIRMIZI önceliklendirme).

**[C10 · P2] Rakam/doküman çelişkileri (stale)**
- İçerik boyutu: `YAYIN_IS_PLANI_V2` + bazı atıflar **643 MB** ↔ ölçüm **~1.51 GB** (10, 11 `du`). FAZ2 rakamı stale.
- 11 KT1: "565 png" yanlış → 371 PNG + 194 WebP.
- `YAYIN_DENETIM_GUVENLIK.md §1/§6` stale (02 özet): Tatbikat geri açıldı, branş "yakında" geri geldi, notifications çıkarıldı — doc'un ÜÇÜ de yanlış. Bu doc'a güvenip yayına gidilirse yanlış varsayım.
- **Çözüm:** FAZ2 rakamını ~1.5 GB'a düzelt; stale doc'lara açık "GÜNCEL DEĞİL — bkz. DEGERLENDIRME" notu.

### C) ÇAPRAZ-BAĞIMLILIK TUTARLILIĞI (ödeme ↔ auth ↔ anti-piracy ↔ asset)

**[D1 · yapısal P0] SIRA-KİLİDİ tek yerde yazılı değil: FAZ2 bitmeden ödeme kozmetik**
- 07 KG3 + 10 P0-1 + 11 hepsi "içerik APK'da gömülü kaldıkça (1.5 GB) ödeme/sunucu-doğrulama KOZMETİK" diyor — ama HARD GATE olarak tek cümlede yok. Zincir: **gerçek koruma (10) ⇐ içerik sunucuda (11 FAZ2) ⇐ entitlement (07/09) ⇐ üyelik+KVKK (08).**
- **Etki:** Sıra bozulursa 5-6 günlük ödeme işi korumasız kapıya kilit takmak olur.
- **Öneri:** Yol haritasına kilit-kural: **FAZ2 (asset→sunucu, içeriği bundle'dan çıkar) BİTMEDEN FAZ4 (ödeme) başlamaz.**

**[D2 · yapısal P0] "Üyelik-aktivasyon kilometre taşı" atomik paket — tam bağımlılık grafiği hiçbir raporda yok**
- `ODEME_AKTIF=true` ⇒ `UYELIK_AKTIF=true` (C7) ⇒ aynı anda gereken: {4 auth yöntemi veya en az Google+e-posta (08 B1), KVKK metni + yurt-dışı açık rıza (08 B3), Play Data Safety (07 B10), hesap silme app-içi + **web URL** (08 KIRMIZI-3), tek-oturum (08 B2), entitlement+RLS+çift-platform (09 B1/B5 + E1), asset→sunucu (11 FAZ2), anti-piracy katmanları (10), Supabase özel SMTP (08 KIRMIZI-1)}.
- **Etki:** Biri eksikse ya mağaza reddi (KVKK/Data Safety/hesap-silme/yanıltıcı offline beyanı) ya gelir kaçağı (tek-oturum yok / entitlement client'ta). Her rapor kendi parçasını P0 sayıyor; **kimse atomik paketi çizmiyor.**
- **Öneri:** Tek "Aktivasyon Checklist"i (aşağıdaki Somut Adımlar §B). Her P0 etiketini "v1-blokeri" / "aktivasyon-blokeri" diye yeniden işaretle (P0 enflasyonunu kır).

**[D3 · yapısal P0] Convergence noktası `imzali-url` Edge Function 4 raporda PARÇALI tarif — kanonik spec yok**
- 07 B11, 09 B2, 10 P0-3/P1-1, 11 B7 hepsi AYNI fonksiyonu anlatıyor; yön tutarlı ama her biri ötekinin parçasını atlıyor. Birleşik kanonik spec:
  - **Girdi:** JWT (09 KIRMIZI-5: GoTrue ağ-çağrısı yerine JWKS yerel doğrula) + `device_id` (10/08) + Play Integrity token (10: `appRecognition != PLAY_RECOGNIZED` → hard-fail, zayıf-cihaz → soft) + `oturum_id` (08 tek-oturum guard).
  - **Kontrol:** entitlement RLS (`premium_users.active`, çift-platform `source` — E1) + **ATOMİK** kota (09 KIRMIZI-4 TOCTOU) + **upstream IP-limit fonksiyondan ÖNCE** (09 KIRMIZI-3: yoksa her abuse isteği invocation+DB+Integrity maliyeti yakar).
  - **Çıktı:** kısa-TTL imzalı URL (C4 kararına göre Supabase imzalı-URL ya da R2 presigned/signed-cookie).
- **Öneri:** Bu beş parçayı tek "imzali-url sözleşmesi" dokümanına birleştir; 07/08/09/10/11 ona referans versin.

**[D4 · yapısal P1] supabase-js lazy-load ↔ tek-oturum kalıcı Realtime soketi — mimari gerilim**
- `supabase.ts:18-23` ağır `@supabase/supabase-js`'i koşullu `require` ile geciktiriyor (release çökme yüzeyi). 08 tek-oturum tasarımı kalıcı Realtime soketi istiyor → ağır modül sürekli açık (pil/veri + başlangıç yüzeyi geri gelir). 01 (bundle/perf) ile kesişir.
- **Çözüm (08 KIRMIZI-4 ile tutarlı):** Realtime'ı ZORUNLU sayma; AppState'te `oturum_id` oku + Edge guard yeterli (tek-oturum yaptırımı asıl imzalı-URL ucunda). Realtime nice-to-have. Raporlar arası bu çözüm bağlanmamış.

**[D5 · tutarlı, ama dağınık P1] Ekran-koruma + filigran 4 raporda — birleştir**
- 06 ATLAMA-1 + 02 K5: `EKRAN_KORUMA_AKTIF=false` (`akis.tsx:59-60`) → FLAG_SECURE şu an KAPALI ("SS almak için"), yayın öncesi `true` yapılmalı. 06: koruma yalnız `/akis`'te (sınav/madde-sheet/sesli-nöbet korumasız). 10/11: filigran kaynağı v2'de user-id'ye. Hepsi hemfikir ama tek yerde toplanmamış.
- **Öneri:** "İçerik-koruma" tek backlog kalemi: FLAG_SECURE'u aç + kart görseli görünen tüm ekranlara genişlet + filigran → user-id (v2).

---

## Hızlı kazanımlar (orkestratör)
- **C1/C2 birleşik karar:** `getDailyQueue` zincirini SİLME — Etüt'e (due+zayıf) bağla; `gunlukKart` o zaman canlanır; yanıltıcı JSDoc düzelt. Tek hamle hem 01 ölü-kod hem 05 SRS hem 02 Eğitim-Planı sorununu çözer.
- **E3 iddia↔gerçek tablosu:** mağaza metni (`MAGAZA_LISTELEME.md`) × kod — yayın öncesi 1 saatlik denetim, en somut mağaza-red riskini kapatır.
- **C10 doküman senkronu:** FAZ2 rakamı 643→~1.5 GB; `YAYIN_DENETIM_GUVENLIK §1/§6` + RevenueCat satırları "stale" işaretle.
- **D5:** FLAG_SECURE'u yayın öncesi aç (SS işi bittiyse) — tek bayrak, en somut "kapatılmış güvenlik".
- **P0 yeniden-etiketle:** her raporun P0'ına "v1-blokeri" mi "aktivasyon-blokeri" mi etiketi — okuyanın yanlış aciliyet algısını kır.

## Riskler
- **Yanlış aciliyet:** Raporlar P0 enflasyonu yüzünden "her şey acil" izlenimi veriyor; gerçek v1-blokerleri (02/04/05/06) v2-aktivasyon işlerinin (07-11) gürültüsünde kaybolabilir.
- **Sıra ihlali (D1):** FAZ2'den önce ödeme/anti-piracy'ye girmek = boşa emek + yayın gecikmesi + inceleme karmaşası (10 "aşırı-mühendislik" riski).
- **Atomik-paket eksiği (D2):** Aktivasyon işlerinden biri (özellikle KVKK metni / hesap-silme web URL / özel SMTP) unutulursa tek başına mağaza reddi.
- **Çözülmemiş teknik çelişki (C3/C4):** at-rest şifreleme ve CDN-cache kararları netleşmeden 11/10/09 fazına girilirse yeniden-yazım.
- **İçerik↔ödeme kopukluğu (E6):** premium sınırı içerik gerçeğiyle eşlenmeden gating yazılırsa "ödeyen ne alıyor" belirsiz → iade/churn.
- **DOĞRULANMADI:** iOS App Store hedefinin var olup olmadığı (E1/C8); özel SMTP/RevenueCat/Play komisyon oranı gibi platform detayları (raporlar zaten işaretledi); WebP pipeline'ın neden durduğu (E7).

## Somut adımlar (sıralı, tahmini efor)

**A — Hemen, v1 (üyelikten bağımsız; gerçek yayın-blokerleri)**
1. **(S) C1/C2/05 birleşik:** `getDailyQueue`'yu Etüt'e (due+zayıf) bağla, ölü JSDoc düzelt, `gunlukKart` canlandığını doğrula. SRS gerçekten çalışsın. ~0.5–1g.
2. **(S) E3 iddia↔gerçek + 02 B1:** bildirimi dürüstleştir/gizle, "Tahmini süre" sahte metriğini kaldır, mağaza metnini koda hizala. ~0.5g.
3. **(S) 04 B1 + sistemik:** Jandarma Teşkilat Yön m.25 düzelt (MM override) + `madde:uret` çok-maddeli birleştirme kök-nedenini düzelt (04 KIRMIZI). ~1g.
4. **(S) D5 + 06:** FLAG_SECURE aç + ilgili ekranlara genişlet; `.env` Supabase anahtarlarını v1 release'de boşalt; `allowBackup=false`. ~0.5g.
5. **(S) 02 B2/B3 + 03:** Tatbikat kilit eşiğini düşür, Branş "yakında" segmentini gizle, kontrast token'larını koyulaştır (`theme.ts`). ~0.5g.
6. **(S) E5 tohum:** jest + web↔native parite + SRS kutu-geçiş smoke testi. ~1g.

**B — Üyelik-aktivasyon kilometre taşı (D2 atomik paket; SIRA D1 ile kilitli)**
7. **(Karar, kod yok)** E1 (iOS hedefi var mı? → çift-platform entitlement mi Android-only mi), E6 (premium/ücretsiz içerik sınırı), E8 (offline politikası), C4 (CDN vs imzalı-URL), C5 (expo-iap), C6 (Billing sağlayıcı sabitle). ~0.5g.
8. **(FAZ2 ÖNCE)** E7 WebP normalize + 11 codegen ayrımı (`KART_ANAHTARLARI`/manifest, ext-aware) + asset→Supabase/R2 + çözümleyici + indirme yöneticisi. ~8–9g.
9. **(FAZ3)** 08: auth yöntemleri (Google+e-posta, özel SMTP), KVKK metni + açık rıza, hesap silme (app-içi + **web URL**), Data Safety; E2 SRS göç/merge tasarımı. ~3–4g.
10. **(FAZ4, FAZ2'den sonra)** 07/09: entitlement tablo+RLS (çift-platform), `imzali-url` **kanonik** Edge Function (D3 birleşik spec: JWKS + Integrity + oturum_id + atomik kota + upstream limit), makbuz doğrulama + RTDN, spend-cap. ~6–8g.
11. **(FAZ4/5)** 10/08: Play Integrity (soft/hard-fail politikası), tek-oturum (AppState+Edge guard; Realtime opsiyonel — D4), cihaz limiti, filigran→user-id. ~5–6g.
12. **(Doğrulama)** `tsc --noEmit` 0 + 4-dosya senkron + 2-cihaz kick testi + closed-test satın-alma/iade/restore + iddia↔gerçek son denetim.

> **Toplam çapraz-bağımlılık hükmü:** raporlar münferiden sağlam; orkestrasyon düzeltmesi = (1) C1/C2/C3 çelişkilerini yukarıdaki gibi karara bağla, (2) D1 sıra-kilidini ve D2 atomik paketini tek checklist yap, (3) D3 imzalı-URL'i tek sözleşmede birleştir, (4) E1/E2/E6 gap'lerini sahiplendir, (5) P0'ları "v1" / "aktivasyon" diye ikiye ayır.
