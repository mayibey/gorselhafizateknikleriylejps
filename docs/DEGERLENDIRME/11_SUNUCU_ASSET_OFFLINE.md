# 11 — Sunucu + Asset + Offline İndirme (Değerlendirme)

> Kapsam: ~1.5 GB gömülü asset'i sunucuya taşıma, kanun-kanun offline indirme yöneticisi, indirilen içeriğin güvenliği, ilk-açılış hızı/lazy indirme/sürümleme. Baz alınan plan: `docs/YAYIN_IS_PLANI_V2.md` **FAZ 2** (satır 35-48) — bu doküman onu **somutlaştırır**, değiştirmez (Supabase kararı korunur; CDN/egress maliyeti P1 olarak eleştirilir).
> Yöntem: kod okundu, varsayım yok. Doğrulanamayanlar "DOGRULANMADI" işaretli.

## Özet
- **Gerçek boyut FAZ 2'deki 643 MB DEĞİL → bugün `assets/kartlar` 883 MB + `assets/sesler` 628 MB = ~1.51 GB** (`du -sh`, 565 png + 566 mp3). Plan rakamı eski; mağaza blokeri tahmin edilenden büyük. **Düzeltilmesi gereken ilk şey FAZ 2 rakamı.**
- **Mimari sürpriz (KRİTİK):** registry yalnız "görsel listesi" değil — `src/db/seed.ts:176` `Object.keys(KART_GORSELLERI)` üzerinden **TÜM kart şemasını (cards/patika/gating/madde-no) türetiyor.** Yani binary'leri uzaklaştırırken **anahtar listesi (string[]) yerel/gömülü KALMALI**, yoksa DB seed'i çöker. FAZ 2 satır 44 bunu sezmiş ("registry'ler anahtar listesi kalır") ama somut değil — bu doküman codegen değişikliğini netleştiriyor.
- **Görsel tarafı kolay, ses tarafı zahmetli:** `expo-image` zaten uzak URL + `cachePolicy="memory-disk"` ile disk cache yapıyor (`study-card.tsx:47-62`) → `require()`→`{uri}` neredeyse yeter. `expo-audio` (`ses-oynatici.tsx:41-42`) uzak URL **çalar ama disk'e cache'lemez** → offline için **`expo-file-system` ile elle indir-sakla-yerel-oynat şart** (ve `expo-file-system` şu an KURULU DEĞİL).
- **Güvenlik primitifi zaten var:** forensic filigran (`study-card.tsx:34` `JSPS • {cihaz} • {tarih}`) duruyor. Cihaz kimliği (`lib/cihaz-kimlik.ts`) kriptografik DEĞİL, reinstall'da değişir — at-rest şifreleme anahtarı için yetersiz; `expo-secure-store` gerekir.
- **Maliyet uyarısı (P1):** 1.5 GB/kullanıcı medya egress'i Supabase Storage'da pahalı ($0.09/GB Pro üstü). **Cloudflare R2 (egress ÜCRETSİZ) + imzalı URL** dramatik tasarruf — Supabase kararını bozmadan "DB/Auth/Edge = Supabase, ağır binary = R2" hibriti öneriliyor.
- **En büyük hızlı kazanım:** PNG→WebP. 883 MB görselin çoğu 1024×1536 PNG; WebP'e %60-80 küçülür → ~200-300 MB. expo-image webp okur. İçerik kalitesi pratikte aynı.

## Bulgular (önem sırası)

### B1 — Registry binary'yi taşıyınca DB seed'i çöker; "anahtar listesi" gömülü kalmalı [P0]
- **Ne:** `src/assets/kart-gorselleri.ts` = `Record<string, ImageRequireSource>` (`require(...)`). `src/db/seed.ts:176` bu objenin **anahtarlarını** dolaşıp her kanunun kartlarını, patika düğümlerini, madde_no'larını ve gating'i üretiyor (`gorselKartlari()`).
- **Nerede:** `src/db/seed.ts:170-210`, `src/assets/kart-gorselleri.ts:6`.
- **Neden:** Eğer codegen'i naif şekilde "anahtarları sil, sadece URL döndür" yaparsak DB tohumlama ağ-bağımlı olur; offline ilk açılışta kart YOK → uygulama boş. Şema deterministik ve offline üretilebilir kalmalı.
- **Etki:** Tüm Mevzuat/Karargah/Tatbikat akışı seed'e dayanır → yanlış yapılırsa komple kırılır.
- **Öneri:** `gorsel:uret` codegen'ini ikiye böl: (a) **`KART_ANAHTARLARI: string[]`** (sadece anahtarlar, ~birkaç KB — gömülü kalır, seed.ts bunu okur); (b) **kaynak çözümleyici** ayrı (anahtar→URL/yerel-dosya). `require()` map'ini SİL. seed.ts `Object.keys(KART_GORSELLERI)` → `KART_ANAHTARLARI` olur. Bu, CLAUDE.md "görsel sistemi codegen, elle düzenleme" değişmezini korur.

### B2 — Görsel: `require()`→`{uri}` + var olan disk cache neredeyse yeterli [P0]
- **Ne:** `study-card.tsx:29,47-62` görseli `KART_GORSELLERI[key]` (require) ile `<Image source=...>`'a veriyor; `cachePolicy="memory-disk"`, `recyclingKey`, `contentFit="contain"`, `onLoad` ile doğal oran. `patika.tsx:15` ve `akis.tsx:376` da KART_GORSELLERI kullanıyor.
- **Nerede:** `study-card.tsx:47`, `patika.tsx`, `akis.tsx:20,376`.
- **Neden:** expo-image uzak URL'i zaten destekler ve `memory-disk` ile diske cache'ler → ilk görüntülemeden sonra offline çalışır (cache temizlenene dek). Migration yükü düşük.
- **Etki:** Görsel kolu küçük; asıl risk ilk-görüntüleme online şartı (B6) ve premium gating (B7).
- **Öneri:** `source={gorsel}` → `source={{ uri: gorselUrl(key) }}` (veya yerel paket varsa `file://`). `placeholder`/`onError` korunur. 3 çağrı noktası (study-card, patika küçük önizleme, akis) tek `gorselKaynak(key)` helper'ından beslensin.

### B3 — Ses: expo-audio uzak URL çalar ama cache'lemez → offline = elle indir + yerel oynat [P0]
- **Ne:** `ses-oynatici.tsx:41-42` `useAudioPlayer(KART_SESLERI[key])` (require number). `hooks/use-kart-sesi.ts`, `use-sesli-nobet.ts`, `lib/sesli-nobet.ts` aynı registry'yi kullanıyor.
- **Nerede:** `ses-oynatici.tsx:41`, `hooks/use-kart-sesi.ts:26`, `hooks/use-sesli-nobet.ts:34`, `lib/sesli-nobet.ts:17`.
- **Neden:** expo-audio `{uri}` ile uzak mp3 STREAM eder (online OK) ama expo-image'in aksine kalıcı disk cache YOK → her dinlemede tekrar indirir, offline'da hiç çalmaz. Offline gereği için dosya elle indirilip `file://` ile çalınmalı.
- **Etki:** Offline "kanun indir" özelliğinin teknik göbeği burası; en çok yeni kod burada.
- **Öneri:** `sesKaynak(key)` çözümleyici: yerel paket dosyası varsa `{ uri: file://.../{key}.mp3 }`, yoksa online iken uzak URL, ikisi de yoksa `null` (UI "indir" gösterir). `sesli-nobet.ts:17` filtresi (`KART_SESLERI[k] !== undefined`) → "ses anahtarı manifestte var mı" kontrolüne çevrilir (binary'siz). **`expo-file-system` kurulmalı** (şu an yok).

### B4 — Gerekli kütüphaneler kurulu DEĞİL [P0]
- **Ne:** `expo-file-system` (indirme/cache/checksum), `expo-crypto` (sha256 doğrulama), `expo-secure-store` (cihaz şifre anahtarı) — hiçbiri `package.json`'da yok. Mevcut: `expo-image ~3.0.11`, `expo-audio ~1.1.1`, `expo-asset 12.0.13`, `@supabase/supabase-js ^2.108.2`.
- **Nerede:** `package.json`.
- **Neden/Etki:** İndirme yöneticisi (devam/checksum) ve at-rest şifreleme bunlar olmadan yazılamaz.
- **Öneri:** `npx expo install expo-file-system expo-crypto` (SDK 54 pin uyumlu). `expo-secure-store` yalnız at-rest şifreleme seçilirse (B8). **expo-asset 12.0.13 pini** (memory: standalone çökme fix) — yeni paketlerin transitif sürümlerini bu pine karşı kontrol et.

### B5 — Egress maliyeti: Supabase Storage 1.5 GB/kullanıcıda pahalı [P1]
- **Ne:** FAZ 2 depolama = Supabase Storage (sabit karar). 1.5 GB tam içerik/kullanıcı indirme egress'i Supabase'de ücretli (Pro $25/ay 250 GB dahil, sonrası ~$0.09/GB).
- **Nerede:** `docs/YAYIN_IS_PLANI_V2.md:4,46`.
- **Neden:** Medya ağırlıklı, tekrar-indirilebilir, statik içerik = CDN işi. Supabase Storage egress'i bunun için pahalı katman.
- **Etki:** 1.000 aktif kullanıcı tam indirse ~1.5 TB egress ≈ pahalı; viral büyümede maliyet patlar.
- **Öneri (Supabase'i bozmadan hibrit):** **DB + Auth + Edge Functions + imzalı-URL üretimi = Supabase** (karar korunur), **ağır binary depolama+dağıtım = Cloudflare R2** (egress ÜCRETSİZ, depolama $0.015/GB/ay; R2 presigned URL imzalı erişim verir). WebP ile (B9) depolama ~250 MB → ~$0.004/ay depolama. Alternatif: Supabase Storage public bucket + Cloudflare CDN önüne koy (cache hit'ler Supabase egress'i azaltır). Karar açık bırakılmalı ama R2 net kazanan. **DOGRULANMADI:** Supabase güncel fiyat satırları (oran tahmini; sözleşme öncesi teyit).

### B6 — App %100 offline; uzak içerik ilk görüntülemede internet ister [P0 ürün kararı]
- **Ne:** Uygulama bugün tamamen offline (gizlilik metni de "veri toplanmıyor" diyor). Uzak asset = ilk görüntüleme online şartı. FAZ 2 satır 47 bu kararı "netleştir" diye bırakmış.
- **Nerede:** `docs/YAYIN_IS_PLANI_V2.md:47`, `constants/config.ts` (UYELIK_AKTIF=false, offline).
- **Neden/Etki:** JSPS hedef kitlesi (kışla/saha, sınırlı internet) için kötü çevrimdışı deneyim churn yapar. Net strateji şart.
- **Öneri (önerilen model):** **İki katman:** (1) **Lazy stream + cache** — kanuna girince expo-image/expo-audio uzaktan çeker, otomatik cache'ler (online deneyim, sıfır kurulum). (2) **Açık "Kanunu indir" (offline paketi)** — kullanıcı internet varken kanunun tüm görsel+sesini kalıcı indirir, sonra tamamen offline. İkisi aynı `kaynak çözümleyici` ardında (B2/B3). Varsayılan: lazy; offline için kullanıcı bilinçli indirir.

### B7 — Premium gating uzak içerikle anlam kazanır: imzalı kısa-ömürlü URL [P1, FAZ 4/5 bağı]
- **Ne:** İçerik gömülüyken ücretli/ücretsiz ayrımı imkânsızdı; uzaklaşınca **private bucket + imzalı URL** ile gerçek gating mümkün.
- **Nerede:** FAZ 2 satır 37-46 (public/premium bucket), FAZ 5.
- **Neden:** Ücretsiz örnek = public/imzasız CDN; premium = private, yalnız **kısa-ömürlü imzalı URL** (Supabase Edge Function `createSignedUrl` veya R2 presigned, TTL ~5-15 dk).
- **Etki:** Ödeme/gating'in (FAZ 4/5) teknik ön şartı; yanlış kurulursa ödeyen-ödemeyen sızması.
- **Öneri:** Edge Function imzalama isteğini **Supabase JWT (giriş yapmış) + premium bayrağı (RLS) + Play Integrity token** ile gate'le → yalnız gerçek app + ödeyen kullanıcı URL alır. URL'ler kısa TTL → paylaşılsa bile çabuk ölür.

### B8 — At-rest şifreleme: cazip ama expo-image/expo-audio'yla çelişir → P2/opsiyonel [P2]
- **Ne:** Brief "cihaza-özel şifreli paket / indirilen asset başkasınca kullanılmasın" istiyor. Ama indirilen dosyayı şifrelersek expo-image (`{uri: file://}`) ve expo-audio şifreli dosyayı **okuyamaz** → her oynatımda decrypt→geçici-dosya yazma gerekir (cache faydasını öldürür, CPU/pil yükü, geçici dosya yine düz sızar).
- **Nerede:** `study-card.tsx:47`, `ses-oynatici.tsx:42` (ikisi de dosyayı doğrudan okur).
- **Neden:** Gerçek tehdit modeli = "biri APK içeriğini çıkarıp dağıtır" → bu zaten **gömülü olmamakla** (B1) + imzalı URL (B7) + Play Integrity ile çözülür. At-rest şifreleme yalnız "root'lu cihazda dosya kopyalama" senaryosuna karşıdır, maliyeti yüksek.
- **Etki:** Erken yapılırsa performans/karmaşıklık borcu; faydası marjinal.
- **Öneri:** **P0/P1'de at-rest şifreleme YOK.** Koruma = (private bucket + imzalı URL + RLS + Play Integrity + var olan forensic filigran). At-rest gerçekten istenirse v2'de **yalnız ses** için (görsel filigranlı, ses değil) `expo-crypto` + `expo-secure-store` (cihaz anahtarı) ile decrypt-to-temp; ayrı keşif gerektirir. Filigran (`study-card.tsx:34`) zaten caydırıcı/forensic — kimlik kaynağı üyelik gelince user-id'ye geçirilmeli (cihaz-kimlik reinstall'da değişiyor).

### B9 — WebP dönüşümü: en büyük tek kazanım (görsel 883→~250 MB) [P1 hızlı kazanım]
- **Ne:** Görseller PNG, çoğu 1024×1536 (PROJE_DURUM faz 9A: "%96.6'sı 2:3 1024×1536"). PNG lossless → büyük. WebP %60-80 küçültür, expo-image webp destekler.
- **Nerede:** `assets/kartlar/**` (883 MB), `gorsel:uret` boru hattı.
- **Neden/Etki:** Hem depolama hem her kullanıcının indirme/egress maliyetini ~3-4× düşürür; offline paket boyutu küçülür.
- **Öneri:** Sunucuya yüklerken `cwebp -q 80` (veya AVIF) ile dönüştür; manifest uzantısı `.webp`. Ses zaten mp3 (kayda değer ek sıkıştırma yok). **DOGRULANMADI:** birebir küçülme oranı (örneklem testi gerekir).

### B10 — Kanun başına paket boyutu dengesiz; bazıları tek-indirmede çok büyük [P2]
- **Ne:** Kanun başına kart sayısı çok değişken: `disiplin` 126, `kabahatler` 62, `tck` 54, `jandteskyon` 39 … `izinyon` 2. Ortalama ~1.56 MB/görsel + ~1.1 MB/ses → `disiplin` paketi ham ~335 MB (WebP sonrası ~140 MB), `tck` ~145 MB.
- **Nerede:** `kart-gorselleri.ts` anahtar önek dağılımı (grep ile sayıldı).
- **Neden/Etki:** "Disiplin'i indir" tek seferde yüz MB → kopan bağlantıda baştan başlama riski; ilerleme/devam şart.
- **Öneri:** İndirici **dosya-bazlı** ilerlesin (kanun = N dosyalık kuyruk), tek tek `createDownloadResumable` + per-dosya checksum → kopan yerden devam, baştan değil. İlerleme = inen dosya / toplam.

## Hızlı kazanımlar
- **WebP dönüşümü (B9):** görsel ~883→~250 MB; depolama + her indirme egress'i ~3-4× düşer. En yüksek ROI.
- **Görsel kolu (B2):** tek `gorselKaynak(key)` helper + `require`→`{uri}`; expo-image disk cache zaten var → minimum kod.
- **R2 hibriti (B5):** egress faturasını ~sıfıra indirir; Supabase Auth/DB kararını bozmaz.
- **Anahtar-listesi codegen (B1):** `KART_GORSELLERI` require map → `KART_ANAHTARLARI: string[]`; bundle anında ~1.5 GB düşer, ilk açılış anında hızlanır.
- Filigran kimlik kaynağını üyelik gelince user-id'ye bağla (kod zaten hazır: `study-card.tsx:34`).

## Riskler
- **Seed/DB kırılması (B1):** anahtar listesi gömülü kalmazsa offline ilk açılış boş kart. Migration ile DB zaten dolu cihazlarda sorun olmaz ama temiz kurulumda kritik → codegen ayrımı şart.
- **Ses offline boşluğu (B3):** expo-audio cache'lemediği için "indirdim sandım ama offline çalmıyor" — indirici yazılmadan offline vaadi verilemez.
- **expo-asset 12.0.13 pini (memory):** yeni paketlerin (file-system/crypto) transitif sürümleri bu pinle çakışırsa standalone build çöker → kurulumdan sonra `expo-doctor` + build dumanı.
- **At-rest şifreleme tuzağı (B8):** erken yapılırsa expo-image/expo-audio uyumsuzluğu + performans borcu; faydası imzalı-URL'in üstüne marjinal.
- **Gizlilik beyanı çelişkisi:** uzak asset = ağ çağrısı → "veri toplanmıyor" beyanı + Play Data Safety GÜNCELLENMELİ (IP/indirme logu). Mağaza reddi riski (FAZ 3 compliance ile birlikte).
- **Maliyet fiyatları DOGRULANMADI:** Supabase/R2 oranları tahmin; sözleşme öncesi teyit.

## Somut adımlar (sıralı, tahmini efor)
1. **(0.5g) FAZ 2 rakamını düzelt + karar:** 643 MB→~1.5 GB; depolama R2-hibrit mi saf-Supabase mi (B5) — başkan onayı. WebP kararı (B9).
2. **(0.5g) Paket kur:** `npx expo install expo-file-system expo-crypto` → `expo-doctor` + build dumanı (expo-asset pin çakışması kontrolü, B4).
3. **(1g) Codegen ayrımı (B1):** `gorsel:uret`/`ses:uret` → `KART_ANAHTARLARI: string[]` üret + binary `require` map'ini kaldır; `seed.ts:176` ve `sesli-nobet.ts:17` anahtar-listesine repoint. `tsc 0` + offline seed teyidi.
4. **(1g) Manifest + yükleme scripti:** içerik manifesti JSON `{version, laws:{<önek>:{files:[{key, img:{url,sha256,bytes}, ses:{url,sha256,bytes}}]}}}`; `assets/kartlar`+`sesler` → (WebP'e çevirip) bucket'a yükle; anahtar = mevcut `gorsel_yolu` namespace.
5. **(1g) Kaynak çözümleyici (B2/B3):** `gorselKaynak(key)`/`sesKaynak(key)` — yerel `file://` → uzak URL → null sırası; study-card/patika/akis/ses-oynatici/hooks tek helper'a bağlanır. Görsel kolu burada biter (lazy+cache çalışır).
6. **(2-3g) İndirme yöneticisi (B3/B10):** `expo-file-system createDownloadResumable` ile per-dosya indir (ilerleme/duraklat/devam), `expo-crypto` sha256 doğrula, `documentDirectory/jsps/{law}/{key}.(webp|mp3)`. UI: kanun satırında "İndir/İndiriliyor %/İndirildi/Sil", toplam MB + temizleme. AsyncStorage'da indirilen-kanun durumu.
7. **(1g) Bundle'dan binary çıkar (B1 sonucu):** `assets/kartlar`/`sesler` artık require edilmiyor → app boyutu ~MB'lere iner; birkaç placeholder kalsın. İlk açılış hızı teyidi.
8. **(2g, FAZ 4/5 ile) Premium imzalı URL (B7):** Supabase Edge Function `createSignedUrl`/R2 presigned, JWT+premium(RLS)+Play Integrity gate; ücretsiz örnek public, premium private TTL~10dk.
9. **(0.5g) Sürümleme/güncelleme:** manifest `version` + per-dosya sha256 → değişen dosya re-indir (tüm kanun değil). DB migration deseniyle (vXX) uyumlu.
10. **(0.5g) Compliance:** gizlilik metni + Play Data Safety "veri indiriliyor/ağ" güncelle (FAZ 3 ile birlikte).
11. **(opsiyonel, v2) At-rest şifreleme (B8):** yalnız gerekçe netse, ses-only decrypt-to-temp; ayrı keşif.

> Tahmini toplam (çekirdek, P0-P1, gating hariç): ~8-9 gün. Gating/premium (adım 8) FAZ 4/5'e bağlı.

---
## KARSI-GORUS & DOGRULAMA (kirmizi takim)

> Yöntem: rapordaki her ana iddia kod/disk üzerinden bağımsızca doğrulandı (`du`, `find`, registry/seed okuması). Aşağıda yanlış/eksik bulduklarım + her ana iddiaya güven notu. Rapor genel olarak SAĞLAM; iki **somut sayısal hata** ve bir **manifest tasarım açığı** var.

### KT1 — FATURE HATASI: "565 png" YANLIŞ → asset zaten KISMEN WebP (371 PNG + 194 WebP) [düzeltilmeli]
- **Ne:** Özet satır 7 "565 png + 566 mp3" diyor. Gerçek: `find assets/kartlar -type f` = **565 dosya ama 371 PNG + 194 WebP** (ext bazında sayıldı). Registry'de 565 `require(...)` anahtarı var (doğru), ama disk dosyalarının **%34'ü ZATEN WebP'e çevrilmiş**.
- **Kanıt:** `find assets/kartlar -name '*.png' | wc -l` = 371; `-name '*.webp'` = 194. Boyut: PNG **835 MB / 371 dosya** (ort. 2.25 MB), WebP **46 MB / 194 dosya** (ort. 0.24 MB). Toplam 883 MB (du doğru) ama "565 png" terkibi YANLIŞ.
- **Etki:** Rapor "Görseller PNG" (B9 satır 71) varsayımıyla ilerliyor; gerçekte iş yarı yapılmış. Bu, B9'un öncülünü, B10 paket-boyut matematiğini ve özellikle **manifest tasarımını** (adım 4 "manifest uzantısı `.webp`") etkiler.
- **Öneri:** Özet/B9/B10'da rakamı düzelt: "Görsellerin %66'sı PNG (835 MB), %34'ü zaten WebP (46 MB)."
- **Güven: Yüksek** (disk sayımı).

### KT2 — B9 ÖNCÜLÜ KISMEN YANLIŞ ama SONUÇ daha güçlü: kalan kazanım ~135 MB hedefi (raporun ~250 MB'ından düşük) [B9 düzelt]
- **Ne:** B9 "883→~250 MB" diyor. Var olan WebP'ler ort. **0.24 MB/dosya**. 371 PNG aynı orana çevrilse ≈ 371×0.24 ≈ **89 MB** + mevcut 46 MB = **~135 MB toplam** (250 değil). Yani gerçek WebP kazanımı raporun tahmininden DAHA İYİ; ama "tüm görseller PNG, en büyük tek kazanım" çerçevesi yanlış — işin 1/3'ü zaten bitmiş, kalan iş 371 dosya.
- **Etki:** B9'un "en yüksek ROI / en büyük tek kazanım" rozeti abartılı; kalan efor daha küçük, ROI hâlâ iyi ama "yeni keşif" değil — mevcut `gorsel:uret` boru hattının WebP kolunu zaten birileri işletmiş (neden yarım kaldığı araştırılmalı: kalite mi, pipeline mı?).
- **Öneri:** B9'u "kalan 371 PNG'yi de WebP'e tamamla (~835→~89 MB); pipeline neden 194'te durdu?" diye yeniden çerçevele.
- **Güven: Yüksek** (boyut/sayım); **DOGRULANMADI:** birebir kalite eşdeğerliği (rapor da bunu işaretlemiş — katılıyorum).

### KT3 — TASARIM AÇIĞI: manifest "uzantısı `.webp`" varsayımı kırılır — ext PER-KEY tutulmalı [B1/adım4/adım5 düzelt]
- **Ne:** Adım 4 "manifest uzantısı `.webp`" ve adım 6 `{key}.(webp|mp3)` diyor. Ama disk ZATEN karışık: aynı namespace'te bazı anahtar `.png`, bazı `.webp` (KT1). Codegen sadece `KART_ANAHTARLARI: string[]` üretirse (B1 önerisi) **uzantı bilgisi kaybolur** → çözümleyici yanlış URL kurar (`.webp` ister, dosya `.png`).
- **Kanıt:** registry satırları gerçek uzantıyı taşıyor: örn `ailekoruma_m10_11 → ...ailekoruma_m10_11.png` ama 194 dosya `.webp`. Anahtar string'i uzantı içermiyor (`tck_m1`), uzantı yalnız `require(...)` yolunda.
- **Öneri:** B1'i genişlet: codegen `KART_ANAHTARLARI: string[]` DEĞİL, **`KART_MANIFEST: Record<string,{img?:string; ses?:boolean}>`** (veya en az `ext` haritası) üretsin; ya da sunucuya yüklerken HEPSİ tek formata (WebP) normalize edilip manifest tek-uzantı garantisi versin (KT2 ile birleşir — önce hepsini WebP'e çevir, sonra `.webp` varsayımı geçerli olur). İkincisi daha temiz; ama "önce normalize" adım sırası adım 3'ten ÖNCE gelmeli, yoksa codegen yanlış uzantı gömer.
- **Güven: Yüksek** (kod + disk).

### KT4 — B8 EKSİK: `expo-screen-capture` zaten ekran-görüntüsü engelliyor — mevcut anti-piracy primitifi kredilendirilmemiş [B8'e ekle]
- **Ne:** Güvenlik bölümü (B8) sadece at-rest şifreleme + filigran sayıyor. Ama `src/app/akis.tsx:68` `ScreenCapture.preventScreenCaptureAsync()` kart akışı boyunca **ekran görüntüsü/kaydı engelliyor** (`:70` çıkışta geri alıyor). `expo-screen-capture ~8.0.9` zaten kurulu. Bu, "indirilen içerik başkasınca alınmasın" tehdit modelinin parçası ve at-rest şifrelemeden ÇOK daha ucuz.
- **Etki:** Tehdit modeli tablosu eksik; B8'in "koruma = filigran + imzalı URL" listesine **screen-capture engeli** de eklenmeli (zaten var, bedava). Ayrıca `docs/DEGERLENDIRME/10_ANTI_PIRACY_APK_KLON.md` ile çapraz referans verilmeli (konu örtüşüyor).
- **Güven: Yüksek** (kod).

### KT5 — B10 paket-boyut matematiği karışık-ortalamaya dayanıyor [küçük]
- **Ne:** B10 "ort. ~1.56 MB/görsel" kullanıyor (= 883MB/565, KARIŞIK ortalama). Ama PNG-only ort. 2.25 MB, WebP 0.24 MB. `disiplin` 126 anahtarın kaçı zaten WebP belirsiz → ham 335 MB tahmini muhtemelen yüksek (içinde küçük WebP'ler varsa). WebP-sonrası hedef (~140 MB) yine de doğru büyüklük sırası.
- **Öneri:** B10'u "WebP normalizasyonu SONRASI per-law boyut" üzerinden ver (önce hepsi WebP → tek ortalama). Devam/checksum önerisi (createDownloadResumable) geçerli ve iyi — orada itiraz yok.
- **Güven: Orta** (per-law ext kırılımı tek tek sayılmadı).

### Ana iddialara güven notu (özet)
- **B1** (seed `Object.keys(KART_GORSELLERI)` ile TÜM şemayı türetiyor): **DOĞRULANDI — Yüksek.** `seed.ts:176` döngüsü kart/madde_no/link/id'yi anahtardan üretiyor; binary uzaklaşınca anahtar listesi gömülü kalmazsa temiz kurulum boş. Rapordaki en kritik ve en doğru bulgu. (KT3 ile genişletilmeli: anahtar + uzantı.)
- **B2** (expo-image `memory-disk` cache zaten var): **DOĞRULANDI — Yüksek.** `study-card.tsx:52` `cachePolicy="memory-disk"`. (Dosya gerçek yolu `src/components/card-flow/study-card.tsx` — rapor `study-card.tsx:47` diyor; satır/altklasör küçük sapma.)
- **B3** (expo-audio disk'e cache'lemez → file-system şart): **Yüksek** (kod: `src/` altında HİÇ `FileSystem`/`downloadAsync` yok, doğrulandı). expo-audio'nun kendi cache davranışı kütüphane-içi → kaynak göstermeden **Orta**; ama yön doğru.
- **B4** (file-system/crypto/secure-store kurulu değil; expo-asset 12.0.13 pin): **DOĞRULANDI — Yüksek.** `package.json` teyit; `overrides.expo-asset: 12.0.13` var.
- **B5** (Supabase egress pahalı, R2 hibrit): yön mantıklı, fiyatlar **Düşük** (rapor da DOGRULANMADI demiş — katılıyorum; sözleşme öncesi teyit).
- **B6** (app %100 offline, uzak içerik ilk görüntülemede net ister): **DOĞRULANDI — Yüksek.** `config.ts:58` `UYELIK_AKTIF=false`, satır 51 "%100 offline".
- **B7** (imzalı kısa-ömürlü URL gating): mimari olarak doğru, FAZ 4/5 bağı — **Orta** (henüz kod yok, ileri faz).
- **B8** (at-rest şifreleme P2): muhakeme sağlam; **ama KT4 eksiği var** → güncellenirse **Yüksek**.
- **B9** (WebP): **Orta** — öncül kısmen yanlış (KT1/KT2), sonuç yönü doğru.
- **B10** (per-law dengesiz, devam/checksum): **Orta** (KT5 matematik notu).

### Önceliklendirme eleştirisi
- **B9'u "en yüksek ROI hızlı kazanım" tepeye koymak yanıltıcı:** iş %34 zaten yapılmış; "yeni büyük kazanım" değil, "yarım kalanı tamamla". Daha doğru P0 sıralaması: **WebP normalizasyonunu codegen'den (B1/adım3) ÖNCE bitir** (KT3), çünkü karışık uzantı manifest+çözümleyiciyi kırar. Yani adım sırası: (a) tüm görselleri WebP'e normalize et → (b) sonra codegen anahtar/manifest üret → (c) çözümleyici. Rapor adım 3'ü (codegen) adım 4'ten (yükleme/WebP) önce koymuş; **KT3 nedeniyle ters çevrilmeli ya da codegen ext-aware olmalı.**
- Geri kalan öncelik (B1/B2/B3 P0, B5/B9 P1, B8 P2) **mantıklı**; itirazım yalnız B9'un rozeti ve adım 3↔4 sırası.

### Eklenecek atlanmış nokta
- **Pipeline neden 194'te durdu?** 194 WebP + 371 PNG = yarım kalmış bir dönüşüm. `scripts/gorsel-registry-uret.mjs` ve varsa WebP scripti incelenip (kalite reddi? OOM? elle mi?) **sebep bulunmadan** B9'a "0.5g" efor biçmek riskli — yarım kalmasının teknik bir nedeni olabilir.

