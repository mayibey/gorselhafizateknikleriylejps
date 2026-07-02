# YAYIN ÖNCESİ TAM TEST RAPORU — 2 Temmuz 2026

> Emülatörde (Pixel 7 / Android 14) test-modu build (vCode 11 tabanı + gecenin tüm fixleri, EXPO_PUBLIC_TEST_MODU=1) uçtan uca gezildi. Google Play imzalı APK. Ayrıca web (localhost) + Supabase paneli + kod incelemesi. Build ALINMADI; kod düzeltmeleri commit'li + push'lu.

## ÖZET
Uygulama yayına HAZIR görünüyor. Çekirdek akışların hepsi Android'de sağlam çalışıyor. Test sırasında **2 gerçek hata düzeltildi** (Google giriş yarışı + aksan-duyarlı arama), **2 küçük gözlem** not edildi, ve başkana **geliştirme önerileri** çıkarıldı. Kritik/engelleyici hata YOK.

---

## ✅ ANDROID'DE TEST EDİLİP SAĞLAM ÇIKANLAR
- **Kurulum & açılış:** APK kuruldu, ilk açılış + bildirim izni akışı, tanıtım ekranı.
- **Giriş:** e-posta/şifre girişi; yanlış şifre → "E-posta veya şifre hatalı." doğru mesaj.
- **Kayıt:** kayıt ekranı (3 adımlı stepper), şartlar onay kutusu → "Devam et" aktifleşmesi, şifre-tekrar alanı.
- **Onboarding:** profil (ad/soyad/telefon/doğum-3sütun-TR/cinsiyet) + rütbe + branş seçimi, "Branşını seç" doğrulaması.
- **Hesap yaşam döngüsü:** çıkış → hesap silme (30 gün uyarı diyaloğu, sunucuda `silme_talep_tarihi` işaretlendi) → tekrar girişte **reaktivasyon** ("Hoş geldin! Hesabın silinmek üzereydi…" bildirimi) + bulut senkron geri-yükleme (17 kartlık ilerleme geri geldi). Sunucudan doğrulandı.
- **Karargah:** sınav geri sayımı, günün maddesi, geri-besleme "Zayıf Mevziler" kartı, sayaçlar (nöbet serisi/genel ilerleme/zayıf mevzi).
- **Mevzuat:** 25 kanun listesi, Müşterek/Branş sekmesi, filtre çipleri, indirme (%'li), "İndirildi/Sil", "Devam et".
- **Branş sekmesi:** temiz "YAKINDA — Branş eğitimi yolda" durumu.
- **Patika:** harita, madde düğümleri, "şu anki konum", tamamlanan düğüm ✓.
- **Kart akışı:** şifreli görsel yerelde çözülüp render (filigranlı), zoom, "Sesli Anlatım" (gerçek mp3, ilerleme çubuğu), "Madde Metni", "Anlatım bitti" penceresi, Öğrendim/Tekrar Hatırlat ilerletme.
- **Talim:** kanunlar 20'şer testlere bölünmüş (TCK Test 1/2/3), sınav çözme, doğru/yanlış + açıklama, **tam sınav → skor ekranı** ("Skorun: 5/20 · %25 · Yanlış maddeleri çalış/Tekrar çöz/Bitir").
- **Öğrenme döngüsü:** sınavda yapılan yanlışlar → **zayıf havuz** doldu (18 mevzi) → Karargah "Geri Besleme" güncellendi → **Etüt akışı** o kartları getirdi. Uçtan uca çalışıyor.
- **Evsaf:** kişisel bilgiler, ilerleme sayaçları, ayarlar (branş/rütbe/hesap), Premium ekranı, Gizlilik & Şartlar.
- **Bildirimler:** izin verildi, **test bildirimi düştü** ("Test bildirimi 🎖️ — Bildirimler çalışıyor…"), Eğitim Planı ekranı (sabah/gece/fırsat saatleri, oturum-başı-kart).
- **ÇEVRİMDIŞI (uçak modu):** ağ kapalıyken uygulama açıldı, Mevzuat listelendi, **indirilmiş kanunun kartları çözülüp render oldu (filigranlı)**, **ses yerel mp3'ten çaldı**, ilerleme kaydedildi. Offline değer önerisi tam çalışıyor.
- **Ekran koruması (FLAG_SECURE):** üretimde AKTİF olduğu DOĞRULANDI (test build'i olmadan ekran görüntüsü 0 bayt = koruma çalışıyor). Testler için ayrı test-modu build'i derlendi.

---

## 🔧 TEST SIRASINDA BULUNAN VE DÜZELTİLEN HATALAR

### 1. 🔴 Google giriş "ilk denemede olmuyor" (arkadaşının bildirdiği) — DÜZELTİLDİ
- **Kök neden:** Android'de `mevzu://` deep-link dönüşü `openAuthSession`'ı 'dismiss' yapıyor; oturum deep-link'ten kuruluyor. İlk denemede `exchangeCodeForSession`, `signInWithOAuth`'un AsyncStorage'a yeni yazdığı PKCE `code_verifier`'ını okuyamadan çalışıp **sessizce** düşüyordu — kullanıcı hiçbir şey görmüyor, tekrar basıyor, depo "ısınınca" 2-3.de giriyordu.
- **Düzeltme:** `oturumKoduIsle` artık **tek basışta içeride 3 kez (500ms arayla)** deniyor; kod yalnız gerçek başarıda dedup'a giriyor, başarısızlıkta serbest kalıyor. Geçici (verifier/challenge/state/expired) hatalarda tekrar, kalıcılarda çıkar. (commit `0aaca1a`)
- **Not:** Emülatörde Google e2e doğrulanamadı (custom-tab + emülatör Play hesabı); düzeltme kod-yolu + web turu bazlı. Gerçek cihazda arkadaşınla teyit iyi olur.

### 2. 🟡 Aksan-duyarlı arama ("kisisel" → Sonuç yok) — DÜZELTİLDİ
- **Kök neden:** Türk kullanıcılar sık sık Türkçe karakter kullanmadan yazar ("kisisel", "gorev", "mesru"). Arama aksan-duyarlıydı → sonuç bulunamıyordu.
- **Düzeltme:** Arama artık **aksan-duyarsız** (ş→s, ı→i, ğ→g, ç→c, ö→o, ü→u); hem sorguya hem içeriğe uygulanıyor, metin gösterimi ham kalıyor, snippet vurgusu bozulmuyor. Node birim testiyle doğrulandı. (commit `c654f65`)

### (Gece turundan, bu build'de zaten var)
- Web Google giriş donması, private-bucket web içerik, hesap-değişimi ilerleme bulaşması, "m.4 — Madde 4" başlık tekrarı, branş/rütbe sunucuya taşıma → hepsi çözülü ve bu test build'inde mevcut.

---

## 🟡 KÜÇÜK GÖZLEMLER (yayını engellemez, değerlendir)
1. **Bildirim kanalı genel:** Bildirimler `expo_notifications_fallback_notification_channel` (genel) kanalında düşüyor; "Sabah İçtiması / Gece Eğitimi / Fırsat" gibi isimli kanallar yok. Kullanıcı Android sistem ayarlarında tek genel kanal görür. İyileştirme: her içtima tipine isimli kanal (kullanıcı tek tek susturabilir/özelleştirebilir).
2. **Test bildirimi sessiz:** Test bildirimi ses/titreşimsiz (silent) geldi. Planlı hatırlatmaların da sessiz olup olmadığını cihazda teyit etmek iyi olur — çalışma hatırlatması için sesli/heads-up daha etkili.
3. **Bildirimler ana anahtarı kapalıyken** alt saat ayarları hâlâ görünür/aktif — küçük tutarlılık; kapalıyken soluklaştırılabilir.

---

## 💡 GELİŞTİRME ÖNERİLERİ (başkanın isteği — "aklına gelebilecek her şey")

### Yüksek etki, düşük efor
- **Aksan-duyarsız arama** — ✅ zaten yaptım (yukarıda). Yayına girsin.
- **Arama "sonuç yok" ekranına öneri:** boş sonuçta "Şunu mu demek istedin?" veya popüler aramalar/ilgili kanun kısayolu göster. Şu an düz "Sonuç yok".
- **Bildirim kanallarını isimlendir** (yukarıdaki gözlem #1) — Play'de bildirim kalitesi + kullanıcı kontrolü artar.
- **Streak (nöbet serisi) koruması/motivasyonu:** "1 günlük serin var, bugün de çalış bozulmasın" gibi akşam bildirimi; seri kırılınca nazik geri-kazanma.

### Orta efor, yüksek değer
- **İlk açılış interaktif tanıtım (coach-mark turu):** Backlog'da var. Yeni kullanıcı Karargah/Mevzuat/Patika/Talim'i tanımadan bırakabilir. 4-5 adımlık kısa tur onboarding tamamlanınca drop-off'u azaltır.
- **Widget / kilit ekranı "günün maddesi":** Android ana ekran widget'ı = günlük dokunuşu artırır, uygulama açmadan mikro-öğrenme.
- **Sınav sonrası "yanlışları kartla çalış" köprüsü zaten var** — bunu güçlendir: skor ekranında yanlış maddelerin mini listesini göster (hangi konularda zayıfım).
- **İlerleme paylaşımı:** Takdir Belgesi / seri / %ilerleme'yi görsel kart olarak paylaş (WhatsApp/Instagram) → organik büyüme (JSPS'ye çalışanlar birbirine tavsiye eder).

### Büyük fikir (yayın sonrası)
- **Yapay zeka soru üretimi / açıklama:** kullanıcının zayıf olduğu maddeden dinamik soru veya "neden yanlış?" açıklaması.
- **Sıralama/lig (leaderboard):** haftalık en çok çalışan / en yüksek deneme skoru — rekabet motivasyonu (JSPS adayları rekabetçi kitle).
- **Çalışma istatistikleri paneli:** haftalık grafik, en zayıf 5 kanun, tahmini sınav hazırlık %.

---

## ❓ BAŞKANA SORULAR / KARAR BEKLEYENLER
1. **Google giriş fix'i** kod-yolu bazlı doğrulandı; gerçek cihazda arkadaşınla son bir teyit ister misin? (Yeni build gerekir.)
2. **TCK m.25 (meşru savunma) içerikte yok** (gece raporundan) — set 1-5, 20-23, 35-45, 247-266, 317-325 kapsıyor. Müfredat bilinçli mi? Eklenecek mi?
3. **Bildirim kanalı isimlendirme** (gözlem #1) yayına yetişsin mi, yoksa v2'ye mi?
4. **Bu düzeltmeler telefonda görünsün diye YENİ BUILD (vCode 12) derleyip Play'e mi yükleyeceğiz?** (Gecenin + bugünün tüm fixleri bu build'de olur.) Emrini bekliyorum — "derle+yükle" dersen hazırlarım (yayınlama kararı sende).

---

## TEST ORTAMI NOTLARI
- Emülatör: `mevzu_test` (Pixel 7, Android 14, D:\android-avd), AEHD hızlandırıcı kurulu.
- Test kullanıcısı: android.test@mevzujsps.com (Supabase onaylı) · profil: Android Testcisi, Astsubay/Jandarma → sonra Personel.
- APK: eldeki vCode 11 AAB + gecenin/bugünün fixleri, `EXPO_PUBLIC_TEST_MODU=1` (yalnız test için ekran görüntüsü açık; **üretimde bu env YOK → FLAG_SECURE tam aktif**).
- Commit'ler: `0aaca1a` (Google retry), `c654f65` (aksan-duyarsız arama), `1e47557` (test şalteri) + gece commit'leri.
