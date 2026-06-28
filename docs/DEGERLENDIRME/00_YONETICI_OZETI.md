# 00 — YÖNETİCİ ÖZETİ (Baş Sentez)

> 11 derin rapor + karşı-görüşler + eksiklik/çelişki sentezi (`00_EKSIKLER_VE_CELISKILER.md`)
> okunarak hazırlandı. Amaç: başkan 5 dakikada durumu kavrasın. Salt-okuma; uygulama koduna
> dokunulmadı. Kanıt için ilgili rapora atıf verildi. Tarih: 2026-06-29.

## Durum tespiti (1 paragraf)

Uygulamanın **mühendislik temeli sağlam** (TypeScript strict, sıfır `any`, web↔native parite
disiplini, 4-dosya senkron, temiz güvenlik duruşu) ve **müşterek 25 kanunun içeriği gerçek ve
zengin** (565 görsel kart + 566 ses + 522 özgün anlatım scripti + ~580 deneme sorusu — "placeholder"
DEĞİL). Ancak ürün, **iki ayrı katmanda eksik**: (1) **v1 dürüstlük/işlevsellik** tarafında —
reklamı yapılan "aralıklı tekrar (SRS)" motoru kullanıcı akışını **fiilen sürmüyor**, "Eğitim Planı
/ Bildirimler" ekranı **tamamen no-op**, ekran-koruması (FLAG_SECURE) yayına kapalı çıkacak (içerik
DOĞRULUĞU ise 565 kartın derin tam-taramasıyla beklenenden TEMİZ çıktı — eksik metin 0, "birleştirme"
vakaları kasıtlı küme kart; tek dar açık var, bkz #5); (2) **v2 para/üyelik** tarafında —
1.5 GB içeriğin tamamı APK'ya gömülü olduğundan ödeme/anti-piracy bugün **kozmetik**, üyelik/auth/
tek-oturum/KVKK/entitlement sıfırdan kurulacak. Raporların ortak hükmü net: **"2 gün sonra ödeme"
gerçekçi değil** — çünkü ödeme, kendisinden önce gelmesi gereken bir zincire (içeriği sunucuya taşı
→ üyelik+KVKK → entitlement) bağlı; o zincir kurulmadan ödeme açmak korumasız kapıya kilit takmaktır.
Doğru hamle: **önce v1'i dürüstleştirip yayınla** (SRS'i bağla, sahte özellikleri gizle, içerik
hatalarını düzelt — ~3-4 gün), parayı **ayrı ve sıralı bir kilometre taşı** olarak kur.

## En kritik 10 bulgu (etki sırası)

1. **SRS motoru kullanıcı akışını sürmüyor — ürünün ANA vaadi çalışmıyor.** "Öğrendim" denen kart
   2/4/7… gün sonra otomatik geri gelmiyor; due (vakti gelen) tekrar yolu (`getDailyQueue`) hiçbir
   ekrandan erişilemez (ölü kod). Etüt yalnız "zayıf havuz". Mağaza "aralıklı tekrar" diyorsa
   **yanıltıcı özellik**. *(05 P0-1; 01 ölü-zincir; 00_EKSIKLER C1 — "sil" değil "Etüt'e bağla"
   hükmü.) En yüksek değer / en düşük efor: saf `gunlukKuyruk` hazır, tek bağlama işi.*

2. **"Eğitim Planı / Bildirimler" ekranı tamamen no-op ama "kuruldu 🫡" diyor.** `planla()` her zaman
   `'web'` döner, `expo-notifications` paketi build'de bile yok; başarı mesajı "dev build'de çalışır"
   diyerek işlevsellik ima ediyor — yayınlanan APK'da hiç çalışmaz. Google "deceptive/non-functional
   feature" red sınıfı. *(02 B1 + K1/K2; 00_EKSIKLER C2: kart-limiti ekseni de ölü → ekran bütünüyle
   dekoratif.)*

3. **Gerçek koruma için zincir-sırası: içerik APK'da gömülü durdukça ödeme KOZMETİK.** 1.51 GB
   (`kartlar` 883 MB + `sesler` 628 MB) bundle'a `require()` ile gömülü; klon APK bugün %100 çalışır.
   Ödeme/imzalı-URL/Integrity ne yapılırsa yapılsın, içerik cihazdan çıkmadan koruma yok. **Hard-gate:
   FAZ2 (içerik→sunucu) bitmeden ödeme başlamamalı.** *(10 P0-1; 07 KG3; 11; 00_EKSIKLER D1.)*

4. **Üyelik-aktivasyonu atomik bir pakettir; biri eksikse mağaza reddi veya gelir kaçağı.** Ödeme
   açmak otomatik olarak şunları zorunlu kılar: üyelik+auth, KVKK metni + yurt-dışı açık rıza, Play
   Data Safety, **hesap silme (app-içi + web URL)**, tek-oturum, entitlement+RLS (çift-platform),
   özel SMTP, içerik→sunucu, anti-piracy. Hiçbir rapor tüm grafiği tek yerde çizmiyordu. *(00_EKSIKLER
   D2; 07 KG1; 08 B3; 09.)*

5. **İçerik DOĞRULUĞU — derin tam-tarama önceki hükmü DÜZELTTİ: büyük kısmı KASITLI, açık dar.**
   565 kartın TAM taraması (`12_ICERIK_TAM_TARAMA.md`): görseli olup metni eksik kart **0**; "çok-madde
   birleştirme" (39 kart) ve "ilk başlık ≠ kart no" (7) vakalarının HEPSİ içerik fabrikasında bilinçli
   **küme/birleşik kart** — boş patika düğümü veya içerik kaybı **YOK** (12_ B1/B3). GERÇEK açıklar dar:
   (a) `Jandarma Teşkilat Yön m.25` küme-temsilcisinde **m.25'in kendi literal metni yok** (blok m.26'dan
   başlıyor) — sınav m.25'i bağımsız soruyorsa `MADDE_METINLERI` override gerek (severity raporlar arası
   tartışmalı: 12_ **P2** ↔ 13_ **P0**; **karar: önce m.25 standalone sınanıyor mu DOĞRULA, gerekiyorsa
   ~dakikalık override**); (b) **Disiplin m.8** fıkra (1)-(6) eksik (metin (7)'den başlıyor); (c) codegen
   ID'siz kanunda (Jandarma) sessiz çoklu-madde birleşmesi üretebiliyor → `madde:uret`'e **doğrulama-assert**
   eklenmeli (13_ İŞ4). Ayrıca **57 maddede resmî metin HAZIR ama görsel/kart YOK** (içerik hattı görselde
   geride; 12_ B4). *(WF1 sentezindeki "sistemik bozuk pedagoji" ifadesi ABARTILIYDI — çoklu-göz derin
   tarama düzeltti; düzeltme planı `13_UYGULAMA_PLANI_P0.md` İŞ4.)*

6. **Ekran-koruması (FLAG_SECURE) yayına KAPALI çıkacak.** `akis.tsx:59-60 EKRAN_KORUMA_AKTIF=false`
   ("SS almak için kapatıldı") → telif'li kartların ekran görüntüsü/kaydı şu an engellenmiyor. Tek
   bayrak; ayrıca koruma yalnız `/akis`'te (sınav/madde-sheet korumasız). *(02 K5; 06 ATLAMA-1;
   00_EKSIKLER D5.)*

7. **Ceza-temelli gamification dürüst öz-değerlendirmeyi cezalandırıyor (ters teşvik).** Kullanıcı
   "zorlandım" derse zayıf havuz dolar → ceza merdiveni ("Yazılı İkaz→…→Aylıktan Kesme"); hep
   "Öğrendim" diyen hem cezadan hem tek tekrar kanalını beslemekten kaçar. Sınav stresi üstüne kaygı +
   churn. (Tetik sıklığı düşük → şiddet tartışılır.) *(05 P0-2 + kırmızı-takım yumuşatması.)*

8. **Tatbikat fiilen kilitli + iki "Çok yakında" branş yüzeyi → "yarım app" izlenimi.** Deneme sınavı
   ancak o kanunun TÜM kartları öğrenilince açılıyor (Disiplin 126 kart) → yeni kullanıcı "kilitli
   satır denizi" görür. Mevzuat + Tatbikat'taki "Branş" segmenti her zaman boş placeholder. *(02 B2/B3;
   03; 05 P1-6 — branş 41 kanun id 26-66 içeriksiz.)*

9. **Düşük renk-kontrastı (WCAG AA altı), sistemik.** `solukMetin/krem = 3.65:1`, `altinKoyu/krem =
   2.86:1` (AA 4.5:1 ister) — projedeki varsayılan ikincil metin rengi. Saha personeli (yorgun göz,
   güneş) için gerçek okunabilirlik sorunu. Tek dosyada (`theme.ts`) 2-3 token koyulaştırma çözer.
   (Mağaza-red değil, kullanılabilirlik.) *(03 P0/P1 + kırmızı-takım: P1, "saha okunabilirliği"
   gerekçesiyle.)*

10. **Otomatik test SIFIR — parite ve "SRS kutsal" değişmezleri cihaz-içi tespite mahkûm.** Tüm saf
    mantık (srs/queue/performans/sinav) test-edilebilir tasarlanmış ama tek test yok; gelecek 6 fazın
    her biri sessiz regresyon riski taşıyor. *(01 P1; 00_EKSIKLER E5 — minimal yüksek-değerli set:
    web↔native parite + SRS kutu-geçiş smoke.)*

## "Wow" / fırsat (5 madde)

1. **Tek hamleyle üç sorunu çöz (SRS'i Etüt'e bağla).** `getDailyQueue`'yu due+zayıf birleşimiyle
   Etüt'e bağlamak (1) ürünün ana vaadini gerçek yapar, (2) ölü kodu diriltir, (3) "Eğitim Planı"
   kart-limiti eksenini canlandırır. Mantık zaten yazılı; yarım-bir-günlük bağlama işi, ürün hikâyesini
   "diğer SRS app'lerinden farkım: görsel hafıza + gerçek aralıklı tekrar" diye tamamlar.

2. **Görsel-önce tasarım, mağaza dönüşümünü uçurur.** Ürünün asıl farkı 4-panel karikatür kartı.
   Karargah hero'sunu büyük görsel kart yapmak (Yön C) ve onboarding'e tek tanıtım kartı eklemek,
   mağaza ekran-görüntülerini çarpıcılaştırır ve ilk-açılış bırakmasını düşürür. *(03 Yön C + onboarding
   değer-önermesi.)*

3. **İçerik zaten ürünün hazinesi — eksik sanılıyordu.** 522 özgün, sınav-odaklı mnemonik anlatım +
   565 görsel + ~580 soru üretilmiş. "Placeholder" çerçevesi yanlıştı. Müşterek bloğu cilalanıp net
   beyanla yayınlanabilir; branş içeriği v1.x'e fazlandırılır. *(05 kırmızı-takım A/B.)*

4. **WebP ile app ~1.5 GB'dan MB'lere; iş zaten 1/3 yapılmış.** Görsellerin %34'ü zaten WebP; kalan
   371 PNG çevrilince görsel 835→~89 MB. İçerik sunucuya taşınınca app boyutu MB'lere iner, ilk açılış
   hızlanır, egress maliyeti 3-4× düşer. *(11 B9 + KT1/KT2 düzeltmesi.)*

5. **R2 hibriti egress faturasını ~sıfıra indirir (Supabase kararını bozmadan).** DB/Auth/Edge =
   Supabase, ağır binary = Cloudflare R2 (egress ücretsiz). Para modeli açılınca maliyet ölçeklenmesini
   baştan doğru kurar. *(11 B5.)*

## Nasıl daha iyi / daha güvenli (özet)

- **Daha iyi (v1, ~3-4 gün):** SRS'i akışa bağla (#1) · sahte bildirimi gizle/dürüstleştir (#2) ·
  içerik hatalarını MM-override + `madde:uret` kök-neden ile düzelt (#5) · FLAG_SECURE aç + ekranlara
  genişlet (#6) · cezayı "nazik hatırlatma"ya çevir (#7) · Tatbikat kilidini düşür + Branş'ı gizle (#8) ·
  `theme.ts` kontrast token'larını koyulaştır (#9) · jest + parite/SRS smoke testi (#10).
- **Daha güvenli (v1 quick-win, kod ~yok):** `.env` Supabase anahtarlarını release'de boşalt ·
  `allowBackup=false` · mağaza metni × kod "iddia↔gerçek" denetimi (yanıltıcı özellik avı).
- **Para için doğru sıra (HARD-GATE):** içerik→sunucu (FAZ2) → üyelik+KVKK+hesap-silme (FAZ3) →
  entitlement+imzalı-URL Edge Function (FAZ4) → Integrity+tek-oturum (FAZ5). "İmzalı-URL" tek kanonik
  sözleşmede toplanmalı (JWKS yerel-doğrula + Integrity + oturum_id + **atomik** kota + upstream
  IP-limit). iOS hedefi var mı kararı verilip entitlement baştan çift-platform (`source=play|appstore`)
  kurulmalı.

> **Tek cümle:** Temel ve içerik güçlü; v1'i dürüstleştirip (özellikle SRS) hızlı yayınla, parayı ise
> zincir-sırasına uyarak ayrı bir kilometre taşı olarak kur — "2 günde ödeme" değil, "2 günde ödeme
> hazırlığının başlangıcı".

---

## Tüm çıktılar (docs/DEGERLENDIRME/)
- **Bu özet** · `00_YOL_HARITASI.md` (P0/P1/P2 + ödeme hazırlık sırası) · `00_RISK_REGISTER.md` · `00_EKSIKLER_VE_CELISKILER.md`
- 11 derin rapor: `01_KOD_MIMARI` · `02_ISE_YARAMAYAN_BOZUK_OZELLIKLER` · `03_TASARIM_UX` · `04_ICERIK_MADDE_METNI` · `05_MANTIK_KAPSAM_OGRETICILIK` · `06_GUVENLIK` · `07_ODEME_ALTYAPISI` · `08_UYELIK_AUTH_TEK_OTURUM` · `09_BACKEND_SAVUNMA` · `10_ANTI_PIRACY_APK_KLON` · `11_SUNUCU_ASSET_OFFLINE` (her biri **kırmızı-takım karşı-görüşüyle** doğrulandı)
- Derinleştirme: **`12_ICERIK_TAM_TARAMA.md`** (565 kart tam tarama — içeriğin gerçek durumu) · **`13_UYGULAMA_PLANI_P0.md`** (sabah "uygula" diyebileceğin kod-seviyesi P0 planı)
- **Tasarım alternatifleri (tarayıcıda aç):** `tasarim/yon-A-saha-dosyasi.html` (evrim, önerilen) · `tasarim/yon-B-komuta-konsolu.html` (dark-first) · `tasarim/yon-C-gorsel-once.html` (görsel-önce) · `tasarim/00_README.md`

## FAZ 6 — orkestratör mutabakat notu (çoklu-göz değeri)
Gece loop'u 4 fazda (11-boyut değerlendirme → kırmızı-takım karşı-görüş → eksiklik kritiği → sentez) + 2 derinleştirme WF'si + tasarım mockup'larıyla yürüdü; ~31 ajan, uygulamaya **sıfır kod dokunuşu**. Derin doğrulama, ilk sentezin **iki iddiasını düzeltti**: (1) İçerik "sistemik bozuk" DEĞİL — birleştirmeler kasıtlı küme kart, gerçek açık dar (#5). (2) m.25 severity'si raporlar arası tartışmalıydı → "önce doğrula, gerekiyorsa dakikalık override" olarak çözüldü. Geri kalan bulgular (SRS akışa bağlı değil, no-op bildirim, gömülü içerik → ödeme kozmetik, FLAG_SECURE kapalı, ters-teşvik gamification) bağımsızca teyitlidir ve önceliklendirmesi sağlamdır. **Aksiyon önceliği değişmedi: önce v1'i dürüstleştir, sonra zincir-sıralı para.**
