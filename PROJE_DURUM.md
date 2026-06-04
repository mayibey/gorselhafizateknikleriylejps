# PROJE DURUM — Görsel Hafıza Teknikleriyle JSPS

> Bu dosya projenin "seyir defteri"dir. Yeni bir Claude sohbeti açtığında bunu yapıştır → kaldığın yerden devam.
> **KURAL: Her iş/düzeltme sonrası bu dosya güncellenir (farz).** Ne yapıldı, hangi commit, yeni karar/sorun eklenir.
> Son güncelleme: 3 Haziran 2026

---

## 1. Nerede kaldık (özet)
Çalışan bir iskelet var: 4 sekmeli navigasyon, gerçek SRS döngüsü, gerçek TCK görselleri, kanun seçip çalışma, branş sistemi + onboarding + DB migration. **Mevzuat artık 66 gerçek kanun başlığıyla dolu (25 müşterek + 41 jandarma, `51ab4bb`); kartlar TCK hariç boş ("yakında").** Android EAS build config de hazır (`e256f95`, profiller: preview/development/production). Sırada: içerik maratonu (49 TCK görselini gerçek kartlara bağlamak).

Geliştirme web'de yürüyor (`npx expo start --web` → localhost). **iPhone Expo Go artık çalışıyor** — bunun için proje SDK 54'e indirildi (`88983ca`; Apple App Store'daki Expo Go en fazla SDK 54 destekliyor). VirtualView/onModeChange hatası gitti.

---

## 2. Tamamlanan fazlar (commit geçmişi, master)
- `284c73d` Initial commit (create-expo-app)
- `14bc0e3` İlk iskelet: tema, 4 sekme, Kart Akışı, SQLite + Leitner SRS
- `17317ad` Fix: web SQLite wasm çözümleme — veri katmanı .web/.native ayrımı
- `9affa4c` Günlük çalışma döngüsü: due-kart kuyruğu (getDailyQueue), UPSERT SRS, Karargah canlı sayılar, Bugünlük bitti
- `ebe279b` Kart Akışı: getDailyQueue akışı + ortalı telefon kolonu (maxWidth 460), ScrollView + pinli buton bandı
- `32af324` Görsel sistemi: 49 TCK görseli temiz şemaya, codegen registry, StudyCard tek-görsel + fallback, m1 seed
- `aecb4f0` Mevzuat ekranı: kanun listesi (Müşterek/Branş + kart sayısı), kanun modu (getCardsByLaw), akış başlığında madde no + ad
- `d95b129` Branş sistemi: branches/law_branches (M2M), AsyncStorage branş kaydı, `PRAGMA user_version` migration runner (SRS korunur, referans veri idempotent), onboarding + branş değiştirme, `getLaws(bransSlug)` + `getBranches()`, Mevzuat branş filtresi; hafıza dosyaları (CLAUDE.md, PROJE_DURUM.md)
- `e256f95` Android EAS build config: eas.json (3 profil), android.package com.mayibey.jsps, expo-dev-client, name/slug düzeltme, EAS projectId
- `87b4d91` docs: JSPS mevzuat listesi PDF (seed kaynağı)
- `51ab4bb` Mevzuat seed: gerçek JSPS listesi (25 müşterek + 41 jandarma = 66 kanun), TCK id1 pinli, law_branches jandarma eşlemesi, MEBS/Mali placeholder kaldırıldı, v2 migration (referans veri re-seed, srs korunur)
- `88983ca` **SDK 56 → SDK 54 tam downgrade**: iPhone Expo Go uyumu (Apple App Store'daki Expo Go en fazla SDK 54). RN 0.81.5, expo 54.0.35, router 6, worklets 0.5.1, reanimated 4.1, typescript 5.9.2. node_modules+lock sıfırdan kuruldu (tek RN 0.81.5, ERESOLVE'suz). 4 şablon dosyada tip uyumu düzeltmesi (external-link Href, collapsible SymbolView, use-theme ColorSchemeName, animated-icon absoluteFillObject) — çekirdek mantık (database/srs/queue/kanun-kartlari/ekranlar) dokunulmadı. Web + iPhone test edildi: VirtualView hatası gitti.
- `f1962a6` docs: SDK sabiti 56 → 54 (CLAUDE.md sürüm pinleri + PROJE_DURUM downgrade notu)
- `947fd1c` **İstatistik Faz A**: `lib/stats.ts` (yeni saf dosya — `hesaplaIstatistik`: çalışılan/öğrenilen/hazırlık%/kutu dağılımı; öğrenildi = kutu≥4), `getCardCount` (4-dosya senkron). Karargah hazırlık % gerçeğe bağlandı, nöbet serisi geçici `—` (streak Faz B'de). Sicil: İLERLEME + KUTU DAĞILIMI kartları (placeholder kalktı). Web/native parite: stats yalnız kutu≥1 (çalışılmış) kart üzerinden. external-link typedRoutes regresyonu (`Extract<…,string>`) düzeltildi. Şema değişmedi (SCHEMA_VERSION=2).
- `2f5b84f` docs: istatistik Faz A tamamlandı notu
- `6ca939a` **İstatistik Faz B (streak)**: `study_days (gun TEXT PK)` tablosu + **migration v3** (tamamen eklemeli — yalnız `CREATE TABLE IF NOT EXISTS`, srs/laws/cards/branches dokunulmaz; v2 telefonlar otomatik v3 alır, ilerleme korunur). `markStudyDay`/`getStudyDays` (4-dosya senkron); `recordReview` her cevapta `bugunISO()` gününü işaretler. `lib/stats.ts`'e saf `hesaplaStreak` + `oncekiGun` (UTC; çapa bugün-veya-dün → geriye kesintisiz say → yoksa 0). Karargah nöbet serisi gerçek (0/yükleniyor → `—`). Web bellek-içi → yenilemede streak sıfırlanır (srs davranışıyla tutarlı). **SCHEMA_VERSION 2→3.**
- `36a90d7` **UX cila turu**: ortak durum bileşenleri `components/ui/` → `<Loading>`, `<EmptyState>`, `<ErrorBoundary>`. Global error boundary (`_layout` Stack'i sarar) + her ekranda `.catch()` ekran-içi "Tekrar dene". Mevzuat yüklemede artık `<Loading>` (eski yanıltıcı "Kanun yok" gitti); gerçekten boşsa "Bu branşta kanun yok". akis: "yakında" kanun → temiz "Yakında" EmptyState (çökme yok, "bitti" demiyor), boş-başlangıç ↔ bitiş ("Bu turu tamamladın") ayrı mesaj, yükleme retry, `cevapla` try/catch (buton kilitlenmez). AudioBar gizlendi (Faz 4'e saklı). `Screen`'e tab-bar `paddingBottom` (son satır görünür). Çekirdek mantık + şema (SCHEMA_VERSION=3) dokunulmadı.
- `1937020` docs: UX cila turu tamamlandı notu
- `c36eb36` **Tatbikat quiz iskeleti**: `lib/quiz.ts` (yeni saf dosya — `quizUret`: tip A "madde→başlık" + tip B "başlık→madde" karışık, çeldirici havuzdaki başka kartlardan, `rastgele` enjekte; `puanla`; `MIN_HAVUZ=4`). Yeni `/quiz?lawId=` rotası (akis ile simetri): state makinesi, şık seçince anlık doğru/yanlış geri bildirim (yeşil/kırmızı), bitince skor `<EmptyState>` (Tekrar/Bitir). Tatbikat sekmesi placeholder → başlatıcı (kanun listesi, kart sayısı ≥4 olanlar tıklanabilir, altı "yetersiz" kilitli). `EmptyState`'e opsiyonel `ikincilButon`. **Kanun-bazlı v1** (mevcut `getCardsByLaw`, yeni DB fn yok). **SRS'e DOKUNULMAZ** (salt ölçüm — recordReview/saveSrs yok). Şema sabit (SCHEMA_VERSION=3). TCK 4 gerçek kartla canlı demo (sahte soru yok).
- `d40fa5d` docs: Tatbikat quiz iskeleti tamamlandı notu
- `7df2b3c` **Akıllı öğrenme Katman 1 (veri toplama)**: `kart_performans (id PK AUTOINCREMENT, card_id, kaynak, sonuc, tarih)` tablosu + **migration v4** (tamamen eklemeli — yalnız `CREATE TABLE IF NOT EXISTS`; srs/study_days/laws/cards/branches dokunulmaz; v3 telefonlar otomatik v4 alır, ilerleme korunur). `kaydetPerformans`/`getPerformans` (4-dosya senkron). **LOG modeli** (her cevap 1 satır, sonuc ham): çalışma cevapları `recordReview` public wrapper'ından (`'calisma'` + biliyorum/tekrar/zor), quiz cevapları `quiz.tsx > sec()`'ten (`'quiz'` + dogru/yanlis, ateşle-unut). **SRS'e DOKUNULMADI** (ayrı katman); `quiz.ts` saf kaldı; `akis.tsx` değişmedi (recordReview üzerinden otomatik). **SCHEMA_VERSION 3→4.** Kullanıcıya görünen UI yok (sadece veri akışı).
- `f60138c` docs: akıllı öğrenme Katman 1 tamamlandı notu
- `0e2ebb0` **Forensic filigran (Faz 1)**: StudyCard'a (akış kartı) kullanıcıya özel çapraz (-30°) tiled watermark — `JSPS • {cihaz-id} • {tarih}`. Kimlik = AsyncStorage `jsps.cihaz` (bir kez üretilen kısa hex, modül-cache; **yeni paket YOK**); `useCihazKimlik` hook. Yeni saf `Watermark` bileşeni (`absoluteFill` + `pointerEvents="none"`, flex merkezleme, opaklık 0.15, ince açık kontur → koyu görselde de okunur); iki kart modunu da kapsar, `overflow:'hidden'` köşeleri kırpar. Tema sabitleri `FiligranOpaklik`/`FiligranAci`. **Çekirdek/şema/SRS dokunulmadı**, DB/4-dosya etkisi yok.
- `b637b85` docs: forensic filigran Faz 1 tamamlandı notu
- `c6b15f8` **Ses altyapısı (Faz 2)**: `expo-audio ~1.1.1` (expo install; app.json'a `expo-audio` config plugin, izin yok; expo-av deprecated → kullanılmadı). Ses registry+codegen (`scripts/ses-registry-uret.mjs` → `src/assets/kart-sesleri.ts`, görsel sistemi analoğu; **0 dosyada boş başlar**, `npm run ses:uret`). `useKartSesi` hook (expo-audio `useAudioPlayer`/`useAudioPlayerStatus` sarmalayıcı): `{ varMi, oynuyor, yukleniyor, calistirDurdur }`, **auto-play YOK**. `AudioBar` placeholder → gerçek hook (sessiz kart → soluk "Sesli anlatım yakında"). `akis.tsx`'te kartın altında `<AudioBar key={kart.id}>` (kart değişince remount → önceki ses durur). **Tek-kart oynat/duraklat**; "Sesli Nöbet" (kuyruk + kilit ekranı) sonraki faz. `ses_yolu` zaten şemada → **şema/4-dosya/çekirdek/study-card dokunulmadı.**
- `c51f678` docs: ses altyapısı Faz 2 tamamlandı notu
- `7161f1e` **Sesli Nöbet v1 (foreground kuyruk)**: `lib/sesli-nobet.ts` (saf — `sesliKartlar` ses filtresi, `sonrakiIndex`/`oncekiIndex`, son kartta dur). `useSesliNobet` hook (tek `useAudioPlayer`; `status.didJustFinish` → otomatik sonraki kart; **auto-start YOK**, oturum aktifken kart değişince devam). Yeni `/sesli-nobet?lawId` rotası: aktif kart (StudyCard, filigran dahil) + önceki/oynat-duraklat/sonraki + "n / m" ilerleme; ses yoksa empty-state; Loading + hata-retry. Mevzuat'ta kanun satırında **kulaklık girişi** (akış navigasyonu bozulmadan ayrı `Pressable`). **`useKartSesi` (tek-kart) DOKUNULMADI** (ayrı hook). **Arka plan/kilit ekranı = v2 (dev build) — app.json'a UIBackgroundModes EKLENMEDİ, yeni paket yok.** Çekirdek/şema/study-card dokunulmadı.
- `d992685` docs: Sesli Nöbet v1 tamamlandı notu
- `d1570ae` **Akıllı sistem KATMAN 2 (analiz + gösterim)**: `lib/performans.ts` (saf — `kotuMu`, `zayifKartlar` [SON-deneme recency: son deneme zor/yanlış ise zayıf, iyi ise toparlandı], `kanunPerformans`, `eksikOzet`). Yeni `getAllCards(): CardWithLaw[]` (4-dosya senkron; **srs JOIN'siz → quiz-only kartların metadata'sını da kapsar**; şema değişmez). Sicil'de KUTU DAĞILIMI altına **"ZAYIF MEVZİLER"**: top-5 zayıf kart (`madde_no — baslik` + "N yanlış") + "En zayıf: {kanun}" + veri yok/temiz durumları; **ayrı state+catch** (İLERLEME'yi bozmaz). **Çekirdek/şema/Katman 1 yazma/study-card dokunulmadı.**
- `8da137b` docs: akıllı sistem Katman 2 tamamlandı notu
- `e4132d0` **4733 m.8 İÇERİĞİ (İÇERİK MARATONU BAŞLADI)**: `assets/kartlar/4733/` 10 panel PNG + `assets/sesler/4733/` ilk ses (m8-6, mp3). `SEED_CARDS`'a 10 kart (id **100-109**, law_id **49**, madde_no '4733 m.8', özet en son); id 105 sesli (`ses_yolu '4733_m8_6'`). 2 codegen (`gorsel:uret`/`ses:uret`) registry'leri üretti. **Migration v5** (eklemeli `seedReference()` re-seed; **DELETE/DROP yok, srs korunur**; v4 telefonlar otomatik alır). **SCHEMA_VERSION 4→5.** **Panel başlıkları GEÇİCİ** ("1. BÖLÜM" vb.) — gerçek başlıklar sonra. İkinci kanun → quiz/istatistik/zayıf mevzi/Sesli Nöbet sistemleri otomatik kapsadı (TCK-özel kod yok). 4733 jandarma branşında görünür.
- `5bd24bc` **Ses sızıntısı fix**: `use-kart-sesi.ts` + `use-sesli-nobet.ts` unmount cleanup (`player.pause()` try/catch, `[player]` dep) — ekran kapanınca/kart değişince ses durur (web HTML5 Audio sızıntısı düzeldi; native ekstra garanti).
- `d754f0e` **Görsel zoom**: kart görseline dokun → tam ekran yakınlaştırma (`@likashefqet/react-native-image-zoom` ^4.3.0, pure-JS; pinch/pan/double-tap). `_layout`'a **`GestureHandlerRootView`**; yeni `gorsel-zoom.tsx` (`absoluteFill` overlay, **Modal değil** → ekran unmount olmaz → **ses kesilmez**); `study-card` görselli modda `<Image>` → `Pressable` (tap→zoom) + overlay. Watermark/placeholder modu korundu. Çekirdek/şema/seed dokunulmadı.
- `62eea37` **Patika Faz 1 (bölüm omurgası)**: `bolumler` + `bolum_kartlari` AYRI tablolar (cards DOKUNULMADI), **migration v6** (eklemeli CREATE+INSERT OR IGNORE, srs korunur), `getBolumler`/`getCardsByBolum` (4-dosya), `lib/patika.ts` (saf `bolumIlerleme`). Mevzuat→**/patika**→bölüm→/akis?bolumId. 4733 demo 2 bölüm, bölümsüz kanun (TCK)→tek "Tüm Kartlar" düğümü→/akis?lawId. quiz/istatistik/zayıf mevzi/Sesli Nöbet (law-bazlı) ETKİLENMEDİ. **SCHEMA_VERSION 5→6.**
- `ba146e1` **Patika Faz 2 (Duolingo zikzak görünüm)**: yalnız `patika.tsx` — düğümler sola-sağa zikzak (`alignSelf` parite), soluk merkez omurga, büyük yuvarlak düğümler (numara + sıraya-döngüsel MaterialCommunityIcons), durum renkleri (yeşil tamam / lacivert başlanmış / soluk başlanmamış), ilk tamamlanmamışa **altın aktif vurgu**, N/M ilerleme (dış border halka; SVG yok). Navigasyon aynen, yeni paket yok.
- `05c8832` **Patika geri butonu**: `Screen`'e opsiyonel `onGeri` prop'u (başlık şeridinde geri oku → `router.back`); patika Mevzuat'a döner. Sekme ekranları + akis/quiz/sesli-nobet etkilenmedi.
- `48fef78` **Geri bildirim sistemi (Formspree, backend'siz)**: akis'te kart altında "Hata/öneri bildir" → yeni `/geri-bildirim` formu (Hata/Öneri/Diğer toggle + çok satırlı mesaj). `src/constants/config.ts > FORMSPREE_ENDPOINT` (placeholder; **boşsa DEMO-success**, doluysa gerçek `fetch` POST). `lib/geri-bildirim.ts` (izole — fetch+endpoint, DB yok). Kart bilgisi (`card_id/madde_no/baslik/kanun`) route param + cihaz kimliği OTOMATİK gömülür. Anlık "Teşekkürler 🙏" + auto-geri; çift-gönderim kilidi; hata→tekrar. **Yeni paket YOK** (fetch built-in), **şema/çekirdek dokunulmadı**.

## 3. Devam eden iş
- **İstatistikler BİTTİ (Faz A `947fd1c` + Faz B `6ca939a`).** Karargah (hazırlık % + nöbet serisi) ve Sicil (ilerleme + kutu dağılımı) metriklerinin tümü gerçek SRS verisine bağlı. DB şema sürümü **3** (study_days dahil).
- **UX cila turu BİTTİ (`36a90d7`).** Ortak durum bileşenleri (`<Loading>`/`<EmptyState>`/`<ErrorBoundary>`) eklendi; tüm ekranlar tutarlı yükleme/boş/hata/bitiş durumu gösteriyor; "yakında" kanun çökmüyor; global + ekran-bazlı hata yakalama (retry) var; AudioBar gizli (Faz 4).
- **Tatbikat quiz İSKELETİ BİTTİ (`c36eb36`).** Kanun-bazlı çoktan seçmeli quiz: A+B karışık soru tipi, otomatik çeldirici, skor. SRS'ten bağımsız (salt ölçüm). İçerik gelince anlamlanır (şu an yalnız TCK ≥4 kartla oynanabilir). **Kapsam dışı (sonraki):** skor/yanlış geçmişi kaydı (kalıcılık), "karışık/tüm kanunlar" quiz (`getAllCards` + 4-dosya), görsel/anlatım-tabanlı soru tipleri.
- **Akıllı öğrenme KATMAN 1 (veri toplama) BİTTİ (`7df2b3c`).** `kart_performans` tablosu + migration v4; çalışma + quiz cevapları LOG'lanıyor. SRS'ten bağımsız. DB şema **4**.
- **Akıllı öğrenme KATMAN 2 (analiz + gösterim) BİTTİ (`d1570ae`).** `lib/performans.ts` (zayıf kart = son-deneme recency) + `getAllCards` + Sicil "ZAYIF MEVZİLER" (top-5 + en zayıf kanun). **Sırada KATMAN 3: "eksikleri çalış" aksiyonu** — zayıf kartlardan (`zayifKartlar`) bir çalışma kuyruğu üretip `/akis`'e besleme (yeni akış girişi/parametresi; örn. Sicil/Karargah'ta "Zayıfları çalış" butonu → `/akis?mod=zayif`). SRS'e bu noktada dokunulup dokunulmayacağı karar verilecek (öneri: normal akış gibi recordReview ile).
- **Forensic filigran FAZ 1 BİTTİ (`0e2ebb0`).** Akış kartlarına kullanıcıya özel çapraz tiled watermark (caydırıcı + sızıntı atıfı). Kimlik şimdilik AsyncStorage cihaz-ID'si (kurulum başına; reinstall'da değişir). **Üyelik gelince** ID kaynağı gerçek user ID'ye bağlanacak (Watermark bileşeni aynı kalır). Opaklık (0.15) ileride telefonda göz kararı ince ayar yapılabilir.
- **Ses altyapısı FAZ 2 BİTTİ (`c6b15f8`).** expo-audio ile tek-kart "Dinle" (oynat/duraklat, auto-play yok); ses registry+codegen boş hazır; sessiz kartlar "Sesli anlatım yakında". AudioBar akışta görünür.
- **Sesli Nöbet v1 (foreground) BİTTİ (`7161f1e`).** Kanun-bazlı kuyruk: `/sesli-nobet` oynatıcı, didJustFinish auto-advance, önceki/oynat-duraklat/sonraki, n/m ilerleme; Mevzuat'ta kulaklık girişi; ses yoksa empty-state. **Expo Go'da test edilir.** **Kalan v2 (DEV BUILD ŞART):** arka plan oynatma (`setAudioModeAsync shouldPlayInBackground`) + kilit ekranı (`setActiveForLockScreen`+metadata) + config plugin `enableBackgroundPlayback` + app.json `UIBackgroundModes` + global player context. **Gerçek oynatma/auto-advance ≥2 ses dosyası gelince görülür** (şu an 0 dosya → her kanun empty-state).
- **İÇERİK MARATONU BAŞLADI (`e4132d0`).** İlk ikinci-kanun içeriği: **4733 m.8** (10 panel görseli = 10 kart + ilk ses dosyası). DB şema **5** (migration v5 re-seed). **Panel başlıkları GEÇİCİ** ("1. BÖLÜM" vb.) — kullanıcı gerçek başlıkları verecek (madde_no zaten '4733 m.8'). **Akış:** kullanıcı görselleri `assets/kartlar/{kanun}/{kanun}_m{no}.png` + sesi `assets/sesler/{kanun}/` ASCII isimle koyar → `npm run gorsel:uret`+`ses:uret` → `SEED_CARDS`'a kartlar → migration vN+1 re-seed. **Sırada:** 4733 gerçek başlıkları + diğer maddeler, sonra diğer kanunlar (TCK görselleri dahil — şu an TCK kartları görselsiz placeholder). İçerik arttıkça istatistik/quiz/performans/Sesli Nöbet hep gerçek dolar.
- **Ses sızıntısı düzeldi (`5bd24bc`)** + **Görsel zoom eklendi (`d754f0e`)** — kart görseline dokun → tam ekran pinch/pan/zoom (ses kesilmeden). Bilgi yoğun panelleri telefonda okumayı sağlar.
- **PATİKA Faz 1+2 BİTTİ (`62eea37` + `ba146e1`).** Bölüm sistemi (`bolumler`/`bolum_kartlari`, migration v6) + Duolingo zikzak görünüm. Mevzuat→kanun→/patika→bölüm→/akis?bolumId. 4733 demo 2 bölüm; bölümsüz kanun tek "Tüm Kartlar" düğümü. DB şema **6**. **Sırada Patika Faz 3:** sıralı kilit (önceki bölüm tamamlanınca açılır — `lib/patika.ts`'e kilit hesabı, SRS okuma) + opsiyonel SVG dairesel ilerleme halkası (yeni dep `react-native-svg` — karar gerek). **2803 gelince** gerçek bölümler seed'lenir (demo 4733 yerine her kanun kendi bölümleriyle).
- **GERİ BİLDİRİM sistemi eklendi (`48fef78`).** Kart altında "Hata/öneri bildir" → form → Formspree (backend yok). Şu an **DEMO modu** (config'de endpoint boş → gerçek mail gitmez, "Teşekkürler" gösterir). **YAPILACAK:** kullanıcı Formspree'de form oluşturup URL'ini `src/constants/config.ts > FORMSPREE_ENDPOINT`'e yazınca gerçek mail düşmeye başlar (kod değişmez). **Gerçek cevap/2-yönlü bildirim üyelikle gelecek** (şimdilik tek yön: kullanıcı → mail).
- İsteğe bağlı sonraki istatistik işi (gerekirse): "bugün çalışılan kart" için `study_days`'e `(gun, adet)` kolonu (sonraki migration v7); streak için ŞART değil.
- **Sıradaki BÜYÜK altyapı kararı:** (a) **Üyelik + ödeme** (gerçek user ID — filigranı/ilerlemeyi kişiye bağlar, paywall), (b) **Akıllı sistem KATMAN 3** ("eksikleri çalış" aksiyonu — zayıf kartları akışa besle), (c) **Sesli Nöbet v2** (arka plan/kilit ekranı — dev build), (d) **Patika Faz 3** (sıralı kilit + opsiyonel SVG halka). Paralel hat: içerik maratonu (her şeyi anlamlı kılar). Not: v2 ses + gerçek ses testi + arka plan = **development build** gerektiriyor (Expo Go ötesi).

## 4. Backlog (planlı işler, sıra kabaca)
- Tatbikat ekranı (quiz/sınav sistemi) — iskelet ✅ (`c36eb36`): kanun-bazlı A+B çoktan seçmeli, otomatik çeldirici, skor. Kalan: skor/yanlış kaydı, karışık quiz (getAllCards), SRS entegrasyonu, çıkmış sorular kategorisi.
- Sicil ekranı istatistikleri: hazırlık % + çalışılan/öğrenilen + kutu dağılımı ✅ (`947fd1c`, Faz A). Kalan: çalışılan saat (zaman ölçümü yok — büyük iş, opsiyonel).
- Ses entegrasyonu: tek-kart "Dinle" iskeleti ✅ (`c6b15f8`, Faz 2 — expo-audio, auto-play yok). Kalan: ses dosyaları (içerik) + "Sesli Nöbet" (arka arkaya kuyruk, kilit ekranı, arka plan modu).
- Karargah metrikleri: Hazırlık % ✅ (`947fd1c`) + Nöbet serisi/streak ✅ (`6ca939a`) gerçeğe bağlandı. (Mini Tatbikat + Günün Maddesi bilerek statik — kapsam dışı.)
- Dikey ekran kilidi (yatay mod kapat)
- **İçerik maratonu**: 49 TCK görselini gerçek kartlara bağla (her birine madde no + başlık + anlatım metni). Sonra 65 gerçek kanun. Önce Müşterek + Jandarma.
- Development build (Faz 6): Expo Go/ngrok derdini kökten çözer, telefonda kendi uygulaman gibi açılır
- Görseller 1100'e çıkınca: Git LFS veya CDN/release asset (repo şişmesini önle) — radarda

## 5. Bilinen sorunlar / notlar
- **Web bellek-içi**: her yenilemede SRS sıfırlanır, tüm kartlar tekrar "yeni" olur. Normal, web önizleme kısıtı. Telefonda native SQLite kalıcı.
- **Telefonda eski veri**: native SQLite ilk açılışta tohumlanıyordu, yeni seed görünmüyordu → DB migration turu bunu çözüyor.
- **ngrok tünel Windows'ta çalışmıyor** (global PATH bug). `--tunnel` "Install and try again" döngüsüne giriyor. Telefon testi için kalıcı çözüm: development build. Şimdilik web yeter.
- Görseller 112 MB (49 TCK) repoda; LFS/CDN ileride.

## 6. Mimari kararlar (neden)
- **Veri katmanı .web/.native ayrımı**: Metro derleme-zamanı import'a göre paketler; tek dosyada expo-sqlite import'u web'e de sızıp wasm hatası verir. Çözüm: ayrı platform dosyaları, ortak saf mantık.
- **"srs kaydı yok = yeni kart"** + recordReview UPSERT: Anki/Leitner standardı, init'te srs tohumlama yok.
- **İki mod ayrımı**: günlük tekrar (due+yeni) vs kanun-bütünü çalışma (due filtresiz) — kullanıcı "TCK'yı çalışayım" derken hepsini ister.
- **Görsel registry codegen**: Metro dinamik require çözmez; 1100 require elle yazılamaz → klasör taranıp registry üretilir, runtime statik kalır.
- **Branş many-to-many**: bir kanun birden çok branşta ortak olabilir → junction tablo (tek kolon yetmez).
- **Migration = user_version runner** (DB adı yükseltme DEĞİL): kullanıcının SRS ilerlemesi korunsun.
- **Branş storage = AsyncStorage** (SQLite settings değil): web'de de kalıcı, onboarding her yenilemede tekrar çıkmasın.
- **Alt sınıf (subay/astsubay) şimdilik yok**: YAGNI, sadece ana branş.
- **SDK 54'te sabit (56 değil)**: iPhone App Store'daki Expo Go en fazla SDK 54 destekliyor (Apple inceleme gecikmesi). 56'da telefonda test imkânsızdı → tüm ekosistem 54'e indirildi (`88983ca`). SDK 56'ya çıkma; çıkılırsa iPhone Expo Go bağlanamaz. Detay/pinler CLAUDE.md "SÜRÜM SABİT" maddesinde.

## 7. İş akışı kuralları (özet — detay CLAUDE.md'de)
- Her değişiklikten önce KEŞİF, sonra FIX. Keşifsiz fix yok.
- 4-dosya senkron (types/d.ts/web/native). Mantık dosyalarına (srs/queue/kanun-kartlari) dokunma.
- Claude Code otomatik build/start yapmaz; içerik üretmez (placeholder).
- Her başarılı iş → commit (açıklayıcı TR mesaj) + master'a push. Geçmiş okunaklı.
- **Her iş sonrası bu dosyayı güncelle.**

## 8. Branş listesi (16) ve kapsam
Jandarma, MEBS, Havacılık, Personel, Maliye, İstihkam, İkmal, Bakım, Bando, Tabip, Diş Tabibi, Eczacı, Sağlık, Kimyager, Veteriner, Mühendis. + Müşterek (25 mevzuat, herkese). Toplam ~65 kanun, ~950-1100 öğretim birimi.

## 9. İçerik varlığı
- TCK: 49 görsel hazır (`assets/kartlar/tck/`), 4 panelli kare format, künye görselin içinde. Şu an sadece m1 seed'e bağlı; gerisi içerik turunda bağlanacak.
- Diğer kanunlar: görsel/metin henüz yok (üretilecek).
- Maskot: Jandarma Cüneyt (mavi bere, tek yıldız, jandarma amblemi). Kart yapısı: olay → sorun → Cüneyt+kanun → sonuç.
