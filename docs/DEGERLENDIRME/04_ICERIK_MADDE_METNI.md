# 04 — İÇERİK DOĞRULUĞU: Madde Metni + Kısaltma + Kanun↔Görsel Uyumu

> Kapsam: yalnız **resmî madde metni** doğruluğu + kısaltma kalitesi + görsel↔kanun/madde
> bağ tutarlılığı. Karikatür panel içeriğine BAKILMADI (o ayrı rapor).
> Yöntem: `maddeMetni(card.madde_no)` çözücüsü kod düzeyinde yeniden üretildi (565 görsel
> kartı → madde_no → MADDE_METINLERI⊕KART_MADDE_METINLERI lookup), metin başındaki "Madde N"
> jetonu ile kart numarası karşılaştırıldı, uzunluk/artefakt dağılımı çıkarıldı.
> Çözücü çağrı yeri doğrulandı: `src/app/akis.tsx:220` `maddeMetni(c.madde_no)` (anahtar = madde_no).

## Özet
- **Kapsam çok iyi:** 565 görsel kartının HEPSİ geçerli bir kanun/etikete bağlanıyor (eşleşmeyen prefix = 0), 513 madde-kartının (normal/ayırt/özet) HEPSİ bir madde metnine çözülüyor (**eksik metin = 0**). 52 genel-özet kartı kasıtlı metinsiz (tasarım gereği, sorun değil).
- **1 maddi hata (P0):** `jandteskyon_m25` (Jandarma Teşkilat Yön. m.25 görseli) → gösterilen resmî metin **m.26/27/29**, m.25 metni TAMAMEN YOK. Görsel↔metin uyumsuz.
- **6 sınır-kayması (P1):** kart "m.N" başlıklı ama metin komşu madde (genelde m.N−1 / m.N−2) ile BAŞLIYOR; çoğunda asıl madde metnin içinde mevcut ama yanıltıcı. Üretim (`npm run madde:uret`) blok-sınırı 1 madde geriden kesiyor.
- **Kısaltma stili tutarsız (P2):** 490 normal kartın 209'unda "Madde N –" başlığı atılıp "(1)" ile başlıyor (TCK/KVKK/Kabahatler/Tebligat/İl İdaresi); içerik doğru, sadece stil farkı.
- **Dipnot/değişiklik artığı gürültüsü (P2):** 21 entry'de "…7533/12 md." tarih kodu, 8 entry'de "RG-…", 31'inde "(Değişik/Ek/Mülga…)" gövde içinde. Sınav okuması için gürültü.
- **Aşırı uzunluk:** Disiplin m.8 = 18.873 karakter (fıkra (7)'den başlıyor → önceki fıkralar eksik olabilir, DOĞRULANMADI), Terörle Mücadele m.21 = 11.953. Tek kartta okunmaz.

## Bulgular (önem sırası)

### B1 — [P0] Jandarma Teşkilat Yön. m.25 kartı yanlış madde metni gösteriyor
- **Ne:** `jandteskyon_m25_1` görseli (m.25 karikatürü) `Jandarma Teşkilat Yön m.25` madde_no ile m.25 metnini çağırıyor; ama o anahtarın metni m.26/27/29 (m.25 hiç yok).
- **Nerede:** `src/assets/kart-madde-metinleri.ts` `"Jandarma Teşkilat Yön m.25"` → metin "MADDE 26- (1) Bir ceza infaz kurumundan… MADDE 27-… MADDE 29-". Görsel anahtarı `src/assets/kart-gorselleri.ts` `jandteskyon_m25_1`.
- **Kanıt:** metinde geçen madde jetonları yalnız `MADDE 26/27/29` (grep ile doğrulandı); `MADDE 25` yok.
- **Neden:** üretim betiği m.25 bloğunu m.26 başlığından başlatmış, m.25 düşmüş.
- **Etki:** Kullanıcı m.25 karikatürünü çalışırken altında alâkasız madde metnini okur → yanlış öğrenme. **Maddi hata.**
- **Öneri:** m.25 resmî metnini elle ekle (MADDE_METINLERI'ne override koy) veya kaynak bloğunu düzelt.

### B2 — [P1] Sınır-kayması: 6 kart komşu madde ile başlıyor (sistematik üretim hatası)
- **Ne / Nerede** (`src/assets/kart-madde-metinleri.ts`; metin başı parantez içinde):
  - `Türk Bayrağı m.2` → "Madde 1 … Madde 2 – Türk Bayrağı…" (m.2 mevcut, m.1 önce)
  - `Personel Yön m.24` → "MADDE 23- … MADDE 24-" (m.24 mevcut)
  - `6284 Uyg. Yön m.34` → "MADDE 33 – … MADDE 34 –" (m.34 mevcut)
  - `Resmî Yazışma m.38` → "MADDE 36- … MADDE 38-" (m.37 atlanmış; m.38 = yürürlük maddesi)
  - `İzin Yön m.22` → "MADDE 20- … MADDE 22-" (m.21 atlanmış; m.22 mevcut)
  - `İzin Yön m.8` → "MADDE 7- (2)… (4)… MADDE 8-" (m.7 fıkra parçaları + m.8; m.7 eksik fıkralı)
- **Neden:** `npm run madde:uret` blok ayıklamasında bir önceki madde başlığını da yutuyor → her kanunda 1-2 entry kayık (toplam doğrulanabilir 6 mismatch; bkz. an2.js diff dağılımı: kanunların %95'i diff0).
- **Etki:** Asıl madde metnin İÇİNDE olduğundan içerik kaybı çoğunlukla yok ama kart yanlış maddeyle açılıyor, okuyan kişi hangi maddeyi çalıştığını şaşırır. B1 bunun metin-tamamen-kayıp uç hali.
- **Öneri:** Bu 6 anahtarın metnini öndeki komşu maddeyi atacak şekilde kırp (veya override). Otomatik tarama yalnız "metin açık Madde-no ile başlayanları" yakalar; başlıksız grupta (aşağı) gizli kayma olabilir → DOĞRULANMADI.

### B3 — [P2] Kısaltma stili tutarsız: yarısında madde başlığı atılmış
- **Ne:** 490 normal kartın 281'i metne "Madde N –/MADDE N-" ile, 209'u doğrudan "(1)" fıkrasıyla başlıyor.
- **Nerede:** Başlıksız gruplar tüm bir kanunda tutarlı: TCK, KVKK, Kabahatler, Tebligat, İl İdaresi entry'lerinin TAMAMI "(1)…" ile açılıyor (ör. `TCK m.21`: "(1) Suçun oluşması kastın varlığına…").
- **Neden:** İki ayrı üretim kaynağı / farklı ayıklama kuralı.
- **Etki:** İçerik DOĞRU (spot-check: TCK m.1/21/247, Kabahatler m.1, İl İdaresi m.2, KVKK m.3 hepsi ilgili maddeyle eşleşiyor) — sadece görsel tutarsızlık; bazı kartta madde no metinde hiç görünmüyor.
- **Öneri:** Tek stil seç (tercihen "Madde N – …" korunsun, kullanıcı hangi madde olduğunu metinden de görsün).

### B4 — [P2] Mevzuat değişiklik/dipnot artığı gövdede gürültü yapıyor
- **Ne:** "(Değişik:RG-22/4/2009-27208)", "(Ek fıkra:21/11/2024-7533/12 md.)" gibi ibareler madde metninin içinde.
- **Nerede:** 8 entry'de `RG-…`, 21 entry'de `…/… md.`, 31 entry'de `(Değişik|Ek|Mülga|Yeniden…)` (ör. `2521 Tüfekler Yön m.12`, `6136 Ateşli Silahlar m.12`).
- **Etki:** Sınav ezberinde işe yaramayan tarih/RG kodları okuma yükü ekliyor; "(...)" elipsisleri ise temiz ve kasıtlı (sorun değil).
- **Öneri:** Üretimde `\((Değişik|Ek|Mülga|Yeniden)[^)]*\)` desenini ayıkla (içerik anlamı değişmez).

### B5 — [P2] Aşırı uzun ve fıkra-eksik kartlar
- **Ne:** Disiplin m.8 = 18.873 char (metin fıkra **(7)**'den başlıyor → (1)-(6) eksik olabilir, DOĞRULANMADI); Terörle Mücadele m.21 = 11.953; Sözleşmeli Sb/Asb m.13 = 5.287; Hizmet Esasları Yön m.4 = 5.331.
- **Nerede:** `src/assets/kart-madde-metinleri.ts` ilgili anahtarlar.
- **Etki:** Tek kartta okunmaz; madde-metni sheet'i çok uzun. Disiplin m.8 ayrıca fıkra kaybı şüphesi taşıyor.
- **Öneri:** Çok uzun maddeleri fıkra bazlı bölmeyi (zaten panel başına bölünüyor) değerlendir; Disiplin m.8 (1)-(6) fıkralarını doğrula.

### B6 — [Bilgi] Düşük sınav değerli "yürürlük/yürütme" maddeleri kart olmuş
- **Ne:** `Jandarma Kanunu m.26` = "Bu Kanun yayımı tarihinde yürürlüğe girer." (63 char), `Resmî Yazışma m.38` (yürürlük), `Türk Bayrağı m.5`/`TCK m.4` kısa ama bunlar gerçek kısa maddeler (truncation YOK — doğrulandı).
- **Etki:** Yürürlük/yürütme maddeleri sınavda sorulmaz; kart havuzunu şişirir. İçerik hatası değil, kapsam tercihi.

### B7 — [Olumlu] Görsel↔kanun bağ bütünlüğü sağlam
- 565 anahtarın hepsi `KANUN_BILGI` prefix'ine çözülüyor (NOBILGI/BADKEY = 0). Ayırt/özet kartları ilk üye maddesinin metnine bağlanıyor (ör. `atesli_m12_13x1` → `6136 Ateşli Silahlar m.12` metni var). `ailekoruma`(law10, 6284 Kanun) ve `aileuyg`(law21, Uyg. Yön) doğru ayrı; `atesli`(law25/6136), `tufekler`(law20/2521) tutarlı. Birleşik kart başlığı tüm üyeleri gösteriyor (`m.12–13 ayırt`).

## Hızlı kazanımlar
1. **B1 (jandteskyon m.25):** tek doğru madde metnini ekle/override → 1 P0 kapanır.
2. **B2 (6 sınır-kayması):** 6 entry'nin önündeki komşu madde başlığını kırp → yanıltıcı açılış biter.
3. **B4:** `(Değişik:RG-…)`/`…md.` dipnotlarını tek regex ile temizle → 30+ entry sadeleşir.
4. Genel-özet 52 kartın metinsizliği **doğru** — değiştirme.

## Riskler
- **Gizli kayma (DOĞRULANMADI):** 209 başlıksız kart "(1)…" ile başladığından otomatik numara doğrulaması yapılamadı; spot-check'ler temiz ama tam tarama yok → B2 türü kaymalar bu grupta sessizce olabilir. Üretim betiği düzeltilmeden tam garanti verilemez.
- **Fıkra kaybı:** Disiplin m.8'in (7)'den başlaması, uzun maddelerde baştaki fıkraların düşmüş olabileceğini düşündürüyor; örneklemle doğrulanmalı.
- Tüm metinler tek üretim hattından (`madde:uret`) geldiği için sınır-bug'ı düzeltilmezse her yeni içerik turunda tekrarlar.

## Somut adımlar (sıralı, tahmini efor)
1. **[P0, 15 dk]** `Jandarma Teşkilat Yön m.25` resmî metnini bul, `MADDE_METINLERI`'ne override ekle (öncelik MM). — B1
2. **[P1, ~1 sa]** 6 sınır-kayması anahtarını (Türk Bayrağı m.2, Personel Yön m.24, 6284 Uyg. Yön m.34, Resmî Yazışma m.38, İzin Yön m.8/m.22) öndeki komşu maddeyi atacak şekilde düzelt. — B2
3. **[P1, ~2 sa]** `madde:uret` blok-sınırı kuralını "başlık satırından İTİBAREN, bir önceki başlığı dahil etme" olacak şekilde düzelt + yeniden üret; sonra başlıksız 209 kartı örneklemle doğrula. — B2/Risk
4. **[P2, 30 dk]** Üretimde `(Değişik|Ek|Mülga|Yeniden …)` ve "…/… md." dipnotlarını ayıklayan temizleyici ekle. — B4
5. **[P2, ~1 sa]** Disiplin m.8 ve >5k char maddelerinde fıkra bütünlüğünü denetle; gerekiyorsa fıkra bölmesi. — B5
6. **[P2, karar]** Yürürlük/yürütme maddelerini (Jandarma Kanunu m.26, Resmî Yazışma m.38…) kart havuzundan çıkarmayı değerlendir. — B6
7. **[P2, 15 dk]** Kısaltma stilini tekleştir (madde başlığını koru). — B3

## Karşı-görüş & doğrulama (çoklu göz)
- **Yöntem doğruluğu:** Çözücü gerçek kodla birebir yeniden üretildi (`maddeMetni = MADDE_METINLERI ⊕ KART_MADDE_METINLERI`, anahtar=card.madde_no, çağrı yeri `akis.tsx:220` teyitli). 565/565 kart parse oldu.
- **Yanlış-pozitif kontrolü:** Mismatch'ler tek tek metinden okunarak doğrulandı (jandteskyon m.25 gerçekten m.25 içermiyor; diğer 6'sında asıl madde metinde mevcut → "yanıltıcı ama içerik var" ayrımı yapıldı).
- **Yanlış-negatif sınırı (itiraz):** Detektör yalnız metin başı "Madde N" jetonu olanları kıyasladı; 209 başlıksız kartta sessiz kayma DOĞRULANMADI olarak işaretlendi — bu raporun en zayıf noktası, üretim betiği düzeltilip tam tarama yapılmadan "%100 temiz" denemez.
- **Olumlu teyit:** Eksik-metin = 0, prefix-eşleşmesi = %100; içerik kapsamı beklenenden iyi, sorunlar nokta-atışı düzeltilebilir nitelikte.

---
## KARSI-GORUS & DOGRULAMA (kirmizi takim)

> Bağımsız teyit: çözücü (`src/db/madde-metinleri.ts:411-413` → `MADDE_METINLERI[no] ?? KART_MADDE_METINLERI[no] ?? null`, çağrı `akis.tsx:220`), B1/B2/B3/B5/B6 örnekleri kodtan tek tek okundu. Aşağıda iddiaların doğrulama notu + raporun GÖZDEN KAÇIRDIĞI sistemik nokta.

### Doğrulananlar (rapor haklı)
- **B1 — DOĞRU [Güven: Yüksek].** `kart-madde-metinleri.ts:142` `"Jandarma Teşkilat Yön m.25"` metni gerçekten MADDE 26 ile başlıyor, m.25 hiç yok. Ufak düzeltme: metin yalnız m.26/27/29 değil, **MADDE 32 ve 33'ü de** içeriyor (rapordaki enumerasyon eksik; sonucu değiştirmez). m.25'in `MADDE_METINLERI` el-yazımı override'ı YOK (orada yalnız m.8/18/19/21/38/45/67/70 var), bu yüzden bozuk registry değeri ekrana düşüyor — çözücü zinciri teyitli.
- **B2 örnekleri — DOĞRU [Yüksek].** `Türk Bayrağı m.2` (satır 355, "Madde 1 – … Madde 2 –"), `Resmî Yazışma m.38` (satır 269, "MADDE 36- … MADDE 38- … MADDE 39-", m.37 atlanmış) kodtan birebir doğrulandı.
- **B3 — DOĞRU [Yüksek].** `TCK m.1` (satır 295) ve `TCK m.21` (satır 298) "(1)…" ile başlıyor, başlıksız. Ek teyit: TCK'nın 48 entry'sinin TAMAMI `KART_MADDE_METINLERI`'nde (MM'de TCK override'ı YOK → grep 0) → kullanıcı gerçekten başlıksız metni görüyor, override maskelemesi yok. Bu alt-iddia sağlam.
- **B6 — DOĞRU [Yüksek].** `Jandarma Kanunu m.26` (satır 131) = "Bu Kanun yayımı tarihinde yürürlüğe girer." (yürürlük). Doğru.

### Düzeltme/itiraz: rapor B5'teki "DOĞRULANMADI"yı ZAYIF işaretlemiş — aslında DOĞRULANDI
- **Disiplin m.8 fıkra kaybı GERÇEK [Yüksek].** Metin birebir `"MADDE 8- (7) (...)"` ile başlıyor (satır 75). Başlık ("MADDE 8-") var ama numaralandırma doğrudan **(7)**'ye atlıyor → fıkralar **(1)-(6) gerçekten eksik**. Rapor bunu "DOĞRULANMADI/şüphe" diye geçmiş; kanıt nettir, **şüphe değil teyitli içerik kaybı** olarak P1'e çekilmeli (18.873 char'lık dev kartın yarısı yanlış değil, EKSİK).

### EN ÖNEMLİ İTİRAZ: B1 tekil değil — sistemik "çok-maddeli birleştirme"nin uç hali; B2'nin "6" sayısı TABAN, gerçek değil [Yüksek]
Detektör yalnız **metin-başı "Madde N" jetonunu** kart no'su ile kıyaslıyor. Bu yapısal olarak şunu KAÇIRIR: *etiketlenen madde metnin BAŞINDA doğru ama arkasına komşu maddeler EKLENMİŞ* durumlar (başlangıç eşleşince flag yok). `Jandarma Teşkilat Yön`'de doğrudan okunan örnekler:
- `m.1` (satır 138) = MADDE 1 **+ MADDE 2**
- `m.5` (satır 151) = MADDE 5 **+ MADDE 6**
- `m.39` (satır 144) = MADDE 39 **+ MADDE 40**
- `m.52` (satır 152) = MADDE 52 **+ 54 + 55 + 56 + 57**
- `m.58`/`m.61`/`m.65`/`m.74`… benzer kümeler; `m.61` (satır 156) = 61 **+ 62 + 63 + 64**
- `Resmî Yazışma m.38` = 36 **+ 38 + 39**

Yani üretim betiği **bir maddeyi değil, blok sonuna kadar peş peşe maddeleri** topluyor. B1 (m.25) bunun yalnızca "etiketli madde ilk sırada DEĞİL → flag yedi" hali. Dolayısıyla:
- **B2'deki "6 sınır-kayması" gerçek kapsamın TABANIDIR**, tavanı değil. Çok-maddeli birleştirme (ilk madde doğru, kuyrukta fazlalık) detektörce HİÇ sayılmadı → onlarca entry potansiyel olarak etiketinden fazla madde gösteriyor. Uygulamanın bütün pedagojik temeli "bu kart = bu madde" iken, m.52 kartı 5 maddeyi, m.25 kartı 6 maddeyi gösteriyor → kart↔madde bağı bu altküme için bozuk. Rapor bunu "içerik içeride, sorun yok" diye hafifletmiş; **mislabel + B5 uzunluk şişmesinin kök nedeni** burası.
- **Sessiz tam-kayıp riski daha yüksek [Orta-Yüksek]:** Başlıksız 209 kart ("(1)…") + başı "MADDE N" olmayanlar (ör. `m.3` satır 143 "a) Asayiş:" ile başlıyor — başlık+intro yok) detektörce doğrulanamadı. Birleştirme mantığı blok başını 1 madde kaydırabildiği için, m.25-tipi **etiketli maddenin TAMAMEN düştüğü** başka kartlar bu grupta gizli olabilir. Rapor bunu zaten "raporun en zayıf noktası" diyor (dürüst), ama mekanizmayı (concatenation kayması) somutlaştırınca risk "olabilir"den "muhtemel"e yükselir.

### Atlanan: MM ↔ registry ÇAKIŞMASI (bakım riski)
`Jandarma Teşkilat Yön m.70` HEM `MADDE_METINLERI` (temiz, tek madde — `madde-metinleri.ts:50`) HEM `KART_MADDE_METINLERI`'nde (kirli, 70+71+72+73 — satır 159). Çözücü MM'i kazanıyor, kullanıcı temizini görüyor. İyi haber: **düzeltme deseni zaten mevcut** (el-yazımı override registry'yi ezer + `madde:uret` regen'inde KORUNUR). Kötü haber: aynı içerik iki yerde, registry kopyaları bayat/yanlış; rapor bu çift-kaynak çakışmasını hiç anmıyor. Bu, somut adımlar için kritik çünkü →

### Önceliklendirme eleştirisi
- Rapor **Adım 2'de 6 entry'yi "registry'de kırp" diyor** — ama registry (`kart-madde-metinleri.ts`) `npm run madde:uret` ÇIKTISIDIR; elle düzenleme **bir sonraki regen'de EZİLİR** (rapor bunu Riskler'de söylüyor ama adımla çelişiyor). Tutarlı olan: Adım 2 de **Adım 1 gibi `MADDE_METINLERI` override**'ı kullanmalı (MM regen'den etkilenmez, registry'yi ezer). Yani "registry'de kırp" → "MM'e doğru tek-madde metni ekle" olarak düzeltilmeli.
- **Kök-neden (Adım 3, `madde:uret` blok-sınırı) P0/P1'e çekilmeli, nokta-yamalardan ÖNCE.** Çünkü (a) sorun 6 değil sistemik (yukarıda), (b) yamalar geçici. Doğru sıra: önce üretim mantığını "başlık satırından bir sonraki başlığa kadar, komşu maddeyi dahil etme" diye düzelt + yeniden üret + başlıksız 209'u örnekle; SONRA kalan tekil hataları MM override ile kapat.

### Sayısal iddialar [Güven: Orta]
565/513/52/490/209/281/6 sayıları detektör yeniden koşulmadan bağımsız türetilmedi (DOĞRULANMADI); iç tutarlı ve makul, rapor yöntemi şeffaf. Örneklemler temiz çıktığından kabul edilebilir ama "6 mismatch" tam sayı DEĞİL, alt sınır (yukarıdaki birleştirme nedeniyle).

### Net hüküm
Rapor **gerçek bir P0 (B1) ve gerçek bir sistemik bug'ı doğru teşhis etti, zayıf noktasını dürüstçe işaretledi** — sağlam iş. İki düzeltme şart: (1) B2'nin ölçeği "6 kayma" değil "çok-maddeli birleştirme = düzinelerce entry'de etiket-fazlası içerik + gizli tam-kayıp riski"; (2) somut adımlar kök-neden (`madde:uret`) + MM-override'ı öne almalı, registry-elle-yama'dan kaçınmalı. Genel güven: **Yüksek** (örnekler kodtan birebir teyitli).
