# 10 — Anti-Piracy / APK Klon Savunması

> Başkan'ın hedefi: **"APK klonlansa bile başkaları kullanamasın."**
> Bu rapor mevcut planlar üzerine İNŞA eder (tekrar etmez): `YAYIN_DENETIM_GUVENLIK.md §3`
> (güvenlik stratejisi), `YAYIN_IS_PLANI_V2.md Faz 2/4/5` (Storage + imzalı URL + gating).
> Koordinasyon: asset şifreleme detayı → **11_SUNUCU_ASSET_OFFLINE**; hesap+cihaz bağlama
> → **08_UYELIK_AUTH_TEK_OTURUM**; entitlement → **07_ODEME** / **09_BACKEND_SAVUNMA**.

---

## Ozet

- **Acı gerçek, net söylenmeli:** İstemciye inen hiçbir şey %100 korunamaz. APK'yı çıkaran biri, içine gömülü her byte'a (görsel + ses) ulaşır. Mevcut planlar bunu kabul ediyor (`YAYIN_DENETIM_GUVENLIK.md:45`) ve doğru sonuca varıyor: **değeri sunucuya taşı.** Bu raporun ana mesajı bunu somutlaştırmak.
- **Bugünkü durum, başkanın hedefinin TAM TERSİ:** Tüm değer (1.510 MB içerik — `assets/kartlar` 883 MB + `assets/sesler` 628 MB) APK'ya gömülü, `require()` ile bundle'da (`src/assets/kart-gorselleri.ts:6`). Gating/auth yok (`UYELIK_AKTIF=false`, `config.ts:58`). Yani **bugün klonlanan APK %100 çalışır** — hiçbir katman yok. Hedef ancak Faz 2+4+5 (Storage + ödeme + gating) bitince anlam kazanır.
- **Klon türü ayrımı kritik** (çoğu plan bunu karıştırıyor): (a) **APK'yı olduğu gibi kopyalama/yeniden dağıtma** — Play dışı APK paylaşımı; içerik gömülüyse bedava tam ürün. (b) **APK'yı patchleyip premium kilidini açma** — gating client'ta ise `isPro=true` yamalanır. (c) **Sadece içeriği çıkarıp APK'sız satma** (1.5GB dosya seti). Üç tehdit, üç farklı savunma; tek "Play Integrity" hepsini çözmez.
- **Tek en güçlü kaldıraç ölçek değil mimari:** Premium içeriği ücretsiz/herkese açık pakete KOYMAMAK. Bu obfuscation/root-tespiti/Integrity'nin hepsinden değerli, çünkü onlar "amatörü yavaşlatır", bu ise "değeri istemcide hiç bulundurmaz."
- **Katmanlar bir savunma derinliği:** Play Integrity (cihaz/app/lisans bütünlüğü) → sunucu-otorite gating → cihaza-özel asset şifreleme + kısa ömürlü imzalı URL → imza/tamper tespiti → hesap+cihaz bağlama. Her biri **maliyet/UX bedeli** taşır; hiçbiri tek başına yeterli değil ve hiçbiri kararlı bir saldırganı durdurmaz — amaç **korsanlığın maliyetini meşru abonelik fiyatının üstüne çıkarmak.**
- **Pragmatik tavsiye (sırayla):** v1 yayını için anti-piracy yatırımı YAPMA (gating yok, korunacak para yok). Para riski başlayınca (Faz 4/5) sırayla: sunucu entitlement → cihaza-özel şifreli asset + imzalı URL → Play Integrity ile kapıla → cihaz limiti. Tamper/root tespiti EN SON, en düşük getiri.

---

## Bulgular (önem sırası)

### [P0-1] Bugün korunacak hiçbir katman yok; tüm değer APK'da gömülü
- **Ne:** Görsel + ses tamamen bundle'a gömülü, statik `require()` ile çözülüyor; uzak kaynak/şifreleme yok.
- **Nerede:** `src/assets/kart-gorselleri.ts:6` (`require("../../assets/kartlar/...")` — ~tüm kartlar); `assets/kartlar` 883 MB + `assets/sesler` 628 MB (du ölçümü); ses de yerel require deseninde (`src/assets/kart-ses-metinleri.ts`).
- **Neden:** APK = ZIP. `unzip app.apk` → `assets/` altındaki tüm png/ses dosyaları düz çıkar. Şifre yok, dönüştürme yok. Klonlayan APK'yı kurmadan bile içeriği alır.
- **Etki:** Başkanın "klonlansa kullanamasın" hedefi bugün **%0 karşılanıyor**. Klon APK = tam çalışan ücretsiz ürün. (Bu v1 için bilinçli kabul — `YAYIN_DENETIM_GUVENLIK.md:48` — ama hedefe karşı durumu net kayda geçiriyorum.)
- **Öneri:** Anti-piracy'nin TEK ön şartı Faz 2 (içerik→Storage). İçerik APK'dan çıkmadan hiçbir savunma katmanının değeri yok. Önce premium içeriği bundle'dan çıkar; sonra katmanları kur.

### [P0-2] "Değeri sunucuya taşı" kararını ikiye böl: önizleme (public) vs premium (asla istemcide kalıcı)
- **Ne:** Plan V2 zaten `public` + `premium` bucket ayrımı öngörüyor (`YAYIN_IS_PLANI_V2.md:38-40`). Eksik olan: premium asset'in istemcide **nasıl** tutulacağı (cache) korsanlığın ana yüzeyi.
- **Nerede:** `YAYIN_IS_PLANI_V2.md:42-47` ("lazy indir + kalıcı cache" + imzalı URL) — ama cache **şifresiz disk cache** ise korumayı boşa çıkarır.
- **Neden:** İmzalı kısa-ömürlü URL yalnız **indirme anını** korur. İndirilen png/ses `expo-image`/`FileSystem` cache'inde DÜZ dosya olarak kalırsa, kullanıcı (root'lu cihazda veya `adb`/yedek ile) cache klasöründen tüm premium içeriği toplar → imzalı URL'in anlamı kalmaz. Bu, planın en büyük gizli açığı.
- **Etki:** İmzalı URL + Storage'a tüm emek harcanır ama içerik yine sızar; sadece "tek seferde toplu indirme"yi zorlaştırır, "yavaş yavaş hepsini topla"yı engellemez.
- **Öneri (11 ile koordine):** Premium asset **cihaza-özel anahtarla şifreli** cache'lensin (indir → şifrele → diske yaz; oynat/göster ânında bellekte çöz). Anahtar cihaz Keystore'unda (Android `expo-secure-store` / Keystore-backed) + sunucudan oturum başına alınır, diske düz yazılmaz. Böylece cache dosyaları başka cihazda/çıkarımda işe yaramaz. **Limit:** Ekrana gelen frame yine yakalanabilir (kamera/ekran kaydı) — bu kaçınılmaz; hedef toplu sızıntıyı kırmak.

### [P0-3] Gating kararı: premium bayrağı ASLA istemcide otorite olmamalı
- **Ne:** Plan "client'taki isPro kırılsa bile içerik sunucuda kilitli" diyor (`YAYIN_DENETIM_GUVENLIK.md:53`) — doğru ilke. Ama Faz 5 UI'si (`YAYIN_IS_PLANI_V2.md:62-64`) "kilit rozetleri / premium eşleşmesi" derken bunun client kontrolüne kaymaması garanti edilmeli.
- **Nerede:** Henüz kod yok (gating yazılmadı) — bu **tasarım uyarısı**, kod bulgusu değil. DOĞRULANMADI: gating implementasyonu mevcut değil.
- **Neden:** Eğer "premium mü?" sorusunun cevabı istemcide bir flag'e bakıyorsa, APK patchlemeyle (smali'de `if(isPro)` → `const v0, 0x1`) açılır. Gerçek kapı: **asset'in imzalı URL'i yalnız sunucu entitlement doğrulanınca üretilir.** Flag UI'yi süsler; erişimi URL üretimi belirler.
- **Etki:** Yanlış yapılırsa Faz 4 ödeme + Faz 5 gating'in tamamı tek bir smali yaması ile bypass edilir.
- **Öneri:** Mimari kural yaz: "Premium asset URL'i = Edge Function, girdi = (kullanıcı JWT + cihaz + Integrity token), çıktı = entitlement DB'de doğrulanırsa kısa-ömürlü imzalı URL, aksi halde 403." Client flag yalnız kozmetik (kilit ikonu) için. Bunu `09_BACKEND_SAVUNMA` ile birebir hizala.

### [P1-1] Play Integrity API — gerçek araç ama "her şeyi çözer" değil; ne korur/korumaz net olmalı
- **Ne:** Plan Play Integrity'yi anıyor (`YAYIN_DENETIM_GUVENLIK.md:54`) ama kapsamı belirsiz bırakıyor.
- **Korur:** İstek yapan uygulamanın **gerçekten senin imzanla imzalı, Play'den gelmiş, değiştirilmemiş** APK olduğunu (signature digest + Play recognition) + cihazın temel bütünlüğünü (`MEETS_DEVICE_INTEGRITY`) + lisans (`appLicensingVerdict=LICENSED`, kullanıcı Play'den edinmiş mi). Bu, **repackage edilmiş/yeniden imzalanmış klon APK'yı sunucu kapısında reddetmenin** en sağlam yolu — çünkü saldırganın imza digest'i seninkiyle eşleşmez.
- **Korumaz:** (a) İçeriğin kendisini — Integrity yalnız "API isteği meşru app'ten mi" der, ekrana gelen pikseli korumaz. (b) Token replay'i tam değil (nonce + kısa TTL şart). (c) Köklü ama "gerçek" cihazlardaki kullanıcıyı durdurmaz; sadece tamper/emulator/yeniden-imza sinyali verir. (d) Offline çalışmaz (sunucu çağrısı şart).
- **Maliyet/UX bedeli:** Google Cloud kurulumu + her hassas istekte nonce round-trip (gecikme); **standart Integrity günlük kota** sınırlı (sınıflandırıcı çağrı limiti) → her asset isteğinde değil, **oturum/entitlement tazeleme** anında çağır. Yanlış-pozitif (eski cihaz/Play servis eksik) meşru kullanıcıyı kilitleyebilir → "soft fail" politikası gerekir.
- **Etki:** Doğru kurulursa "yeniden imzalanmış klon APK sunucudan içerik alamaz" → başkanın hedefinin teknik çekirdeği. Yanlış kurulursa (hard-fail + her istekte) hem kota patlar hem meşru kullanıcı kilitlenir.
- **Öneri:** Integrity'yi **asset URL üreten Edge Function'ın girişine** koy (entitlement + cihaz + Integrity verdict birlikte). Token nonce'lu, TTL kısa. Hard-fail yalnız `appRecognitionVerdict != PLAY_RECOGNIZED` (yani repackaged) için; `deviceIntegrity` zayıfsa soft-degrade (logla, belki düşük çözünürlük) — UX'i koru. **Native modül + gerçek build gerektirir** (Expo Go'da YOK).

### [P1-2] Asset extraction (1.5GB) tek seferlik toplu indirmeye karşı sertleştirme
- **Ne:** İçerik Storage'a taşınınca yeni tehdit: biri tek hesapla **tüm 1.5GB'ı indirip** APK'sız dağıtır.
- **Nerede:** Plan "kanunu indir / offline" opsiyonu öngörüyor (`YAYIN_IS_PLANI_V2.md:47`) — bu offline-indir özelliği aynı zamanda **toplu sızıntı kapısı**.
- **Neden:** İmzalı URL bile olsa, entitlement'lı bir hesap script'le tüm anahtar listesini (`KART_GORSELLERI` anahtarları herkese açık registry'de) dolaşıp her dosyayı çeker.
- **Etki:** Bir "kurban hesap" → tüm içerik dökümü → torrent. Asset-özel şifreleme [P0-2] bunu kırar (dosyalar cihaza bağlı), ama şifreleme yoksa rate-limit zayıf savunma.
- **Öneri:** (1) Asset-özel şifreleme [P0-2] birincil savunma. (2) Edge Function'da **hesap başına indirme rate-limit + hacim anomali tespiti** (1 saatte 1500 dosya = bot → throttle/flag). (3) İmzalı URL TTL çok kısa (30-60 sn) → URL paylaşımı işe yaramaz. (4) Registry anahtar listesi tahmin edilebilir olduğundan (örn. `tck_m1`), liste keşfini zorlaştırmak boşa kürek — şifreleme + rate-limit'e yatır.

### [P1-3] İmza/tamper tespiti — Integrity'nin yedeği, tek başına zayıf
- **Ne:** İstemci-tarafı imza doğrulama (kendi APK signing cert SHA'sını runtime'da kontrol) + root/Frida/debugger tespiti.
- **Nerede:** Şu an yok; native kod ister.
- **Korur:** Amatör repackage'ı yavaşlatır; "uygulama kendi imzasını kontrol etti, eşleşmiyor → kapan" amatörü eler.
- **Korumaz:** Profesyonel kontrolü patchler (imza kontrol fonksiyonunu `return true` yapar — istemci-tarafı her kontrol patchlenebilir). Bu yüzden **Play Integrity'nin sunucu-taraflı imza doğrulaması bunu işlevsel olarak kapsar ve daha güçlü.**
- **Maliyet/UX:** Native entegrasyon + yanlış-pozitif (bazı cihazlar/Play servis) riski; ROI düşük.
- **Öneri:** İstemci-tarafı tamper/root tespitine **yatırım yapma** (Integrity zaten sunucuda imzayı doğruluyor). Yapılacaksa yalnız "caydırıcı sürtünme" olarak, asla tek kapı olarak değil. **En düşük öncelik (P2).**

### [P1-4] Hesap + cihaz bağlama (lisans paylaşımı) — 08 ile koordine
- **Ne:** Bir abonelik → sınırsız cihazda kullanım (arkadaş grubu tek hesap paylaşır) korsanlığın en yaygın gerçek-dünya biçimi.
- **Nerede:** Plan "kullanıcı başına aktif cihaz kaydı, limit aşılınca en eskiyi düş" diyor (`YAYIN_DENETIM_GUVENLIK.md:58`); cihaz kimliği bugün AsyncStorage random + reinstall'da sıfırlanıyor (`src/lib/cihaz-kimlik.ts:5,15`).
- **Neden:** Mevcut `cihaz-kimlik` forensic watermark için yeterli ama **lisans bağlama için zayıf** (kriptografik değil, reinstall'da değişir — `cihaz-kimlik.ts:14` `Math.random`). Cihaz bağlama Keystore-destekli kalıcı kimlik ister.
- **Etki:** Cihaz limiti olmadan, tek ödenen hesap N kişiye hizmet eder → gelir kaybı doğrudan.
- **Öneri (08 ile):** Entitlement geldiğinde sunucu tarafı `user_id ↔ device_id` tablosu + aktif cihaz limiti (örn. 2). `device_id` = `expo-secure-store`/Keystore'da kalıcı, reinstall'a daha dayanıklı (tam kalıcı değil — fabrika sıfırlama sıfırlar, kabul). Limit kontrolü asset URL Edge Function'ında. **Limit:** Çok katı limit meşru "telefon değiştirdim" kullanıcısını yakar → "30 günde 1 cihaz değişimi" gibi tolerans şart (UX bedeli).

### [P2-1] Forensic watermark — caydırıcı/adli, koruma değil; user ID'ye bağlanmalı
- **Ne:** Kart üstünde çapraz tekrarlı filigran (`src/components/card-flow/watermark.tsx`); kaynağı cihaz kimliği (`cihaz-kimlik.ts`).
- **Korur:** Hiçbir şeyi *engellemez*; sızan ekran görüntüsünün **kaynağını** belli eder (caydırıcı + adli iz). Ekran-fotoğrafı sızıntısına karşı tek pratik araç.
- **Korumaz:** Asset extraction'ı (filigran ekrana render anında bindiriliyor, kaynak png temiz → APK'dan çıkarılan görselde filigran YOK). Yani toplu sızıntıya karşı işe yaramaz; sadece "kullanıcı ekran görüntüsü paylaştı" senaryosunda iz bırakır.
- **Öneri:** v2'de filigran kaynağını cihaz-random'dan **gerçek user ID'ye** taşı (`cihaz-kimlik.ts` yorumu zaten bunu öngörüyor: satır 5). Düşük efor, makul caydırıcılık. Asset koruması [P0-2] ayrı iş — filigranı onunla karıştırma.

### [P2-2] `expo-screen-capture` zaten kurulu ama yalnız akış ekranında
- **Ne:** `usePreventScreenCapture()` kart akışında aktif (FLAG_SECURE) — `YAYIN_DENETIM_GUVENLIK.md:87`.
- **Korur:** Android'de ekran görüntüsü/kaydını engeller (içerik ekranı).
- **Korumaz:** İkinci telefonla fotoğraf; iOS'ta tam engel yok; APK extraction'la alakasız.
- **Öneri:** Yeterli, genişletmeye gerek yok. Anti-piracy'nin asıl ekseni (asset+sunucu) ile karıştırma; bu sadece gündelik screenshot sürtünmesi.

---

## Hizli kazanimlar

- **Karar netleştir, kod değil:** "Premium içerik ücretsiz pakete asla girmez" kuralını `YAYIN_IS_PLANI_V2.md`'ye sabit-karar olarak yaz (bugün "en son gating" derken bu mimari gereksinim örtük kalmış).
- **Cache şifreleme kararını Faz 2'ye ekle:** Plan "lazy indir + cache" diyor; tek satır ekle → "premium cache cihaza-özel şifreli" (yoksa imzalı URL emeği boşa). Bu kararı şimdi vermek, Faz 2'yi baştan doğru kurar (sonradan eklemek = yeniden yazım).
- **Registry'yi anahtar-listesi olarak tut:** `kart-gorselleri.ts` zaten codegen; Faz 2'de `require()` → URL çözücüye dönerken anahtar listesinin public olması sorun değil (savunma şifreleme+entitlement'ta, gizlilikte değil) — boşa "obfuscate" etme.
- **Integrity'yi "soft-fail + repackage-hard-fail" politikasıyla planla:** baştan yanlış (her istekte hard-fail) kurmak kota+UX felaketi; politika kararını şimdi yaz.
- **Filigran kaynağını v2'de user ID'ye bağlamayı backlog'a al** (tek dosya, `cihaz-kimlik` → auth user).

---

## Riskler

- **Aşırı-mühendislik riski (en büyük):** v1'de korunacak para yok (gating kapalı). Şimdi Integrity/şifreleme/tamper'a girmek yayını geciktirir, incelemeyi karmaşıklaştırır, sıfır getiri. **Risk: değeri olmayan şeyi korumak.** Anti-piracy = para riski başlayınca (Faz 4+).
- **Yanlış güvenlik hissi:** "Play Integrity koydum, korundum" yanılgısı. Integrity API isteğini doğrular, ekrana gelen içeriği değil. Cache şifresizse içerik yine sızar. Katmanları birbirinin yerine koyma.
- **UX/meşru-kullanıcı bedeli:** Hard-fail Integrity + katı cihaz limiti + agresif rate-limit → eski cihaz, telefon değişimi, kötü internet olan **gerçek müşteriyi** kilitler. Korsanı %5 azaltırken meşru churn'ü %20 artırma riski. Her katmanda "soft" varsayılan + tolerans şart.
- **Offline vaadi ile çatışma:** App bugün %100 offline pazarlanıyor. Sunucu-otorite gating + Integrity → premium içerik **internet ister**. Bu, kullanıcı beklentisi ve mağaza açıklamasıyla çelişebilir → "ücretsiz kısım offline, premium ilk açılışta indirir sonra offline" gibi net politika gerekir (UX kararı, 11 ile).
- **Kaçınılmaz limit (dürüst beyan):** Kararlı + teknik bir saldırgan, gerçek cihazda meşru abonelikle içeriği ekran-yakalama/bellek-dump ile **er ya da geç** çıkarır. Hiçbir istemci savunması bunu durdurmaz. Hedef: maliyeti aboneliğin üstüne çıkarıp **toplu/kolay** korsanlığı kırmak; "imkânsız" değil "zahmetli/pahalı" yapmak. Bunu başkanla net konuş — "kimse kullanamasın" mutlak haliyle teknik olarak imkânsız.

---

## Somut adimlar (sirali, tahmini efor)

1. **(Karar, ~0.5g)** `YAYIN_IS_PLANI_V2.md`'ye iki sabit-karar ekle: (a) "Premium içerik ücretsiz/herkese-açık pakete asla girmez"; (b) "Premium cache cihaza-özel şifreli". Bu rapor + 11 ile hizala. *(Kod yok, yalnız plan.)*
2. **(v1: hiçbir şey)** Yayına kadar anti-piracy kodu YAZMA. Mevcut filigran + screen-capture yeterli caydırıcı. *(Bilinçli no-op.)*
3. **(Faz 2 ile, ~3-5g)** İçerik→Storage taşınırken: premium bucket private + indir→cihaz-anahtarı-ile-şifrele→cache; göster anında bellekte çöz. Anahtar `expo-secure-store`/Keystore. **Bu, hedefin teknik çekirdeği.** *(Detay 11.)*
4. **(Faz 4/5 ile, ~3-4g)** Asset URL Edge Function: girdi = JWT + device_id + Play Integrity token; entitlement DB doğrula → 30-60sn TTL imzalı URL, aksi 403. Client `isPro` yalnız kozmetik. *(09 ile.)*
5. **(Faz 4/5 ile, ~2-3g)** Play Integrity entegrasyonu (native, gerçek build): nonce'lu, oturum/entitlement-tazeleme anında çağrı (her asset değil). Politika: repackage→hard-fail, zayıf-cihaz→soft. *(Google Cloud kurulumu + gerçek build şart, Expo Go yok.)*
6. **(Faz 4/5 ile, ~2g)** Hesap↔cihaz tablosu + aktif cihaz limiti (örn 2) + "30 günde 1 değişim" toleransı; rate-limit + hacim anomali tespiti Edge Function'da. *(08 ile.)*
7. **(v2, ~0.5g)** Filigran kaynağını `cihaz-kimlik` random'dan auth user ID'ye taşı (`watermark.tsx` props aynı kalır). *(Adli iz güçlensin.)*
8. **(Yapma listesi)** İstemci-tarafı tamper/root/imza tespitine, asset anahtar-listesi obfuscation'ına, ekstra DRM SDK'larına yatırım YOK — ROI negatif, Integrity sunucuda imzayı zaten doğruluyor.

---

## KARŞI-GÖRÜŞ & DOĞRULAMA (çoklu göz)

- **DOĞRULANDI (kod okundu):** İçerik gömülü + `require()` (`kart-gorselleri.ts:6`); asset boyutu 883M+628M (`du`); auth kapalı (`config.ts:58`, `supabase.ts:16`); cihaz kimliği random/reinstall-resettable (`cihaz-kimlik.ts:14-15`); filigran render-anı overlay, kaynak png temiz (`watermark.tsx`); screen-capture yalnız akışta (`YAYIN_DENETIM_GUVENLIK.md:87`); eas production = app-bundle (`eas.json`).
- **DOĞRULANMADI / varsayım:** Gating ve asset-URL kodu HENÜZ YOK → [P0-3], [P1-1], [P1-2] tasarım uyarısı, kod bulgusu değil. Play Integrity günlük kota rakamları ve Edge Function gecikme tahmini ölçülmedi (Google dokümantasyon bilgisi, projede test edilmedi).
- **Karşı-görüş 1 (aşırı-mühendislik):** "Bu kadar katman bir niş JSPS sınav app'i için fazla." Geçerli — bu yüzden P0 = sadece mimari karar + içeriği sunucuya taşıma; gerçek kod hep Faz 4+ ve "soft" varsayılan. Niş app'te kararlı saldırgan az; asıl tehdit "tek hesap N arkadaş" (P1-4) ve "klon APK Play dışı dağıtım" (P0-1) — ikisi de orta-efor katmanlarla kırılır, ağır DRM gerekmez.
- **Karşı-görüş 2 (offline pazarlama çatışması):** Sunucu-otorite gating offline vaadini bozar. Geçerli risk (Riskler'de işlendi) — çözüm "ücretsiz offline, premium ilk-indirme-sonra-offline" politikası; bu UX kararı 11/07 ile netleşmeli, bu raporda açık bırakıldı.
- **Boşluk (gelecek pas):** "premium ilk-indirme-sonra-offline" senaryosunda şifreli cache'in offline çözülmesi için anahtarın cihazda kalması gerekir → anahtar cihazdaysa teorik olarak çıkarılabilir (çözülmüş içerik bellekte). Bu, offline ↔ koruma arasındaki temel gerilim; 11'de derinleştirilmeli.

---
## KARSI-GORUS & DOGRULAMA (kirmizi takim)

Bağımsız doğrulama yapıldı (kod + doküman okundu). Genel hüküm: **rapor sağlam, dürüst ve doğru önceliklenmiş.** Ana mesaj (değeri istemcide tutma, v1'de no-op, katmanlar maliyet/UX bedelli) kanıtlanabilir ve doğru. Aşağıda düzeltilecek bir hata, eklenecek noktalar ve önceliklendirme itirazı var.

### Düzeltilmesi gereken hata
- **[P0-1] yanlış dosya referansı (Güven: Yüksek — kanıtlı).** Rapor (`10...:26`) ses için "yerel require deseninde (`src/assets/kart-ses-metinleri.ts`)" diyor. DOĞRULANDI: `kart-ses-metinleri.ts` **require içermez** (0 adet) — o dosya **TTS metni** (`expo-speech ile TTS okunur`, dosya başlığı). Gerçek mp3 require registry'si **`src/assets/kart-sesleri.ts`** (566 adet `require("../../assets/sesler/.../*.mp3")`). İddianın özü (ses gömülü + require) DOĞRU; yalnız dosya adı yanlış → düzeltilmeli, çünkü Faz 2'de `require()`→URL dönüşümü **`kart-sesleri.ts`** üzerinde yapılacak, `kart-ses-metinleri.ts` (TTS) bundle'da kalabilir. Not: görsel registry `kart-gorselleri.ts` 565 require ile DOĞRULANDI.

### Doğrulanan iddialar (kod okundu)
- İçerik gömülü/require: `kart-gorselleri.ts:6` (565 png require) + `kart-sesleri.ts:5` (566 mp3 require) — **Yüksek.**
- Boyut 883M+628M (`du`) — **Yüksek.**
- `UYELIK_AKTIF=false` (`src/constants/config.ts:58`) + `supabase.ts:16 supabaseHazir` zinciri — **Yüksek.**
- Cihaz kimliği `Math.random` + reinstall'da sıfırlanır, kriptografik değil (`cihaz-kimlik.ts:14-16`, dosya yorumu satır 5 user ID'ye geçişi zaten öngörüyor) — **Yüksek.**
- Filigran render-anı overlay, kaynak png temiz (`watermark.tsx:14-29`, `pointerEvents="none"`) — **Yüksek.**
- Screen-capture yalnız akışta: `akis.tsx:4,68` `ScreenCapture.preventScreenCaptureAsync()` (rapor "usePreventScreenCapture()" diyor; gerçekte hook değil **imperatif çağrı** — özünde doğru, API formu küçük netsizlik) — **Yüksek.**
- `eas.json` production = `app-bundle` — **Yüksek.**
- Plan referansları (`YAYIN_IS_PLANI_V2.md:38-47,62-64`, `YAYIN_DENETIM_GUVENLIK.md:45,48,53,54,58,87`) hepsi yerinde — **Yüksek.**

### Atlanmış / eklenecek noktalar
- **[P0-2]'nin temel zaafı küçümseniyor (Güven: Yüksek — mantık kanıtı).** Rapor cihaza-özel şifreli cache'i "birincil savunma" diye çerçeveliyor ama **offline premium şartı bunu ciddi zayıflatır**: offline çözme için anahtar cihazda kalmalı → tek meşru abonelikli **rootlu sahip**, anahtar+ciphertext'i alıp her şeyi yerelde çözer. Şifreli cache yalnız naif "cache klasörünü başka cihaza kopyala" saldırısını kırar, "tek meşru hesapla içeriği topla" saldırısını DEĞİL. Rapor bunu en sonda "gelecek pas" diye geçiştirmiş; bu, [P0-2]'nin "birincil savunma" iddiasını doğrudan çürüten bir gerçek, dipnot değil **ana uyarı** olmalı. Sonuç: şifreli cache **toplu-kolay** sızıntıyı kırar (değerli), ama tek-kararlı saldırgan + offline talebi karşısında ROI sanıldığından düşük.
- **Sunucu-taraflı filigran alternatifi atlanmış (Güven: Orta).** [P2-1] filigranı istemci overlay'i (temiz png) olarak bırakıyor → APK/cache'ten çıkarılan dosyada filigran YOK. Daha güçlü (ama pahalı) seçenek: **filigranı sunucuda teslim edilen görsele gömmek** (per-user, indirme anında). Bu, filigranı "yalnız ekran-görüntüsü izi"nden "çıkarılan-dosya izi"ne yükseltir → asset extraction senaryosunda da kaynak belli olur. Faz 2 sunucu mimarisi zaten kurulduğundan marjinal ek maliyet. Rapor bunu hiç anmıyor; en azından backlog'a girmeli.
- **.aab/split-APK nüansı (Güven: Yüksek).** Rapor hep "klon APK" diyor ama Play'e yüklenen artifact `.aab`; Play cihaz başına split APK üretir. Saldırgan içerik için universal/split APK'ları çeker — sonucu değiştirmez (içerik yine çıkar) ama terminoloji netleşmeli: tehdit "tek APK kopyala" değil, "Play'in ürettiği split'leri birleştir/içerik çıkar."
- **Entitlement sağlayıcı tutarsızlığı (Güven: Orta — doküman çelişkisi).** Rapor sunucu entitlement'i jenerik "Edge Function + DB" diye anlatıyor; bu `YAYIN_IS_PLANI_V2.md:58` (Supabase Edge → Google Play Developer API, **doğrudan Play Billing**) ile uyumlu. ANCAK `YAYIN_DENETIM_GUVENLIK.md:53` entitlement için **RevenueCat** diyor. İki plan çelişiyor; rapor bu çelişkiyi çözmeden ikisine de atıf yapıyor. [P0-3]/[P1-1]'in "Edge Function entitlement" reçetesi V2 ile uyumlu ama DENETIM'le değil → 07/09 ile sağlayıcı kararı netleşmeli (rapor bunu işaret etmeli).
- **EXPO_PUBLIC_* sızıntısı kapsam-dışı bırakılmış ama bitişik (Güven: Yüksek).** `06_GUVENLIK.md:26`: `config.ts:41-42` `EXPO_PUBLIC_SUPABASE_URL/ANON_KEY` Metro tarafından bundle'a **literal string** inline edilir (UYELIK_AKTIF=false olsa bile). Anti-piracy değil ama "APK'dan ne çıkar" sorusunun parçası; rapor "APK = ZIP, her byte çıkar" derken bu sırrın da çıktığını (v2'de dolduğunda) bir cümleyle bağlamalı. 06'ya pas yeterli.

### Önceliklendirme itirazı
- **[P1-4] (hesap paylaşımı) çok düşük sıralanmış (Güven: Orta-Yüksek).** Niş bir JSPS app'i için **gerçek-dünya #1 gelir tehdidi** "tek hesap N arkadaş"tır — rapor da KARŞI-GÖRÜŞ 1'de bunu kabul ediyor ama yine de cihaz-bağlamayı [P0-2] ağır şifreleme makinesinin ALTINA koyuyor. Cihaz-bağlama + rate-limit (~2g, basit) ROI'si, per-asset cihaz-şifrelemeden (~3-5g, kırılgan, offline'ı bozar) **daha yüksek**. Öneri: [P1-4]'ü efor/getiri bazında [P0-2]'nin ÜSTÜNE çıkar — "ucuz, yüksek getiri, meşru kullanıcıyı az yakar." Rapor kendi tezini (KARŞI-GÖRÜŞ 1) sıralamaya yansıtmamış.
- **Genel sıra doğru.** v1=no-op (adım #2) kesinlikle doğru; korunacak para yok, inceleme karmaşası riski gerçek. Tamper/root tespitinin en sona/P2'ye atılması (ROI negatif, Integrity sunucuda imzayı zaten doğruluyor) **doğru ve iyi gerekçeli** — Yüksek güven.

### Ana iddialara güven notları (özet)
- [P0-1] içerik gömülü, bugün 0 katman → **Yüksek** (kanıtlı; tek kusur ses dosya adı).
- [P0-2] şifreli cache şart → **Orta** (yön doğru; "birincil savunma" çerçevesi offline+anahtar-cihazda gerçeğiyle abartılı).
- [P0-3] gating asla istemcide otorite olmamalı → **Yüksek** (ilke doğru; sağlayıcı çelişkisi çözülmeli).
- [P1-1] Play Integrity ne korur/korumaz → **Orta-Yüksek** (kapsam tarifi doğru; kota/gecikme rakamları DOĞRULANMADI, rapor da öyle işaretliyor).
- [P1-2] toplu extraction sertleştirme → **Orta** (rate-limit zayıf, şifreleme [P0-2] zaafına bağımlı).
- [P1-3] istemci tamper tespiti düşük ROI → **Yüksek** (doğru).
- [P1-4] cihaz bağlama → **Yüksek** (cihaz-kimlik Math.random doğrulandı; sıralaması düşük — yukarı çekilmeli).
- [P2-1] filigran adli/caydırıcı → **Yüksek** (overlay doğrulandı; sunucu-gömme alternatifi eksik).
- [P2-2] screen-capture yalnız akışta → **Yüksek** (akis.tsx doğrulandı).
