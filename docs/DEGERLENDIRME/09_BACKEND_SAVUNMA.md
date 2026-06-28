# 09 — Backend Savunma (Supabase)

> Kapsam: yayın iş planı V2'nin (`docs/YAYIN_IS_PLANI_V2.md`) seçtiği yığın için somut
> backend savunma tasarımı + eleştiri. Yığın: **Supabase** (Postgres + Auth + Storage +
> Edge Functions) · **doğrudan Google Play Billing** (RevenueCat YOK) · içerik `public`/
> `premium` bucket'lar + imzalı URL. Bu rapor mevcut planın "güvenlik" satırlarını
> (V2 Faz 2/4 + `YAYIN_DENETIM_GUVENLIK.md` §3 v2) SOMUTLAŞTIRIR ve eksiklerini
> işaretler. Uygulama koduna dokunulmadı; tasarım/öneridir.

## Özet
- **Bugünkü zemin sağlam ama uykuda:** `UYELIK_AKTIF=false` (`src/constants/config.ts:58`) → şu an Supabase'e hiç bağlanılmıyor, saldırı yüzeyi yok. Bu rapor v2 açılınca (ödeme + premium içerik sunucuda) doğacak yüzeyi savunur. Sıfırdan değil, **şalter açılmadan önce yazılması gereken backend sözleşmesi**.
- **En büyük tehdit DDoS değil, MALİYET + SCRAPING:** anon key bundle'da PUBLIC (`config.ts:41-42`, `supabase.ts:16`). Saldırgan bu key'le supabase-js/curl ile REST ve Storage'a doğrudan vurur. Gerçek koruma RLS + Edge Function kapısı + Play Integrity; "anon key gizli" diye bir savunma YOK ve plan bunu doğru kabul ediyor (`config.ts:38` "RLS gerçek koruma").
- **Premium içeriği imzalı URL ile dağıtmak tek başına yetmez:** imzalı URL üretimi kapısız kalırsa (sadece "giriş yapan herkes") tek hesapla tüm 252 MB ses + 391 MB görsel sızdırılır = hem fikri mülkiyet kaybı hem egress maliyet saldırısı. Kapı = entitlement + Play Integrity + kullanıcı başına indirme kotası.
- **Supabase'in kritik boşluğu: uç-uca per-user rate limit yok.** Auth uçlarında yerleşik limit var; REST/Storage/Edge'de yok. Önüne **Cloudflare (WAF + rate limit + cache)** koymak P0. Aksi halde tek saldırgan Storage egress'i ile faturayı uçurur.
- **`service_role` asla client'ta** (plan bunu biliyor); ama somut kural: service_role YALNIZ Edge Function ortam değişkeninde, makbuz doğrulama + premium bayrağı yazma için. Client her zaman anon key + RLS.
- **Spend cap + alarm P0:** Supabase'te bütçe aşımı uyarısı + (mümkünse) sert tavan; egress/fonksiyon-çağrı patlamasına e-posta alarmı. Maliyet saldırısı sessizce büyür.

---

## Bulgular (önem sırası)

### [B1 · P0] Anon key public → REST/Storage doğrudan scraping kapısı
- **Ne:** `SUPABASE_ANON_KEY` JS bundle'a gömülü (`config.ts:42`); release APK'dan çıkarılır. Bu key + proje URL ile saldırgan PostgREST'e (`/rest/v1/cards?select=*`) ve Storage'a uygulama olmadan vurur.
- **Neden/etki:** RLS yoksa veya gevşekse tüm kanun/kart/madde-metni tablosu tek istekle dump edilir; premium içerik anlamsızlaşır. Bu, "sahte client" + "scraping" tehdidinin ana vektörü.
- **Öneri (somut):**
  - Tüm tablolarda **RLS AÇIK + varsayılan DENY**. İçerik tabloları (cards/laws) için iki seçenek: (a) metni hiç sunucuya koyma (zaten APK'da, v1 kabulü) — yalnız premium *medya* sunucuda; ya da (b) referans metni sunucudaysa `anon`'a SADECE ücretsiz kapsam (`is_free=true`) satırlarını aç.
  - Örnek politika (içerik metni sunucudaysa, ücretsiz tadımlık):
    ```sql
    alter table public.cards enable row level security;
    -- anon yalnız ücretsiz kartların METASINI görür (medya yine imzalı URL'le)
    create policy cards_free_read on public.cards
      for select to anon, authenticated
      using (is_free = true
             or auth.uid() in (select user_id from premium_users where active));
    ```
  - **Kullanıcı verisi (SRS/ilerleme bulut senkronu)** tablosu — katı sahiplik:
    ```sql
    alter table public.user_progress enable row level security;
    create policy own_rows on public.user_progress
      for all to authenticated
      using (auth.uid() = user_id) with check (auth.uid() = user_id);
    ```
  - Storage `premium` bucket **private** (RLS ile `select`/`download` politikası YOK → yalnız service_role imzalı URL üretebilir). `public` bucket sadece tadımlık.
- **DOĞRULANMADI:** Henüz şema/tablo yok (`**/supabase/**` boş — Glob 0 sonuç). Bu politikalar yeni yazılacak; mevcut migration sistemi yalnız yerel SQLite (`database.native.ts`), Supabase Postgres göçü AYRI kurulacak.

### [B2 · P0] İmzalı URL üretimi entitlement + Integrity ile kapılı olmalı
- **Ne:** Plan "ücretli içerik için süreli imzalı URL (Edge Function)" diyor (`YAYIN_IS_PLANI_V2.md:46`) ama kapı kuralını tanımlamıyor. Kapısız imzalı-URL endpoint'i = "giriş yapan = her şeyi indir".
- **Neden/etki:** Hesap paylaşımı + tek hesapla toplu sızdırma + egress maliyet saldırısı buradan akar. İmzalı URL kısa ömürlü olsa bile, üretim ENDPOINT'i sınırsızsa saldırgan döngüde yeni URL üretip tüm kütüphaneyi çeker.
- **Öneri:** Tek Edge Function `imzali-url` (service_role içeride), her çağrıda SIRAYLA:
  1. **JWT doğrula** (Authorization header → `auth.getUser`).
  2. **Play Integrity token doğrula** (B5) — istek gerçek imzalı app'ten mi.
  3. **Entitlement kontrol** — `premium_users.active = true` (DB'den, client bayrağına GÜVENME).
  4. **Per-user kota** — `download_log`'a yaz; günlük N dosya / saatlik M üstünde reddet (B3).
  5. Geçerse `createSignedUrl(path, 60)` (60 sn TTL, tek dosya).
  - Skeleton:
    ```ts
    // supabase/functions/imzali-url/index.ts
    const sb = createClient(SB_URL, SERVICE_ROLE, { auth: { persistSession:false }});
    const { data:{ user } } = await sbAnon.auth.getUser(jwt);     // 1
    if (!user) return json(401);
    if (!await integrityOk(integrityToken, user.id)) return json(403); // 2
    const { data:ent } = await sb.from('premium_users')
      .select('active').eq('user_id', user.id).single();          // 3
    if (!ent?.active) return json(402);
    if (!await kotaArttirVeKontrol(sb, user.id)) return json(429); // 4
    const { data } = await sb.storage.from('premium')
      .createSignedUrl(path, 60);                                 // 5
    ```
  - TTL kısa (≤60 sn) + **tek dosya/çağrı** (toplu `createSignedUrls` ile "tüm bucket" verme). Görsel/ses lazy istenince üretilir (V2 Faz 2 cache modeli ile uyumlu).

### [B3 · P0] Per-user / per-IP rate limit yok → maliyet ve abuse açığı
- **Ne:** Supabase REST/Storage/Edge için **yerleşik per-user rate limit YOK** (yalnız Auth uçlarında var — aşağıda B6). Plan rate limiting'i hiç ele almıyor.
- **Neden/etki:** DDoS değil asıl tehlike **maliyet saldırısı**: imzalı-URL döngüsü → Storage egress (GB başına ücret) faturayı uçurur; Edge Function çağrı sayısı + Auth signup spam ek maliyet.
- **Öneri (katmanlı):**
  - **Cloudflare önde (P0):** Storage ve Edge'i custom domain ardına al; WAF Rate Limiting Rules (IP başına dk/sa eşiği) + bot fight + (premium medya için) cache → tekrar indirmeler CDN'den, origin egress düşer. En yüksek kaldıraç bu.
  - **DB tabanlı per-user kota (Edge içinde):** `download_log(user_id, ts)`; pencere içi sayım, eşik üstü `429`. Aynı tabloyu B2 adım 4 kullanır:
    ```sql
    create table download_log(user_id uuid, path text, ts timestamptz default now());
    create index on download_log(user_id, ts);
    -- Edge: son 1 saatte > 200 satır ise reddet; son 24s > 1500 ise reddet
    ```
  - **Postgres fonksiyon çağrılarına** (RPC) `pg_stat_statements` + gerekirse `pgbouncer` limitleri.
  - Auth: aşağıda B6.

### [B4 · P0] service_role sızıntısı = tam yıkım; sıkı saklama kuralı
- **Ne:** `service_role` RLS'i baypas eder (tüm veriye yazma/okuma). Plan "service_role asla client'ta" prensibini ima ediyor ama yazılı kural ve denetim yok.
- **Neden/etki:** Tek sızıntı → tüm kullanıcı verisi + premium bayrağı manipülasyonu + içerik dump. Geri dönüşü yok.
- **Öneri:**
  - service_role YALNIZ Edge Function **secret**'ında (`supabase secrets set SERVICE_ROLE=...`); repo/`.env`/bundle'da ASLA. `EXPO_PUBLIC_*` prefixinin bundle'a gömüldüğü zaten not edilmiş (`YAYIN_DENETIM_GUVENLIK.md:63`) → service_role'a ASLA bu prefix verme.
  - `.gitignore` denetimi: `.env`, `supabase/.env`, fonksiyon secret'ları commit'lenmesin. CI'da gizli-tarama (gitleaks) ekle.
  - service_role kullanımını yalnız 2-3 Edge Function'a sınırla (imzalı-url, makbuz-dogrula, hesap-sil). Her birinde girişte JWT doğrula → "service_role var ama yine de kullanıcı bağlamı zorunlu".
  - Anahtar rotasyonu prosedürü yaz (sızıntı şüphesinde Supabase'ten rotate + redeploy).

### [B5 · P1] Play Integrity ile istek doğrulama — "sadece gerçek imzalı app"
- **Ne:** `YAYIN_DENETIM_GUVENLIK.md:54` Play Integrity'yi öneriyor ama bağlama (hangi endpoint, nasıl doğrulanır) yok.
- **Neden/etki:** Integrity olmadan, geçerli bir JWT + anon key ile yazılmış sahte client (curl/script) Edge Function'lara meşru görünür → bot/scraping/hesap-paylaşımı ucuzlar.
- **Öneri:**
  - Hassas Edge Function'larda (imzalı-url, makbuz-dogrula) **Play Integrity token zorunlu**. Client `requestIntegrityToken` ile üretir, header'da yollar; Edge Function **Google Play Integrity API**'ye (server-to-server) doğrular: `appRecognitionVerdict == PLAY_RECOGNIZED`, `deviceRecognitionVerdict` MEETS_DEVICE_INTEGRITY, paket adı + imza sertifikası eşleşmesi, nonce taze (replay önleme).
  - **Nonce akışı:** Edge `nonce` üretir → client Integrity token'a gömer → Edge doğrularken nonce'u eşler (tek kullanımlık, kısa ömür). Replay'i keser.
  - **Gerçekçi sınır:** Integrity yalnız ANDROID + gerçek Play imzalı build. Expo Go'da YOK; native modül + production build gerekir (V2 Faz 4 zaten gerçek build diyor). iOS için karşılık = **App Attest / DeviceCheck** (iOS dahilse). Bunu "tek başına savunma değil, kapı bir katmanı" olarak konumla; düşerse fail-soft mu fail-hard mı kararı (öneri: premium indirmede fail-hard, ücretsiz tadımlıkta fail-soft).
- **DOĞRULANMADI:** Play Integrity için Google Cloud servis hesabı + Play Console bağlama gerekir; bu bürokratik adım (FAZ 0 hesap işine eklenmeli).

### [B6 · P1] Auth abuse: signup spam, OTP/parola yok ama OAuth-only avantajı
- **Ne:** Giriş yalnız Google OAuth (`auth.ts:64`, `signInWithOAuth provider:'google'`). Parola/e-posta-OTP yüzeyi YOK → brute-force/credential-stuffing yüzeyi de yok (iyi). Ama Supabase Auth yine de hız sınırına tabi ve signup ile kullanıcı tablosu şişirilebilir.
- **Öneri:**
  - Supabase **Auth Rate Limits** panelinden token/verify/signup eşiklerini düşür (varsayılanlar cömert).
  - Yalnız Google sağlayıcısı açık kalsın; e-posta/parola/anonymous sign-in KAPALI (saldırı yüzeyini daraltır).
  - `Site URL` / `Redirect URLs` SIKI allowlist — `mevzu://**` + gerekli exp adresleri (zaten `UYELIK_KURULUM.md` §3 bunu kuruyor). Açık redirect = oturum kaçırma riski. Wildcard'ı production'da daralt (`exp://` redirect'leri yayında KALDIR).
  - **PKCE zaten açık** (`supabase.ts:38 flowType:'pkce'`) — doğru; auth-code interception'a karşı.

### [B7 · P1] Hesap paylaşımı / aynı anda çok cihaz — entitlement + cihaz kaydı
- **Ne:** Tek premium hesabın onlarca kişide kullanılması (JSPS hedef kitlesinde yüksek olasılık — kapalı meslek grubu, tanıdık paylaşımı). `YAYIN_DENETIM_GUVENLIK.md:58` "2 cihaz limiti v2" diyor; somut mekanizma yok.
- **Öneri:**
  - `devices(user_id, device_id, last_seen, integrity_ok)` tablosu; her premium çağrıda cihaz kaydet/güncelle.
  - **Aktif cihaz limiti** (örn. 2): yeni cihaz limiti aşarsa en eski cihazı pasifle veya yeniyi reddet. Karar Edge Function'da (service_role), client'a güvenme.
  - `device_id` kararlı olmalı (reinstall'da değişmesi sorun — filigran notuyla aynı kısıt `YAYIN_DENETIM_GUVENLIK.md:65`). Android için Play Integrity device verdict + uygulama kurulum kimliği kombinasyonu öner.
  - **Forensic filigran** (kullanıcı ID + tarih, mevcut roadmap Faz 1) caydırıcı tamamlayıcı: paylaşılan ekran görüntüsünde kaynak hesap belli olur.

### [B8 · P1] Makbuz doğrulama sunucuda + entitlement tek kaynak DB
- **Ne:** V2 Faz 4 (`:58`) "makbuz doğrulama (Edge Function → Google Play Developer API) → premium bayrağı (Supabase tablo + RLS)" diyor. Doğru yön; somut güvenlik kuralları eksik.
- **Öneri:**
  - Client satın alma token'ını Edge'e yollar → Edge **Play Developer API**'ye `purchases.subscriptions/products.get` ile doğrular (service hesabı) → geçerliyse `premium_users.active=true` yazar. Client'tan gelen "ben premium'um" bayrağına ASLA güvenme (entitlement DB'de, RLS ile korunur).
  - **RTDN (Real-time Developer Notifications)** Pub/Sub → Edge webhook: iptal/iade/yenileme/grace gelince `active` güncelle. Aksi halde iade edilmiş abonelik premium kalır (gelir kaçağı + "kötü niyetli iade-sonrası erişim").
  - Webhook **imza/kaynak doğrulama** (Pub/Sub push'ta OIDC token doğrula) — sahte iptal/aktivasyon enjekte edilmesin.
  - **Replay/duplicate:** purchase token'ı `processed_purchases` tablosunda tekille (idempotent).

### [B9 · P2] Gözlemlenebilirlik & alarm — maliyet saldırısı sessiz büyür
- **Ne:** Plan log/alarm/metrik tarafına hiç değinmiyor.
- **Öneri:**
  - **Spend/usage alarm (P0 aslında):** Supabase org bütçe uyarısı; egress GB + Edge invocation + DB boyutu eşiklerine e-posta. Mümkünse "spend cap" sert tavan.
  - **Log drain / Logflare:** Edge Function + Auth + Postgres logları; 401/403/429 patlamasına ve tek IP/tek user yoğunluğuna alarm (anomali = scraping/abuse).
  - `download_log` üzerinden günlük rapor: kullanıcı başına indirilen GB (üst %1 = paylaşım/scraping şüphesi).
  - Edge Function'larda yapılandırılmış log (user_id, sonuç kodu, integrity sonucu) — PII yazma (e-posta loglama).

### [B10 · P2] Yedek & kurtarma
- **Ne:** Kullanıcı verisi (premium entitlement + ileride SRS bulut senkronu) kıymetli; plan yedeği konuşmuyor.
- **Öneri:**
  - **PITR** (Point-in-Time Recovery, ücretli plan) entitlement + ödeme tablosu için; en azından günlük `pg_dump` otomasyonu (Edge cron / GitHub Action, şifreli depo).
  - **İçerik (Storage) yedeği:** premium medya zaten yerelde asset olarak var (kaynak repo/üretim hattı) → Storage tek kopya değil, kurtarılabilir. Bunu doğrula (gerçek kaynak = `assets/`, Storage türev).
  - Felaket senaryosu tatbikatı: "entitlement tablosu bozulursa Play makbuzlarından yeniden inşa" prosedürü yaz (makbuz = gerçeğin kaynağı, DB türev).
  - **Bölge:** Frankfurt/EU önerisi (`UYELIK_KURULUM.md:18`) KVKK açısından doğru; yedeğin de AB'de kalması.

### [B11 · P2] Edge Function genel sıkılaştırma
- **Öneri:** CORS allowlist (yalnız app origin / `*` verme), girdi doğrulama (path traversal: `premium/../` engelle, izinli key deseni regex — mevcut `gorsel_yolu` namespace'i `tck_m1` gibi ASCII, bunu beyaz listele), timeout + hata mesajında iç detay sızdırma, secret'ları yalnız env'den oku, fonksiyon başına en az ayrıcalık.

---

## Hızlı kazanımlar
- **RLS varsayılan-deny + sahiplik politikası** şablonunu daha şema kurulurken yaz (B1) — sonradan eklemek zor, baştan ucuz.
- **Auth panel sıkılaştırma** (B6): e-posta/parola/anonymous KAPALI, yalnız Google; redirect allowlist daralt; rate-limit eşikleri düşür. Kod değil, panel ayarı.
- **Spend cap + bütçe uyarısı** (B9) — birkaç tık, maliyet saldırısına ilk siper.
- **service_role'u tek secret'a hapset + gitleaks** (B4) — düşük efor, yüksek koruma.
- İmzalı URL TTL'sini ≤60 sn + tek dosya yap (B2) — varsayılan uzun TTL'den tek satır fark.

## Riskler
- **Cloudflare olmadan Supabase Storage egress'i açık hedef** — Supabase'in uç rate-limit boşluğu mimari risk; önüne CDN/WAF koymadan premium içeriği canlıya almak maliyet saldırısına davet.
- **Play Integrity Android-only + gerçek build:** Expo Go test edilemez, iOS dahilse App Attest ayrı iş; "tek savunma" sanılırsa yanıltıcı. Katman olarak konumla.
- **Hesap paylaşımı tam çözülemez** (filigran caydırır, cihaz limiti zorlaştırır ama kapalı meslek grubunda sosyal paylaşım güçlü) — iş modeli buna dayanıklı fiyatlanmalı.
- **service_role/secret yanlış konumlanırsa** tüm savunma çöker — insan hatası en büyük tek-nokta.
- **Supabase tek satıcı bağımlılığı** (auth+db+storage+functions+billing-doğrulama hep orada); kesinti/fiyat değişimi tek noktada. Makbuz = gerçeğin kaynağı tutularak (B8/B10) bağımlılık azaltılır.
- **DOĞRULANMADI alanlar:** henüz hiç Supabase şeması/Edge Function/Storage yok (Glob `**/supabase/**` = 0). Tüm bu rapor "açılış öncesi sözleşme"; uygulanınca her madde tekrar denetlenmeli.

## Somut adımlar (sıralı, tahmini efor)
1. **(FAZ 0'a ekle, ~yarım gün)** Google Cloud servis hesabı: Play Developer API (makbuz) + Play Integrity API erişimi; Supabase org bütçe uyarısı/spend cap aç. (B5, B8, B9)
2. **(Şema kurulurken, ~1 gün)** Postgres şema + **RLS varsayılan-deny** + sahiplik/ücretsiz-kapsam politikaları (B1); `premium_users`, `devices`, `download_log`, `processed_purchases` tabloları. SQL'i repoya `supabase/migrations/` olarak versiyonla.
3. **(~1 gün)** Auth panel sıkılaştırma (B6) + service_role secret disiplini + gitleaks (B4). Düşük efor, hemen.
4. **(~2 gün)** Edge Function `imzali-url`: JWT + entitlement + kota + (sonra Integrity) → 60sn imzalı URL (B2, B3). `download_log` kotası burada.
5. **(~2 gün)** Edge Function `makbuz-dogrula` + RTDN webhook (imza doğrulamalı, idempotent) → entitlement tek-kaynak DB (B8).
6. **(~2 gün)** Play Integrity (+ iOS App Attest dahilse) nonce akışı, hassas endpoint'lere tak (B5).
7. **(~1 gün)** Cloudflare: Storage/Edge önüne WAF + rate-limit + premium cache (B3); custom domain.
8. **(~1 gün)** Gözlemlenebilirlik: log drain + 401/403/429 + egress alarmı; kullanıcı başına GB raporu; PITR/pg_dump yedek + kurtarma prosedürü (B9, B10).
9. **(~yarım gün)** Cihaz limiti politikası (B7) — `devices` ile aktif-cihaz kuralı; filigranı gerçek user ID'ye bağla (mevcut roadmap Faz 1 ile birleştir).

---

## Karşı-görüş & doğrulama (çoklu göz)
- **"Tüm bunlar v1'i geciktirir mi?"** Hayır — `UYELIK_AKTIF=false` olduğu sürece (`config.ts:58`) bu yüzeyin HİÇBİRİ canlı değil; bu rapor **şalter açılmadan önce** yapılacak iş listesi. V1 yayını bunu beklemez (plan da v2'ye atıyor).
- **"İmzalı URL + RLS yeterli, Integrity/Cloudflare aşırı mı?"** RLS scraping'i, imzalı URL fikri mülkiyeti korur; ama ikisi de **maliyet saldırısını** (geçerli hesapla egress yakma) ve **sahte client botunu** durdurmaz. Cloudflare rate-limit (maliyet) + Integrity (gerçek app) o boşluğu kapatır. Yine de Integrity Android+gerçek-build sınırı gerçek → "kapı katmanı", tek bel kemiği değil.
- **"service_role hiç gerekmez, RLS yeter mi?"** Makbuz doğrulama sonrası entitlement YAZMAK ve imzalı URL üretmek RLS-üstü yetki ister → service_role kaçınılmaz; çözüm onu Edge secret'ında hapsetmek (B4), client'a vermemek.
- **Doğrulama yöntemi:** mevcut kod (`supabase.ts`, `auth.ts`, `config.ts`) okundu → anon-key public, PKCE, OAuth-only, üyelik-kapalı teyit edildi. Supabase tarafı henüz YOK (Glob `**/supabase/**` boş) → server politikaları "tasarım", uygulanınca yeniden denetim şart.
- **Eksik kalan / sonraki pas:** (a) SRS bulut senkronu açılırsa yeni RLS yüzeyi (kullanıcı verisi yazma) ayrı denetlenmeli; (b) KVKK/veri-ikamet (AB bölge) hukuki tarafı `06_GUVENLIK` / gizlilik raporuyla çapraz kontrol; (c) iOS dahil edilirse App Attest detayı bu raporda yüzeysel — derinleştirilmeli.

---
## KARSI-GORUS & DOGRULAMA (kirmizi takim)

> Bagimsiz denetim: rapordaki kod/dokuman atiflari tek tek okundu. Asagida (1) dogrulanan/abartilan iddialar, (2) atlanmis onemli noktalar, (3) onceliklendirme elestirisi, (4) ana iddialara guven notu. Uygulama koduna dokunulmadi.

### Dogrulama sonucu — saglam temel, kucuk atif kaymalari
Rapordaki kod iddialari BUYUK OLCUDE DOGRU; cogu satir atfi 1-2 satir kayikli ama maddi hata degil:
- `UYELIK_AKTIF=false` (`config.ts:58`) ✅; anon key env'den, su an BOS sabit (`config.ts:41-42`) ✅; "RLS gercek koruma" notu (`config.ts:38`) ✅; PKCE ✅ ama **`supabase.ts:37`** (rapor `:38` demis — 1 satir kayik); OAuth-only Google ✅ (`auth.ts:64-65`).
- **Atif kaymasi:** Ozet satir 12 "anon key bundle'da PUBLIC" icin `supabase.ts:16` gosteriyor — ama o satir `supabaseHazir` GUARD'i, anon key tanimi degil. Frankfurt/EU atifi `UYELIK_KURULUM.md:18` denmis, gercekte **`:16`**. Dusuk etki; duzeltilmeli.
- `**/supabase/**` Glob = 0 ✅ bagimsiz teyit edildi — hicbir sema/Edge/Storage yok. Raporun "acilis oncesi sozlesme, hepsi DOGRULANMADI" cercevesi DURUST ve dogru.
- **Iyi yakalama (raporun gucu):** Iki kaynak dokuman CELISIYOR — `YAYIN_DENETIM_GUVENLIK.md:53,58,72` RevenueCat diyor, ama V2 plan `YAYIN_IS_PLANI_V2.md:56` dogrudan `react-native-iap` (RevenueCat YOK). Rapor V2'yi esas alip "RevenueCat YOK" demis (basligi) — bu dogru uzlastirmadir, ama metinde belirgin not edilmemis; ileride karisiklik yaratir.

### Atlanmis onemli noktalar (P0/P1)
- **[KIRMIZI-1 · P0] B3'un "en yuksek kaldirac" CDN-cache iddiasi B2 ile CELISIYOR.** B3 (satir 75) "premium medya icin Cloudflare cache → tekrar indirmeler CDN'den, origin egress duser, **en yuksek kaldirac bu**" diyor. AMA B2 (satir 54,69) her cagri **per-user 60sn imzali URL, tek dosya, benzersiz token query-string** uretiyor. Benzersiz imzali URL'ler **her istekte CDN cache MISS** → CDN onbellegi calismaz; query-string yok sayarak cache'lemek imzayi (= guvenligi) bozar. Yani raporun en yuksek kaldirac dedigi siper, kendi imzali-URL tasarimiyla buyuk olcude etkisiz. Cozum ayri tasarim ister: (a) premium medyayi kullanici-bagimsiz uzun-TTL stabil URL + Cloudflare signed-cookie/token-auth ile koru (Supabase imzali-URL degil), ya da (b) imzali URL'i path bazli sabit tutup yetkiyi cookie'de tasi. Bu raporun en buyuk tek teknik celiskisi. **Guven: Yuksek.**
- **[KIRMIZI-2 · P1] Supabase ZATEN Cloudflare arkasinda.** Tum Supabase projeleri Cloudflare uzerinden servis edilir (DDoS/L3-4 koruma var). Raporun "Cloudflare onde koy (P0)" onerisi DDoS icin buyuk olcude GEREKSIZ; gercek bosluk **uygulama-seviyesi per-user kota** (ki onu B3 `download_log` zaten cozuyor). Ek custom-domain+Cloudflare maliyet/karmasiklik getirir, getirisi sinirli. Rapor bu mevcut katmani gormeden "CDN/WAF yoksa acik hedef" (Riskler) diye abartiyor. **Guven: Orta-Yuksek.**
- **[KIRMIZI-3 · P0] imzali-url Edge Function'in KENDISI maliyet/DoS hedefi; kota fonksiyon ICINDE kontrol ediliyor.** B2 skeleton'da JWT-dogrula + entitlement-sorgu + integrity (Google API cagrisi) + kota-insert HEPSI fonksiyon CALISTIKTAN sonra. Saldirgan endpoint'i dovdugunde her istek = 1 Edge invocation (faturali) + 1-2 DB sorgu + 1 Google Integrity API cagrisi (kotali) yakar — `429` donse bile kaynak harcanir. Kota fonksiyon-ici oldugu surece maliyet saldirisi durmuyor; **upstream (gateway/IP) rate-limit fonksiyondan ONCE** sart. Rapor Cloudflare'i anar ama bu fan-out maliyetini ve "kota-ici-fonksiyon hala harcar" celiskisini baglamiyor. **Guven: Yuksek.**
- **[KIRMIZI-4 · P1] Kota kontrolu YARIS KOSULU'na acik.** `kotaArttirVeKontrol` (satir 65) read-then-write desenliyse, saldirgan paralel istekle esigi asar (TOCTOU). Atomik olmali: tek transaction'da `INSERT ... RETURNING (SELECT count(*) ... FROM window)` ya da sayac satirinda `UPDATE ... WHERE count < N`. Rapor "son 1 saatte > 200 satir ise reddet" diyor ama atomiklikten bahsetmiyor. **Guven: Yuksek.**
- **[KIRMIZI-5 · P1] `auth.getUser(jwt)` her cagrida AG round-trip = GoTrue'ya yuk + gecikme.** Skeleton (satir 60) GoTrue'ya network dogrulamasi yapiyor; bu hem latency hem GoTrue rate-limit'ine takilabilen bir abuse vektoru. Edge'de JWKS ile **yerel imza dogrulamasi** (network'suz) tercih edilmeli. Rapor bu optimizasyonu atliyor. **Guven: Orta-Yuksek.**
- **[KIRMIZI-6 · P1] iOS para yolu HIC ELE ALINMAMIS.** CLAUDE.md: proje SDK 54'te SABIT cunku **iPhone Expo Go uyumu** — iOS acik bir hedef. Ama V2 monetizasyon (`react-native-iap` + Play Billing) Android-only; iOS premium icin StoreKit/App Store makbuz dogrulama AYRI bir entitlement yolu ister. B8 yalniz "Play Developer API" diyor. Rapor B5'te App Attest'i "iOS dahilse" diye SARTLI gecistiriyor — oysa iOS dahil, dolayisiyla hem App Attest hem StoreKit makbuz dogrulama EKSIK is, opsiyonel degil. Entitlement mimarisi cift-platform tasarlanmali (`premium_users.source = play|appstore`). **Guven: Yuksek.**
- **[KIRMIZI-7 · P2] Play Integrity "nonce" modeli eskimekte.** B5 (satir 99) klasik nonce-akisini anlatiyor; Google **Standard Integrity API**'de istege gomulu nonce yerine `requestHash`/icerik-baglama kullaniliyor, klasik istek deprecate yoluna girdi. Replay korumasi icin sunucu-nonce hala klasik API'de gecerli ama yeni entegrasyonda Standard + requestHash onerilir. Rapor klasik modeli tek dogru gibi sunuyor. **Guven: Orta.**
- **[KIRMIZI-8 · P2] `download_log` sinirsiz buyur + RLS politika performansi.** (a) Yuksek-hacimli insert tablosu icin retention/partition/TTL yok (rapor index ekliyor, temizlik yok). (b) B1 politikalarinda `auth.uid()` cipliak kullaniliyor — Supabase bilinen ayagina-sik: `(select auth.uid())` ile sarmalanmazsa her satirda yeniden degerlendirilir; `cards_free_read`'teki satir-ici subquery (satir 33-34) de her satirda calisir → `EXISTS` veya SECURITY DEFINER cache'li fonksiyon olmali. **Guven: Orta.**

### Onceliklendirme elestirisi
- **P0 enflasyonu:** B1+B2+B3+B4 hepsi P0. Bu, P0'i anlamsizlastiriyor. Gercek: `UYELIK_AKTIF=false` oldugu icin bunlarin HICBIRI v1 icin P0 degil — hepsi "**v2-salter-acilis-blokeri**". Rapor bunu ozet'te kabul ediyor ama etiketleri "simdi P0" izlenimi veriyor. Oneri: P0 = "v2 acilmadan ONCE zorunlu", v1 yayin-blokeri DEGIL diye acikca etiketle.
- **Ic tutarsizlik (B9):** Rapor kendi #1 tehdidini "maliyet saldirisi" ilan ediyor (Ozet, satir 14,16) ve "spend cap P0 aslinda" diyor (satir 130) — ama spend cap B9 (P2) icine gomulu. **En ucuz + en hizli + #1 tehdide ilk siper olan spend-cap/butce-alarmi ayri bir P0 madde olmali**, P2 icinde degil. (Rapor "Hizli kazanimlar"da aniyor ama oncelik etiketi celisik.)
- **Gercek dogru sira (efor/kaldirac):** (1) Spend cap + butce alarmi [panel, dakikalar] → (2) service_role tek-secret + gitleaks [B4, dusuk efor] → (3) Auth panel sikilastirma [B6, panel] → (4) RLS varsayilan-deny sema [B1, temel] → (5) imzali-url + ATOMIK kota + upstream IP-limit [B2/B3/KIRMIZI-3,4] → (6) makbuz dogrulama cift-platform [B8/KIRMIZI-6]. Cloudflare (B3) Supabase zaten-arkasinda oldugu icin (KIRMIZI-2) listede ASAGI inmeli, "en yuksek kaldirac" degil.

### Ana iddialara guven notu (ozet)
- "En buyuk tehdit DDoS degil maliyet+scraping" → **Yuksek** (dogru tespit; ama maliyet-savunmasinin onerilen araci=Cloudflare-cache kendi tasarimiyla celisik, KIRMIZI-1).
- "Anon key public, RLS gercek koruma" → **Yuksek** (kod + dokuman teyit).
- "Supabase'te per-user rate limit yok, Cloudflare P0" → **Orta** (app-seviye kota dogru eksik; ama Supabase zaten Cloudflare arkasinda, ek Cloudflare DDoS icin gereksiz — KIRMIZI-2).
- "Imzali URL + entitlement + integrity kapisi" → **Yuksek** (yon dogru; skeleton'da yaris-kosulu, getUser-ag-cagrisi, fonksiyon-ici-kota maliyet bosluklari var — KIRMIZI-3,4,5).
- "service_role yalniz Edge secret" → **Yuksek** (standart ve dogru).
- "Play Integrity istek dogrulama" → **Orta** (dogru katman; nonce modeli eskimekte, iOS App Attest sartli gecistirilmis — KIRMIZI-6,7).
- "Makbuz dogrulama sunucuda, entitlement tek-kaynak DB + RTDN" → **Yuksek** (Android icin saglam; iOS yolu eksik — KIRMIZI-6).

### Genel hukum
Rapor **iyi yapilandirilmis, durust cerceveli (DOGRULANMADI etiketleri yerinde), kod-temelli ve buyuk olcude DOGRU**. En ciddi zafiyetleri: (a) B2 imzali-URL ile B3 CDN-cache arasindaki teknik celiski (KIRMIZI-1), (b) iOS para/attest yolunun yoklugu (KIRMIZI-6), (c) P0 enflasyonu + spend-cap'in yanlis kademede olmasi. Bunlar duzeltilirse savunma sozlesmesi uygulanabilir.
