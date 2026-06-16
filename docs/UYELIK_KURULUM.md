# Üyelik (Gmail ile giriş) — Kurulum Rehberi

Bu uygulamada **giriş opsiyoneldir** ve Supabase + Google OAuth ile çalışır.
Anahtarlar girilmeden uygulama %100 offline çalışır (giriş ekranı "yakında" der).
Aşağıdaki adımlar **bir kez** yapılır; sonra `Gmail ile giriş yap` butonu aktifleşir.

> **Önemli:** Bu adım yalnız **giriş/üyelik** içindir. **Satın alma (ödeme)** ayrı bir
> fazdır (RevenueCat + Google Play/App Store Billing) ve gerçek build + developer hesabı
> ister — Expo Go'da test edilemez. Önce giriş, sonra ödeme.

---

## 1) Supabase projesi aç

1. https://supabase.com → giriş yap → **New project**.
2. İsim ver (örn. `mevzu-jsps`), bir DB şifresi belirle, bölge seç (Frankfurt/EU önerilir).
3. Proje açılınca **Settings → API** sayfasından şunları kopyala:
   - **Project URL** (örn. `https://abcdxyz.supabase.co`)
   - **anon public** key (uzun bir JWT — bu PUBLIC anahtardır, istemcide durması normaldir).

## 2) Google Cloud OAuth client oluştur

1. https://console.cloud.google.com → bir proje seç/oluştur.
2. **APIs & Services → OAuth consent screen**:
   - User type: **External** → uygulama adı, destek e-postası, geliştirici e-postası gir.
   - Kapsam (scopes) eklemene gerek yok (varsayılan e-posta/profil yeter).
   - Test aşamasında kendi Gmail'ini **Test users**'a ekle (yayına alınca herkes girer).
3. **APIs & Services → Credentials → Create Credentials → OAuth client ID**:
   - Application type: **Web application**.
   - **Authorized redirect URIs** kısmına Supabase callback adresini ekle:
     `https://<PROJE>.supabase.co/auth/v1/callback`
     (`<PROJE>` = 1. adımdaki Project URL'in alt alan adı)
   - Oluştur → **Client ID** ve **Client secret**'i kopyala.

## 3) Supabase'te Google sağlayıcısını aç

1. Supabase panel → **Authentication → Providers → Google** → **Enable**.
2. 2. adımdaki **Client ID** ve **Client Secret**'i yapıştır → **Save**.
3. **Authentication → URL Configuration → Redirect URLs** kısmına uygulamanın
   deep-link şemasını ekle (giriş sonrası app'e dönüş için):
   - `mevzu://`
   - (Geliştirme/Expo Go için ayrıca Expo'nun ürettiği `exp://` adresini de eklemen
     gerekebilir — giriş denerken konsolda görünen `redirectTo` adresini ekle.)

## 4) Anahtarları uygulamaya gir

İki yol var (biri yeter):

**A. `.env` (önerilen, gizli kalır):** Proje kökünde `.env` dosyası:
```
EXPO_PUBLIC_SUPABASE_URL=https://<PROJE>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon public key>
```
Sonra `npx expo start -c` (cache temiz başlat).

**B. Doğrudan kod:** `src/constants/config.ts` içindeki `SUPABASE_URL` ve
`SUPABASE_ANON_KEY` sabitlerine yapıştır. (Repoya commit'lenir — `.env` daha temiz.)

## 5) Test

- `Sicil → Gmail ile giriş yap` → tarayıcı açılır → Google hesabını seç → uygulamaya döner.
- Giriş sonrası Sicil'de e-postan görünür; `Giriş` ekranında **Çıkış** ile çıkılır.
- Expo Go'da çalışır (native modül yok). Anahtar yoksa "yakında" gösterir, çökmez.

---

## Notlar / sonraki fazlar

- **İlerleme bulut senkronu** (SRS'i hesaba bağlama) henüz YOK — şu an giriş yalnız
  kimlik sağlar. Senkron ayrı iş (Supabase tabloları + RLS tasarımı gerekir).
- **Satın alma / freemium kilidi** ayrı faz: RevenueCat + store billing + gerçek build.
- **Native Google butonu** (yerel hesap seçici) ileride dev build'e geçince eklenebilir;
  şimdiki OAuth-web akışı Expo Go uyumlu olduğu için tercih edildi.
- **Gizlilik/KVKK:** Üyelik canlıya çıkmadan önce `docs/GIZLILIK_POLITIKASI.md` +
  uygulama içi `yasal-metin.ts` hesap/e-posta verisi akışını yansıtacak şekilde
  güncellenmeli (giriş ekranındaki onay satırı oraya bağlı).
