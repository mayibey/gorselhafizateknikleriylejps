# 13 — P0/v1 UYGULAMA PLANI (Kod-Seviyesi, "Uygula" Hazır)

> Baş mühendis sentezi. Taban: `00_YONETICI_OZETI.md` (en kritik 10 bulgu) + `00_YOL_HARITASI.md`
> (P0-v1 V1–V10) + 02/03/04/05 derin raporlar + kırmızı-takım doğrulamaları. Bu belge **kod
> DEĞİŞTİRMEZ** — her P0/v1 işi için dosya:satır referanslı, tam değişiklik tarifli, 4-dosya senkron
> etkili, risk + kabul kriteri + efor içeren bir uygulama planıdır. Salt-okuma keşif tamamlandı;
> tüm satır referansları kodtan birebir teyit edildi (29 Haz). Sıra ve bağımlılıklar sonda.
>
> **Kapsam (başkanın istediği 7 iş):** (1) SRS'i Etüt'e bağla · (2) sahte Bildirim/Eğitim Planı'nı
> dürüstleştir · (3) FLAG_SECURE aç + ekranlara genişlet · (4) içerik hataları (m.25 + çok-madde
> birleştirme kök-neden) · (5) WCAG kontrast token koyulaştır · (6) Tatbikat kilidi düşür + Branş
> gizle · (7) minimal jest + parite/SRS smoke. (V5 ceza-modeli ve V8/V9 ayrı iş; bu plan dışında.)
>
> **MUTLAK KURAL hatırlatması (CLAUDE.md):** Saf mantık dosyaları (`lib/srs.ts`, `lib/queue.ts`,
> `lib/kanun-kartlari.ts`, `lib/performans.ts`) — DOKUNMADAN bırakmayı tercih et; parite garantisi
> onlardan gelir. Yeni public DB fonksiyonu = **4-dosya senkron** (`types.ts` + `database.d.ts` +
> `database.native.ts` + `database.web.ts`). Görsel registry'ler ELLE düzenlenmez (codegen).

---

## ÖZET TABLO

| # | İş | Ana dosya(lar) | 4-dosya senkron? | Efor | Bağımlılık |
|---|----|----------------|:---:|------|-----------|
| 1 | SRS'i Etüt'e bağla (due + zayıf) | `database.*` ×4, `(tabs)/index.tsx` | **EVET** (yeni `getEtutKuyruk`) | 0.5–1g | yok |
| 2 | Bildirim/Eğitim Planı dürüstleştir | `egitim-plani.tsx`, `(tabs)/index.tsx`, `ayarlar.tsx` | hayır | 0.5g | yok |
| 3 | FLAG_SECURE aç + genişlet | `akis.tsx`, `sinav.tsx`, (madde-sheet `akis.tsx`) | hayır | 0.5g | yok |
| 4 | İçerik: m.25 override + `madde:uret` kök-neden | `madde-metinleri.ts`, `scripts/madde-metni-uret.mjs` | hayır | 1–1.5g | yok |
| 5 | WCAG kontrast token koyulaştır | `constants/theme.ts` | hayır | 0.25g | yok |
| 6 | Tatbikat kilidi düşür + Branş gizle | `(tabs)/tatbikat.tsx`, `(tabs)/mevzuat.tsx` | hayır | 1g | yok |
| 7 | jest + parite/SRS smoke | `package.json`, `jest.config`, `__tests__/` | hayır | 1g | #1 (sonra test) |

---

## İŞ 1 — SRS'i Etüt'e bağla (ürünün ANA vaadi) · [V1, 05 P0-1, 01 ölü-zincir]

### Sorun (teyitli)
- Karargah "Etüt" = `getZayifKuyruk()` (yalnız zayıf havuz) — `src/app/(tabs)/index.tsx:46`.
- Due (vakti gelen Leitner tekrarları) yolu `getDailyQueue()` **hiçbir erişilebilir UI girişinden
  çağrılmıyor**. `akis.tsx:165` `gunlukSinirli()` else-dalı parametresiz `/akis`'e bağlı, ama tüm
  navigasyon parametreli (`mod:zayif` / `lawId` / `bolumId` / `kart`) → **parametresiz `/akis` =
  ölü kod** (05 kırmızı-takım C ile doğrulandı). Yani due tekrarlar yalnız `yeniLimit=0` ile kısıtlı
  değil, **tamamen erişilemez**.
- `getDailyQueue` zaten doğru çalışıyor: `database.native.ts:447-460` ve `database.web.ts:77-79`
  → `gunlukKuyruk(cards, srsMap, bugunISO(), 0)` = sadece due (yeni kart yok). Mantık hazır, bağlı değil.

### Değişiklik (kod-seviyesi)
**Yaklaşım A — yeni public backend fonksiyonu `getEtutKuyruk()` (ÖNERİLEN, 4-dosya senkron).**
Etüt kuyruğu = **due tekrarlar (önce) + zayıf havuz (sonra), card.id ile dedup**. Backend'de tek
yerde birleştir → web/native parite tek kaynaktan garanti.

1. `src/db/types.ts` (`Backend` arayüzü, ~satır 20-25 civarı, `getDailyQueue`/`getZayifKuyruk`
   komşuluğuna): ekle
   ```ts
   getEtutKuyruk(): Promise<QueueCard[]>;
   ```
2. `src/db/database.d.ts` (public tip, ~satır 17-21 komşuluğu): ekle
   ```ts
   export function getEtutKuyruk(): Promise<QueueCard[]>;
   ```
3. `src/db/database.native.ts`:
   - `SqliteBackend` içine (mevcut `getDailyQueue` `:447` ve `getZayifKuyruk` `:552` yanına) metod:
     ```ts
     async getEtutKuyruk(): Promise<QueueCard[]> {
       const due = await this.getDailyQueue();      // sadece due (yeniLimit=0)
       const zayif = await this.getZayifKuyruk();   // performans-temelli zayıf havuz
       const gorulen = new Set<number>();
       const out: QueueCard[] = [];
       for (const c of [...due, ...zayif]) {
         if (gorulen.has(c.id)) continue;
         gorulen.add(c.id);
         out.push(c);
       }
       return out;
     }
     ```
   - Modül-seviyesi public wrapper (mevcut `getDailyQueue` `:663` / `getZayifKuyruk` `:746` deseniyle):
     ```ts
     export async function getEtutKuyruk(): Promise<QueueCard[]> {
       const backend = await ensureBackend();   // mevcut wrapper'lardaki aynı çağrı
       return backend.getEtutKuyruk();
     }
     ```
4. `src/db/database.web.ts`: `MemoryBackend` içine AYNI mantıkla `getEtutKuyruk()` (web `getDailyQueue`
   `:77` + `getZayifKuyruk` `:174` zaten saf fonksiyonları çağırıyor → birleştirme birebir aynı kod) +
   modül wrapper (`:244`/`:327` deseni). **web ve native AYNI birleştirme algoritmasını içermeli.**
5. `src/app/(tabs)/index.tsx`:
   - `:46` `getZayifKuyruk()` → `getEtutKuyruk()` (import'u da güncelle).
   - Sayaç ayrımı: şu an `tekrarSayisi`/`bekleyen` ikisi de `queue.length` (= hepsi zayıf sanılıyor —
     03 raporu "3 kez aynı sayı"). Etüt artık due+zayıf olduğundan: Karargah'a **"bugün N tekrar"**
     ayrımı için ya (a) `getEtutKuyruk` çağrısına ek olarak due adedini ayrı al, ya da (b) basit tut:
     hero alt metnini "N kart seni bekliyor (tekrar + zayıf)" yap, `:249-252` ve `:282`/`:323`
     metinlerini buna göre güncelle. **Öneri:** "Zayıf mevzi" etiketini "Tekrar & zayıf" / "Bugünkü
     etüt" olarak değiştir (artık yalnız zayıf değil) — yanıltıcı etiket kalmasın.
   - `akis.tsx` zayıf akışı (`mod:zayif`) Etüt girişidir; Etüt artık due+zayıf gösterecekse `mod`
     parametresini `mod:etut` yapmayı **değerlendir** ve `akis.tsx:159` yükleme dalını
     `getEtutKuyruk()`'e bağla. (Aksi halde Karargah sayacı due+zayıf, tıklayınca açılan akış yalnız
     zayıf gösterir → tutarsızlık.) **Bu kritik:** sayaç ile akışın AYNI kuyruğu göstermesi şart.

**Yaklaşım B — hafif (yeni public fonksiyon YOK, 4-dosya senkrondan kaçın).** `index.tsx` ve
`akis.tsx` içinde `Promise.all([getDailyQueue(), getZayifKuyruk()])` çağırıp JS'te birleştir. Parite
güvenli (iki fonksiyon da parite-güvenli). DEZAVANTAJ: birleştirme mantığı 2 ekranda kopyalanır
(Karargah sayacı + akış yüklemesi) → drift riski; A daha temiz. **Karar başkanın; A öneriliyor.**

**Yan not (DOKUNMA):** `yeniLimit` 0 kalsın — yeni kart öğrenme Mevzuat→patikada (CLAUDE.md değişmezi).
Etüt yalnız due+zayıf düzeltme bölümü olarak kalır; "yeni öğrenme" karışmaz.

### 4-dosya senkron etkisi
**EVET** (Yaklaşım A). `types.ts` + `database.d.ts` + `database.native.ts` + `database.web.ts`
DÖRDÜ birden `getEtutKuyruk` kazanır; web ve native birebir aynı birleştirme/dedup üretmeli.

### Risk
- Sayaç ↔ akış tutarsızlığı (Karargah due+zayıf der, akış yalnız zayıf açarsa kullanıcı şaşırır) →
  **mutlak**: ikisini aynı kuyruğa bağla.
- `getDailyQueue` + `getZayifKuyruk` = 2 ayrı sorgu/2 tam kart taraması → Karargah focus'unda ek yük;
  kart sayısı ~565, kabul edilebilir. (P1-g dedupe işiyle birleşmeden de çalışır.)
- Yanıltıcı JSDoc: `database.native.ts:445-446` ("Etüt = SADECE TEKRAR") ve `database.web.ts:76`
  yorumları artık yanlış → güncelle (yoksa gelecek geliştirici yanılır).
- Off-by-one aralık (`srs.ts` `ARALIKLAR[0]=1` erişilemez, P1-3) bu işten SONRA görünür hale gelir —
  bu plan kapsamı değil ama İş 7 testinde işaretle.

### Kabul kriteri
- Karargah Etüt'e tıkla → due tekrar(lar) + zayıf kartlar tek akışta gelir; sayaç = akıştaki kart
  sayısı.
- Bir kartı "Öğrendim" → 2 gün sonra (cihaz saatini ilerlet veya `srs.sonraki_tarih` manuel geri al)
  Etüt'te due olarak geri gelir. (Bugün: HİÇ gelmiyor.)
- `npx tsc --noEmit` 0 hata. Web ve native aynı kuyruğu üretir (İş 7 parite smoke ile).

### Efor: ~0.5–1 gün. Bağımlılık: yok.

---

## İŞ 2 — Sahte "Bildirim / Eğitim Planı"nı dürüstleştir · [V2, 02 B1/K1/K2]

### Sorun (teyitli)
- `src/lib/bildirim.ts:60-63` `planla()` HER ZAMAN `'web'` döner; `expo-notifications` paketi ne
  `package.json`'da ne `app.json` plugins'te var (teyit: `package.json` deps'te yok). Hiçbir bildirim
  planlanmaz.
- `src/app/egitim-plani.tsx:36-46` durum mesajı: `'ok'`/`'izin-yok'`/`'hata'` dalları **ulaşılamaz**
  (planla hep `'web'`); kullanıcı her zaman `:44` "Bildirimler yalnız telefonda (development build)
  çalışır." görür — yayınlanan APK dev build OLMADIĞI için cihazda da çalışmaz → yanıltıcı.
- Giriş noktaları: Karargah çan ikonu `index.tsx:151-157` (→`/egitim-plani`) + Ayarlar satırı
  `ayarlar.tsx:66-70`.
- **NÜANS (K1):** Ekranın "Oturum başına kart" stepper'ı GERÇEK çalışıyor — `gunlukKart` AsyncStorage'a
  yazılıyor ve `akis.tsx:54-57 gunlukSinirli()` ile günlük kuyruğu dilimliyor. AMA gunlukSinirli ölü
  yolda (İş 1). İş 1 Etüt'ü due+zayıf yaparsa `gunlukKart` ayarı yine yalnız `getDailyQueue` yolunu
  etkiler → bu ayarın da Etüt'e bağlanması veya gizlenmesi gerekir (aşağıda).

### Değişiklik — KARAR: "gizle" (v1) vs "tamamla (FCM)" (v2). Öneri: **gizle/dürüstleştir** (FCM = v2 backlog).
1. **Çan ikonunu gizle:** `index.tsx:151-157` Pressable'ı v1'de render etme (yorum-out veya
   `{false && ...}` yerine TEMİZ kaldır; `headerSag` yalnız profil ikonu kalsın `:158-164`).
2. **Ayarlar satırını gizle:** `ayarlar.tsx:66-70` "Eğitim Planı (Bildirimler)" `<Satir>`'ı kaldır.
   (Böylece `/egitim-plani`'ye erişilebilir giriş kalmaz; rota dursa da ölü → sorun değil.)
3. **Mesajı dürüstleştir (savunma derinliği):** `egitim-plani.tsx:43-44` `'web'` mesajını
   "Ayar kaydedildi. (Bildirim hatırlatmaları yakında.)" yap — "development build'de çalışır" ibaresini
   KALDIR (yanıltıcı). Çan/satır gizlense de ekran metni dürüst kalsın.
4. **"Oturum başına kart" kararı:** Bu stepper gerçek çalışan tek kontrol. İki seçenek:
   (a) Ekran tümüyle erişilemez olacaksa stepper de gizlenmiş olur — `gunlukKart` varsayılan 15'te
   kalır (akis dilimleme etkisi İş 1'e bağlı). (b) Eğer "günlük kart sınırı" değerli bulunuyorsa, bu
   tek kontrolü Ayarlar'a sade bir satır olarak taşı, bildirim eksenini at. **Öneri:** (a) — v1'de tüm
   Eğitim Planı yüzeyini gizle; sınır ayarı v2'de gerçek bildirimle birlikte gelsin.

### 4-dosya senkron etkisi: yok (UI + lib mesajı).
### Risk
- Çan/satır kaldırılınca `egitim-plani.tsx` ve `bildirim.ts` ölü kod olur — **kaldırma, dursun**
  (v2'de geri açılacak); sadece erişilemez. `tsc` unused-import vermesin diye import temizliği gerekir
  (`index.tsx`/`ayarlar.tsx`).
- Mağaza metni (`MAGAZA_LISTELEME.md`) "bildirim/hatırlatma" vaat ediyorsa çıkar (V9 iş; bu plan dışı
  ama not).

### Kabul kriteri
- Karargah'ta çan ikonu YOK; Ayarlar'da "Eğitim Planı" satırı YOK; `/egitim-plani`'ye UI'dan
  ulaşılamaz. Hiçbir yerde "kuruldu — içtimalar zamanında düşecek 🫡" gösterilmez.
- `npx tsc --noEmit` 0 hata (kullanılmayan import kalmaz).

### Efor: ~0.5 gün (3 dosya). Bağımlılık: yok.

---

## İŞ 3 — İçerik koruması: FLAG_SECURE aç + ekranlara genişlet · [V4, 02 K5, 06 ATLAMA-1]

### Sorun (teyitli)
- `src/app/akis.tsx:59-60` `EKRAN_KORUMA_AKTIF = false` ("GEÇİCİ: SS almak için kapatıldı").
  `:66-72` effect bu bayrak false iken `preventScreenCaptureAsync` HİÇ çağırmaz → kart akışında ekran
  görüntüsü/kaydı engellenmiyor.
- Koruma yalnız `/akis`'te tasarlanmış; **sınav (`sinav.tsx`) ve madde-metni sheet'i** (akış içi panel,
  `akis.tsx` `acikPanel==='madde'`) için ayrı ekran yok ama sınavda da kart görseli/telifli içerik var.
- `expo-screen-capture` `~8.0.9` zaten yüklü (package.json) → ek paket gerekmez.

### Değişiklik
1. **Bayrağı aç:** `akis.tsx:60` `const EKRAN_KORUMA_AKTIF = true;` (SS işi bittiyse — başkan teyidi).
   Yorumu da güncelle (artık "geçici kapalı" değil).
2. **Sınav ekranını koru:** `src/app/sinav.tsx`'e `akis.tsx:62-72` ile AYNI effect'i ekle:
   ```ts
   useEffect(() => {
     if (Platform.OS === 'web') return;
     void ScreenCapture.preventScreenCaptureAsync().catch(() => {});
     return () => { void ScreenCapture.allowScreenCaptureAsync().catch(() => {}); };
   }, []);
   ```
   (import: `import * as ScreenCapture from 'expo-screen-capture';` + `Platform`.)
3. **Madde-sheet:** Madde paneli `akis.tsx` içinde açıldığından, `/akis` zaten korumalı → ayrı iş
   gerekmez (bayrak açılınca otomatik kapsanır). `sesli-nobet.tsx` rotası ölü (02 B4) → koruma gereksiz
   (kaldırılırsa zaten yok; bu plan dışı).
4. **Yardımcı: ortak hook.** Tekrarı önlemek için `src/hooks/use-ekran-koruma.ts` (yeni, küçük) çıkar:
   ```ts
   export function useEkranKoruma(aktif = true) {
     useEffect(() => {
       if (!aktif || Platform.OS === 'web') return;
       void ScreenCapture.preventScreenCaptureAsync().catch(() => {});
       return () => { void ScreenCapture.allowScreenCaptureAsync().catch(() => {}); };
     }, [aktif]);
   }
   ```
   `akis.tsx` ve `sinav.tsx` bunu çağırsın. (Opsiyonel temizlik; İş 3'ün kabulü için şart değil.)

### 4-dosya senkron etkisi: yok.
### Risk
- Web'de `expo-screen-capture` API'si yok → `Platform.OS === 'web'` guard ŞART (akış'taki desen
  korunmalı; aksi halde web çöker).
- Android emülatör/dev'de FLAG_SECURE bazı ekran paylaşımını/preview'i etkiler — geliştirme sırasında
  SS gerekirse bayrağı geçici çevirmek yerine `__DEV__` ile sarmalamayı değerlendir (ama yayında true).
- iOS'ta `preventScreenCaptureAsync` ekran KAYDINI işaretler/karartır ama SS'i tam engellemez (platform
  kısıtı) — beklenti notu (kabul kriterini Android'e göre yaz).

### Kabul kriteri
- Android'de kart akışı + sınav ekranında ekran görüntüsü alınamaz / "engellendi" davranışı.
- Web build çökmedi (`expo start --web` + akış/sınav aç). `npx tsc --noEmit` 0 hata.

### Efor: ~0.5 gün. Bağımlılık: yok. **(SS işi bittiği başkan tarafından teyit edilmeli — tek karar.)**

---

## İŞ 4 — İçerik hataları: m.25 override + `madde:uret` kök-neden · [V3, 04 B1/B2 + kırmızı-takım]

### Sorun (teyitli)
- **B1 (P0, maddi hata):** `Jandarma Teşkilat Yön m.25` kartı m.25 yerine **m.26/27/29/32/33** metnini
  gösteriyor; m.25 metni HİÇ yok. Çözücü zinciri: `madde-metinleri.ts:411-412`
  `maddeMetni = MADDE_METINLERI[no] ?? KART_MADDE_METINLERI[no]`. `MADDE_METINLERI`'nde (`:18`)
  Jandarma m.25 override'ı YOK → bozuk `KART_MADDE_METINLERI` değeri ekrana düşüyor.
- **Sistemik kök-neden (kırmızı-takım):** `scripts/madde-metni-uret.mjs` ID'siz kanunlarda (Jandarma)
  bir 📜 tırnak bloğu BİRDEN ÇOK maddeyi kapsıyor (`metinCikar` `:95-108` kapanış tırnağına kadar
  okuyor). `bloklaBol` `:126-141` bunu `Madde\s+(\d+)\s*[–-]` regex'iyle bölüyor — ama: (a) blok
  m.25'i atlayıp m.26'dan başladığında m.25 hiç segment olmuyor; (b) regex eşleşmeyen başlık
  varyasyonlarında (örn "MADDE 25-" vs "Madde 25 –", tırnak/boşluk farkı) komşu maddeler tek segmente
  yapışıp **etiket-fazlası içerik** üretiyor (m.52→5 madde, m.61→4 madde — 04 kırmızı-takım örnekleri).
  Detektör yalnız "metin-başı Madde N" eşleşmesini kıyasladığından bu birleşmeler RAPORLANMADI →
  "6 kayma" TABAN, gerçek sayı daha yüksek.

### Değişiklik — iki katman (kök-neden ÖNCE, sonra override).
**(a) `madde:uret` kök-neden düzeltme (`scripts/madde-metni-uret.mjs`):**
1. `bloklaBol` regex'ini başlık varyasyonlarına dayanıklı yap: `Madde`/`MADDE`, `–`/`-`/`.`,
   tırnak/boşluk toleranslı; her segmentin metnini **bir sonraki MADDE başlığında KES** (mevcut
   `:134-139` slice mantığı doğru ama idxs eksikse kesilmiyor → regex kapsamını genişlet).
2. **Doğrulama adımı ekle (kritik):** `masterParse` çıktısından sonra, her `out[no]` için metnin
   GÖVDESİNDE yalnız tek bir `MADDE <no>` başlığı olduğunu assert et; birden fazla `MADDE \d+`
   başlığı varsa (= birleşmiş) konsola **uyarı dök** ("jandteskyon m.52 → 5 başlık"). Bu, sessiz
   birleşmeleri görünür kılar (kırmızı-takımın istediği tam tarama).
3. Yeniden üret: `npm run madde:uret` → `src/assets/kart-madde-metinleri.ts` regen. **Registry ELLE
   düzenlenmez** — yalnız script + regen.

**(b) Kalan tekil hataları MADDE_METINLERI override ile kapat (regen'den ETKİLENMEZ, lookup'ta kazanır):**
4. `src/db/madde-metinleri.ts` `MADDE_METINLERI` (`:18`) içine, doğrulama adımının (a.2) raporladığı
   her bozuk anahtar için resmî tek-madde metnini ekle. EN AZ:
   - `'Jandarma Teşkilat Yön m.25'`: m.25 resmî metni (mevzuat.gov.tr'den, tek madde).
   - (a.2 uyarı listesinden çıkan diğer çok-maddeli Jandarma anahtarları: m.1, m.5, m.39, m.52, m.61,
     m.70 vb. — `m.70` zaten MM'de temiz override'lı, model bu; aynısını ötekilere uygula.)
   - 04 B2'nin 6 sınır-kayması (Türk Bayrağı m.2, Personel Yön m.24, 6284 Uyg. Yön m.34, Resmî Yazışma
     m.38, İzin Yön m.8/m.22) → **registry'de kırpma DEĞİL**, MM override (kırmızı-takım: registry
     regen'de ezilir).
5. **Disiplin m.8 fıkra bütünlüğü:** Metin `(7)` ile başlıyor → fıkra (1)-(6) eksik (kırmızı-takım
   teyitli). Resmî m.8 (1)-(6)'yı bul, MM override ile tam metni koy (uzunsa panel bölmesi zaten var).

### 4-dosya senkron etkisi: yok (içerik + codegen script).
### Risk
- Script regex değişikliği DİĞER kanunları bozabilir (ID'li kanunlar `cur` yolundan gider, etkilenmez;
  ama ID'siz Jandarma blok-bölme hassas). **Regen sonrası diff'i incele** (`git diff
  kart-madde-metinleri.ts`) — beklenmedik kayıp/değişim var mı.
- MM override metinleri **resmî kaynaktan** alınmalı (mevzuat.gov.tr); yanlış metin koymak hatayı
  değiştirmez, taşır. Kaynak link `PROJE_DURUM`'a not.
- "Tam temiz" garantisi: a.2 doğrulama adımı çalışmadan "düzinelerce gizli birleşme" kapanmaz —
  doğrulama adımı bu işin EN değerli parçası, atlanmamalı.

### Kabul kriteri
- `jandteskyon_m25` kartı (Mevzuat→Jandarma Teşkilat Yön → m.25 patika düğümü, veya akışta) m.25 resmî
  metnini gösterir; m.26+ metni görünmez.
- `madde:uret` çalıştırınca doğrulama adımı "çok-başlıklı" anahtar listesi basar; listedeki her anahtar
  ya script ile tek-maddeye iner ya MM override'da. 0 yeni placeholder.
- `npx tsc --noEmit` 0 hata. `git diff` regen çıktısı incelenip onaylandı.

### Efor: ~1–1.5 gün. Bağımlılık: yok. (Önce script+regen, sonra override — sıra önemli.)

---

## İŞ 5 — WCAG kontrast token koyulaştır · [V7 kısmı, 03 P0/P1 + kırmızı-takım]

### Sorun (teyitli, hesaplandı)
- `src/constants/theme.ts:23` `solukMetin: '#8A7D62'` / kremZemin `#F7F3EA` = **3.65:1** (AA 4.5:1 ister).
- `:27` `altinKoyu: '#B88917'` / krem = **2.86:1** — metin için kullanıldığında AA altı.
- `:48` `amber: '#B5791C'` altın soluk yüzey üstünde daha kötü.
- `solukMetin` projedeki VARSAYILAN ikincil metin rengi (yüzlerce `color="solukMetin"`).
- (Kırmızı-takım: "mağaza reddi" gerekçesi DÜŞÜK güven — gerekçe **saha okunabilirliği**, mağaza değil.
  P0 değil P1 ama tek-dosya/yüksek getiri olduğu için bu pakette.)

### Değişiklik (`src/constants/theme.ts` — TEK dosya)
1. `:23` `solukMetin: '#8A7D62'` → **`'#6E6047'`** (≈4.6:1, AA geçer). İsim/anlam aynı; tüm ekranlara
   tek noktadan yayılır.
2. Metinde altın kullanımı için: `altinKoyu`'yu DOLGU/SVG/çizgide bırak (`:27` değeri korunabilir),
   ama METİN için ayrı token ekle: **`altinMetin: '#8A6410'`** (≈4.0+:1) ve `altinKoyu`'yu METİN olarak
   kullanan yerleri (örn `tatbikat.tsx:223` "Deneme Sınavı", `index.tsx` etiketleri) `altinMetin`'e
   çevirmeyi değerlendir. **Minimal kabul için:** yalnız `solukMetin` koyulaştırma yeterli; altın-metin
   ayrımı opsiyonel ikinci adım.
3. `PaletteColor` tipi otomatik genişler (yeni token eklenirse `as const` ile tip güncel).

### 4-dosya senkron etkisi: yok.
### Risk
- Marka hissi: `solukMetin` koyulaşınca krem-premium "soluk" estetiği biraz sertleşir — değer kabul
  edilebilir (okunabilirlik > estetik nüans). Başkan göz teyidi önerilir.
- `altinMetin` eklenirse kullanım yerlerini değiştirmek N dosyaya dokunur (drift) → minimal versiyonda
  yalnız `solukMetin` yap, altını v1.x'e bırak.

### Kabul kriteri
- `solukMetin/kremZemin` ≥ 4.5:1 (hesapla/teyit). İkincil metinler gözle belirgin okunur.
- Hiçbir ekran düzeni bozulmadı (yalnız renk değişti). `npx tsc --noEmit` 0 hata.

### Efor: ~0.25 gün (minimal) – 0.5 gün (altın-metin ayrımı dahil). Bağımlılık: yok.

---

## İŞ 6 — Tatbikat kilidini düşür + Branş'ı gizle · [V6, 02 B2/B3, 03]

### Sorun (teyitli)
- **Tatbikat kilidi:** `src/app/(tabs)/tatbikat.tsx:70`
  `m.set(lawId, { ..., tamam: top > 0 && cal >= top })` → bir kanunun deneme sınavı ancak o kanunun
  TÜM kartları (`kutu>=1`) çalışılınca açılıyor (Disiplin 126 kart). `:197` `acik = durum?.tamam` →
  `:204-205` kilitliyse `/patika`'ya yollar. Yeni kullanıcı "kilitli satır denizi" görür.
- **Sessiz tuzak (K4):** Bir law'ın quiz'i VAR ama kartı YOKSA `durum` undefined → `acik=false` →
  KALICI kilit. Quiz law_id ↔ kart law_id eşleşmesi teyit edilmeli (DOĞRULANMADI).
- **Branş placeholder:** `tatbikat.tsx:118-123` `blok==='brans'` → "Çok yakında" DurumKutu;
  `mevzuat.tsx` branş segmenti de aynı (03: `mevzuat.tsx` branş yarısı her zaman placeholder;
  `mevzuat.tsx:112` liste `blok==='müşterek' && kartSayisi>0` ile zaten branşı filtreliyor ama
  segment kontrolü görünür).

### Değişiklik
1. **Kilit eşiğini düşür:** `tatbikat.tsx:70` `tamam` koşulunu yumuşat. Seçenekler:
   - (a) **Quiz hep açık** (en basit, önerilen): `tamam`'ı kilit için kullanma; satır her zaman
     `onSinav`'a gitsin (`:205` `acik ? onSinav : onCalis` → `onSinav`). İlerleme `calisilan/toplam`
     bilgi olarak kalır ama kilitlemez. `:204` `satirKilitli` stilini kaldır.
   - (b) **Eşik ≥%50:** `tamam: top > 0 && cal >= Math.ceil(top * 0.5)`. Daha tutucu; Mevzuat ilerleme
     tanımıyla (kutu>=1) tutarlı kalır.
   **Öneri:** (a) — deneme sınavı ölçüm aracıdır, kilitlemek öğrenme döngüsünü kapatır (05 P2-9).
2. **Quiz↔kart law eşleşme teyidi:** `:80-81` `musterek = laws.filter(... sinavVarMi(l.id) ...)`.
   `sinavVarMi` olan her law'ın `durumMap`'te (kart-temelli) karşılığı olduğunu doğrula; kartsız ama
   quizli law varsa (a) yaklaşımıyla zaten açılır (kilit yok) — (a) bu tuzağı da çözer. (b) seçilirse
   kartsız law için fallback `tamam=true` gerekir.
3. **Branş segmentini v1'de gizle:**
   - `tatbikat.tsx:95-116` blok seçici (`['müşterek','brans']`) → yalnız `['müşterek']` render et veya
     seçiciyi tümüyle gizle (tek blok varken segment anlamsız). `:118-123` branş DurumKutu erişilemez
     olur.
   - `mevzuat.tsx` aynı: branş segment kontrolünü v1'de gizle (03: `mevzuat.tsx:176-204` placeholder +
     segment). Müşterek-only liste zaten `:112` filtresiyle doğru.
   - `onboarding`/`brans-secici` branş SEÇİMİNİ tutar (rütbe/AsyncStorage), yalnız Mevzuat/Tatbikat
     segment YÜZEYİ gizlenir — kapsam beyanı (V9) ayrı.

### 4-dosya senkron etkisi: yok (UI).
### Risk
- Kilit kaldırılınca (a) "hiç çalışmadan sınava girip düşük skor" → caydırıcı his; ama 05 P2-9
  "sınav→eylem köprüsü" bunu zaten istiyor (yanlışlar zayıf havuza, İş 1 ile Etüt'e döner). Kabul.
- Branş segment gizleme: Mevzuat ve Tatbikat AYRI dosyalar → ikisinde de yap (drift). Onboarding
  "branşına özel içerik" iması varsa metin yumuşat (V9 kapsamı).
- Mevzuat ilerleme tanımı (`kutu>=1`) ile Tatbikat eşiği ayrışırsa kafa karışır (02 Riskler) → (a)
  yaklaşımı eşiği tümden kaldırdığı için bu çelişki YOK.

### Kabul kriteri
- Tatbikat'ta her müşterek kanun satırı (quiz'i olan) açılıp sınava girilebilir; "0/126 önce çalış"
  kilidi yok.
- Mevzuat ve Tatbikat'ta "Branş / Çok yakında" segmenti GÖRÜNMÜYOR. `npx tsc --noEmit` 0 hata.

### Efor: ~1 gün (kilit + eşleşme teyidi + 2 ekran segment). Bağımlılık: yok.

---

## İŞ 7 — Minimal jest + parite/SRS smoke testi · [V10, 01 P1, 00_EKSIKLER E5]

### Sorun (teyitli)
- `package.json` devDeps'te jest YOK; tüm saf mantık (`srs`/`queue`/`performans`/`sinav`/
  `kanun-kartlari`) test-edilebilir tasarlı ama 0 test. "web↔native parite" ve "SRS kutsal"
  değişmezleri yalnız cihaz-içi tespite mahkûm.

### Değişiklik
1. **Kurulum (`package.json`):** devDeps ekle: `jest`, `jest-expo` (SDK 54 uyumlu sürüm),
   `@types/jest`, `babel-jest`. `scripts`'e `"test": "jest"`. `jest.config.js` (veya package.json
   `"jest"`): `preset: 'jest-expo'`, `testMatch`/`roots: ['<rootDir>/src']`. **SÜRÜM SABİT** kuralı:
   jest-expo'yu SDK 54 ile uyumlu pinle (çekirdek sürümleri DEĞİŞTİRME).
2. **Yüksek-değerli minimal set (`src/__tests__/` veya `*.test.ts` yan yana):**
   - **`queue.test.ts` (parite + SRS çekirdeği):** `gunlukKuyruk(cards, srsMap, bugun, yeniLimit)`
     için: (a) due ayrımı (`sonraki_tarih <= bugun` → due, srs yok → yeni), (b) sıralama (due önce,
     tarih artan, eşitlikte id — `queue.ts:45-47`), (c) `yeniLimit=0` → yeni kart YOK (Etüt değişmezi),
     (d) `yeniLimit` slice. Bu, web+native AYNI saf fonksiyonu çağırdığından **parite kanıtı**.
   - **`srs.test.ts` (SRS kutsal + bilinen hatalar):** `sonrakiKutu`/`sonrakiTarih`/`srsGuncelle`:
     biliyorum→kutu+1, zor→1, tekrar→2 (`srs.ts:33-42`); `ARALIKLAR=[1,2,4,7,14,30]` indeksleme;
     **off-by-one'ı belgeleyen test** (`ARALIKLAR[0]=1` erişilemez — yeni kart kutu 0, ilk cevap ≥1 →
     min 2 gün) → İş 1 sonrası bu hata görünür, test "mevcut davranışı kilitler" + TODO notu.
   - **`getEtutKuyruk` birleştirme (İş 1):** saf birleştirme mantığını test et (due+zayıf dedup, due
     önce). Backend metodu IO'lu → ya saf bir `birlestirEtut(due, zayif)` helper'ı çıkar (test-edilebilir)
     ya da `queue.ts`'e dokunmadan `__tests__`'te map'le simüle et.
   - **`performans.test.ts` (opsiyonel, zayıf havuz):** `zayifKartlar` giriş ('zor'/'yanlis') / çıkış
     ("son 2 iyi") kuralı (`performans.ts`).
3. **CI/komut:** Yalnız yerel `npm test`; build/start YOK (CLAUDE.md). `npx tsc --noEmit` ayrı kalır.

### 4-dosya senkron etkisi: yok (test altyapısı).
### Risk
- jest-expo + RN 0.81 + Reanimated 4 transform çakışması olabilir → **yalnız saf `lib/` modüllerini**
  test et (RN bileşeni/Expo native modülü import eden dosyalara DOKUNMA) → preset karmaşası minimum.
  `db/database.*` IO'lu (sqlite/memory) → onları doğrudan test ETME; saf `lib/` yeterli.
- Sürüm pini: yanlış jest-expo sürümü SDK 54 çekirdeğini zorlayabilir → uyumlu sürümü pinle, lock'u
  kontrol et.

### Kabul kriteri
- `npm test` yeşil; en az `queue` + `srs` testleri geçiyor. `gunlukKuyruk` parite/sıralama/yeniLimit=0
  davranışı kilitli. Yeni `getEtutKuyruk` birleştirme testi var (İş 1 sonrası).
- `npx tsc --noEmit` hâlâ 0 hata; çekirdek sürümler değişmedi.

### Efor: ~1 gün. Bağımlılık: **İş 1** (Etüt birleştirme bağlandıktan SONRA test et).

---

## SIRA & BAĞIMLILIKLAR (uygula akışı)

```
Paralel/bağımsız (hemen):  İş 2 ─ İş 3 ─ İş 5 ─ İş 6   (UI/içerik/token, birbirinden bağımsız)
Kök iş:                    İş 1 (SRS→Etüt)  → sonra → İş 7 (testler İş 1'i kilitler)
İçerik hattı:              İş 4 (script kök-neden ÖNCE, override SONRA)  — bağımsız
```

**Önerilen tek-geliştirici sırası (toplam ~4–5 gün):**
1. **İş 5** (kontrast, 0.25g) — en hızlı, görünür, sıfır risk; ısınma.
2. **İş 2** (bildirim gizle, 0.5g) — bağımsız, mağaza-red yüzeyini kapatır.
3. **İş 3** (FLAG_SECURE, 0.5g) — başkan "SS bitti" teyidi alınca; bağımsız.
4. **İş 1** (SRS→Etüt, 0.5–1g) — ürünün ana vaadi; 4-dosya senkron; en yüksek değer.
5. **İş 7** (testler, 1g) — İş 1'den sonra; parite/SRS değişmezini kilitler.
6. **İş 6** (Tatbikat kilidi + Branş, 1g) — bağımsız ama akış/zayıf havuz (İş 1) ile birlikte düşün
   (sınav yanlışları İş 1 ile Etüt'e döner → köprü tamam).
7. **İş 4** (içerik, 1–1.5g) — paralel ilerleyebilir; script regen diff incelemesi dikkat ister.

**Her iş sonrası (CLAUDE.md FARZ):** `npx tsc --noEmit` 0 hata + (İş 1/7 için) web↔native parite
teyidi + 4-dosya senkron kontrolü + açıklayıcı Türkçe commit (mantıken ayrı işler ayrı commit) +
`PROJE_DURUM.md` güncelle (ne yapıldı, hangi commit, yeni karar/sorun).

## KARARLAR (başkan onayı gereken, kod öncesi)
- **İş 1:** Yaklaşım A (yeni `getEtutKuyruk`, 4-dosya senkron) vs B (component-merge). → **A öneriliyor.**
  Ayrıca Etüt akışı (`mod`) sayaçla aynı kuyruğu göstermeli (kritik).
- **İş 2:** "gizle (v1)" vs "FCM ile tamamla (v2)". → **gizle öneriliyor**; FCM backlog.
- **İş 3:** "SS alma işi bitti mi?" → bittiyse bayrak true. (Tek bloker.)
- **İş 6:** Kilit (a) "hep açık" vs (b) "≥%50". → **(a) öneriliyor.**
- **İş 5:** Yalnız `solukMetin` (minimal) vs +`altinMetin` ayrımı. → minimal v1, altın v1.x.
