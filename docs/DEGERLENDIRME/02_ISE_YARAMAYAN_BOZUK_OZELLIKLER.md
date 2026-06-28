# 02 — İşe Yaramayan / Sahte / Bozuk / Yarım Özellikler

> Kapsam: "var gibi görünüp çalışmayan ya da düzgün çalışmayan" özellikler (başkan özel isteği).
> Taban: `docs/YAYIN_DENETIM_GUVENLIK.md` §1 (S1) GÜNCELLENİP GENİŞLETİLDİ.
> Yöntem: her özellik kodda DOĞRULANDI (dosya:satır). Kart karikatür içeriğine bakılmadı.
> Tarih: 2026-06-29 · tek branch: master.

---

## Özet

- **YAYIN_DENETIM_GUVENLIK §1 ARTIK BÜYÜK ÖLÇÜDE GEÇERSİZ (stale).** O denetim "Tatbikat komple gizlendi (Ü5)", "Mevzuat branş yakında kaldırıldı (Ü6)", "expo-notifications eklendi/tutuldu (A5)" diyordu. Kod bunların ÜÇÜNÜ DE geri almış: Tatbikat sekmesi tekrar aktif (5 sekme), 25 müşterek kanun gerçek quiz + kart/görsel içeriği gelmiş, iki ekranda "Branş → Çok yakında" placeholder'ı geri gelmiş, `expo-notifications` hem `app.json` hem `package.json`'dan ÇIKARILMIŞ. Doc'a güvenip yayına gidilirse yanlış varsayımlarla gidilir.
- **EN KRİTİK SAHTE ÖZELLİK — Bildirimler/Eğitim Planı:** Kullanıcıya öne çıkan bir özellik (Karargah'ta çan ikonu + Ayarlar'da satır + tam ekran). Aç/saat seç/Kaydet → "Eğitim planı kuruldu, içtimalar zamanında düşecek 🫡" benzeri olumlu mesaj. Gerçekte `planla()` HER ZAMAN `'web'` döner ve HİÇBİR bildirim planlanmaz; `expo-notifications` paketi de yok. = reklamı yapılan ama hiçbir şey yapmayan özellik (Google "yanıltıcı/çalışmayan özellik" riski).
- **Tatbikat fiilen kilitli:** Quiz içeriği gerçek (25 kanun, ~580 soru) ama bir kanunun deneme sınavı ancak o kanunun TÜM kartları öğrenilince açılıyor (ör. Disiplin 126 kart). Tipik kullanıcı için Tatbikat sekmesi baştan sona "kilitli satır denizi" gibi görünür → "var ama erişilemeyen" özellik.
- **İki reachable "Çok yakında" yüzeyi** (Mevzuat + Tatbikat'taki "Branş" segmenti) → mağaza "yarım/içeriksiz app" izlenimi.
- Doğru gizlenmiş/uykuda olanlar (sorun değil, bilgi): Giriş/Supabase üyelik (`UYELIK_AKTIF=false` → tam uykuda, /giris erişilemez), Geri bildirim girişi (FORMSPREE boş → gizli). `sesli-nobet` rotası yetim (kayıtlı ama hiçbir yerden açılmıyor).

---

## Bulgular (önem sırası)

### P0 — Sahte/yanıltıcı, yayından önce karar şart

**[B1] Bildirimler ("Eğitim Planı") tamamen no-op ama "çalışıyor" hissi veriyor**
- **Ne:** Açılıp saat ayarlanabilen, kaydedilince olumlu onay veren bir bildirim sistemi var gibi; aslında hiç bildirim planlanmıyor.
- **Nerede:** `src/lib/bildirim.ts:60-63` → `planla()` gövdesi yalnız `return 'web'` (gerçek yorumda: "v1'de DEVRE DIŞI — expo-notifications kaldırıldı"). `src/app/egitim-plani.tsx:29-47` kaydet→`planla`→durum mesajı; `'web'` dalı "Ayar kaydedildi. Bildirimler yalnız telefonda (development build) çalışır." der (cihazda da çalışacağı imasını verir, oysa cihazda da çalışmaz). Giriş noktaları: `src/app/(tabs)/index.tsx:151-157` (Karargah çan ikonu) + `src/app/ayarlar.tsx:66-70` ("Eğitim Planı (Bildirimler)").
- **Doğrulama:** `app.json` plugins'te `expo-notifications` YOK; `package.json`'da da YOK (yalnız expo-screen-capture/expo-speech/expo-audio var). Yani gerçek bir bildirim altyapısı derlemede bile yok.
- **Neden/Etki:** Reklamı yapılan ama hiçbir şey yapmayan özellik + yanıltıcı başarı mesajı. Google Play "deceptive behavior / non-functional feature" red gerekçesi. Kullanıcı güveni zedelenir (SRS uygulamasında bildirim çekirdek beklenti).
- **Öneri:** İki yol — (a) **DÜZELT (hızlı):** mesajı dürüstleştir + ekranı "Yakında" rozetiyle pasifleştir veya çan ikonunu/Ayarlar satırını v1'de gizle (kod duruyor). (b) **TAMAMLA (doğru):** `expo-notifications` + standalone için `google-services.json`/FCM kurup `planla()`'yı gerçek `scheduleNotificationAsync` ile yeniden yaz. Mevcut "yarım" hâli en kötü seçenek (var görünüp çalışmıyor).

### P1 — Var ama pratikte erişilemeyen / yarım izlenim

**[B2] Tatbikat: gerçek quiz içeriği var ama kilit eşiği aşırı yüksek → fiilen erişilemez**
- **Ne:** 25 müşterek kanun için gerçek küratörlü sorular yüklü (`src/assets/kart-sorulari.ts`, ~580 soru), `sinav.tsx` akışı tam çalışıyor. Ama `tatbikat.tsx` her kanunu, o kanunun bölüme bağlı TÜM kartları `kutu>=1` olana kadar KİLİTLİ tutuyor.
- **Nerede:** `src/app/(tabs)/tatbikat.tsx:66-71` (`tamam = top>0 && cal>=top`), `:204-205` (kilitliyse sınav yerine patikaya yollar). Kart sayıları yüksek: Disiplin 126, Kabahatler 62, TCK 54 (görsel registry sayımı). 
- **Neden/Etki:** Yeni kullanıcı Tatbikat'a girince neredeyse her satır kilitli ("Önce tüm kartları çalış 0/126") → "deneme sınavı var ama hiçbirini açamıyorum" = işlevsiz görünen özellik. §1'deki eski "kilitli satır denizi" sorunu (H3) farklı biçimde geri gelmiş.
- **Öneri:** **DÜZELT** — kilit eşiğini düşür (ör. ≥%50–60 kart veya en az N kart) ya da quiz'i her zaman açık tutup skoru ölçüm bırak. Ayrıca quiz law_id'leri ile kart law_id'lerinin TAM hizalı olduğunu teyit et (hizasızsa bir kanun hiç açılmaz — DOĞRULANMADI: 25/25 birebir eşleşme ayrıca kontrol edilmeli).

**[B3] İki reachable "Çok yakında" branş placeholder'ı (minimum-functionality riski)**
- **Ne:** Hem Mevzuat hem Tatbikat ekranında üstte "Müşterek / Branş" segmenti var; "Branş" seçilince tam ekran "Çok yakında — Branşına özel … hazırlanıyor" kutusu.
- **Nerede:** `src/app/(tabs)/mevzuat.tsx:176-204` ve `src/app/(tabs)/tatbikat.tsx:95-122`.
- **Doğrulama:** `YAYIN_DENETIM_GUVENLIK §6 [Ü6]` "Mevzuat branş yakında KALDIRILDI" diyor; kodda GERİ GELMİŞ (doc stale). Branş içeriği yok (`SEED_LAW_BRANCHES` tüm branş kanunlarını yalnız Jandarma'ya bağlıyor — `seed.ts:108-111`), yani branş seçenler için zaten içerik yok.
- **Neden/Etki:** Reviewer iki sekmede de boş "yakında" görür → "yarım app" izlenimi. Onboarding'de branş seçtirilip sonra "branşına özel içerik yakında" demek beklenti-kırıcı.
- **Öneri:** **DÜZELT** — v1'de "Branş" segmentini iki ekrandan da gizle (müşterek-only), branş içeriği gelince geri aç. Onboarding metnini de buna göre yumuşat.

### P2 — Ölü/yetim/latent (mağaza riski düşük ama temizlik/teyit gerek)

**[B4] `sesli-nobet` rotası yetim (kayıtlı ama erişilemez)**
- **Ne/Nerede:** `src/app/sesli-nobet.tsx` tam yazılı ekran + `_layout.tsx:93` Stack kaydı var; ancak hiçbir yerden `push('/sesli-nobet')` YOK (grep: yalnız import + Stack kaydı). Karttaki sesli anlatım zaten `akis.tsx` içindeki audio-bar ile çalışıyor.
- **Etki:** Ölü kod; mağaza riski yok ama bakım yükü + "sesli nöbet diye bir şey vardı" kafa karışıklığı.
- **Öneri:** **KALDIR** (rota+ekran+hook) ya da Mevzuat/patikadan bir giriş ekleyip **TAMAMLA**. §1 [T1] "bilerek bırakıldı" demiş; karar netleşmeli.

**[B5] Giriş/Supabase üyelik iskelesi — doğru biçimde uykuda (bilgi, aksiyon ops.)**
- **Ne/Nerede:** `config.ts:58 UYELIK_AKTIF=false` → `supabase.ts:16 supabaseHazir=false` → `auth-context.tsx:58 hazir=false` → `ayarlar.tsx:54` Hesap satırı gizli → `/giris` UI'dan erişilemez. Erişilse `giris.tsx:43-50` "Üyelik yakında" gösterir.
- **Etki:** Yanıltıcı DEĞİL (gizli + offline iddiasıyla tutarlı). Ama `giris.tsx`/`auth*.ts`/`cihaz-kimlik.ts` ölü kod olarak taşınıyor; bundle'da `auth.ts` deep-link/redirect mantığı duruyor.
- **Öneri:** **TUT** (v2 planı). v1 build'inde gereksiz izin/şema sızdırmadığını teyit et (DOĞRULANMADI: deep-link `scheme:"mevzu"` ile /giris redirect'inin erişilemezliği koddan kesin).

**[B6] Geri bildirim — gizli ama latent sahte-başarı yolu**
- **Ne/Nerede:** Giriş gizli (`akis.tsx:549` `FORMSPREE_ENDPOINT ?` → boşken render yok), doğru. Ama `lib/geri-bildirim.ts:28-32` endpoint boş/yanlışsa 600ms bekleyip sessizce BAŞARI simüle ediyor; `geri-bildirim.tsx` "ulaştı" der.
- **Etki:** v1'de erişilemez (düşük risk). Ancak endpoint ileride YANLIŞ girilirse mail gitmeden "ulaştı" döner (eski H1'in tohumu duruyor).
- **Öneri:** **DÜZELT (küçük):** demo dalını yalnız `__DEV__`'de bırak; production'da boş endpoint → görünür "şu an gönderilemiyor" hatası. Endpoint girilince gerçek POST'u bir kez canlı test et.

**[B7] Rütbe filtresi gerçek ama neredeyse dekoratif**
- **Ne/Nerede:** `rutbe-kapsam.ts:14-25` gerçekten filtreliyor (Mevzuat `:112`, Tatbikat `:81` `rutbeGorur` çağırıyor) — AMA tüm matris yalnız 2 kanunu (law 13, 16) ve yalnız `uzmj/uzmerb` rütbelerinde gizliyor. Diğer tüm rütbe/kanun kombinasyonları aynı.
- **Etki:** Onboarding "Konular rütbene göre filtrelenir" (`onboarding.tsx:33`) iddiası abartılı; subay/astsubay ile uzman arasında 2 kanun farkı dışında HİÇBİR fark yok. Kullanıcı rütbe seçtiğinde anlamlı bir kişiselleştirme görmez → "var gibi ama etkisiz" his.
- **Öneri:** **TAMAMLA (içerik)** veya iddiayı yumuşat: branş/rütbe matrisi gerçekten dolana kadar onboarding metnini "müfredat kapsamı" gibi sade tut; rütbe farkını Evsaf'ta küçük bir not olarak göster.

---

## Hızlı kazanımlar

- `egitim-plani.tsx` durum mesajını dürüstleştir + çan ikonu/Ayarlar satırını v1'de gizle (B1) — tek dosya, mağaza riskini kapatır.
- Mevzuat + Tatbikat "Branş" segmentini v1'de gizle (B3) — iki ekranda 4-5 satır.
- Tatbikat kilit eşiğini düşür/kaldır (B2) — `tatbikat.tsx:70` tek koşul.
- `sesli-nobet` rota+ekran+hook'unu sil (B4) — net ölü kod.
- `YAYIN_DENETIM_GUVENLIK.md §1/§6`'yı "stale" işaretle; bu dosyayı güncel referans yap.

## Riskler

- **Mağaza red:** Bildirim (B1) en somut "non-functional advertised feature" gerekçesi; Branş "yakında" yüzeyleri (B3) "minimum functionality" gerekçesi. İkisi birlikte "yarım app" izlenimini güçlendirir.
- **Doc güveni:** Eski denetim doc'una göre "bunlar zaten gizliydi" sanılırsa B1/B3 gözden kaçar. Kod ≠ doc.
- **Tatbikat (B2):** Eşik düşürülürken Mevzuat ilerleme tanımıyla tutarlılık bozulmamalı (ikisi de `getBolumKartIds` + `kutu>=1` kullanıyor); ayrı eşik ekranlar arası kafa karıştırabilir.
- **DOĞRULANMADI:** (1) 25 quiz law_id'sinin 25 kart law_id'sine birebir eşleştiği; (2) deep-link ile /giris'in production'da gerçekten erişilemez olduğu; (3) "Aklına Çivile" arama kapsamının ses metinlerinde gerçekten dolu döndüğü (kod doğru, veri kontrol edilmedi).

## Somut adımlar (sıralı, tahmini efor)

1. **B1 — Bildirimi dürüstleştir/gizle** (S, ~1 saat): mesaj + giriş noktaları. Karar başkanda: gizle mi, FCM ile tamamla mı.
2. **B3 — Branş segmentini v1'de kapat** (S, ~30 dk): mevzuat+tatbikat.
3. **B2 — Tatbikat kilidini yumuşat** (S-M, ~1 saat + test): eşik kararı + quiz/kart law eşleşme teyidi.
4. **B4 — sesli-nobet temizliği** (S, ~20 dk): sil veya giriş ekle.
5. **B6 — geri bildirim demo dalını __DEV__'e kıs** (S, ~15 dk).
6. **B7 / onboarding iddiası** (S, metin): rütbe filtresi iddiasını gerçek matrise kadar yumuşat.
7. **Doc senkron** (S): `YAYIN_DENETIM_GUVENLIK.md` §1/§6 stale notu + `PROJE_DURUM.md` güncelle.

---
## KARSI-GORUS & DOGRULAMA (kirmizi takim)

> Bağımsız doğrulama: ana iddiaların her biri kodda yeniden okundu (dosya:satır). Aşağıda (1) doğrulanan/düzeltilen iddialar, (2) atlanmış noktalar, (3) önceliklendirme eleştirisi, (4) her ana bulguya güven notu.

### Güven notları (özet tablo)
- **B1 (Bildirim no-op):** çekirdek iddia DOĞRU — **Yüksek**. Ama "tamamen no-op" ABARTILI (aşağıda).
- **B2 (Tatbikat kilidi):** DOĞRU — **Yüksek**. "Fiilen erişilemez" yerine "yüksek sürtünme" demek daha doğru.
- **B3 (Branş "yakında"):** DOĞRU — **Yüksek**. Mağaza-red riski OLARAK çerçevesi ABARTILI — **Orta**.
- **B4 (sesli-nobet yetim):** DOĞRU — **Yüksek**.
- **B5/B6 (auth/geri-bildirim uykuda):** DOĞRU — **Yüksek**.
- **B7 (rütbe filtresi dekoratif):** DOĞRU — **Yüksek** (matris birebir teyit edildi: yalnız law 13 & 16, yalnız uzmj/uzmerb).

### Düzeltilen / nüanslanan iddialar

**[K1] B1 "tamamen no-op" YANLIŞ — Eğitim Planı ekranının 1/4'ü GERÇEKTEN çalışıyor.**
- Özet "EN KRİTİK SAHTE ÖZELLİK … Gerçekte hiçbir şey yapmıyor" ve B1 "tamamen no-op" diyor. Doğrulama: `egitim-plani.tsx` dört kontrol sunar — (a) Bildirim aç/kapa, (b) Sabah/Gece saati, (c) Fırsat Eğitimi, (d) **Oturum başına kart** stepper. (a)-(c) gerçekten no-op (planlama yok). Ama (d) `gunlukKart` AsyncStorage'a yazılıyor ve `akis.tsx:53-57 gunlukSinirli()` günlük kuyruğu `ayar.gunlukKart` ile DİLİMLİYOR → kullanıcı bu ayarı değiştirince çalışılan kart sayısı gerçekten değişir. Yani ekran "reklamı yapılıp hiçbir şey yapmayan" değil; **bildirim KISMI** no-op, kart-limiti KISMI çalışıyor. Bu, "deceptive feature" çerçevesini zayıflatır: özellik tümden sahte değil, yalnız bildirim ekseni ölü. Düzeltme önerisi aynı kalır ama mesaj "ekran çöpe, gizle" değil "bildirim eksenini dürüstleştir, kart-limitini koru" olmalı. Güven: **Yüksek**.

**[K2] B1 güçlendirme — `planla()`'nın 3 dönüş dalı ÖLÜ kod; durum mesajı mantığı yanıltıcı tasarımın kanıtı.**
- `bildirim.ts:60-63 planla()` HER ZAMAN `'web'` döner. Dolayısıyla `egitim-plani.tsx:37-45`'teki `'ok'` ("içtimalar zamanında düşecek 🫡"), `'izin-yok'`, `'hata'` dalları ASLA çalışmaz — ulaşılamaz kod. Kullanıcı her zaman `:44`'teki `'web'` mesajını ("Bildirimler yalnız telefonda (development build) çalışır.") görür. Bu mesaj GERÇEK cihazda (Play Store standalone build, dev build DEĞİL) da yanlış: orada da bildirim YOK. Yani mesaj "dev build'de çalışır" diyerek işlevsellik iması veriyor ama yayınlanan APK dev build olmadığından kullanıcıya HİÇ çalışmaz. Bu, B1'in mağaza-red argümanını GÜÇLENDİRİR (rapor bunu hafife almış). Güven: **Yüksek**.

**[K3] B3 mağaza-red çerçevesi ABARTILI — "minimum functionality" bütün-app testidir.**
- B3 ve Riskler bölümü Branş "yakında" yüzeylerini Google "minimum functionality" red gerekçesi sayıyor. Google'ın bu politikası, **tümüyle işlevsiz / boş app**'leri hedefler; aksi çalışan bir app içinde bir sekme/segmentin "çok yakında" demesi tek başına RED sebebi değildir (yaygın, kabul gören kalıp). Müşterek tarafı tam işlevsel (25 kanun + kart + ses + quiz). Gerçek risk "reviewer'da yarım-app izlenimi" (yumuşak, sübjektif) — somut red değil. Önceliklendirme bu yüzden P1 yerine P2'ye yakın. Yine de gizlemek ucuz ve doğru; öneri geçerli. Güven: **Orta**.

**[K4] B2 "fiilen erişilemez" sözcüğü güçlü — kilit AŞILABİLİR, sorun sürtünme.**
- `tatbikat.tsx:70 tamam = top>0 && cal>=top`, `:205` kilitliyse `/patika`'ya yollar. Doğru. Ama kullanıcı o kanunun tüm kartlarını çalışınca sınav AÇILIYOR — yani "erişilemez" değil "yüksek eşik". 25 quiz law anahtarı (`kart-sorulari.ts`, 25 kayıt) teyit edildi; soru hacmi iddiası (~580) makul. Asıl sessiz tuzak: bir law'ın quiz'i VAR ama o law'ın kartı YOKSA → `durumMap.get(lawId)` undefined → `toplam = law.kartSayisi` (fallback), `tamam=false` → o satır KALICI kilitli kalır (rapor "DOĞRULANMADI" diye işaretlemiş; mekanizma kodda gerçek, riski doğru tespit). Eşik düşürme önerisi yerinde. Güven: **Yüksek**.

### Atlanmış noktalar (rapora EKLE)

**[K5] YENİ — Ekran-koruma (FLAG_SECURE) KAPALI: içerik koruması fiilen devre dışı.**
- `akis.tsx:59-60 EKRAN_KORUMA_AKTIF = false` ("GEÇİCİ: SS almak için kapatıldı, geri açılacak"). `:66-69` bu bayrak false iken `preventScreenCaptureAsync` HİÇ çağrılmaz. Yani kart akışında ekran görüntüsü/kaydı engellenmiyor — "içerik koruması" özelliği yazılmış ama kapatılmış (yarım/devre-dışı özellik, bu raporun kapsamı). Telif'li 643MB içerik için bilinçli kapatılmış bir koruma yayına bu hâliyle çıkarsa istenmeyen. **Öneri:** yayından önce `true` yap (SS alma işi bitti ise) veya bilinçli kararı PROJE_DURUM'a yaz. Öncelik: **P1** (içerik/güvenlik). Güven: **Yüksek**.

**[K6] B1 öncelik sırası içi tutarsızlık — "Somut adımlar" B1'i 1. koyuyor ama "karar başkanda" diyor.**
- Adım 1 (B1) "gizle mi FCM mi — karar başkanda" diyor; bu bir bekleme/karar maddesidir, "ilk yapılacak iş" değil. Gizleme (mesaj + çan ikonu + Ayarlar satırı) FCM kararından BAĞIMSIZ ve 30 dk'lık iş — onu hemen yapıp "tamamlama"yı v2'ye bırakmak net. Adım listesi bu ikisini ayırmalı: (1a) hemen gizle/dürüstleştir [P0, bağımsız], (1b) FCM ile tamamla [v2, karar]. 

**[K7] Doğrulanan ama raporda eksik kalan: çan ikonu + Ayarlar satırı GERÇEK giriş noktaları, gizleme tek-dosya değil iki-dosya.**
- B1 "tek dosya, mağaza riskini kapatır" (Hızlı kazanımlar) diyor ama giriş noktaları İKİ ayrı dosyada: `index.tsx:152,156` (Karargah çan) + `ayarlar.tsx:67-69` (satır) + mesaj `egitim-plani.tsx:39,44`. Yani "tek dosya" yanlış; gizleme 3 dosyaya dokunur. Küçük ama efor tahminini etkiler.

### Önceliklendirme eleştirisi (net)
- **B1:** P0 doğru (yanıltıcı başarı mesajı + reklamı yapılan işlevsiz bildirim). K1/K2 ile çerçeve düzeltilmeli ("kısmi no-op").
- **K5 (FLAG_SECURE kapalı):** raporda YOK; **P1** olmalı — yayına çıkacak en somut "yarım bırakılmış/kapatılmış" güvenlik özelliği.
- **B3:** P1 → **P2'ye indir** (mağaza-red değil, izlenim riski). Düzeltme ucuz olduğu için yine de yapılır.
- **B2:** P1 doğru.
- Genel: rapor sağlam ve kodla tutarlı; tek sistematik eğilim, mağaza-red riskini (B1 mesajı hariç) biraz YÜKSEK tahmin etmesi.
