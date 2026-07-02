# Yayın Öncesi Tam Denetim — 2 Temmuz 2026

> vCode 12 Play incelemesindeyken yapılan 4 kollu bağımsız denetim (güvenlik + tasarım/UX + mağaza/yasal + kod sağlamlık).
> 29 Haz çok-ajanlı değerlendirmenin ÜSTÜNE, sonradan eklenen ekranlara (auth, paywall, indirme, bildirim, talim, sicil) odaklandı.
> Kod DEĞİŞTİRİLMEDİ — bu bir keşif/rapor. Düzeltme başkan onayıyla ayrı iş.

## GRUP 1 — YAYINI ENGELLEYEBİLİR (Google reddi + KVKK) — EN KRİTİK

Uygulama artık zorunlu hesap açıyor ve ad/soyad/telefon/doğum tarihi/cinsiyet topluyor, buluta yazıyor.
Ama yasal metinler + mağaza beyanı hâlâ eski "çevrimdışı/hesapsız" döneme ait. Bu üçlü tutarsızlık Google'ın en sık red sebebi.

- **[RED] Gizlilik metni topladığı verileri saymıyor** — `yasal-metin.ts §1` + `docs/index.html §1` yalnız "e-posta + hesap kimliği" diyor; ad/soyad/telefon/doğum tarihi/cinsiyet HİÇ geçmiyor. Bu 5 kategori eklenmeli.
- **[RED] "Şifre saklamıyoruz (giriş Google üzerinden)" yanlış** — `yasal-metin.ts:29` + `index.html:63`. E-posta/şifre kaydı var (Supabase şifre hash'i saklar). Düzelt.
- **[RED] "Yalnız Google ile giriş zorunlu" yanlış** — `yasal-metin.ts:20-21` + `index.html` + `sartlar.html §4`. E-posta/şifre tam bir alternatif. "E-posta/şifre veya Google" olmalı.
- **[RED] Mağaza listeleme dosyası "veri toplamıyoruz" diyor** — `docs/MAGAZA_LISTELEME.md:46-60` tümüyle eski dönem ("hesap yok", "yalnız cihazda", "Data Safety: veri toplamıyor"). ARŞİV işaretle; Data Safety'yi aşağıdaki checklist'ten doldur.
- **[YÜKSEK] Google ile girişte KVKK açık rıza kutusu YOK** — `auth-ekrani.tsx:192-210` rıza checkbox'ı yalnız e-posta KAYIT modunda. Google butonu her iki modda görünür ama onay istemiyor → kullanıcı Şartlar/Gizlilik'i onaylamadan hesap açıyor. Rıza gate'i Google'ı da kapsamalı.
- **[YÜKSEK] index.html ↔ hesap-sil.html iç çelişki** — hesap-sil.html silinen veriler arasında ad/soyad/telefon/DT/cinsiyet sayıyor (doğru), ama index.html bunların toplandığını hiç söylemiyor. (Üstteki düzeltmeyle çözülür.)
- **[ORTA] Şartlarda abonelik/ücret maddesi yok** — `sartlar.html §4` "şu an ücretsizdir" diyor ama paywall canlı (yıllık otomatik yenilenen + ömür boyu). Otomatik yenileme, "ödemeler Google Play üzerinden", iade/iptal maddeleri eklenmeli.
- **[ORTA] 18 yaş beyanı zayıf** — kod 18+ dayatıyor ama metinler yalnız muğlak "belirlenen yaş altına yönelik değildir" diyor. Açık "en az 18 yaşında olmalısın" yaz.
- **[DÜŞÜK] Gizlilik/Şartlar URL'i Play Console'da zorunlu** — `config.ts` boş (gömülü metin kullanılıyor). index.html güncellenince URL Play Console'a yazılmalı.

### DATA SAFETY FORMU — koda göre doğru cevaplar
- Veri topluyor mu? → **EVET** (mağaza dosyasındaki "hayır" YANLIŞ)
- Aktarımda şifreli mi? → EVET · Silme talebi? → EVET (uygulama içi 30 gün + iletisim@)
- **Kişisel:** E-posta, Ad, Telefon, Kullanıcı kimliği, Doğum tarihi, Cinsiyet — hepsi Collected + kimliğe bağlı (amaç: hesap yönetimi + uygulama işlevi)
- **Etkinlik:** İlerleme/branş/rütbe/sicil — Collected, linked (uygulama işlevi + kişiselleştirme)
- **Finansal:** Satın alma geçmişi (IAP canlı) — Collected, linked
- **Geri bildirim:** yalnız gönderilirse (Formspree endpoint boşsa şimdilik yazma; dolarsa "Shared")
- **IP/log:** güvenli taraf, işaretle (güvenlik amaçlı)
- **HAYIR:** Konum, kişiler, kamera/mikrofon, reklam kimliği, İzleme (Tracking=NO), sağlık
- Google/Supabase/Cloudflare = işleyen (processor) → "shared" değil, "collected" altında

## GRUP 2 — PARA/KİLİT AÇILINCA KRİTİK (şimdi değil, aktivasyondan önce)

- **[YÜKSEK] Sunucuda premium kontrolü YOK** — `imzali-url` + `gorsel` Edge Function'ları yalnız "oturum var mı" bakıyor, "ödedi mi" bakmıyor (kod içinde geliştirici TODO'su da var). Kilit açıldığı an ücretsiz kayıtlı herkes tüm premium içeriğe ulaşır → ödeme duvarı baypas. `premium_mi` RPC'si zaten var, çağrılmalı.
- **[YÜKSEK] Bir satın alma birçok hesapta kullanılabilir** — `uyelik_haklari.satin_alma_token`'da UNIQUE yok. Bir kişi makbuzunu paylaşır, sınırsız hesap premium olur. Token'a UNIQUE koy.
- **[ORTA] Edge Function'larda rate-limit/kota yok** — döngüyle çağırıp ağır filigran işlemesini tetikleme = maliyet/DoS. Kullanıcı başına dakikalık kota.
- **[DÜŞÜK] E-posta enumerasyonu** — `eposta_kullanimda` RPC anon'a açık (geliştirici kabul etmiş). Rate-limit/captcha ileride.
- **[DÜŞÜK] R8/minify release'te kapalı** — kod karartma yok (Hermes bytecode koruması var, etki sınırlı).

## GRUP 3 — KULLANICI DENEYİMİ (test öncesi düzeltilebilir, ucuz)

- **[ORTA] Bildirim planı ekranında "Kaydet & Planla" butonu KIRMIZI** — `egitim-plani.tsx:328`. Uygulamadaki tüm diğer ana butonlar lacivert; kırmızı tema kuralında yalnız uyarı/silme için. Pozitif eylem tehlike rengiyle → tereddüt. Lacivert yap.
- **[ORTA] Kayıtta ham İngilizce hata sızıyor** — `onboarding.tsx:178,328` catch'inde `__DEV__` guard yok → ağ hatasında "Network request failed" kullanıcıya görünür. Diğer ekranlarda maskelenmiş, burada da uygula.
- **[ORTA] Hesap değişince favori + arama geçmişi sızıyor** — `senkron.ts:49-63` DB ilerlemesini + sınav ilerlemesini siliyor ama `jsps.favori` + `jsps.sonAramalar` kalıyor → aynı cihazda yeni giren öncekinin favorilerini/aramalarını görür. Bu iki anahtarı da temizle.
- **[ORTA] Bildirim planı stepper (+/-) butonları 34px, hitSlop yok** — parmakla ıskalama; ayrıca ekran okuyucu etiketi yok. hitSlop + accessibilityLabel ekle.
- **[ORTA] Küçük ekranda (320dp) bildirim saat stepper'ları taşabilir** — flexWrap düşün.
- **[DÜŞÜK] Bildirim izni reddinde "Ayarları Aç" butonu yok** — kullanıcı ayarı elle arar. `Linking.openSettings()` butonu ekle.
- **[DÜŞÜK] Talim yüklenirken spinner yok** — statik ikon "donmuş" gibi görünür. Ortak Loading kullan.
- **[DÜŞÜK] Çeşitli metin-butonlar 44px altı** — indir satırı, geri-bildirim çipleri, "geri yükle", "şifremi unuttum". hitSlop artır.
- **[DÜŞÜK] Dekoratif görseller ekran okuyucudan gizlenmemiş** — arma/karakter/arkaplan. `importantForAccessibility` ekle.
- **[DÜŞÜK] "İndirildi" butonu basınca siliyor ama okuyucu "Sil" demiyor** — a11y etiketi "İndirileni sil" yap.

## GRUP 4 — YAYIN ANAHTARLARI (promote etmeden kontrol et)

- **[YÜKSEK] KILIT_AKTIF = false** — kasıtlı (kapalı test tüm içeriğe ersin). Gerçek yayına çıkmadan `true` yapılmalı + Grup 2 sunucu kontrolleri tamam olmalı, yoksa herkes bedava.
- **UYELIK_AKTIF = true** — giriş zorunlu; Grup 1 yasal metinler bununla tamamlanmalı.
- **TEST_MODU set değil** → ekran koruması (FLAG_SECURE) üretimde aktif ✅
- **Küçük tutarsızlıklar:** `package.json` version 1.0.0 ≠ app.json 1.0.2 (kozmetik); `expo` caret `^54` (pin `~54.0.35` olmalı); `giris-formu.tsx` ölü dosya; `CLAUDE.md` tema paleti bayat (soluk/amber eski değer yazıyor).

## TEMİZ ÇIKANLAR (bulgu yok — güvence)

- Sırlar git'te değil; service_role/R2/management token yalnız .env (ignore'lu), istemci paketine girmiyor
- Şifreleme sağlam (AES-256, anahtar donanım keystore'da, sunucuya gitmiyor)
- Hesap değişiminde İLERLEME bulaşması çözülü (sahiplik modeli + RLS) — yalnız favori/arama kaldı (Grup 3)
- RLS politikaları temiz (own-rows, soft-delete başkasının hesabını diriltemez)
- 4-dosya veri paritesi TAM (28 fonksiyon, web↔native aynı); fresh-install kritik yolu güvenli
- Bellek: interval/listener temizlikleri tam, kaçak yok
- Eski geçersiz renkler kodda YOK; solukMetin kontrastı düzeltilmiş (≈5.5:1, AA geçer)
- console.* ve DEV/test panelleri üretimde kapalı (__DEV__ guard'lı)
- Sınav geri sayım tarihi (2 Eylül 2026) gelecekte, bug yok
