# Yayın Denetimi, Güvenlik ve İş Sırası

> Bu dosya = uygulamanın yayın-öncesi **denetim sonucu + güvenlik stratejisi + iş sırası**.
> Amaç: her seferinde uygulamayı baştan taramamak. Bir iş bitince ilgili satırı ✅ işaretle
> ve `PROJE_DURUM.md`'ye commit notu düş. Kaynak: 15 Haziran 2026 tam tarama (tsc + web export temiz, 20 rota).

---

## 1. ÇALIŞMAYAN / SAHTE / RİSKLİ ÖZELLİKLER (tarama bulguları)

### Gerçek hatalar (yayından önce DÜZELT)
- **[H1] Geri bildirim sahte "gönderildi"** — `src/constants/config.ts` `FORMSPREE_ENDPOINT=''` boş. Endpoint boşken `lib/geri-bildirim.ts` hata fırlatmadan dönüyor, ekran "Değerlendirmeniz bize ulaştı 🙏" gösteriyor ama **mail GİTMİYOR**. Yanıltıcı UX (Google "deceptive behavior") + sessiz veri kaybı.
- **[H2] Bildirim altyapısı eksik kurulu** — `app.json` plugin listesinde `expo-notifications` YOK. Eğitim Planı'ndan bildirim açılıyor ama production build'de Android ikon/kanal düzgün kurulmayabilir.

### Mağaza izlenimi — "içeriksiz/yarım app" riski (en kritik red sebebi)
- **[H3] Tatbikat "kilitli satır denizi"** — `tatbikat.tsx`: 66 kanunun yalnız 3'ünde (TCK, Kabahatler, 4733) quiz oynanabiliyor; gerisi kilitli "yetersiz". Mevzuat'ı temizledik, Tatbikat'a yapmadık.
- **[H4] Tatbikat branş 15/16 boş** — `seed.ts` `SEED_LAW_BRANCHES` tüm branş kanunlarını yalnız Jandarma'ya bağlıyor; başka branş seçen "Bu bölümde kanun yok" görüyor.
- **[H5] Karargah "Mini Tatbikat: 1" sahte sabit** — `(tabs)/index.tsx` statik `sayi={1}`, hiçbir şeye bağlı değil, tıklanmıyor.

### Hukuki / marka riski
- **[H6] Resmî amblem/logo kullanımı** — NOT (16 Haz 2026): "Jandarma Cüneyt" maskotu **TERK EDİLDİ**, artık öyle bir karakter yok (kullanıcı). Dolayısıyla maskot-stilize işi İPTAL. Kalan tek kontrol: **mevcut kart görsellerinin içinde gerçek jandarma/SG amblemi veya logosu BİREBİR kullanılmamalı** (impersonation riski karakterden değil, resmî logonun aynen kopyalanmasından doğar). Kullanıcı teyit edecek; birebir logo varsa stilize edilmeli. "Bağlantılı değildir" ibaresi (A4) yine de bedava sigorta olarak kalır.

### Mağaza zorunluluğu (sende — içerik/hosting)
- **[H7] Gizlilik politikası URL'i** — Data Safety formu zorunlu istiyor; `config.ts` `GIZLILIK_URL/SARTLAR_URL` boş. `docs/GIZLILIK_POLITIKASI.md`'yi (İçtima'sız güncel haliyle) bir yere yayınla → URL'leri config'e yaz. Uygulama içi `/yasal` metni zaten çalışıyor (canonical = `constants/yasal-metin.ts`).

### Temizlik (zarar yok)
- **[T1] Ölü rota** — `src/app/madde-metni.tsx` artık kullanılmıyor (yerine `MaddeMetniSheet` overlay). Silinebilir. (`sesli-nobet` rotası bilerek bırakıldı — geri eklenecek.)

### İçerik gerçeği (bilinçli — CLAUDE.md "içerik üretme" kuralı)
- Yalnız 3 kanunda kart var; üretilen kartların `anlatim_metni` = placeholder; 4733 görselleri boş (2x2 fallback). Editör düzeltmeleri bitince yeni build (veya ileride OTA).

---

## 2. NEYDEN "GOL YERİZ" (Google red sebepleri özeti)
1. Minimum functionality / "test gibi app" → dolu içeriği öne çıkar, boş yüzeyleri sadeleştir (H3/H4).
2. Yanıltıcı davranış → sahte geri bildirim (H1).
3. Gizlilik URL eksik → Data Safety (H7).
4. Çalışmayan reklamı yapılan özellik → bildirim (H2).
5. Resmî kurum taklidi → amblem/üniforma (H6).

---

## 3. GÜVENLİK STRATEJİSİ (gerçekçi)

**Temel gerçek:** Mobil uygulamada istemciye inen içerik %100 korunamaz — APK'daki görseller çıkarılabilir. Hedef: maliyeti yükseltmek + **değerli içeriği istemciye hiç indirmemek**. Gerçek koruma backend ister.

### v1 (offline, şimdi)
- İçerik APK'da → çıkarılabilir; kabul. Filigran var (sızarsa kaynak belli, caydırıcı/adli).
- **Premium/değerli içeriği ücretsiz APK'ya KOYMA** (en güçlü kaldıraç).

### v2 (Pro + backend — para riski başlayınca)
- **Premium içerik sunucudan**, kullanıcı doğrulamalı, **imzalı kısa-ömürlü URL** ile (hepsini birden indirme yok).
- **Sunucu taraflı entitlement** (RevenueCat) — istemcideki `isPro` kırılsa bile içerik sunucuda kilitli. **Asla istemcide "full unlock" bayrağı tutma.**
- **Google Play Integrity API** — uygulamanın gerçek/değiştirilmemiş olduğunu doğrular; backend içeriğini bununla kapıla. Korsan/repackage'a karşı GERÇEK araç.

### Soru-cevap
- **Ekran görüntüsü engelleme:** `expo-screen-capture` → Android FLAG_SECURE (screenshot + kayıt engeli). Ucuz kazanım, yalnız içerik/kart ekranlarına. Sınır: ikinci telefonla fotoğraf engellenemez; iOS'ta tam engel yok (sadece tespit/bulanıklaştırma). Dev/production build ister.
- **Aynı anda 2 cihaz engelleme:** Hesap + backend olmadan imkânsız. Pro+hesap gelince: kullanıcı başına aktif cihaz kaydı, limit aşılınca en eskiyi düş (RevenueCat entitlement + backend kontrolü). → v2.
- **Korsan APK / hackleme:** Tam engellenemez. Gerçek savunma = (1) premium içeriği APK'ya koyma + (2) sunucu entitlement + (3) Play Integrity. Obfuscation/root-tespiti sadece amatörü yavaşlatır.
- **Üyelik ne zaman aktif:** v1 onaylanıp stabilleşince, ayrı faz. Yayını buna bağlama.

### Diğer güvenlik notları
- `EXPO_PUBLIC_*` bundle'a gömülür → asla gizli key koyma.
- Formspree endpoint gömülü → spam'lenebilir; honeypot/rate-limit düşün.
- Filigran cihaz-ID reinstall'da değişir → Pro/hesap gelince gerçek user ID'ye bağla.
- Deep link `mevzu://` ile hassas aksiyon olmasın. Backend gelince HTTPS + RLS + imzalı URL.

---

## 4. MONETİZASYON
- **Pro üyelik = v2 (onaydan SONRA).** Şimdi kurmak incelemeyi karmaşıklaştırır + yayını geciktirir; sonradan eklemek normal güncelleme.
- ⚠️ Dijital içerik satışında **Google Play Billing ZORUNLU** (harici ödeme = ban). Pratik yol: **RevenueCat** (Play Billing sarmalayıcı, abonelik/entitlement/cihaz bağlama). Development build ister.
- Model önerisi: ücretsiz sınırlı içerik + Pro tüm kanunlar/özellikler.

---

## 5. İŞ SIRASI (öncelikli)

### A — Yayın-engelleyici (kod, önce bunlar)
- [x] **A1 [H1]** ✅ Geri bildirim sahte başarı düzeltildi — `akis.tsx`'te "Hata/öneri bildir" girişi `FORMSPREE_ENDPOINT` boşken gizleniyor. Adres `config.ts`'e yazılınca buton otomatik geri gelir, kod değişmeden gerçek çalışır. (Form ekranı + gönderme mantığı yerinde, park edildi.)
- [x] **A2 [H3+H4]** ✅ Tatbikat KOMPLE gizlendi (kullanıcı kararı: liste değil tek "yakında" ekranı) — `tatbikat.tsx` artık tek EmptyState ("Deneme sınavları ve tatbikat bölümü yakında eklenecek"). Kilitli satır denizi + boş branş sorunu gitti. Quiz altyapısı (`/quiz`, `lib/quiz.ts`) kodda duruyor; içerik gelince liste+başlatıcı git geçmişinden geri gelir.
- [x] **A3 [H5]** ✅ Karargah sahte "Mini Tatbikat: 1" kaldırıldı — `(tabs)/index.tsx` "BUGÜNÜN GÖREVİ" kutusunda artık yalnız gerçek iki sayı (Tekrar + Yeni), `flex:1` ile 50/50 ortalı.
- [x] **A4 [H6]** ✅ "Resmî kurumla bağlantılı değildir" ibaresi eklendi — `constants/yasal-metin.ts > RESMI_BAGLANTI_YOK` ortak sabiti; Kullanım Şartları md.1'e gömüldü + Sicil ekranı altında görünür soluk satır. **Kalan (SENDE, D4):** maskot ambleminin stilize edilmesi (görsel iş) + mağaza açıklamasına aynı ibarenin konması.
- [x] **A5 [H2]** ✅ Bildirim tutuldu — `app.json` plugins'e `expo-notifications` eklendi (JSON doğrulandı). Production/dev build'de Android ikon/kanal düzgün kurulur. (Expo Go'da sınırlı — normal; gerçek build'de çalışır.)

### B — Güvenlik (bloklamaz, yayından önce iyi olur)
- [x] **B1** ✅ `expo-screen-capture ~8.0.9` kuruldu; `akis.tsx`'te `usePreventScreenCapture()` → kart akışı açıkken Android'de ekran görüntüsü/kaydı engellenir (FLAG_SECURE). Yalnız gerçek build'de etkin (web/Expo Go no-op; web export doğrulandı). Sınır: ikinci telefonla fotoğraf engellenemez, iOS'ta tam engel yok — caydırıcı + filigran tamamlayıcısı.

### C — Temizlik
- [x] **C1 [T1]** ✅ Ölü rota `src/app/madde-metni.tsx` silindi + `_layout.tsx` kaydı kaldırıldı. Madde metni özelliği `madde-metni-sheet` (overlay) ile çalışmaya devam ediyor. tsc temiz, başka referans yok.

### D — Sende (kod değil)
- [ ] **D1 [H7]** Gizlilik metnini yayınla → URL'leri `config.ts`'e yaz.
- [x] **D2** ✅ `docs/` yasal/mağaza dökümanları İçtima'sız + Google Play odaklı güncellendi: GIZLILIK_POLITIKASI · KULLANIM_SARTLARI · MAGAZA_LISTELEME · YAYIN_HAZIRLIK. (canonical = `yasal-metin.ts` ile tutarlı; yer tutucular [GELİŞTİRİCİ/İLETİŞİM/TARİH] sende.)
- [~] **D4 [H6]** Maskot İPTAL (Cüneyt terk edildi) → stilize işi YOK. Kalan: (a) mevcut kart görsellerinde birebir resmî jandarma/SG **logosu/amblemi** olmadığını teyit et; (b) mağaza açıklamasına `RESMI_BAGLANTI_YOK` ibaresini koy.
- [ ] **D3** Developer hesabı + EAS production build + 20 test / 14 gün + ekran görüntüleri + feature graphic.

### E — v2 (onaydan sonra, backend gerektirir)
- [ ] Pro üyelik (RevenueCat + Play Billing) · Sunucu-kapılı premium içerik + imzalı URL · Play Integrity · 2 cihaz limiti · Filigranı gerçek user ID'ye bağla.

---

## 6. ÜYELİK SONRASI DENETİM (17 Haziran 2026) — Gmail girişi eklendikten sonra

> Bölüm 1-5 denetimi üyelik EKLENMEDEN önceydi. Sonra Gmail (Google OAuth + Supabase)
> girişi eklendi → yeni denetim (kapsamlı ajan taraması). 3 BLOCKER bulundu, hepsi üyelikten.

### Bulgular (BLOCKER — hepsi Gmail/Supabase'den)
- **[Ü1] Gizlilik politikası ÇELİŞKİSİ** — `yasal-metin.ts` + `docs/GIZLILIK_POLITIKASI.md` "hesap açmıyoruz, e-posta toplamıyoruz, sunucuya veri gitmez" diyor; ama Gmail girişi e-posta+hesabı Supabase'e (yurt dışı) yazıyordu. → Google "yanıltıcı davranış" red + KVKK açığı.
- **[Ü2] Hesap silme YOK** — Gmail girişli uygulamada Google zorunlu; sadece "Çıkış" vardı.
- **[Ü3] Data Safety uyumsuz** — e-posta/sunucu toplama beyan edilmemiş.

### ÇÖZÜM (uygulandı) — v1 için üyelik ana şalterle KAPATILDI
- **`config.ts > UYELIK_AKTIF = false`** (derleme-zamanı). `supabase.ts`: `supabaseHazir = UYELIK_AKTIF && ...` → **client HİÇ oluşmaz, Supabase'e bağlanılmaz, e-posta toplanmaz** → uygulama gerçekten %100 offline → mevcut "hesap yok" gizlilik metni DOĞRU kalır → **Ü1+Ü2+Ü3 blocker'ları YOK oldu.** `sicil.tsx` Hesap kartı `hazir` ile gizlendi; `/giris` rotası ulaşılamaz (kod duruyor). **v2'de** (onaydan sonra, ödeme ile) bayrak TRUE + gizlilik güncelle + hesap silme + Data Safety → **yeni build = yeniden inceleme** (meşru faz; sunucudan gizli açma DEĞİL).
- **[Ü4 orta] `error-boundary.tsx` `console.error`** → `__DEV__` guard'landı (üretimde sessiz).

### Kalan risk (v1, düşük — yönetilebilir)
- **[Ü5] ✅ Tatbikat sekmesi GİZLENDİ** — `(tabs)/_layout.tsx` Tatbikat `href:null` → sekme çubuğundan kalktı (boş "yakında" sekmesi = minimum-functionality riski gitti). Rota+ekran v2 için kodda durur. Artık **3 sekme: Karargah · Mevzuat · Sicil** (hepsi işlevsel/dolu). /tatbikat /quiz'e giden link yok (doğrulandı).
- **[Ü6] ✅ Mevzuat "Branş konuları yakında" kartı KALDIRILDI** — `mevzuat.tsx` artık yalnız 24 dolu müşterek kanunu temiz gösterir (BransYakinda fonksiyonu+stilleri silindi). Reachable "yakında" yüzeyi kalmadı. (akis bağlamsal boş durumları yalnız içeriksiz öğede çıkar — Mevzuat dolu kanun gösterir → reviewer görmez; giriş/sesli-nobet ulaşılamaz.)
- **[D1] ✅ Gizlilik/Şartlar URL'leri CANLI + DOĞRU** — GitHub Pages yayında (HTTP 200): GIZLILIK_URL + SARTLAR_URL açılıyor; gizlilik metni "tamamen çevrimdışı, hesap açmıyoruz, e-posta toplamıyoruz, sunucuya gönderilmez" diyor → **üyelik kapalı v1 ile birebir DOĞRU**. `config.ts` URL'leri bunlara bağlı. Data Safety formu için URL hazır.
- Leftover tarandı: src/'de Cüneyt/maskot/TODO/placeholder YOK (temiz).
- **[D1 hâlâ SENDE]** Gizlilik URL'ini gerçekten yayınla (GitHub Pages) + linkin açıldığını teyit et.
- Doğrulama: tsc 0 hata. Üyelik kapalı → Supabase çağrısı yok (AuthProvider erken döner).
