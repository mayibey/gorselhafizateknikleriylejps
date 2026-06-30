# Serving Güvenliği — İmzalı URL (deploy rehberi) + sonraki: sunucu-filigran

> Amaç: içerik bucket'ını PRIVATE yap → public scraping bitsin; indirme yalnız giriş yapmış
> kullanıcıya verilen kısa-ömürlü (15 dk) imzalı URL'lerle olsun. Kod HAZIR + flag'li (kapalıyken
> mevcut public akış çalışır). Aşağıdaki adımlarla AKTİF edilir.

## PARÇA 1 — İmzalı URL (HAZIR, deploy senin)

### Kod (bende, commit'li)
- `supabase/functions/imzali-url/index.ts` — Edge Function (JWT doğrula → createSignedUrls).
- `src/lib/imzali-url.ts` — istemci (batch, tek çağrı).
- `src/lib/indirme.ts` — IMZALI_URL_AKTIF açıksa indirme imzalı URL'den; değilse public.
- `src/constants/config.ts` — `IMZALI_URL_AKTIF` (EXPO_PUBLIC_IMZALI_URL=1).

### Deploy adımları (sen)
1. **Supabase CLI** (yoksa): `npm i -g supabase` → `supabase login` → `supabase link --project-ref vwmjrvolkbiofpkzzwef`
2. **Fonksiyonu deploy et:**
   ```
   supabase functions deploy imzali-url --project-ref vwmjrvolkbiofpkzzwef
   ```
3. **service_role secret'ı ekle** (Edge'de SUPABASE_URL/ANON otomatik, service key'i sen ver):
   ```
   supabase secrets set SERVICE_ROLE_KEY=eyJ...    (Settings → API → service_role)
   ```
4. **Bucket'ı PRIVATE yap:** Storage → `icerik` → Settings → **Public access KAPAT.**
5. **Flag'i aç:** `.env` → `EXPO_PUBLIC_IMZALI_URL=1` → `npx expo start -c`
6. **Test:** Mevzuat → bir kanun → İndir → inmeli (imzalı URL'lerle). Public URL artık çalışmaz (private).

> ⚠ Bucket PRIVATE olunca: indirilmemiş kartın "stream" yolu (public {uri}) çalışmaz → zaten
> "zorunlu indir-önce-çalış" gate'i var, sorun olmaz (her şey indirilerek çalışılır).

## PARÇA 2 — Sunucu-tarafı PİKSEL FİLİGRAN (sıradaki, asıl koruma)
> Kullanıcının "filigran bypass edilir" endişesini KÖKTEN çözer: filigran client'ta değil,
> görselin PİKSELLERİNE SUNUCUDA basılır → cihaza zaten filigranlı gelir, temiz kopya hiç oluşmaz.

**Mimari kararı (yapılacak):**
- **(a) Cloudflare Worker + R2 binding** — R2 egress ÜCRETSİZ, Worker görseli R2'den çeker + filigran
  (photon WASM) + verir. EN UCUZ. (R2 serving DNS'i çözülünce — custom domain.)
- **(b) Supabase Edge Function + WASM görsel lib** — Supabase'de kalır; egress fonksiyon üstünden.
- Filigran **indirmede bir kez** basılır (görüntülemede değil) → compute bounded, ~$0 (free tier).

**Akış:** indirme isteği → sunucu görseli çeker → kullanıcı e-postasını piksele basar → cihaza
filigranlı gelir → cihaz AES ile şifreler. Client-overlay filigran kaldırılabilir (artık piksel-filigran var).

**Karar:** R2 serving (DNS Cloudflare'e) çözülürse (a) en iyi; yoksa (b) Supabase Edge ile başla.
