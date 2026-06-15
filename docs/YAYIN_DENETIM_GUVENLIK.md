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

### Hukuki / marka riski (gözden kaçıyor — ciddi)
- **[H6] Resmî amblem/üniforma** — maskot "Jandarma Cüneyt" gerçek jandarma amblemi + askeri rütbe taşıyor. Google impersonation politikası + TR mevzuatı resmî kurum amblemine duyarlı. Çözüm: maskotu stilize/jenerik yap (birebir resmî amblem değil) + **"Jandarma Genel Komutanlığı veya resmî bir kurumla bağlantılı değildir"** ibaresi (mağaza açıklaması + uygulama içi).

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
- [ ] **A4 [H6]** "Resmî kurumla bağlantılı değildir" ibaresi (yasal metin + görünür yer) + maskot uyarısı.
- [ ] **A5 [H2]** `app.json`'a `expo-notifications` plugin ekle (v1'de tutuyorsak) ya da bildirimi v1'de gizle.

### B — Güvenlik (bloklamaz, yayından önce iyi olur)
- [ ] **B1** `expo-screen-capture` ile çalışma/kart ekranlarında ekran görüntüsü engeli.

### C — Temizlik
- [ ] **C1 [T1]** Ölü rota `madde-metni.tsx` sil.

### D — Sende (kod değil)
- [ ] **D1 [H7]** Gizlilik metnini yayınla → URL'leri `config.ts`'e yaz.
- [ ] **D2** `docs/` yasal/mağaza dökümanlarını İçtima'sız güncelle (canonical = `yasal-metin.ts`).
- [ ] **D3** Developer hesabı + EAS production build + 20 test / 14 gün + ekran görüntüleri + feature graphic.

### E — v2 (onaydan sonra, backend gerektirir)
- [ ] Pro üyelik (RevenueCat + Play Billing) · Sunucu-kapılı premium içerik + imzalı URL · Play Integrity · 2 cihaz limiti · Filigranı gerçek user ID'ye bağla.
