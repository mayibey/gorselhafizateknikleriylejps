# 07 — ÖDEME ALTYAPISI (Play Billing, doğrudan)

> Baz alınan plan: `docs/YAYIN_IS_PLANI_V2.md` FAZ 4–5 (Doğrudan Google Play Billing, RevenueCat YOK). Bu rapor o iki maddeyi somut, sıralı, eforlu bir mühendislik planına dönüştürür ve eksikleri kapatır.
> Doğrulama: kod okundu (`auth-context.tsx`, `supabase.ts`, `auth.ts`, `config.ts`, `package.json`). Hipotezler dosya:satır ile işaretlendi. Doğrulanmayanlar "DOĞRULANMADI".

## Özet
- **Mevcut durum: ödeme tarafında SIFIR kod var.** `package.json` (D:\...\package.json:5-42) içinde hiçbir billing kütüphanesi yok; `grep premium|billing|iap|abonelik` yalnız UI/tema yanlış-eşleşmeleri döndürdü (gerçek entitlement mantığı YOK). Yani bu faz tamamen yeni inşa.
- **Auth iskelesi ödemeye HAZIR ama eksik bir alan var:** `auth-context.tsx` yalnız `{id, email}` tutuyor (auth-context.tsx:12, :36) — **`premium`/yetki alanı YOK**. Ödeme entitlement'ı bu context'e eklenecek tek-nokta. Supabase client koşullu yükleniyor (supabase.ts:16-19) → ödeme de aynı "ana şalter" desenini izlemeli (`ODEME_AKTIF` bayrağı).
- **Kütüphane kararı:** `expo-in-app-purchases` **ÖLÜ** (arşivlendi, SDK 54 yok) → eleyin. **`react-native-iap`** (mature) veya **`expo-iap`** (aynı yazar, Expo-config-plugin-native) → ikisi de **Expo Go'da çalışmaz, dev/prod build şart** — proje zaten yerel gradle build kullandığı için uyumlu (CLAUDE.md "yerel build"). Öneri: **react-native-iap** (v13.x, RN 0.81 uyumlu pin) — en çok saha-test edilmiş.
- **Gelir güvenliğinin TEK doğru ekseni: sunucu otoritesi.** İstemcideki "premium=true" bayrağı reklamdır, koruma değildir. Gerçek kilit = premium içeriğin **imzalı URL'i yalnız sunucuda doğrulanmış entitlement'a verilir** (FAZ 2 premium bucket ile birleşir). Bu rapor bunu zorunlu kılar.
- **Ürün modeli önerisi:** v1'de TEK ürünle başla → karmaşık yenileme/iade yaşam döngüsünü minimuma in. İki aday: (a) **tek-seferlik "Tam Erişim" (non-consumable)** — en basit doğrulama, churn yok; (b) **abonelik (aylık+yıllık base plan + 3 gün deneme)** — yinelenen gelir ama RTDN/yenileme yaşam döngüsü şart. Karar gerekçesi aşağıda.
- **Compliance bloklayıcı:** Ödeme açılınca Play Data Safety + gizlilik metni ("veri toplanmıyor" → "satın alma/e-posta toplanıyor") GÜNCELLENMELİ (config.ts:44-46, :58 zaten "v2'de güncellenir" notu var). Çelişki = mağaza reddi.

---

## Bulgular (önem sırası)

### B1 — [P0] Kütüphane seçimi: expo-in-app-purchases ÖLÜ; react-native-iap pinle
- **Ne:** Play Billing istemci kütüphanesi seçilmeli.
- **Nerede:** Yeni bağımlılık; `package.json:5-42` (şu an yok).
- **Neden:** `expo-in-app-purchases` Expo tarafından **deprecate edildi ve arşivlendi** (SDK 47 sonrası bakımsız, SDK 54 için yayını YOK — DOĞRULANMADI: tam EOL sürümü, ama Expo dokümanında "deprecated" olduğu bilinen gerçek). Kalan iki gerçek seçenek:
  - **react-native-iap** (yazar hyochan): olgun, Play Billing **v7** destekli sürümler (v13.x) RN 0.81 ile uyumlu. Config plugin var (`react-native-iap` → autolinking). **Expo Go'da ÇALIŞMAZ** (native modül) → mevcut yerel dev/prod build şart, ki zaten var.
  - **expo-iap** (aynı yazar, daha yeni, Nitro/Expo-modül tabanlı): Expo config-plugin entegrasyonu daha temiz, ama saha-test geçmişi daha kısa.
- **Etki:** Yanlış lib (deprecate) seçilirse build/runtime kırılır; SDK 54 pin kuralı (CLAUDE.md "SÜRÜM SABİT") gereği sürüm el-yordamıyla seçilmeli.
- **Öneri:** **react-native-iap** seç, kesin sürümü `react-native-iap@<RN0.81-uyumlu son>` olarak **pinle** (caret değil). `app.json` plugins'e config plugin ekle. Yeni native modül = yeni dev build + EAS/yerel gradle yeniden derleme. (Alternatif expo-iap'i POC'la kıyasla; karar tek seferlik.)

### B2 — [P0] Entitlement, auth-context'e taşınmalı (tek-nokta yetki)
- **Ne:** "Bu kullanıcı premium mi?" durumu uygulama geneline tek yerden sunulmalı.
- **Nerede:** `auth-context.tsx:12` (`Kullanici = {id,email}` — premium YOK), `:14-20` (context değeri), `:58` (provider value).
- **Neden:** Gating (FAZ 5) ve UI kilitleri tek bir `premium`/`yetki` okuyacak. Şu an böyle bir alan yok → her ekran kendi kontrolünü yaparsa tutarsızlık + güvenlik deliği.
- **Etki:** Eklenmezse gating dağınık ve istismara açık olur.
- **Öneri:** `AuthContextDeger`'e `premium: boolean`, `premiumBitis: string | null` (ISO), `yetkiYukleniyor: boolean`, `yetkiYenile(): Promise<void>` ekle. Kaynak: Supabase `entitlements` tablosu (B5) + yerel cache (B6). Oturum açılınca/uygulama öne gelince yenile.

### B3 — [P0] Sunucu doğrulama: Play Developer API + Supabase Edge Function
- **Ne:** İstemcinin döndürdüğü `purchaseToken` SUNUCUDA Google'a doğrulatılmalı; istemciye asla güvenilmez.
- **Nerede:** Yeni Supabase Edge Function (Deno) `verify-purchase`; istemci tarafı satın-alma callback'i (yeni `src/lib/odeme.ts`).
- **Neden:** İstemci sahte "satın aldım" diyebilir; APK patch'lenebilir (bkz. 10_ANTI_PIRACY). Tek güven kaynağı **Google Play Developer API**:
  - Abonelik: `purchases.subscriptionsv2.get` (purchaseToken ile).
  - Tek-seferlik: `purchases.products.get`.
  - Yetki: GCP service account (JSON key) + Play Console'da "Finance/Order management" yetkisi; Edge Function service-account JWT ile Google'a OAuth2 token alır.
- **Etki:** Bu olmadan ödeme = dekoratif; herkes bedava açar.
- **Öneri:** Akış → istemci satın alır → `purchaseToken`+`productId` Edge Function'a POST (kullanıcı JWT'si Authorization header'da) → fonksiyon Google'a doğrular → geçerliyse `entitlements` tablosuna yazar (service_role) → istemci `acknowledgePurchase`/`finishTransaction` çağırır (3 gün içinde ack ZORUNLU yoksa Play iade eder).

### B4 — [P0] Yenileme/iptal/iade için RTDN (Real-time Developer Notifications)
- **Ne:** Aboneliklerde yenileme, iptal, ödeme başarısızlığı, iade (voided) olayları sunucuya itilmeli.
- **Nerede:** Yeni Edge Function `play-rtdn` (webhook); Google Cloud Pub/Sub topic.
- **Neden:** İstemci "restore" yetersiz — kullanıcı uygulamayı açmadan abonelik bitebilir/iade alabilir. Play **RTDN**'i Pub/Sub topic'e iter; Pub/Sub push subscription → Edge Function. İade için ayrıca `purchases.voidedpurchases.list`.
- **Etki:** Olmazsa: iptal eden/iade alan kullanıcı premium kalır (gelir kaçağı) veya yenileyen kullanıcı erişimini kaybeder (destek yükü).
- **Öneri:** Play Console → Monetization setup → Pub/Sub topic adı gir. Edge Function olay tipine göre `entitlements.aktif`/`bitis` günceller. **Tek-seferlik ürün seçilirse RTDN gereği büyük ölçüde düşer** (yalnız iade webhook'u) → B-ürün-modeli kararını basitleştirir (bkz. B8).

### B5 — [P1] Entitlement tablosu + RLS (Supabase)
- **Ne:** Doğrulanmış yetki kalıcı saklanmalı.
- **Nerede:** Yeni tablo `public.entitlements`.
- **Neden:** auth-context bunu okuyacak; imzalı-URL Edge Function bunu kontrol edecek.
- **Şema önerisi:** `user_id uuid PK/FK auth.users`, `urun text`, `kaynak text` (play), `purchase_token text unique`, `aktif boolean`, `baslangic timestamptz`, `bitis timestamptz null` (abonelik), `son_dogrulama timestamptz`, `ham_yanit jsonb`.
- **RLS:** SELECT yalnız `auth.uid() = user_id`; INSERT/UPDATE **yalnız service_role** (Edge Function). Kullanıcı kendi satırını YAZAMAZ (yoksa premium'u kendine verir).
- **Etki:** RLS yanlışsa kullanıcı kendine premium yazar → gelir sıfır.

### B6 — [P1] Offline grace (çevrimdışı tolerans)
- **Ne:** Uygulama %100 offline çalışıyor (CLAUDE.md); entitlement her açılışta sunucuya bağlanamayabilir.
- **Nerede:** Yeni `src/lib/entitlement-cache.ts` (AsyncStorage), auth-context'te tüketilir.
- **Neden:** İnternetsiz açan ödeyen kullanıcı kilitlenmemeli; ama sonsuz offline = bedava istismar.
- **Öneri:** Son doğrulama `son_dogrulama` + `bitis` AsyncStorage'a yazılır. Kural: `aktif && now < min(bitis, son_dogrulama + GRACE)`; **GRACE = 7–14 gün**. Çevrimiçi olunca yenile. (Saat manipülasyonu için: son görülen sunucu zamanını sakla, geri-gitmeyi reddet — DOĞRULANMADI: kapsam kararı.)
- **Etki:** GRACE yoksa offline ödeyen kilitlenir (kötü UX + 1-yıldız); GRACE sonsuzsa bir kez doğrulayıp uçağa alıp süresiz kullanır.

### B7 — [P1] Restore (satın alımları geri yükle) — Play politikası ZORUNLU
- **Ne:** Cihaz değiştiren/yeniden kuran kullanıcı satın alımını geri getirebilmeli.
- **Nerede:** Yeni `src/lib/odeme.ts` → `getAvailablePurchases()` (react-native-iap) açılışta + "Satın alımları geri yükle" butonu (Sicil ekranı).
- **Neden:** Google Play politikası geri-yüklemeyi şart koşar; ayrıca aynı Google hesabıyla giren kullanıcı yeniden ödememelidir.
- **Öneri:** Açılışta sessiz `getAvailablePurchases` → her token'ı B3 Edge Function'a doğrulat → entitlement güncelle. UI'da manuel buton da olsun.

### B8 — [P1] Ürün modeli kararı (abonelik vs tek-seferlik)
- **Ne:** YAYIN_IS_PLANI_V2:78 "açık karar" olarak bırakmış (abonelik mi, tek-seferlik mi, paket mi).
- **Karşılaştırma:**
  - **Tek-seferlik "Tam Erişim" (non-consumable INAPP):** ✅ en basit sunucu doğrulama (`products.get`), ack-only, RTDN'siz (yalnız iade), churn yok, offline-grace kolay. ❌ yinelenen gelir yok, fiyatlama tek atış. **Sınav app'i = zaman-sınırlı kullanım → kullanıcı "ömür boyu" beklentisini sevmez ama satışı kolay.**
  - **Abonelik (base plan aylık + yıllık offer + 3 gün deneme):** ✅ yinelenen gelir, deneme ile dönüşüm, Play modern base-plan/offer esnek. ❌ RTDN+yenileme+grace+iptal yaşam döngüsü (B4) zorunlu → en çok mühendislik.
  - **Paket (branş/kanun başına):** en karmaşık gating; v1 için ERTELE.
- **Öneri:** **v1'de tek-seferlik "Tam Erişim" ile başla** (en hızlı yayın, en az hata yüzeyi), yapı aboneliği sonradan ekleyecek şekilde tasarlanır (entitlement tablosu `bitis null` = süresiz). Yinelenen gelir hedefi netse v1.1'de yıllık abonelik eklenir. (Karar başkanın; bu rapor teknik maliyeti netleştirir.)
- **Fiyat:** Play min ~ aylık/sabit; TR pazarı için tek-seferlik makul bir bedel (DOĞRULANMADI: fiyat iş kararı). Play "yerel fiyatlandırma" otomatik.

### B9 — [P0] Play politika uyumu (reddi önle)
- **Ne:** Dijital içerik için **Play Billing dışında ödeme YASAK** (harici link/kart yok). Ayrıca: abonelik şartları net gösterimi, deneme bitince ücretlendirme bildirimi, "Aboneliği yönet" derin linki (`https://play.google.com/store/account/subscriptions`), fiyat/periyot açık gösterim, geri-yükleme (B7).
- **Nerede:** Yeni "Yükselt/Premium" ekranı + Sicil.
- **Neden:** İhlal = anında red veya hesap askısı.
- **Etki:** En sık red sebeplerinden biri harici ödeme yönlendirmesi.
- **Öneri:** Tüm satın-alma yalnız `requestPurchase` (Play sheet). UI'da net fiyat, periyot, iptal/yönet linki, gizlilik linki.

### B10 — [P1] Compliance: Data Safety + gizlilik metni güncelle
- **Ne:** Ödeme açılınca "veri toplanmıyor" beyanı yalan olur.
- **Nerede:** `config.ts:44-46` (Sentry kaldırıldı, "veri toplanmıyor" doğru), `:50-58` (UYELIK_AKTIF=false notu zaten "v2'de gizlilik güncellenir" diyor), `docs/GIZLILIK_POLITIKASI.md`, `constants/yasal-metin.ts` (DOĞRULANMADI: dosya var mı, ama config notu referans veriyor).
- **Neden:** Auth(e-posta)+satın-alma(işlem) toplanır → Play Data Safety formu + gizlilik metni + hesap silme (08 raporu konusu) eşzamanlı.
- **Öneri:** B-fazıyla atomik: ödeme PR'ı + compliance PR'ı birlikte yayınlanır.

### B11 — [P2] Gating bağlama noktası (FAZ 5 ile birleşir)
- **Ne:** Entitlement'ın içeriği gerçekten kilitlediği yer.
- **Nerede:** Premium içerik erişimi = FAZ 2 imzalı-URL Edge Function (11_SUNUCU_ASSET_OFFLINE konusu). İstemci UI kilidi = ayrı (kozmetik).
- **Neden:** Gerçek koruma istemcide değil, imzalı-URL'i veren sunucuda (B3 entitlement kontrolü). UI kilidi yalnız UX.
- **Öneri:** İmzalı-URL fonksiyonu, URL üretmeden önce `entitlements`'tan yetki doğrular. Ücretsiz örnek = public bucket (imzasız). Bu rapor kapsamı ödeme; gating detayı FAZ 5/11. raporda.

---

## Hızlı kazanımlar
- `auth-context.tsx`'e `premium`/`yetkiYenile` alanlarını **şimdiden** (ödeme lib'i gelmeden, hep `false` dönen) ekle → diğer ekranlar arayüze bağlanır, ödeme gelince yalnız kaynak değişir. Düşük efor, gating'i ileride dağıtmaz.
- `ODEME_AKTIF` bayrağını `config.ts`'e ekle (`UYELIK_AKTIF` deseni, supabase.ts:16 gibi) → ödeme kodu bayrak kapalıyken HİÇ yüklenmez, v1 offline beyanı bozulmaz.
- Service account + Pub/Sub topic + Play "Monetization setup" = **bürokratik bekleme** → FAZ 0 ile birlikte HEMEN tetikle (kod beklemeden), kütüphane geldiğinde hazır olsun.
- Entitlement tablosu + RLS = küçük SQL; Edge Function iskeleti gelmeden kurulabilir.

## Riskler
- **R1 (gelir kaçağı):** İstemci-only "premium=true" → APK patch ile bedava. Azaltma: B3 sunucu doğrulama + B11 imzalı-URL sunucu kontrolü ZORUNLU. İstemci bayrağı yalnız UX.
- **R2 (SDK 54 pin):** react-native-iap yanlış sürüm → native build kırılır (CLAUDE.md sürüm kuralı). Azaltma: kesin sürüm pin + ayrı dev build'de doğrula, yarım bırakma.
- **R3 (ack unutma):** Play satın alımı 3 günde acknowledge edilmezse OTOMATİK iade. Azaltma: doğrulama başarılı olunca derhal `acknowledgePurchase`/`finishTransaction`.
- **R4 (Expo Go imkânsızlığı):** Native modül → Expo Go test edilemez; tüm ödeme testi internal/closed test track + dev build. Azaltma: Play "Lisans test hesapları" + closed test ile gerçek satın-alma simülasyonu (test hesabı ücretsiz satın alır).
- **R5 (compliance çelişkisi):** Ödeme açık + "veri toplanmıyor" beyanı = red. Azaltma: B10'u ödeme ile atomik yayınla.
- **R6 (saat manipülasyonu / offline istismar):** Sonsuz grace + cihaz saati geri alma. Azaltma: grace sınırı + son-görülen-sunucu-zamanı geri-gitme reddi.
- **R7 (RTDN kurulum karmaşası):** Pub/Sub yanlış → yenileme/iade kaçar. Azaltma: tek-seferlik ürünle başla (RTDN yüzeyi küçük), aboneliği sonra ekle.

## Maliyet
- **Play komisyonu:** İlk 1M USD/yıl gelirde **%15**, üstünde %30 (abonelikte de %15 — DOĞRULANMADI: Play'in güncel oran tablosu, ama bilinen yapı). TR için yerel fiyat + KDV Play tarafından yönetilir.
- **Altyapı:** Supabase Edge Functions + tablo = mevcut ücretsiz/başlangıç planında. GCP Pub/Sub + Developer API = pratikte ücretsiz (düşük hacim). Service account = ücretsiz.
- **Geliştirme eforu (kaba):** kütüphane+config plugin+dev build 0.5g · satın-alma akışı (odeme.ts) 1g · Edge Function doğrulama+service account 1–1.5g · entitlement tablo+RLS+auth-context bağı 0.5g · offline grace+restore 0.5g · RTDN webhook (abonelikte) +1g · Premium/Yükselt ekranı 0.5g · compliance (Data Safety+gizlilik) 0.5g · closed-test doğrulama 0.5g. **Toplam ~5–6.5 gün** (tek-seferlik) / **+1.5g** (abonelik). 2 günde TÜMÜ gerçekçi DEĞİL → 2 gün = hesap/iskele + tek-seferlik MVP doğrulaması.

---

## Somut adımlar (sıralı, eforlu)
1. **(FAZ 0, hemen — bürokrasi)** Play Console: ödeme/satıcı profili + vergi (onay gün sürer) · GCP service account (JSON) + Play "Order management" yetkisi · Pub/Sub topic + Play Monetization setup. **(0 kod, bekleme uzun)** — ~0.5g + bekleme.
2. **(iskele)** `config.ts`'e `ODEME_AKTIF=false` bayrağı; `auth-context.tsx`'e `premium/premiumBitis/yetkiYenile` (hep false döner). Tüm gating bu arayüze bağlanır. — ~0.5g.
3. **(DB)** Supabase `entitlements` tablosu + RLS (SELECT=self, write=service_role). — ~0.25g.
4. **(lib)** `react-native-iap` pinli kur + config plugin + yeni dev build; `src/lib/odeme.ts` (init, ürün sorgu, `requestPurchase`, `getAvailablePurchases`, ack). — ~1.5g.
5. **(sunucu)** Edge Function `verify-purchase`: kullanıcı JWT doğrula → Play Developer API ile token doğrula → `entitlements` yaz (service_role). — ~1.5g.
6. **(istemci bağla)** Satın-alma callback → verify çağır → başarı → ack → `yetkiYenile` → auth-context premium=true. `entitlement-cache.ts` (offline grace) + açılışta restore. — ~1g.
7. **(abonelik seçilirse)** Edge Function `play-rtdn` (Pub/Sub push) → yenileme/iptal/iade → entitlement güncelle. — ~1g.
8. **(UI)** "Premium/Yükselt" ekranı (fiyat/periyot/iptal-yönet linki/gizlilik) + Sicil'de "Satın alımları geri yükle". Play politika uyumu (B9). — ~0.5g.
9. **(compliance)** `ODEME_AKTIF=true` ile EŞZAMANLI: Data Safety formu + gizlilik metni + hesap silme (08 ile). — ~0.5g.
10. **(test)** Closed test track + lisans test hesabı ile gerçek satın-alma/iade/restore/grace senaryoları. `npx tsc --noEmit` 0. — ~0.5g.

> **Gating (FAZ 5) bu raporun dışında** ama bağlanır: gerçek kilit B11 (imzalı-URL Edge Function entitlement kontrolü, 11. rapor). İstemci kilidi yalnız UX.

---

## KARŞI-GÖRÜŞ & DOĞRULAMA (çoklu göz)
- **"2 günde biter" iddiasına karşı:** Maliyet bölümü ~5–6.5g diyor; 2 gün yalnız FAZ 0 bürokrasi + tek-seferlik MVP iskelesine yeter. Bu raporun başlığındaki "2 gün sonra" = işin BAŞLAMA zamanı, bitiş değil. Gerçekçi tutuldu.
- **"react-native-iap kesin doğru" değil:** expo-iap (aynı yazar, Expo-native) daha temiz olabilir; karar tek-seferlik POC ile netleşmeli — bu yüzden B1 alternatifi açık bıraktı. expo-in-app-purchases'in EOL tam sürümü DOĞRULANMADI (genel "deprecated" bilgisi kesin, tam tarih değil).
- **"Abonelik daha iyi" otomatik değil:** Sınav app'i zaman-sınırlı; tek-seferlik daha az hata yüzeyi + daha hızlı yayın. Yinelenen gelir iş kararı; rapor teknik maliyeti netleştirip kararı başkana bıraktı (B8).
- **İstemci güvenine karşı en sert duruş alındı:** entitlement istemcide değil sunucu+imzalı-URL'de (R1, B3, B11) — 10_ANTI_PIRACY ve 11_SUNUCU raporlarıyla tutarlı olmalı (çapraz-kontrol önerilir).
- **Play komisyon oranı ve EOL sürüm gibi sayısal/sürüm detayları "DOĞRULANMADI" işaretlendi** (resmi dokümandan teyit edilmeli); mimari kararlar koddan doğrulandı (auth-context premium yokluğu, supabase koşullu yükleme deseni, billing lib yokluğu).

---
## KARSI-GORUS & DOGRULAMA (kirmizi takim)

> Bağımsız ikinci göz. Yukarıdaki "çoklu göz" notu raporun KENDİ savunması; bu bölüm o savunmayı da test eder. Kod bağımsızca okundu: `auth-context.tsx`, `supabase.ts`, `config.ts`, `package.json` + `grep` (src genelinde premium/billing/purchase → yalnız `theme.ts` ve `app-text.tsx` yanlış-eşleşmesi, gerçek ödeme kodu YOK).

### Doğrulanan ana iddialar (güven notu)
- **"Ödeme tarafında SIFIR kod"** → **DOĞRU / Yüksek.** `package.json:5-42` billing kütüphanesi yok; src genelinde entitlement/purchase mantığı yok (yalnız tema yanlış-eşleşmesi). ✓
- **"auth-context premium alanı yok, tek-nokta entitlement gerekir"** → **DOĞRU / Yüksek.** `auth-context.tsx:12` `Kullanici={id,email}`, `:14-20` context tipi, `:58` provider değeri — premium/yetki alanı gerçekten yok. ✓
- **"Sunucu otoritesi zorunlu, istemci bayrağı reklamdır"** → **Mimari olarak DOĞRU / Yüksek.** B3 (Play Developer API token doğrulama) + B5 (RLS write=service_role) doğru kurgu. ✓
- **"ODEME_AKTIF bayrağı, supabase.ts:16 / UYELIK_AKTIF desenini izlemeli"** → **Desen DOĞRU / Yüksek** ama eksik (aşağıda KG1). `supabaseHazir = UYELIK_AKTIF && anahtarlar` (supabase.ts:16) teyit edildi. ✓
- **"react-native-iap seç (v13.x, Play Billing v7, RN0.81 uyumlu)"** → **Sürüm/öneri / Düşük.** Bu rapor sürümü zaten "DOĞRULANMADI" dedi; doğru. Ancak öneri yönü tartışmalı (KG2).

### Atlanan / yetersiz işlenen kritik noktalar
- **KG1 [P0] — Ödeme, üyeliği ZORUNLU kılar; ODEME_AKTIF bağımsız bayrak DEĞİL.** Rapor B5'te entitlement'ı `user_id uuid FK auth.users` ile per-kullanıcı bağlıyor; ama "Hızlı kazanımlar"da `ODEME_AKTIF`'i `UYELIK_AKTIF`'ten bağımsız ekle diyor. Çelişki: server-doğrulamalı per-user entitlement, oturum (Supabase auth) olmadan İMKANSIZ. Yani **ODEME_AKTIF ⇒ UYELIK_AKTIF=true** (sert bağımlılık). `config.ts:58` şu an `UYELIK_AKTIF=false`; ödeme açmak otomatik olarak e-posta toplama + hesap silme + Data Safety yükümlülüğünü (B10, 08 raporu) tetikler. Tek alternatif "Play-hesabı-only" (Supabase'siz, sadece `getAvailablePurchases`) modeldir ki bu B5/B7'nin kendi-hesabına-bağlı restore'unu çürütür. Rapor bu çatalı (login-gated vs Play-only) hiç adlandırmamış. **Etki: Yüksek** — yol haritası sırasını değiştirir.
- **KG2 [P1] — react-native-iap önerisi büyük olasılıkla TERS.** Aynı yazar (hyochan) `react-native-iap`'in yeni sürümlerini Nitro/Expo-modül mimarisine taşıdı ve **expo-iap**'i halefi olarak konumlandırdı; "en çok saha-test edilmiş = react-native-iap" gerekçesi eski sürümlere ait, yeni majör sürüm zaten yeniden-yazım. Expo SDK 54 + config-plugin + yerel gradle olan BU proje için **varsayılan expo-iap olmalı, react-native-iap alternatif** — rapor tam tersini öneriyor. (Web erişimi yok, knowledge cutoff Jan 2026 → **güven Orta**; POC ile kesinleştir. CLAUDE.md "SÜRÜM SABİT" gereği hangi seçilirse pin + dev build doğrulaması şart, bu kısım doğru.)
- **KG3 [P0] — Gömülü içerik varken imzalı-URL koruması SIFIR.** R1/B11 azaltması ("premium içerik yalnız imzalı URL ile") YALNIZCA içerik cihazdan çıkınca (FAZ 2, Supabase Storage) işe yarar. `YAYIN_IS_PLANI_V2.md` notu: 643MB içerik APK'ya GÖMÜLÜ + kapalı test sürüyor. Gömülü kaldıkça APK'yı alan herkes tüm asset'lere sahip → ödeme/sunucu-doğrulama ne olursa olsun koruma KOZMETİK. Rapor bu bağımlılığı B11'de değiniyor ama P0 sıralama-kısıtı olarak yükseltmiyor: **"FAZ 2 (içerik→Storage) BİTMEDEN ödeme gerçek kilit sağlamaz"** açıkça yazılmalı. Yoksa 5-6.5 günlük ödeme işi, korumasız bir kapıya kilit takmak olur. **Etki: Yüksek.**
- **KG4 [P1] — `obfuscatedAccountId` / satın-almayı kullanıcıya bağlama yok.** B3 yalnız token doğruluyor; satın alma anında `obfuscatedAccountId = Supabase user_id` set edip sunucuda token-hesap eşleşmesini doğrulamak, hesap-paylaşımı/dolandırıcılığı önler (08 raporunun "tek oturum" derdiyle doğrudan ilişkili). Eksik.
- **KG5 [P1] — PENDING (ertelenmiş ödeme) durumu yok.** B3 ack'i kapsıyor ama Play `PENDING` satın-alma (nakit/DANA vb.) durumunu anmıyor; PENDING'de yetki VERİLMEMELİ, satın-alma tamamlanınca verilmeli. Atlama = yanlışlıkla bedava erişim.

### Önceliklendirme eleştirisi
- **B7 (Restore) P1 → P0 olmalı.** Rapor kendisi "Play politikası geri-yüklemeyi ŞART koşar" diyor (B7); politika-zorunlu = red riski = P0. P1 etiketi tutarsız.
- **B10 (Data Safety/gizlilik) P1 → P0.** Özet "compliance bloklayıcı" diyor, B10 ise P1. Hard reddi tetikleyen iş P0 olmalı; etiket düşük kalmış.
- **B6 (offline grace) P1 doğru**, ama KG1 nedeniyle grace ancak oturum+entitlement varken anlamlı; sıralaması KG1/KG3'ten sonra.

### Küçük doğruluk notları
- Özet (madde, satır 8) entitlement kanıtı için **"auth-context.tsx:36"** veriyor; satır 36 `getSession` içindeki `setKullanici`, provider değeri/tipi DEĞİL (doğrusu `:14-20` ve `:58`, ki B2 bunları doğru veriyor). Önemsiz atıf kayması.
- Efor tablosu (satır 120) "Edge Function doğrulama+service account 1–1.5g" — Deno/Edge'de service-account JWT imzalama + Google OAuth2 token alımı pratikte daha kırılgan; tahmin iyimser ama kabul edilebilir; raporun "2 gün ≠ bitiş" geri-adımı dürüst.
- Komisyon %15/%30 (satır 118): DOĞRULANMADI işaretli — doğru, teyit edilmeli (**Orta**).

### Tek cümle hüküm
Rapor mimari teşhiste (sıfır kod, sunucu-otoritesi, entitlement tek-nokta) **sağlam ve koddan doğrulanmış**; en kritik üç boşluk: ödemenin üyeliği zorunlu kılması (KG1), gömülü içerik dururken sunucu-korumasının kozmetik kalması (KG3) ve restore/compliance'ın P0 olması — bunlar eklenmeden plan eksiktir.
