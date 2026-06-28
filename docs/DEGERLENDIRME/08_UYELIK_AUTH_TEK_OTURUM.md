# 08 — Üyelik / Auth / Tek-Oturum (Değerlendirme + Tasarım)

> Kapsam: kayıt/giriş/çıkış/şifre-sıfırlama yöntemleri, oturum yönetimi, **tek-oturum
> zorlama** (hesap paylaşımı engeli), KVKK, UX (zorunlu mu / misafir mi). Mevcut iskele:
> `src/lib/{supabase,auth,auth-context,cihaz-kimlik}.ts(x)`, `src/app/{giris,onboarding}.tsx`,
> `src/app/ayarlar.tsx`, `src/constants/config.ts`. Üzerine inşa edilen dokümanlar:
> `docs/UYELIK_KURULUM.md`, `docs/YAYIN_IS_PLANI_V2.md` (Faz 3), `docs/IS_PLANI.md` (madde
> 1/2/13), `docs/YAYIN_DENETIM_GUVENLIK.md` (Ü1/Ü2/Ü3, satır 58/65/109-114).

## Özet
- İskele **yalnız Google OAuth + çıkış** kadarını içeriyor; başkanın istediği 4 yöntemden
  (Gmail/Google, e-posta+şifre, telefon/OTP, Apple) **yalnız 1'i** kodlanmış. E-posta+şifre,
  OTP, Apple, **şifre-sıfırlama ve hesap silme YOK** (`src/lib/auth.ts` sadece `gmailIleGiris`
  + `cikisYap` ihraç ediyor — satır 57, 97).
- **Tek-oturum (hesap paylaşımı engeli) sıfır kod.** Ne sunucu tarafı oturum tablosu, ne
  son-giriş invalidasyonu, ne realtime kick var. `cihaz-kimlik.ts` filigran için var ama
  oturuma bağlı değil; `auth-context.tsx` Realtime'a abone değil (yalnız `onAuthStateChange`).
  `grep realtime|channel|postgres_changes src/` → **0 sonuç.**
- Supabase'in kendi mekanizması **tek-oturumu doğrudan vermez**: JWT erişim belirteci süresi
  dolana kadar (~1 saat) geçerli kalır; gerçek "kick" için **özel `aktif_oturum` tablosu +
  RLS + Realtime + Edge Function admin signOut** birleşimi gerekir. Tasarım aşağıda.
- **KVKK/mağaza blokeri hâlâ açık:** `UYELIK_AKTIF=false` (`config.ts:58`) bu yüzden sorun
  uykuda. Açılınca `yasal-metin.ts` "hesap açmıyoruz, e-posta toplamıyoruz, sunucuya veri
  gitmez" beyanı **yalan olur** (Supabase EU = yurt dışı aktarım) → Google "yanıltıcı
  davranış" reddi + hesap silme zorunluluğu (denetim Ü1/Ü2).
- **Apple ZORUNLU değil — şimdilik.** Uygulama Android-öncelikli (`app.json:13` paket var,
  `ios` bloğunda yalnız ikon, **bundleIdentifier yok** → App Store hedefi kurulu değil).
  iOS'a Google/Gmail girişiyle çıkıldığı an Apple App Store Guideline **4.8 "Sign in with
  Apple" ZORUNLU** olur. Android-only kaldıkça gereksiz.
- **Zorunlu vs misafir gerilimi var:** `IS_PLANI.md` madde 1 "Gmail giriş **ZORUNLU**" diyor;
  iskele tam tersine "giriş **opsiyonel**, misafir devam" kurgulu (`giris.tsx:38`,
  "Şimdilik girişsiz devam et" satır 126). Bu çelişki karar bekliyor (öneri: aşağıda).

## Bulgular

### B1 (P0) — Auth yöntem seti eksik; yalnız Google OAuth var
- **Ne:** Başkanın istediği yöntemlerden e-posta+şifre, telefon/OTP, Apple ve ortak
  gereksinimler (şifre-sıfırlama, hesap silme) kodlanmamış.
- **Nerede:** `src/lib/auth.ts:57-100` (yalnız `gmailIleGiris`, `cikisYap`, `girisDonusAdresi`).
  `auth-context.tsx:14-20` arayüzünde de yalnız `girisYap/cikis`.
- **Neden:** İskele "Gmail ile giriş" MVP'si olarak yazılmış (`auth.ts:1-8` başlık yorumu).
- **Etki:** Gmail'i olmayan/istemeyen personel üye olamaz; başkanın "kişi nasıl üye olur"
  sorusu tek kanala sıkışık. Şifre unutan kullanıcı kilitlenir. Hesap silme yokluğu **mağaza
  reddi** (Google Play + App Store, kullanıcı hesabı tutan uygulamada zorunlu).
- **Öneri:** Supabase tek backend ile dört kanalı da destekler:
  - **Google/Gmail:** mevcut (`signInWithOAuth provider:'google'`). Kalsın.
  - **E-posta + şifre:** `supabase.auth.signUp({email,password})` + e-posta doğrulama
    (confirm) + `signInWithPassword`. En düşük sürtünme, OTP/SMS maliyeti yok.
  - **Telefon/OTP:** `signInWithOtp({phone})` → SMS provider (Twilio/MessageBird) **ücretli +
    kurulum** ister; Türk personel için telefon doğal ama maliyet/operasyon yükü → **v2'ye
    ötele** (P2). E-posta OTP (`signInWithOtp({email})`) SMS'siz alternatif, şifresiz akış.
  - **Apple:** yalnız iOS App Store hedeflenince ekle (B6).
  - **Şifre-sıfırlama:** `resetPasswordForEmail(email,{redirectTo:'mevzu://sifre-sifirla'})`
    → derin link ile `updateUser({password})`. E-posta+şifre kanalıyla birlikte ZORUNLU.
  - **Hesap silme:** istemci `auth.admin.deleteUser` çağıramaz (service role gerekir) →
    **Edge Function `hesap-sil`** (kullanıcının JWT'siyle doğrula → `admin.deleteUser` +
    `aktif_oturum`/sync satırlarını sil). Ayarlar'a "Hesabımı sil" (çift onay) düğmesi.

### B2 (P0) — Tek-oturum zorlama tamamen yok (başkanın ana isteği)
- **Ne:** "Aynı hesap aynı anda tek cihaz" için ne tablo, ne invalidasyon, ne kick var.
- **Nerede:** `auth-context.tsx:28-45` yalnız `getSession` + `onAuthStateChange`'e abone;
  Realtime kanalı yok. `cihaz-kimlik.ts` cihaz ID üretir ama hiçbir oturum kaydına yazılmıyor.
- **Neden:** İskele kimlik-only; paylaşım engeli kapsam dışıydı (`UYELIK_KURULUM.md:83`
  "senkron ayrı iş").
- **Etki:** 1 hesap → sınırsız cihaz = ödeme açılınca **doğrudan gelir kaybı** (hesap
  paylaşımı). Denetim dokümanı da bunu "v2, hesap+backend olmadan imkânsız" diye işaretlemiş
  (`YAYIN_DENETIM_GUVENLIK.md:58`).
- **Öneri:** Aşağıdaki "Tek-oturum tasarımı" bölümü. Özet: `aktif_oturum` tablosu (user başına
  tek satır: cihaz_id + oturum_id) → girişte üzerine yaz (eski oturum_id geçersizleşir) →
  Realtime ile eski cihaza anlık kick + Edge Function ile eski refresh token'ı admin signOut.

### B3 (P0) — KVKK/gizlilik metni ve hesap silme beyanı çelişkili
- **Ne:** `UYELIK_AKTIF=true` olunca uygulama veri toplamaya başlar ama yasal metin "toplamıyoruz" diyor.
- **Nerede:** `src/constants/yasal-metin.ts` ("Hesap açmıyoruz; e-posta/şifre … TOPLAMIYORUZ",
  "sunucumuza aktarılmaz", "KVKK m.11: uygulamayı kaldırman yeterli"). `config.ts:44-46`
  Sentry kaldırılmış, "veri toplanmıyor" beyanı korunmuş.
- **Neden:** v1 bilinçli olarak offline+UYELIK_AKTIF=false tutuldu (`config.ts:48-58`,
  denetim Ü1/Ü2/Ü3 kapatma kararı satır 114).
- **Etki:** Aktivasyonla birlikte güncellenmezse **mağaza reddi + KVKK ihlali** (yurt dışına
  aktarım = Supabase EU; açık rıza/aydınlatma şart).
- **Öneri:** Faz 3 aktivasyonunda ZORUNLU yan iş paketi: (a) `yasal-metin.ts` + `docs/
  GIZLILIK_POLITIKASI.md` → "e-posta + (varsa) telefon + cihaz ID Supabase'e (EU) işlenir",
  açık rıza onay satırı (giriş ekranında zaten link var `giris.tsx:96-106` ama metin offline);
  (b) hesap silme hakkı + uygulama içi düğme; (c) Play Data Safety + (iOS'ta) App Privacy
  yeniden beyan; (d) `GIZLILIK_URL`/`SARTLAR_URL` doldur (`config.ts:20-21` boş → şu an gömülü
  metin). Açık rıza KVKK m.9 (yurt dışı aktarım) için **ayrı onay kutusu** önerilir.

### B4 (P1) — Token saklama AsyncStorage'da (SecureStore değil)
- **Ne:** Oturum belirteçleri düz AsyncStorage'da; şifreli depo (Keychain/Keystore) kullanılmıyor.
- **Nerede:** `supabase.ts:27-29` (`storage: AsyncStorage`). `package.json`'da
  `expo-secure-store` **yok** (grep → yok).
- **Neden:** İskele Expo Go uyumu için en yalın depoyu seçmiş.
- **Etki:** Root/jailbreak cihazda refresh token okunabilir → tek-oturum güvenliği zayıflar
  (çalınan token başka cihaza taşınır). Düşük-orta risk.
- **Öneri:** Faz 4 (dev build) ile `expo-secure-store` tabanlı storage adaptörü (büyük token
  için chunk'lama gerekir; SecureStore 2KB sınırı). Expo Go'da AsyncStorage fallback. **P1**,
  tek-oturum tablosu zaten sunucu tarafı asıl korumayı verdiği için bloklayıcı değil.

### B5 (P1) — Çıkış var ama Ayarlar'da değil; "Çıkış yap" yeri
- **Ne:** Başkan "üye olunca Ayarlar'da Çıkış yap" istiyor. Çıkış mevcut ama `/giris`
  ekranının içinde gömülü (`giris.tsx:63-69`); Ayarlar yalnız "Hesap" satırıyla `/giris`'e
  yönlendiriyor (`ayarlar.tsx:54-61`).
- **Nerede:** `ayarlar.tsx:54-61` (Hesap satırı), `giris.tsx:63-69` (çıkış düğmesi).
- **Neden:** Hesap yönetimi tek ekrana toplanmış.
- **Etki:** Çıkış iki dokunuş uzakta; başkanın beklediği doğrudan görünürlük yok. Düşük.
- **Öneri:** Ayarlar'da giriş yapılıyken "Hesap" satırının altına doğrudan **"Çıkış yap"** +
  **"Hesabımı sil"** satırları (kırmızı). Veya `/giris` ekranını "Hesap" ekranı olarak
  zenginleştir (e-posta, çıkış, hesap sil, bağlı cihaz). `ayarlar.tsx:54` `hazir` koşulu
  zaten var → genişlet.

### B6 (P2) — Apple Sign In: iOS'a geçilirse zorunlu, şimdilik değil
- **Ne:** Üçüncü-taraf sosyal giriş (Google) sunan iOS uygulaması App Store Guideline 4.8
  gereği "Sign in with Apple" sunmak ZORUNDA. Şu an kodda yok, dep yok
  (`expo-apple-authentication` yok).
- **Nerede:** `app.json:10-12` iOS bloğunda yalnız ikon, **bundleIdentifier yok** → App Store
  hedefi kurulu değil; Android paketi var (`app.json:14`).
- **Neden:** Proje Android-öncelikli ilerliyor.
- **Etki:** Android-only kaldıkça **gereksiz**. iOS yayını gündeme gelirse (Expo Go testi
  ≠ App Store yayını) Apple + `bundleIdentifier` + `usesAppleSignIn` eklenmeli, yoksa **App
  Store reddi.**
- **Öneri:** Karar: iOS App Store hedefi var mı? **DOĞRULANMADI** (yalnız Android paketi
  kurulu). Varsa B6'yı Faz 4 ile planla (Supabase `provider:'apple'` + Edge tarafı nonce);
  yoksa kapsam dışı bırak, bu kararı dokümante et.

### B7 (P2) — Cihaz kimliği kriptografik değil + reinstall'da değişir
- **Ne:** `cihaz-kimlik.ts` `Math.random` ile ~10 hane hex üretiyor; uninstall'da kayboluyor.
- **Nerede:** `cihaz-kimlik.ts:14-18` ("kriptografik değil; izlenebilirlik amaçlı").
- **Neden:** Filigran/forensic amaçlı tasarlanmış, oturum güvenliği için değil.
- **Etki:** Tek-oturum'da cihaz ayırt edici olarak yeterli (çakışma olasılığı çok düşük) ama
  reinstall'da yeni cihaz gibi görünür → kullanıcı uninstall/reinstall ile "kick" zincirini
  baypaslayamaz (zaten her girişte oturum_id yenilenir, sorun değil). Düşük.
- **Öneri:** Tek-oturum için `cihaz_id`'yi aynen kullan (yeterli). Daha sağlamı istenirse
  `expo-application` `getAndroidId`/`getIosIdForVendorAsync` (kurulum-kalıcı) ile birleştir.
  Bağımsız değişiklik, IS_PLANI madde 13 (filigran user-ID'ye) ile aynı yere dokunur.

---

## Tek-oturum tasarımı (somut)

**Hedef:** Bir hesap aynı anda yalnız bir cihazda açık olsun; yeni giriş eskisini düşürsün.

**Veri modeli (Supabase Postgres):**
```
table public.aktif_oturum (
  user_id   uuid primary key references auth.users(id) on delete cascade,
  cihaz_id  text not null,           -- cihaz-kimlik.ts değeri
  oturum_id uuid not null,           -- her girişte yenilenen jeton
  son_giris timestamptz default now()
)
-- RLS: user yalnız kendi satırını SELECT/INSERT/UPDATE edebilir
--   using (auth.uid() = user_id)
```

**Akış:**
1. **Giriş başarılı** (`auth-context` `onAuthStateChange` SIGNED_IN): istemci yeni bir
   `oturum_id = uuid()` üretir, `aktif_oturum`'a **upsert** (user_id PK çakışır → üzerine
   yazar). Eski cihazın elindeki `oturum_id` artık tabloyla **uyuşmaz**. `oturum_id` lokalde
   (AsyncStorage/SecureStore) saklanır.
2. **Anlık kick (Realtime):** her oturumlu istemci, `supabase.channel('oturum')` ile
   `postgres_changes` (event UPDATE, filter `user_id=eq.<uid>`) abone olur. Bir UPDATE gelince
   `payload.new.oturum_id !== lokalOturumId` ise → **`supabase.auth.signOut()` + "Hesabın başka
   bir cihazda açıldı"** ekranı. Online cihaz için ~saniye altı kick.
3. **Offline/foreground kontrolü:** Realtime kaçabilir (uygulama kapalıyken giriş). App her
   öne gelişte (`AppState 'active'`) `aktif_oturum`'u okur; `oturum_id` uyuşmuyorsa lokal
   signOut. Bu, Realtime'ı kaçıran cihaz için ikinci ağ.
4. **Gerçek sunucu invalidasyonu (refresh revoke):** JWT erişim belirteci süresi dolana kadar
   (~1 sa) sync/premium çağrıları teknik olarak geçer. İki teeth:
   - **Edge Function `oturum-al`:** girişte eski oturumu admin ile düşür
     (`auth.admin.signOut(user_id)` → eski **refresh token** iptal; eski cihaz erişim belirteci
     dolunca yenileyemez → max ~1 sa sonra kesin dışarı). Service role yalnız Edge'de.
   - **Korumalı uçların oturum_id kontrolü:** premium imzalı-URL ve sync yazan Edge
     Function'lar isteğin `oturum_id`'sini `aktif_oturum` ile karşılaştırır; uyuşmazsa 403.
     Böylece kick anından itibaren para/içerik açısından eski cihaz **anında** etkisiz (UX
     kick'i kaçırsa bile).
5. **Çıkış:** `cikisYap` + `aktif_oturum` satırını sil (veya oturum_id sıfırla).

**İskele boşlukları (bu tasarım için eklenecek):**
- `auth.ts`: `oturumKaydet(oturumId)` / `oturumDogrula()` + e-posta/şifre/OTP/sıfırlama/sil
  fonksiyonları. (Şu an yok.)
- `auth-context.tsx`: SIGNED_IN'de oturum upsert + Realtime kanal aboneliği + AppState
  dinleyici + "kick" durumu (`kovuldu: boolean`). (Şu an yalnız basit dinleyici, satır 40-43.)
- `cihaz-kimlik.ts`: kullanılabilir, değişiklik gerekmez (B7).
- Supabase tarafı: `aktif_oturum` tablo + RLS + Realtime publication; Edge Functions
  `oturum-al`, `hesap-sil`, (premium) imzalı-URL'e oturum_id guard. (Hiçbiri yok.)
- `config.ts`: `UYELIK_AKTIF=true` + anahtarlar (`config.ts:41-42,58`).

**Sınırlar (dürüst not):** Supabase tek başına "anında, kesin, tek-oturum" garantilemez;
yukarıdaki Realtime (UX) + admin-signOut (refresh revoke) + Edge guard (yetki) üçlüsü pratikte
yeterli. JWT süresini kısaltmak (örn. 15 dk) artık residual pencereyi küçültür.

---

## Hızlı kazanımlar
- **Ayarlar'a doğrudan "Çıkış yap"** (giriş yapılıyken) + e-posta görünür satır — `ayarlar.tsx`
  `hazir && kullanici` koşuluyla, mevcut `cikis()` (`auth-context.tsx:52`) çağrısı. Tek ekran.
- **Apple kararını dokümante et:** iOS App Store hedefi yoksa (DOĞRULANMADI) B6'yı resmen
  kapsam dışına al; `app.json`'a `ios.bundleIdentifier` eklenince tetiklensin notu.
- **`GIZLILIK_URL`/`SARTLAR_URL` boş** (`config.ts:20-21`): metin yayınlanınca doldur → giriş
  ekranındaki onay linki (`giris.tsx:102`) web'e de açılır.
- **OTP/SMS'i v2'ye ötele** kararını sabitle (SMS maliyeti/operasyon) → ilk sürüm Google +
  e-posta/şifre ile çıksın; sürtünme düşük.

## Riskler
- **R1 (mağaza reddi):** UYELIK_AKTIF açılıp yasal metin/Data Safety/hesap silme güncellenmezse
  Google "yanıltıcı davranış" + KVKK reddi (denetim Ü1/Ü2 yeniden açılır). B3 bloklayıcı.
- **R2 (gelir kaçağı):** Tek-oturum çıkmadan ödeme açılırsa hesap paylaşımı normalleşir; sonradan
  sıkıştırmak kullanıcı tepkisi (churn) doğurur. Ödeme ile tek-oturum **birlikte** çıkmalı.
- **R3 (kick güvenilirliği):** Yalnız Realtime'a güvenmek (AppState + Edge guard olmadan) çevrimdışı
  cihazı kaçırır → paylaşım sızar. Üç katman birlikte şart (tasarım madde 2-4).
- **R4 (Apple sürprizi):** iOS yayını ani gündeme gelirse Apple Sign In eksikliği son anda red →
  build/zaman kaybı. Kararı şimdi netleştir.
- **R5 (token hırsızlığı):** AsyncStorage token + root cihaz → tek-oturum baypası. Edge guard
  (oturum_id) bunu da yakalar; SecureStore (B4) ikincil sigorta.
- **R6 (zorunlu giriş = kurulum churn):** Girişi sert zorunlu yaparsan (IS_PLANI m.1) ilk açılışta
  bırakma artar; misafir akışı (mevcut iskele) bunu azaltır. Karar gerek (aşağıda).

## Somut adımlar (sıralı, tahmini efor)

> Yürütme YAYIN_IS_PLANI_V2 Faz 3 (giriş) ve Faz 4 (ödeme/dev build) ile hizalı. Önce hesap/
> evrak, sonra kod, en sonra tek-oturum sunucu işi.

1. **Karar paketi (kod yok, ~0.5g):** (a) Giriş **zorunlu mu / misafir mi** — öneri: *soft-gate*
   (misafir temel kullanım; bulut sync + premium + kişisel filigran için giriş şart) → IS_PLANI
   m.1 "zorunlu" ile uzlaştır; (b) ilk sürüm yöntemleri = **Google + e-posta/şifre** (OTP v2);
   (c) iOS App Store hedefi var mı (Apple). Kararları PROJE_DURUM'a yaz.
2. **Faz 0 hazırlık (~0.5g):** Supabase projesi + Google OAuth (zaten UYELIK_KURULUM.md'de);
   `aktif_oturum` tablosu + RLS + Realtime publication SQL'i.
3. **Auth fonksiyonları (~1.5g):** `auth.ts`'e e-posta/şifre signUp+signIn, e-posta doğrulama,
   `resetPasswordForEmail`+`updateUser`, hesap silme çağrısı; `auth-context.tsx` arayüzünü
   genişlet (kayit/girisEposta/sifreSifirla/hesapSil). 4-dosya senkronu burada yok (DB değil,
   auth) ama web/native paritesi: native modül kullanma (Expo Go uyumu) → ortak kalır.
4. **Giriş/Ayarlar UI (~1g):** `giris.tsx`'e e-posta/şifre formu + sekme; `ayarlar.tsx`'e
   doğrudan Çıkış + Hesabımı sil. Şifre-sıfırlama derin link ekranı (`mevzu://sifre-sifirla`).
5. **KVKK/compliance (~1g):** `yasal-metin.ts` + `GIZLILIK_POLITIKASI.md` güncelle (e-posta/
   telefon/cihaz aktarımı + yurt dışı açık rıza), hesap silme hakkı, `GIZLILIK_URL/SARTLAR_URL`
   doldur, Play Data Safety taslağı. **B3 — yayından önce ZORUNLU.**
6. **Tek-oturum sunucu (~2g):** Edge Function `oturum-al` (admin signOut eski oturum) +
   `hesap-sil`; `auth-context`'e oturum upsert + Realtime kanal + AppState kontrolü + "kovuldu"
   ekranı; premium/sync Edge uçlarına oturum_id guard.
7. **Sertleştirme (~1g, Faz 4 dev build):** `expo-secure-store` token storage (chunk'lı),
   JWT süresini kısalt, (iOS hedeflenirse) Apple Sign In + `bundleIdentifier`.
8. **Doğrulama:** `npx tsc --noEmit` 0; 2 cihazla manuel kick testi (A giriş → B giriş → A
   saniyeler içinde düşmeli); hesap silme sonrası tekrar giriş engeli; gizlilik metni gerçeğe
   uygunluk teyidi. PROJE_DURUM güncelle.

---
## KARSI-GORUS & DOGRULAMA (kirmizi takim)

> Raporu kodla bagimsizca capraz-kontrol ettim. **Olgusal iddialarin tamami dogrulandi** —
> abartili/yanlis teknik iddia bulamadim. Asagida: (a) her ana iddiaya guven notu, (b) raporun
> ATLADIGI 5 onemli nokta, (c) onceliklendirme elestirisi, (d) tasarima 2 itiraz.

### Dogrulama tablosu (iddia → kanit → guven)
- **B1 (auth yontem seti eksik):** `auth.ts` yalnizca `gmailIleGiris` (s.57) + `cikisYap` (s.97)
  + `girisDonusAdresi` ihrac ediyor; e-posta/sifre/OTP/Apple/sifre-sifirlama/hesap-sil YOK.
  `auth-context.tsx:18-19` arayuzu yalniz `girisYap/cikis`. → **DOGRU. Guven: Yuksek.**
- **B2 (tek-oturum sifir kod):** `auth-context.tsx:28-45` yalniz `getSession`+`onAuthStateChange`;
  Realtime/kanal yok. `grep realtime|channel|postgres_changes src/` → **0 sonuc (teyit ettim).**
  `cihaz-kimlik.ts` oturum kaydina yazilmiyor. → **DOGRU. Guven: Yuksek.**
- **B3 (KVKK metni celiskili):** `yasal-metin.ts:23` "e-posta/sifre... TOPLAMIYORUZ", s.29
  "sunucumuza aktarilmaz", s.35 "KVKK m.11". `config.ts:58 UYELIK_AKTIF=false`,
  `config.ts:44-46` Sentry kaldirildi notu. → **DOGRU ama KOSULLU** (yalniz aktivasyonda).
  Guven: Yuksek.
- **B4 (AsyncStorage, SecureStore degil):** `supabase.ts:29 storage: AsyncStorage`;
  `package.json`'da `expo-secure-store` **yok (teyit).** → **DOGRU. Guven: Yuksek.**
- **B5 (cikis Ayarlar'da degil):** `ayarlar.tsx:54-61` yalniz `/giris`'e yonlendiriyor;
  cikis dugmesi `giris.tsx:63-69` icinde. → **DOGRU. Guven: Yuksek.**
- **B6 (Apple zorunlu olur):** `app.json:10-12` iOS blogunda yalniz `icon`, **bundleIdentifier
  YOK**; android paketi `app.json:14`. → Olgu DOGRU; ama "Apple ZORUNLU" cikarimi **fazla kati**
  (asagida). Guven: Orta.
- **B7 (cihaz-kimlik Math.random):** `cihaz-kimlik.ts:14-18` `Math.random().toString(16)`,
  reinstall'da kaybolur (s.5 yorumu). → **DOGRU. Guven: Yuksek.**
- **IS_PLANI celiskisi:** `IS_PLANI.md` madde 1 "Gmail ile giris ZORUNLU"; iskele
  `giris.tsx:38` "Giris yapmak istege baglidir" + s.126 "Simdilik girissiz devam et". →
  **DOGRU, gercek bir celiski. Guven: Yuksek.**

### Raporun ATLADIGI noktalar (eklenmeli)
1. **(P0 — aktivasyonda) Supabase varsayilan SMTP uretim icin KULLANILAMAZ.** B1 "e-posta
   dogrulama (confirm)" diyor ama Supabase'in dahili e-posta gondericisi saatte ~2-4 mail ile
   sinirli ve "yalniz gelistirme" icin. E-posta+sifre kanaligi acilirsa **ozel SMTP (Resend/
   SendGrid/Postmark) ZORUNLU** — yoksa kayit/dogrulama/sifre-sifirlama maillari teslim
   edilmez. Rapor bunu hic anmamis; e-posta kanaliginin gizli on-kosulu. (DOGRULANMADI: kod
   yok, ama Supabase platform kisiti — Guven: Yuksek.)
2. **(P0 — aktivasyonda) Misafir→hesap SRS goc/birlestirme stratejisi yok.** Soft-gate onerisi
   (adim 1a) dogru ama kritik bosluk: kullanici **girissiz** SRS ilerlemesi biriktirmis olacak
   (CLAUDE.md: "SRS kutsal"). Giris yapinca lokal ilerleme ile (varsa) bulut kaydi nasil
   birlesecek? Cakisma cozumu (lokal mi bulut mu kazanir) tanimsiz. Veri kaybi/cift-sayim
   riski. Rapor "senkron ayri is" deyip geciyor ama soft-gate'i onerirken bu **ayni isin
   parcasi**. Guven: Yuksek.
3. **(P1 — magaza) Play "hesap silme" icin uygulama-DISI web URL'i de gerekir.** B1/Edge
   `hesap-sil` uygulama-ici silmeyi kapsiyor ama Google Play Data deletion politikasi,
   uygulamayi KALDIRMIS kullanicinin da silme talep edebilecegi **web sayfasi/baglanti**
   istiyor (store listeleme alaninda). Sadece uygulama-ici dugme yetmez. Rapor B3/B5'te
   uygulama-ici silmeyi ele aliyor, web-tarafi silme talebini atlamis. Guven: Orta-Yuksek.
4. **(P1) Realtime, v1'in "supabase-js'i baslangicta YUKLEME" tasarimini deler.** `supabase.ts:18-23`
   bilincli olarak agir `@supabase/supabase-js`'i kosullu `require` ile geciktiriyor (release
   cokme yuzeyini kucultmek icin). Tek-oturum tasariminin **kalici Realtime soketi** her oturumlu
   istemcide bu agir modulu surekli acik tutar → pil/veri + baslangic yuzeyi geri gelir. Tasarim
   bu mimari gerilimi anmiyor. Guven: Yuksek.
5. **(P2) Tatbikat/icerik gating ile oturum_id guard ortusmesi.** Rapor "premium imzali-URL +
   sync uclarina oturum_id guard" diyor ama v1 zaten **643MB iceregi sunucuya tasiyacak**
   (memory: YAYIN_IS_PLANI_V2). Asil tek-oturum yaptirimi imzali-URL ucunda olacak; rapor bunu
   bir cumlede geciyor, oysa pratikte **kick'in tek gercek disi** burasi (gerisi UX). Bu uc
   net spec hak ediyor. Guven: Orta.

### Onceliklendirme elestirisi
- **P0 etiketleri "mutlak" degil, "aktivasyon-kosullu" — netlestirilmeli.** v1 `UYELIK_AKTIF=false`
  ile cikiyor; bu durumda B1/B2/B3'un HICBIRI su anki surum icin P0 DEGIL (uygulama %100 offline,
  hicbiri tetiklenmiyor). Rapor B3 icin "uykuda" diyor ama B1/B2'yi de mutlak P0 gibi sunuyor.
  Daha dogru cerceve: **"Uyelik-aktivasyon kilometre tasinin P0'lari"**. Aksi halde okuyan
  "su an acil" sanir. (Bu bir cerceve hatasi, olgu hatasi degil.)
- **Aktivasyon icinde dogru P0 sirasi:** B3 (KVKK/hesap-silme/Data Safety) **tek gercek magaza
  blokeri** → en ust. B2 (tek-oturum) is/gelir blokeri ama **magaza blokeri degil** → odeme ile
  birlikte ama B3'ten sonra. B1 e-posta/sifre "olmazsa olmaz" degil (Google tek basina ilk
  surum icin yeterli) → P1'e cekilebilir. Yani **B1'i P0'dan P1'e indirmeyi oneriyorum.**

### Tasarima 2 itiraz
- **Apple (B6) "zorunlu" cikarimi fazla kati.** App Store Guideline 4.8, uygulama **YALNIZCA**
  ucuncu-taraf/sosyal girise dayaniyorsa esdeger (gizlilik-korumali) bir secenek ister. **B1'deki
  e-posta+sifre KENDI hesap sisteminiz** oldugu icin cogu durumda 4.8'i karsilar ve Apple Sign
  In'i ZORUNLU olmaktan cikarir. Yani iOS'a cikilsa bile **e-posta+sifre eklemek Apple'i opsiyonel
  yapan kacis yolu** olabilir. Rapor Apple'i tek cozum gibi sunuyor; B1 ile B6 arasindaki bu
  ilizki kurulmamis. (Apple politika yorumu — Guven: Orta.)
- **Realtime'i "kick" icin sart gostermek over-engineering.** Tasarim madde 3 (AppState'te
  oturum_id oku) + madde 4 (Edge guard) tek baslarina, bir calisma uygulamasi icin **yeterli**:
  kullanici uygulamayi her one getirdiginde dususu gorur, para/icerik ucu zaten aninda 403.
  Realtime "saniye-alti kick"i sadece **kozmetik** (uygulama acik dururken). Madde 4'teki
  mimari maliyet (yukarida #4) goz onune alininca Realtime'i **opsiyonel/erteleme** olarak
  isaretlemek daha dogru. Rapor R3'te "uc katman birlikte SART" diyor — bunu yumusatiyorum:
  AppState + Edge guard ZORUNLU, Realtime NICE-TO-HAVE.

### Genel hukum
Rapor **olgusal olarak saglam, kanit-bagli ve dogru** (dosya:satir referanslari tutuyor). Ana
eksikler teknik degil **operasyonel/uretim** tarafinda (SMTP, misafir-goc, web silme URL'i) ve
bir **cerceveleme** sorunu (P0'lar aktivasyon-kosullu). B1'i P1'e indirmeyi, Apple'i e-posta+sifre
ile uzlastirmiyi ve Realtime'i opsiyonel saymayi oneriyorum. Guven (genel): **Yuksek.**
