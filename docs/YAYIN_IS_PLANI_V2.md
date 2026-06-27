# Yayın İş Planı V2 — Sunucu, Üyelik, Ödeme, Gating

> Karar tarihi: 2026-06-27. Bu plan 6 maddelik yayın hedefini sıralar.
> **Sabit kararlar:** Depolama = **Supabase Storage** · Ödeme = **Doğrudan Google Play Billing** (RevenueCat yok) · İçerik kısıtlama (gating) = **en son**.

## 0. Mevcut durum (keşif bulguları)
- **App içinde 643 MB içerik gömülü** (`assets/kartlar` 391 MB + `assets/sesler` 252 MB). Bu haliyle mağazaya yüklenemez → içeriği sunucuya taşımak yayının ÖN ŞARTI, sadece iyileştirme değil.
- **Gmail giriş iskelesi HAZIR ama uykuda:** `src/lib/supabase.ts`, `src/lib/auth.ts`, `src/lib/auth-context.tsx`, `src/app/giris.tsx` var; `config.ts` → `UYELIK_AKTIF=false`, `SUPABASE_URL/ANON_KEY` boş. Yani sıfırdan değil, **aktivasyon** işi.
- **Ödeme:** sıfırdan (billing lib yok).
- **Gizlilik beyanı şu an "veri toplanmıyor"** (offline). Auth+ödeme açılınca bu beyan + Play Data Safety GÜNCELLENMELİ (çelişki = mağaza reddi).
- İçerik boru hattı hazır: `scripts/icerik-yerlestir.py` (görsel) + `scripts/ses-yerlestir.py` (ses) + `gorsel:uret`/`ses:uret` codegen + migration deseni (vXX: cards/bolumler DELETE+reseed, SRS korunur).

## 1. Bağımlılık haritası
- **Supabase = ortak temel** → Storage (içerik) + Gmail giriş + ödeme-kullanıcı eşleşmesi + gating hepsi buna dayanır.
- **İçerik üretimi** (kalan sesler + 10 görsel) = koddan bağımsız, paralel.
- **Ödeme hesapları** = bürokratik bekleme süresi uzun → erken tetiklenir.
- **Gating** = giriş + ödeme + içerik-sunucuda hazır olmadan yapılamaz → EN SON.

---

## FAZ 0 — Hesap açılışları (hemen tetikle; bekleme süresi uzun, paralel)
- [ ] Supabase projesi aç → `Project URL` + `anon key` → `src/constants/config.ts` (`SUPABASE_URL`, `SUPABASE_ANON_KEY`). (Detay: `docs/UYELIK_KURULUM.md`)
- [ ] Google Cloud OAuth client (Gmail giriş) + Supabase Google provider.
- [ ] Google Play Console: satıcı/ödeme profili + vergi bilgisi (onay günler sürebilir).
- **Bu fazın kodu yok; sadece hesap/anahtar hazırlığı.**

## FAZ 1 — İçerik tamamlama (paralel içerik kolu)
- [ ] Kalan kanunların sesleri üretilince `ses-yerlestir.py` + `ses:uret` ile sisteme akar (16 kanun deseni).
- [ ] Son 10 görsel düzeltilince `icerik-yerlestir.py` + `gorsel:uret` ile yenilenir.
- [ ] Değişiklik sonrası migration vXX (cards/bolum_kartlari/bolumler DELETE+reseed; SRS korunur) + `SCHEMA_VERSION` bump.
- **Kabul:** ses↔görsel birebir (gorselsiz_ses=0, sessiz_gorsel=0), tsc 0.

## FAZ 2 — İçerik → Supabase Storage + bağlantı güvenliği (İLK BÜYÜK TEKNİK ADIM)
**Amaç:** 643 MB blokerini çöz + gating altyapısını kur.
- [ ] Supabase Storage bucket(lar):
  - `public` bucket → ücretsiz/önizleme içerik (CDN URL, imzasız).
  - `premium` bucket (private) → ücretli içerik (yalnız imzalı URL ile).
- [ ] İçerik yükleme scripti: `assets/kartlar` + `assets/sesler` → ilgili bucket'lara (anahtar = mevcut `gorsel_yolu` namespace).
- [ ] App tarafında **uzak kaynak + yerel cache**:
  - Görsel: `expo-image` zaten uzak URL + `cachePolicy="memory-disk"` destekliyor → registry `require()` yerine URL çözücü (`{bucketBase}/{key}.png|webp`).
  - Ses: `expo-audio` uzak URL çalar; ilk dinlemede indir + FileSystem cache.
  - Anahtar→URL eşleyici tek yerde (registry'ler "anahtar listesi" kalır, kaynak uzaklaşır).
- [ ] App bundle'dan büyük asset'leri çıkar → boyut MB'lere iner (birkaç yerel placeholder kalsın).
- [ ] **Güvenlik:** HTTPS (varsayılan) · ücretli içerik için **süreli imzalı URL** (Edge Function) · Supabase RLS · anon key public (RLS gerçek koruma).
- **⚠️ Mimari karar (UX):** App şu an %100 offline. Uzak içerikle ilk görüntüleme internet ister. Strateji: lazy indir + kalıcı cache; opsiyonel "kanunu indir" (offline). Bu kararı netleştir.
- **Kabul:** app boyutu < ~100 MB, içerik uzaktan yüklenip cache'leniyor, ücretli içerik imzasız erişilemiyor, tsc 0.

## FAZ 3 — Gmail giriş/kayıt (iskele hazır → aktivasyon)
- [ ] `UYELIK_AKTIF=true`; Supabase Google provider; `giris.tsx` canlandır; oturum/hesap akışı (`auth-context`).
- [ ] **Zorunlu yan iş (compliance):** `GIZLILIK_POLITIKASI.md` + Play Data Safety güncelle (e-posta toplanıyor) + **hesap silme** ekle + uygulama içi yasal metin güncelle. (`GIZLILIK_URL` doldur.)
- **Kabul:** Gmail ile giriş/çıkış/hesap silme çalışıyor; gizlilik beyanı gerçeğe uygun.

## FAZ 4 — Ödeme entegrasyonu (Doğrudan Play Billing)
- [ ] `react-native-iap` (RN 0.81/SDK 54 uyumlu sürüm pini) — Expo Go DEĞİL, yerel dev/prod build gerekir (mevcut yerel gradle build ile uyumlu).
- [ ] Play Console'da ürünler (abonelik veya tek seferlik — model kararı). 
- [ ] Satın alma akışı + **makbuz doğrulama** (Supabase Edge Function → Google Play Developer API) → kullanıcıya `premium` bayrağı (Supabase tablo + RLS).
- **Kabul:** satın alma → doğrulama → premium bayrağı kalıcı; iade/yenileme durumları işleniyor.

## FAZ 5 — İçerik kısıtla + ödemeye göre aç (EN SON)
- [ ] Ücretsiz örnek/önizleme + kilitli içerik (premium imzalı URL yalnız ödeyene).
- [ ] UI: kilit rozetleri, "yükselt" ekranı, deneme/ilk N kart bedava.
- [ ] Gating mantığı: kullanıcı `premium` + içerik bucket'ı (public/premium) eşleşmesi.
- **Kabul:** ödemeyen örnek/ücretsizi görür, premium kilitli; ödeyen tümüne erişir.

---

## Paralel kollar (önerilen yürütme)
- **Kol A (içerik/hesap):** Faz 0 hesap açılışları + Faz 1 kalan sesler/10 görsel.
- **Kol B (teknik):** Faz 2 (içerik→Storage + güvenli erişim) → Faz 3 (Gmail) → Faz 4 (ödeme) → Faz 5 (gating).

## Açık kararlar (ilerledikçe netleşecek)
- Monetizasyon modeli: abonelik (aylık/yıllık) mı, tek seferlik mi, branş/kanun paketi mi? (Faz 4/5 tasarımını belirler.)
- Offline politikası: tam offline "indir" desteği var mı, yoksa cache-only mu? (Faz 2.)
- Ücretsiz kapsam: hangi kanun/kaç kart bedava? (Faz 5.)

## İlgili mevcut dokümanlar
`docs/UYELIK_KURULUM.md` · `docs/YAYIN_DENETIM_GUVENLIK.md` · `docs/YAYIN_HAZIRLIK.md` · `docs/MAGAZA_LISTELEME.md` · `docs/PLAY_MAGAZA_GIRISI.md` · `docs/IS_PLANI.md` (saha içerik planı, ayrı).
