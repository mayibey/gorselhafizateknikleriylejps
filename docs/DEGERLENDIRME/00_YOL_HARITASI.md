# 00 — YOL HARİTASI (Önceliklendirilmiş, Bağımlılıklı)

> 11 rapor + `00_EKSIKLER_VE_CELISKILER.md` sentezinden türetildi. Her madde: **iş · neden · efor ·
> bağımlılık**. Efor = tek geliştirici/kaba tahmin. Salt plan; kod yazılmadı.
>
> **Kademe ayrımı (P0 enflasyonunu kırmak için):**
> - **P0-v1** = bugünkü offline sürümün yayın/dürüstlük blokeri (üyelikten BAĞIMSIZ, ŞİMDİ).
> - **P0-akt** = üyelik/ödeme şalteri açılmadan ÖNCE zorunlu (v2 aktivasyon paketi).
> - P1 / P2 = önemli ama bloklayıcı değil.

---

## P0-v1 — Hemen, gerçek yayın blokerleri (üyelikten bağımsız) · toplam ~3-4 gün

**[V1] SRS'i kullanıcı akışına bağla (ürünün ana vaadi)**
- **İş:** `getDailyQueue`'yu SİLME; due tekrarlar + zayıf havuz birleşimiyle Etüt'e bağla (`[...due,
  ...zayif]`), `gunlukKuyruk`'u `yeniLimit>0` ile çağır; Karargah'a "bugün N tekrar" sayacı; yanıltıcı
  JSDoc'ları (`native.ts:644,662`) düzelt. `gunlukKart` ayarı o zaman canlanır.
- **Neden:** "Aralıklı tekrar/SRS" duyurulurken motor akışı sürmüyor (yanıltıcı özellik + düşük tutma).
  Tek hamle 01 (ölü kod) + 05 (SRS) + 02 (Eğitim-Planı kart-limiti) sorununu birlikte çözer.
- **Efor:** ~0.5-1g. **Bağımlılık:** yok (mantık hazır). *(05 P0-1, 01, 00_EKSIKLER C1/C2.)*

**[V2] Sahte "Bildirim/Eğitim Planı" özelliğini dürüstleştir/gizle**
- **İş:** Başarı mesajını dürüstleştir; çan ikonu (`index.tsx:152,156`) + Ayarlar satırı (`ayarlar.tsx:
  67-69`) + ekranı (`egitim-plani.tsx`) v1'de gizle/pasifleştir. (FCM ile gerçek yapmak = v2 backlog.)
- **Neden:** Tamamen no-op özellik + "kuruldu 🫡" mesajı = Google "deceptive feature" red sınıfı.
- **Efor:** ~0.5g (3 dosya). **Bağımlılık:** yok. *(02 B1/K1/K2; 00_EKSIKLER E3.)*

**[V3] İçerik hataları: m.25 düzelt + `madde:uret` kök-neden**
- **İş:** (a) `Jandarma Teşkilat Yön m.25` doğru metnini `MADDE_METINLERI`'ne **override** ekle (registry
  elle düzenlenmez — regen'de ezilir). (b) `madde:uret` blok-sınırını "başlık satırından bir sonraki
  başlığa kadar, komşu maddeyi DAHİL ETME" diye düzelt + yeniden üret → çok-maddeli birleştirmeyi kök-
  ten kapat. (c) Disiplin m.8 fıkra (1)-(6) bütünlüğünü doğrula. (d) Başlıksız 209 kartı örneklemle tara.
- **Neden:** 1 maddi hata + düzinelerce kart etiketinden fazla madde gösteriyor → "kart=madde" pedagojisi
  bozuk. Nokta-yama değil kök-neden öncelikli (yamalar regen'de ezilir).
- **Efor:** ~1-1.5g. **Bağımlılık:** yok. *(04 B1/B2/B5 + kırmızı-takım.)*

**[V4] İçerik koruması: FLAG_SECURE aç + ekranlara genişlet**
- **İş:** `akis.tsx:59 EKRAN_KORUMA_AKTIF=true` (SS işi bittiyse); korumayı sınav/madde-sheet/sesli-nöbet
  (kart görseli görünen tüm ekranlar) için genişlet.
- **Neden:** Telif'li içerik koruması yazılmış ama yayına kapalı çıkacak; tek bayrak.
- **Efor:** ~0.5g. **Bağımlılık:** yok. *(02 K5; 06 ATLAMA-1; 00_EKSIKLER D5.)*

**[V5] Ceza modelini yeniden çerçevele (ters teşvik)**
- **İş:** "Aylıktan Kesme" ceza merdivenini kaldır/"nazik hatırlatma"ya çevir (`sicil.ts:56-61`); zayıf
  havuzu öz-rapor yerine performans + due'dan besle (doğru quiz cevabını da logla — `sinav.tsx:101`).
  Ödül tarafını (Takdir/Başarı) koru.
- **Neden:** Dürüst "zorlandım" itirafı cezalandırılıyor → tek tekrar kanalı az dolar + kaygı/churn.
- **Efor:** ~0.5g. **Bağımlılık:** [V1] ile birlikte düşün (zayıf havuz/SRS ilişkisi). *(05 P0-2/P1-4.)*

**[V6] "Yarım app" izlenimini kapat: Tatbikat kilidi + Branş gizle**
- **İş:** Tatbikat kilit eşiğini düşür (≥%50-60 kart veya quiz hep açık) (`tatbikat.tsx:70`); Mevzuat +
  Tatbikat "Branş" segmentini v1'de gizle (müşterek-only). Quiz law_id ↔ kart law_id eşleşmesini teyit et.
- **Neden:** Yeni kullanıcı "kilitli satır denizi" + boş "Çok yakında" yarısı görüyor → ilk-izlenim/churn.
- **Efor:** ~1g (+ eşleşme testi). **Bağımlılık:** yok. *(02 B2/B3; 03; 05 P1-6.)*

**[V7] Kontrast + Karargah sadeleştirme (saha okunabilirliği)**
- **İş:** `theme.ts` token koyulaştır (`solukMetin→~#6E6047`, metin-altın ayrı); Karargah "Tahmini süre"
  sahte metriğini kaldır, "Zayıf mevzi" 3 tekrarını 1'e indir; `mevzuat.tsx` Monogram'a
  `numberOfLines/adjustsFontSizeToFit` ekle; fallback kırmızı şeridi lacivert/altına çevir.
- **Neden:** İkincil metin AA altı (yorgun göz/güneş); bilgi fazlalığı premium hissi kırıyor.
- **Efor:** ~0.5g. **Bağımlılık:** yok. *(03 P0/P1 + kırmızı-takım.)*

**[V8] Güvenlik quick-win (kod ~yok)**
- **İş:** v1 release'de `.env` `EXPO_PUBLIC_SUPABASE_*` boşalt; `allowBackup=false` (config plugin);
  `https` intent-filter İLE İLGİLİ ÖNERİYİ UYGULAMA (06 kırmızı-takım: o `<queries>`'te, silmek dış-link
  açmayı kırar).
- **Neden:** "%100 offline" beyanıyla çelişen canlı endpoint sızıntısı + yedek vektörü.
- **Efor:** ~0.5g. **Bağımlılık:** yok. *(06 P1×2; 00_EKSIKLER C10.)*

**[V9] İddia↔Gerçek denetimi + doküman senkronu**
- **İş:** `MAGAZA_LISTELEME.md` × kod: her özellik vaadi kodda çalışıyor mu? Çalışmayanı düzelt/metinden
  çıkar. `YAYIN_DENETIM_GUVENLIK.md §1/§6` + RevenueCat satırlarına "stale" notu; FAZ2 rakamı 643→~1.5 GB.
- **Neden:** En somut mağaza-red riskini (yanıltıcı özellik) toplu kapatır; eski doc'a güvenip yanlış
  varsayımla yayına gidilmesin.
- **Efor:** ~0.5g. **Bağımlılık:** [V1][V2][V6] (düzeltmeler bitince metin hizalanır). *(00_EKSIKLER E3/C10.)*

**[V10] Test tohumu (jest)**
- **İş:** `jest` + `jest-expo`; minimal yüksek-değerli set: web↔native parite smoke + SRS kutu-geçiş +
  `'tekrar'` ölü-kod kararı (3-buton Kolay/Orta/Zor mu, sil mi) + off-by-one aralık düzeltmesi (`srs.ts`).
- **Neden:** Parite/"SRS kutsal" değişmezleri cihaz-içi tespite mahkûm; gelecek fazlar regresyon riski.
- **Efor:** ~1g. **Bağımlılık:** [V1] (SRS bağlandıktan sonra test et). *(01 P1; 05 P1-3; 00_EKSIKLER E5.)*

---

## P1 — Önemli, bloklayıcı değil

- **[P1-a] Kart akışına hafif retrieval (aktif hatırlama).** Kanun bölümü sonu 2-3 mini soru veya "önce
  hatırla" adımı. Neden: testing-effect en güçlü öğrenme kaldıracı; mevcut akış pasif/tanıma temelli.
  Efor ~1g. Bağımlılık: tasarım kararı. *(05 P1-5.)*
- **[P1-b] Sınav→eylem köprüsü.** Final ekrana "yanlış yaptığın N maddeyi çalış" → zayıf akışı CTA +
  kanun bazlı döküm. Efor ~0.5g. *(05 P2-9.)*
- **[P1-c] Onboarding değer-önermesi.** Branş seçiminden önce 1 tanıtım kartı (örnek karikatür + SRS
  rozeti). Neden: ürünün ana farkı ilk ekranda görünmüyor → drop-off. Efor ~0.5g. *(03.)*
- **[P1-d] Bileşen konsolidasyonu.** `Monogram`/`Progress`/`SegmentedTabs`/`DurumKutu→EmptyState` tek
  API. Neden: 3-4 kopya → görünüm sapması (kanıt: Monogram fix tutarsızlığı). Efor ~1-2g. *(03 P1.)*
- **[P1-e] WebP normalizasyonu.** Kalan 371 PNG → WebP (835→~89 MB); **pipeline neden 194'te durdu**
  araştır. Neden: app boyutu + egress; FAZ2 codegen'inden ÖNCE (karışık uzantı manifest'i kırar). Efor
  ~0.5-1g + araştırma. Bağımlılık: FAZ2'den önce. *(11 B9/KT1-3/E7.)*
- **[P1-f] Kod sertleştirme (P2'den yükseltilebilir).** `enableMinifyInReleaseBuilds=true` + build smoke
  (reanimated/svg keep). Efor ~0.5-1g. *(06 P2.)*
- **[P1-g] initDatabase self-heal + seed `!` guard'ları + Karargah dedupe.** `hazir=null` reset; seed
  regex eşleşmezse skip; ham perf+cards tek yükle + `Promise.all`. Neden: boot-crash/kilit + mükerrer
  yükleme. Efor ~0.5g. *(01 P1/P2 + kırmızı-takım.)*

---

## P2 — İyileştirme / temizlik

- **[P2-a] Dipnot/değişiklik artığı temizliği** (`(Değişik:RG-…)`/`…md.`) `madde:uret`'e regex. *(04 B4.)*
- **[P2-b] `sesli-nobet` yetim rotasını sil veya giriş ekle.** *(02 B4.)*
- **[P2-c] Orphan `srs` süpürme** migration adımı (`DELETE FROM srs WHERE card_id NOT IN ...`). *(01 P1/P2.)*
- **[P2-d] Erişilebilirlik ek eksenleri:** dokunma-hedefi ≥44/48dp, dynamic-type, ekran-okuyucu
  (dekoratif ikon `importantForAccessibility="no"`). *(03 kırmızı-takım.)*
- **[P2-e] Haptik + ödül mikro-animasyonu** (öğrendim/doğru). *(03 P2.)*
- **[P2-f] `akis.tsx` (992 satır) hook'lara böl.** Test edilebilirlik. *(01 P2.)*
- **[P2-g] Yürürlük/yürütme maddelerini kart havuzundan çıkarmayı değerlendir.** *(04 B6.)*

---

## AYRI KÜME — "2 gün sonra ödeme" hazırlık sırası (v2 aktivasyon)

> **Gerçeklik:** Ödeme MVP'si tek-seferlik ürünle bile ~5-6.5 gün (07 maliyet); 2 gün yalnız BÜROKRASİ +
> iskele + kararlara yeter, bitiş değil. **HARD-GATE: FAZ2 (içerik→sunucu) bitmeden FAZ4 (ödeme) gerçek
> kilit sağlamaz** — gömülü içerik dururken ödeme kozmetik. *(00_EKSIKLER D1.)*

**Kümeyi başlatırken HEMEN (bekleme uzun, kod beklemez):**
1. **[FAZ0 bürokrasi]** Play Console ödeme/satıcı profili + vergi (onay gün sürer) · GCP service account
   (Play Developer API makbuz + Play Integrity API) · Pub/Sub topic + Monetization setup · Supabase org
   **spend cap + bütçe alarmı** (en ucuz, #1 maliyet-saldırısı siperi). Efor ~0.5g + bekleme. *(07 adım1;
   09 B9.)*
2. **[KARAR paketi, kod yok]** ~0.5g: (a) **iOS App Store hedefi var mı?** → çift-platform entitlement
   (`source=play|appstore`) mı Android-only mu (yoksa CLAUDE.md'ye "iOS yalnız Expo Go test" yaz);
   (b) premium/ücretsiz içerik SINIRI (branş boşken neyi paraya kapatıyorsun? — `is_free` kapsamı);
   (c) offline politikası ("ücretsiz offline, premium ilk-indirme-sonra-offline"); (d) CDN vs imzalı-URL
   (C4); (e) ödeme lib **expo-iap** (varsayılan) vs react-native-iap — POC; (f) ürün modeli (öneri:
   tek-seferlik "Tam Erişim" — en az hata yüzeyi). *(00_EKSIKLER E1/E6/E8/C4/C5; 07 B8; 08.)*

**Sıralı zincir (kilitli):**
3. **[FAZ2 — ÖNCE] İçerik→sunucu (~8-9g).** WebP normalize ([P1-e]) → codegen ayrımı (`KART_ANAHTARLARI`/
   ext-aware manifest, seed gömülü kalır) → R2/Supabase yükleme → kaynak çözümleyici (`gorselKaynak`/
   `sesKaynak`) → indirme yöneticisi (`expo-file-system createDownloadResumable` + sha256, per-dosya
   devam) → binary'yi bundle'dan çıkar. Bağımlılık: KARAR(c)(d). *(11 adımlar; 00_EKSIKLER E7/D1.)*
4. **[FAZ3] Üyelik + KVKK (~3-4g).** Auth yöntemleri (Google + e-posta/şifre; OTP v2) + **özel SMTP**
   (Supabase default üretimde kullanılamaz) + şifre-sıfırlama; KVKK metni + yurt-dışı **açık rıza**;
   **hesap silme (app-içi + web URL)**; Play Data Safety + gizlilik metni; `GIZLILIK/SARTLAR_URL` doldur;
   misafir→hesap **SRS göç/merge** tasarımı (idempotent `max(kutu,tarih)`). Bağımlılık: KARAR(a). *(08
   B1/B3 + kırmızı-takım SMTP/web-URL/göç; 00_EKSIKLER E2.)*
5. **[FAZ4 — FAZ2 SONRASI] Entitlement + ödeme (~6-8g).** `entitlements`/`premium_users` tablo + RLS
   (write=service_role, çift-platform) → ödeme lib (pinli, dev build) + `odeme.ts` (satın al, restore,
   ack) → **kanonik `imzali-url` Edge Function** (D3: JWKS yerel-doğrula + Integrity + oturum_id +
   **ATOMİK** kota + **upstream IP-limit fonksiyondan ÖNCE**) → makbuz doğrulama + RTDN (idempotent,
   imza doğrula) → PENDING durumu + `obfuscatedAccountId=user_id` → spend-cap. Bağımlılık: FAZ2+FAZ3.
   *(07 B3/B5/KG4/KG5; 09 B2/KIRMIZI-3/4/5/6.)*
6. **[FAZ5] Anti-piracy + tek-oturum (~5-6g).** Play Integrity (repackage→hard-fail, zayıf-cihaz→soft;
   oturum/entitlement-tazeleme anında, her asset değil) → tek-oturum (`aktif_oturum` tablo + AppState +
   Edge guard; **Realtime opsiyonel/nice-to-have**) → cihaz limiti (örn. 2 + "30 günde 1 değişim"
   toleransı) → filigran kaynağı → user-id. (At-rest cache şifreleme P0/P1'DE YAPMA — expo-image/audio
   şifreli okuyamaz; v2'de yalnız-ses opsiyonel.) *(08 tek-oturum; 10 P1-1/P1-4; 11 B8 + C3 hükmü.)*
7. **[DOĞRULAMA]** `tsc --noEmit` 0 + 4-dosya senkron + 2-cihaz kick testi + closed-test satın-alma/iade/
   restore/grace + iddia↔gerçek son denetim + KVKK/Data Safety gerçeğe uygunluk.

**Çözülmesi gereken açık kararlar (zincire girmeden):** iOS hedefi (E1/C8) · CDN-cache vs imzalı-URL
(C4) · ödeme lib (C5) · Billing sağlayıcı RevenueCat değil doğrudan-Play (C6, sabitle + stale doc işaretle).
