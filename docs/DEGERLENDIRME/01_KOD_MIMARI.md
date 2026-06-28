# 01 — KOD KALİTESİ & MİMARİ

> Salt-okuma değerlendirme. Kanıt: `dosya:satır`. Hipotezler kod okunarak doğrulandı.
> Kapsam: `src/db` (4-dosya senkron + parite + migration runner), `src/lib` (saf mantık),
> `src/app` + `(tabs)` + `components/card-flow`.

## Özet
- **Mimari sağlam ve disiplinli.** TypeScript `strict` açık, kod tabanında **sıfır `any` / `@ts-ignore`** (yalnız 2 standart `exhaustive-deps` disable). Platforma-bölük veri katmanı (web/native) ve saf-mantık ayrımı tutarlı uygulanmış; web↔native paritesi paylaşılan saf fonksiyonlarla garanti altına alınmış.
- **4-dosya senkron ihlali YOK.** 24 `Backend` metodunun tamamı `types.ts` + `database.d.ts` + `database.native.ts` + `database.web.ts` dörtlüsünde birebir mevcut ve imza-uyumlu (doğrulandı).
- **En büyük borç: otomatik test sıfır.** "Saf / test edilebilir" diye tasarlanmış kritik mantık (srs/queue/performans/stats/sinav/birlesik) için ne jest ne test script'i var — parite ve SRS kutsallığı yalnız elle/Node ile doğrulanıyor (P1).
- **Ölü mimari yüzey:** `getDailyQueue → gunlukSinirli → gunlukKuyruk → YENI_LIMIT` zinciri artık erişilemez (tüm `/akis` navigasyonları param taşıyor); yine de tam 4-dosya senkronuyla taşınıyor (P1).
- **Migration zinciri (v1→v23) sağlıklı** ama tekrarlı `DELETE cards`+reseed adımları **orphan `srs` satırları** bırakıyor (temizlik yok); ayrıca `initDatabase` reddi kalıcı kilitlenme tuzağı içeriyor (P2).
- Karargah her odaklanmada **aynı veriyi iki kez** yüklüyor (`getPerformans`/`getAllCards` mükerrer) — kolay kazanım (P1).

## Bulgular

### P1 — Otomatik test yok (tested-edilebilir tasarım boşa gidiyor)
- **Ne:** `lib/srs`, `lib/queue`, `lib/performans`, `lib/stats`, `lib/sinav`, `lib/birlesik`, `lib/kanun-kartlari` hepsi DB/IO'suz, enjekte-RNG/tarih ile saf yazılmış (örn. `getSinavSorulari(lawId, rastgele=Math.random)` `sinav.ts:43`; `hesaplaStreak(gunler, bugun)` `stats.ts:74`; `srsGuncelle(kutu, cevap, bugun)` `srs.ts:53`) — yani **deterministik test için bilinçli kurgulanmış**.
- **Nerede:** `package.json:43-59` — `devDependencies`'te jest/test-runner yok, `scripts`'te `test` yok. Repoda hiç `*.test.ts` yok (yalnız `node_modules`).
- **Neden:** Parite ("web ve native AYNI sonucu üretir") ve "SRS kutsal" değişmezleri bu saf fonksiyonlara bağlı; bir regresyon yalnız cihazda fark edilir.
- **Etki:** Her içerik/şema turunda elle Node testi (PROJE_DURUM kayıtlarında geçiyor) — yorucu, kapsama boşluğu bırakır, CI yok.
- **Öneri:** `jest` + `jest-expo` ekle, `npm test` script'i; başlangıç olarak PROJE_DURUM'da anlatılan manuel senaryoları (yanlış→zayıf akışı, streak, kutu sırası, `kaynakMaddeNolari`/`eslesenKartIdleri`) kalıcı testlere çevir. Parite testi: aynı seed'le web+native backend'i aynı girdiyle çağırıp çıktı eşitliği assert et.

### P1 — Ölü kuyruk zinciri (`getDailyQueue` / `gunlukSinirli` / `gunlukKuyruk`)
- **Ne:** "Günlük kuyruk" (Etüt) artık zayıf havuza taşındı; `akis.tsx`'in default dalı (`gunlukSinirli()` → `getDailyQueue()`) hiçbir navigasyonla tetiklenmiyor.
- **Nerede:** `akis.tsx:54-57` (`gunlukSinirli`), `:159-165` (öncelik zinciri — default dal). Tüm `/akis` çağrıları param taşıyor: `mod:'zayif'` (`index.tsx:233,311`, `sicil.tsx:127,139`), `lawId` (`patika.tsx:299`, `ara.tsx:99`), `bolumId` (`patika.tsx:392`). Param'sız `/akis` girişi yok → default dal ölü. Ayrıca `getDailyQueue` her iki backend'de `gunlukKuyruk(..., 0)` çağırıyor (`native.ts:459`, `web.ts:78`) → `gunlukKuyruk`'un "yeni kart" dalı (`queue.ts:40-42,49` + `YENI_LIMIT=8`) hiç çalışmaz.
- **Neden:** Etüt'ün zayıf-havuza repoint'i sonrası eski due-kuyruk yolu kaldırılmadı.
- **Etki:** `getDailyQueue` 4 dosyada senkron tutuluyor (`types.ts:20`, `d.ts:17`, `native.ts:447/663`, `web.ts:77/244`) + `queue.ts` modülü tamamı bakım yükü; okuyan için yanıltıcı (hâlâ aktifmiş gibi).
- **Öneri:** Ya zinciri kaldır (4 dosya + `queue.ts` + `gunlukSinirli`), ya da `akis.tsx`'te yorumla "yalnız geriye dönük/derin-link" olarak işaretle. Kaldırma seçilirse `kanunKuyrugu` ile karışmasın — o canlı.

### P1 — Karargah odaklanmada mükerrer yükleme
- **Ne:** `useFocusEffect(yukle)` her dönüşte `getPerformans`+`getAllCards`'ı **iki kez** çalıştırıyor: bir kez `getZayifKuyruk` içinde, bir kez ayrı `Promise.all`'da.
- **Nerede:** `index.tsx:46` (`getZayifKuyruk`) — native karşılığı `getPerformans()`+`getAllCards()` çağırıyor ve **sıralı await** ile (`native.ts:554`, paralel değil). Aynı `yukle` `index.tsx:63`'te yine `Promise.all([getPerformans(), getAllCards()])`. Ek olarak `getStudyCards`+`getCardCount` (`:49`) + `getStudyDays` (`:59`).
- **Neden:** Zayıf hesap backend'e gömülü; ekran ham veriyi de ayrıca istiyor.
- **Etki:** ~565 kart + büyüyen performans logu her Karargah ziyaretinde 2× tam tablo taraması; native'de zayıf hesabı seri await ile ek gecikme.
- **Öneri:** Ham `perf`+`cards`'ı bir kez yükle, zayıf havuzu saf `zayifKartlar(perf, cards)` (`performans.ts:45`) ile ekranda türet (zaten saf ve dışa açık). `native.ts:554` await'lerini `Promise.all` yap.

### P1 — Orphan `srs` satırları (migration tekrarlı cards reseed)
- **Ne:** v12–v21 arası birçok adım `DELETE FROM cards` + `seedReference()` ile kart id şemasını değiştiriyor (`law*1000+sıra`); `srs` `card_id`'ye bağlı ama FK yok ve eski id'ler temizlenmiyor.
- **Nerede:** `native.ts:168,187,196,204,212,223,234,251` (cards delete+reseed); v18 yorumu açıkça "srs eski id'lere bağlıydı → orphan olur" diyor (`native.ts:221-222`). Şemada FK yok (`schema.ts:148-152`).
- **Neden:** Görsel/içerik yenilemeleri id'leri kaydırdı; reseed kullanıcı `srs`'ini korumak için kasıtlı dokunmadı.
- **Etki:** Yayın öncesi kabul (PROJE_DURUM). Ama mevcut test cihazlarında ölü `srs` satırları kalıcı birikir; JOIN'ler dışladığı için görünmez, fakat **gelecekte bir kart yeni içerikte eski bir id'yi geri alırsa** o kart yanlışça "çalışılmış"/kutuda görünür (sessiz veri kirliliği riski).
- **Öneri:** İleride bir migration adımında tek seferlik süpürme: `DELETE FROM srs WHERE card_id NOT IN (SELECT id FROM cards)` (aynısı `kart_performans` için de düşünülmeli). Tip-güvenli, idempotent, kullanıcı ilerlemesini yalnız zaten-kopuk satırlarda etkiler.

### P2 — `initDatabase` reddi kalıcı kilit
- **Ne:** Modül-seviyesi `hazir` promise'i bir kez set edilince tutulur; `init()`/migration reddederse her sonraki çağrı aynı **reddedilmiş** promise'i alır, retry yolu yok.
- **Nerede:** `native.ts:636-642` (`if (!hazir) hazir = backend.init()`), aynısı `web.ts:217-223`. `_layout.tsx:37` `void initDatabase()` (fire-and-forget). Ekranlar `.catch` ile yalnız UI hata gösterir, DB'yi iyileştiremez.
- **Neden:** Hata durumunda `hazir` sıfırlanmıyor.
- **Etki:** Bozuk/yarım migration → uygulama, yeniden başlatmaya kadar tüm DB çağrılarında ölü kalır (self-heal yok).
- **Öneri:** `backend.init().catch(e => { hazir = null; throw e; })` ile reddte memoizasyonu sıfırla → sonraki ekran/retry yeniden dener.

### P2 — Seed'de non-null assertion = açılış-anı crash noktaları
- **Ne:** İki yerde "her zaman eşleşir" varsayan `!` var; codegen bugün doğru tutuyor ama bozuk/yeni bir anahtar **seed/import anında** (uygulama açılmadan) çökertir.
- **Nerede:** `seed.ts:192` `gorselKartlari()` — ayırt/özet olmayan her anahtarın `^m(\d+)...`'e uyduğunu varsayıp `m![1]` okuyor (örn. ileride `tck_intro` gibi bir anahtar → `m` null → throw). `web.ts:56` `cardsWithLaw` — her `card.law_id` için `SEED_LAWS.find(...)!`.
- **Neden:** Registry codegen güvencesine dayanılmış; defansif kontrol yok.
- **Etki:** İçerik turunda yanlış adlandırılmış tek bir PNG anahtarı tüm uygulamayı boot'ta düşürür (sessiz değil, tam crash).
- **Öneri:** `gorselKartlari`'da regex eşleşmezse `continue`/uyarı; `cardsWithLaw`'da law bulunamazsa kartı atla. Maliyet düşük, kırılganlığı kapatır.

### P2 — `getStudyCards` web/native küme ayrışması (latent parite tuzağı)
- **Ne:** Web `getStudyCards` **tüm** kartları döndürür (çalışılmamış → `kutu:0`), native yalnız `srs` JOIN'li (çalışılmış) kartları.
- **Nerede:** `native.ts:417-426` (INNER JOIN srs) vs `web.ts:61-66` (tüm kartlar, `kutu ?? 0`). `stats.ts:36-39` yorumu bunu kabul ediyor: tek tüketici `hesaplaIstatistik` `kutu>=1` filtreler → sonuç eşit.
- **Neden:** Web bellek-içi modelde "srs yoksa kutu 0" deseni doğal.
- **Etki:** Bugün zararsız, ama `getStudyCards`'ı `kutu>=1` filtrelemeden iterleyen **yeni bir tüketici parite kırar** (web'de çalışılmamış kartlar da gelir).
- **Öneri:** Web tarafını `srs`'i olanlarla filtrele (gerçek parite), veya fonksiyonu `getStudiedCards` gibi adlandırıp sözleşmeyi netleştir.

### P2 — `akis.tsx` mega-bileşeni (992 satır)
- **Ne:** Tek bileşen kuyruk + panel (ses/madde) + otomatik ses + "geçelim mi" modalı + swipe jesti + komşu-görsel önyükleme + madde-scroll ölçümü hepsini yönetiyor.
- **Nerede:** `akis.tsx` (tamamı; örn. 12+ `useState`, 4+ `useEffect`, panel/scroll ref blokları `:104-151`).
- **Neden:** Özellikler zamanla aynı dosyaya eklenmiş (PROJE_DURUM FAZ 9A vb.).
- **Etki:** Bilişsel yük yüksek; bileşen test edilemez (saf çekirdek dışarı çıkmamış); regresyon riski.
- **Öneri:** Hook'lara böl — `useKartKuyrugu(params)` (yükleme/öncelik zinciri), `useMaddePanel()` (scroll ölçüm/“devamını gör”), `useGorselBoyut(oran, alan)`. Davranışı bozmadan kademeli.

## NE İYİ (borç değil — korunmalı)
- **Tip güvenliği:** `strict` (`tsconfig.json:3`), sıfır `any`/`ts-ignore`; yalnız 2 `exhaustive-deps` disable (`tts-bar.tsx:91`, `use-sesli-nobet.ts:59`) — standart.
- **4-dosya senkron:** 24 metot dörtlüde tutarlı; yeni `ekleSinavSonucu`/`getSinavSonuclari` örneğinde senkron doğru uygulanmış (`types.ts:53-56`, `d.ts:43-49`, `native.ts:615-631`, `web.ts:206-212`).
- **web/native parite motoru:** Her iki backend ham veriyi çekip AYNI saf fonksiyonu çağırıyor (`kanunKuyrugu`, `gunlukKuyruk`, `zayifKartlar`, `hesaplaIstatistik`, `srsGuncelle`) → yapısal parite garantisi.
- **Migration runner:** `PRAGMA user_version` tabanlı, fresh-install hızlı yolu ara sürümleri atlıyor (`native.ts:60-73`), reseed tek transaction (`seedReference` `:290`, `seedBolumler` `:333` — performans bilinçli), kullanıcı `srs`'i her adımda korunuyor; v22/v23 eklemeli (referans reseed yok) doğru ayrıştırılmış.
- **Saf-mantık katmanı:** DB/IO'suz, enjekte edilebilir bağımlılıklar; `bugunISO` tek-kaynak yerel gün (`srs.ts:18-31`) → tüm günlük sayaçlar yerel 00:00'da sıfırlanır (UTC bug'ı kapatılmış).
- **Birleşik kart çıkarımı tek kaynak:** `birlesik.ts` üye-madde parse'ı hem seed (patika bağlama), hem `kanunKuyrugu` sıralaması, hem sınav `eslesenKartIdleri` tarafından paylaşılıyor → çoğaltılmış mantık yok.
- **Codegen registry'ler:** görsel/ses/soru/madde içerikleri koddan ayrı, idempotent üretiliyor; el-yazımı `MADDE_METINLERI` öncelikli + üretilen registry fallback (`madde-metinleri.ts:13-16`).
- **Hata yönetimi/kabuk:** kök `ErrorBoundary` (`_layout.tsx:56`), `.catch` ile degrade (ekranlar retry sunar), forensic filigran + ekran-yakalama guard'ı (şu an kapalı `akis.tsx:60`), font yüklenene kadar splash.
- **Adlandırma/yapı tutarlılığı:** Türkçe alan dili tutarlı; yoğun ama isabetli gerekçe yorumları (özellikle migration adımları her birinin "neden srs korunur" notu).

## Hızlı kazanımlar
1. Karargah mükerrer yüklemesini dedupe et: ham `perf`+`cards`'ı bir kez çek, `zayifKartlar`'ı ekranda türet (`index.tsx:46` + `:63`); `native.ts:554` await'leri `Promise.all`.
2. Ölü `getDailyQueue`/`gunlukSinirli`/`gunlukKuyruk`/`YENI_LIMIT` zincirini kaldır ya da "geriye dönük" işaretle.
3. `initDatabase` reddinde `hazir=null` sıfırla (self-heal).
4. Seed'deki `m![1]` (`seed.ts:192`) ve `find(...)!` (`web.ts:56`) için defansif `continue`/skip.
5. İleride bir migration adımına orphan süpürme: `DELETE FROM srs WHERE card_id NOT IN (SELECT id FROM cards)`.

## Riskler
- **Test boşluğu** parite/SRS değişmezlerini cihaz-içi tespite mahkûm ediyor — en yüksek yapısal risk.
- **Orphan srs + id geri-kullanımı**: gelecekte eski bir kart id'si yeniden atanırsa sessiz "çalışılmış" kirliliği.
- **Boot-anı crash**: tek bozuk registry anahtarı (`!` noktaları) tüm açılışı düşürür; içerik turu öncesi guard yoksa kırılgan.
- **`initDatabase` kilidi**: yarım migration → yeniden başlatmaya kadar uygulama ölü.
- **`getStudyCards` ayrışması**: yeni tüketici eklenirse paritenin sessizce kırılması.

## Somut adımlar (sıralı, tahmini efor)
1. **(S, ~0.5 gün)** Karargah dedupe + `Promise.all` düzeltmesi + `initDatabase` reddinde sıfırlama + seed `!` guard'ları. Düşük riskli, davranış-koruyan.
2. **(S, ~0.5 gün)** Ölü `getDailyQueue` zincirini kaldır (4 dosya + `queue.ts` + `gunlukSinirli`) veya açıkça işaretle; `tsc --noEmit` 0 + 4-dosya senkron teyidi.
3. **(M, ~1-1.5 gün)** `jest`+`jest-expo` kur; saf çekirdek için ilk test seti (srs/queue/performans/stats/sinav/birlesik) + bir web↔native parite testi; `npm test` script'i.
4. **(S, ~0.5 gün)** Gelecek migration'a orphan `srs`/`kart_performans` süpürme adımı (idempotent, `user_version` bump) — kullanıcı verisi yalnız kopuk satırlarda etkilenir.
5. **(M, ~1-2 gün, opsiyonel)** `akis.tsx`'i hook'lara böl (`useKartKuyrugu`/`useMaddePanel`/`useGorselBoyut`) — test edilebilirlik + bakım.

---
### KARŞI-GÖRÜŞ & DOĞRULAMA (çoklu göz)
- **"Ölü `getDailyQueue`" iddiası** grep ile doğrulandı: tüm `/akis` navigasyonları param taşıyor (`index/sicil/ara/patika`); param'sız giriş bulunamadı. Yine de **derin-link/QA kısayolu** ile param'sız `/akis` teorik olarak açılabilir → "kaldır" yerine "işaretle+koru" da savunulabilir; bu yüzden öneri çift seçenekli bırakıldı.
- **"Mükerrer yükleme" performans iddiası** native kodda doğrulandı (`getZayifKuyruk` içte `getPerformans`+`getAllCards`, ekran ayrıca aynısını çekiyor). Karşı-görüş: veri seti ~565 kart, modern cihazda fark milisaniye — **P1 değil P2 sayılabilir**; yine de büyüyen `kart_performans` logu ve native seri-await nedeniyle P1'de tutuldu.
- **"Orphan srs" riski** şema FK'sız olduğu için gerçek; ancak `id=law*1000+sıra` şeması id geri-kullanımını pratikte seyrekleştiriyor (kanun bloğu sabit) → **etki düşük olasılık, yüksek sessizlik**; bu yüzden P1 (veri bütünlüğü) ama "yayın-bloklayıcı değil".
- **4-dosya senkron "ihlal yok"** iddiası dört dosyanın metot listesi karşılaştırılarak doğrulandı; eksik/fazla metot bulunmadı.
- **Doğrulanmadı:** `tsc --noEmit`'in şu an 0 hata verdiği (salt-okuma; çalıştırılmadı) — PROJE_DURUM'daki son kayıtlara dayanıyor, bağımsız teyit edilmedi (DOĞRULANMADI).

---
## KARSI-GORUS & DOGRULAMA (kirmizi takim)

> Bağımsız ikinci göz. İlgili kod birebir okundu (akis.tsx, index.tsx, database.native/web.ts, seed.ts). Her ana iddiaya güven notu eklendi. Mevcut "çoklu göz" notları geçerli; bunlar üzerine ekleme/eleştiri.

### Doğrulanan iddialar (sağlam)
- **"Sıfır `any`/`@ts-ignore`"** — grep ile bağımsız teyit: `: any|as any|<any>|@ts-ignore|@ts-expect-error` için **0 eşleşme** (`src` geneli). **Güven: Yüksek.**
- **`initDatabase` reddi kalıcı kilit** — `native.ts:640` `if (!hazir) hazir = backend.init();` birebir doğrulandı; reddedilen promise memoize kalır, retry yok. **Güven: Yüksek.** Öneri (`hazir=null` reset) isabetli.
- **Seed `m![1]` boot-crash noktası** — `seed.ts:191-193` doğrulandı: `geri` üç önekin (`ayirt_m`/`ozet_m`/`ozet_`) hiçbirine uymazsa `/^m(\d+).../` zorunlu; eşleşmezse `m` null → `m![1]` throw. Bu kod **seed/import anında** (UI öncesi) koşar → tam boot-crash. **Güven: Yüksek.**
- **`getStudyCards` web/native ayrışması** — `native.ts:417-426` (INNER `JOIN srs` → yalnız çalışılmış) vs `web.ts:61-66` (tüm kartlar, `kutu ?? 0`) birebir doğrulandı. Tek tüketici `index.tsx:49→hesaplaIstatistik` (`kutu>=1` filtreler) → bugün eşit. **Güven: Yüksek.**
- **Ölü `gunlukSinirli`/`getDailyQueue`** — `akis.tsx:54-57` + `:159-165`: yalnız param'sız default dalda; tüm canlı navigasyonlar param taşıyor. **Güven: Yüksek** (kod), **Orta** (gerçekten erişilemez olduğu — derin-link/QA param'sız `/akis` açabilir).

### Eleştiriler / düzeltmeler
1. **"Mükerrer yükleme = iki kez" SAYIM EKSİK (rapor hafif küçümsüyor).** Karargah her odaklanmada `cards`'ı **3 kez** tam tablo tarıyor, `perf`'i **2 kez**: (a) `getZayifKuyruk()` içte `getPerformans()`+`getAllCards()` (`native.ts:554`), (b) `getStudyCards()` (`index.tsx:49`, ayrı cards JOIN'i), (c) `Promise.all([getPerformans(), getAllCards()])` (`index.tsx:63`). Rapor yalnız (a)+(c)'yi sayıp "iki kez" demiş; (b)'yi atlamış. Dedupe önerisi hâlâ doğru ama kazanım rapordan büyük. **Güven: Yüksek.**
2. **Önceliklendirme inversiyonu: ölü kod P1, boot-crash P2 — TERS.** Ölü `getDailyQueue` zinciri *yalnız bakım yükü* (sıfır kullanıcı etkisi, sıfır correctness). Seed `m![1]` ise **gerçek boot-crash** ve CLAUDE.md "içerik ayrı iş" diyor → yeni PNG anahtarları **yakında** gelecek (tetikleyici an yaklaşıyor). Boot-crash guard'ı (rapor P2) en az ölü-kod temizliği (rapor P1) kadar acil; bence **P1↔P2 yer değiştirmeli**. **Güven: Orta-Yüksek** (zamanlama yargısı).
3. **Test önerisi over-scoped (P1 ölçeği abartılı).** Tek geliştirici + yayın-öncesi bir app için "jest+jest-expo + srs/queue/performans/stats/sinav/birlesik tam set" pahalı bir P1. Yüksek-değerli alt küme: **yalnız web↔native parite smoke testi + SRS kutu-geçiş testi** (en yüksek sessiz-regresyon riski olan iki şey). Geri kalan saf-fonksiyon coverage P2 olarak ertelenebilir. Yani iddia doğru, *kapsam* abartılı. **Güven: Orta.**
4. **"Orphan srs" — P1 etiketi tartışmalı (kendi karşı-görüşleriyle çelişiyor).** Rapor metni P1 demiş ama Özet "yayın-bloklayıcı değil" + çoklu-göz notu "düşük olasılık, yüksek sessizlik" diyor. `id=law*1000+sıra` şemasında id geri-kullanımı pratikte ancak bir kanunun madde sayısı *azalırsa* + sonra *artarsa* olur — seyrek. **Gerçek P2.** Süpürme önerisi (`DELETE FROM srs WHERE card_id NOT IN ...`) doğru ve ucuz; itirazım yalnız etikette. **Güven: Orta.**

### Atlanmış noktalar (eklenecek)
5. **Yanıltıcı/bayat JSDoc — aktif tuzak (rapor değinmemiş).** `native.ts:644` "akış artık `getDailyQueue` kullanır" ve `:662` "Etüt kuyruğu" yorumları **yanlış**: Etüt artık `getZayifKuyruk` (CLAUDE.md değişmezi). Okuyan geliştiriciyi ölü yola yönlendiriyor — ölü-kod bulgusunun *belge tarafı*. Zincir silinmezse bile bu iki yorum düzeltilmeli. **Güven: Yüksek.**
6. **`getZayifKuyruk` native seri-await mikro-darboğaz.** `native.ts:554` `[await getPerformans(), await getAllCards()]` — iki bağımsız sorgu seri bekliyor (`Promise.all` değil). Rapor "Öneri"de değinmiş ama ayrı bulgu olarak listelenmemiş; web tarafında bu sorun yok (senkron). Küçük ama davranış-koruyan kolay kazanım. **Güven: Yüksek.**
7. **`gunlukSinirli` silinirse `getAyar` çağrısı da ölmüyor — dikkat.** `akis.tsx:55` `getAyar()` (gunlukKart) başka yerde de kullanılıyor olabilir; ölü zincir kaldırılırken `getAyar`/`ayar.gunlukKart`'ın başka tüketicisi var mı teyit edilmeli (yanlışlıkla canlı ayarı koparma riski). **DOĞRULANMADI** (bu denetimde `getAyar` diğer tüketicileri taranmadı).

### Net
Rapor teknik olarak doğru ve kanıtlı; ana zaafı **önceliklendirme** (ölü-kod P1 / boot-crash P2 tersliği) ve **mükerrer-yükleme sayımının eksikliği**. Hiçbir iddiada *yanlış* bulgu yok; iki yerde *abartı/eksik* (test kapsamı, "iki kez") ve bir *etiket çelişkisi* (orphan P1 vs metin) var.
