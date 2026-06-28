# 12 — İÇERİK TAM SİSTEMATİK TARAMA: Madde Metni ↔ Görsel ↔ Kanun

> Kapsam: **04_ICERIK_MADDE_METNI.md** örnekleme yaptı; bu rapor TAM sistematik tarama +
> **kök-neden doğrulaması** yapar ve 04'ün bazı hipotezlerini **MASTER kaynağa bakarak düzeltir**.
> Yöntem: üç veri katmanı kod düzeyinde yeniden üretildi ve çapraz koşuldu —
> `src/assets/kart-gorselleri.ts` (565 görsel anahtarı), `src/db/madde-metinleri.ts`
> (`MADDE_METINLERI`, 90 el-yazımı), `src/assets/kart-madde-metinleri.ts`
> (`KART_MADDE_METINLERI`, 355 üretilen); `seed.ts gorselKartlari()` + `maddeMetni()`
> (`src/db/madde-metinleri.ts:411`) birebir simüle edildi. Şüpheli her vaka, içerik fabrikası
> MASTER md kaynağına (`D:/JSPS Fabrika/.../KANUN_MASTER_DOSYALARI/MUSTEREK/*/​*MASTER*.md`)
> ve üretici betiğe (`scripts/madde-metni-uret.mjs`) bakılarak DOĞRULANDI.

## Özet sayılar
- **565 görsel anahtarı → 565 kart.** Eşleşmeyen/önek-dışı görsel = **0**, bozuk anahtar = **0**
  (her PNG geçerli bir kanuna ve madde_no'ya çözülüyor). Dağılım: normal 490, ayırt 21, özet 2,
  genel-özet 52.
- **Görseli olup madde metni eksik normal kart = 0.** 490 normal kartın HEPSİ bir resmî metne
  çözülüyor (placeholder "Yer tutucu" yalnız `anlatim_metni` alanında, ekranda kullanılmıyor;
  metin `maddeMetni()` ile gelir). **(a) bulgu boş — bu güçlü bir pozitif.**
- **Metin kayıtları toplam 420 anahtar; karta bağlı 363; bağsız (öksüz) 57.** → 57 maddede
  resmî metin HAZIR ama o maddenin GÖRSELİ/kartı YOK (içerik hattı görselde geride).
- **İlk "MADDE N" jetonu kart numarasından farklı: 7 anahtar.** Hepsi `KART_MADDE_METINLERI`
  (üretilen). **MASTER kaynak doğrulaması: 7'sinin de KÖK NEDENİ aynı — bunlar bilinçli
  "birleşik/küme kart"; üretici hatası DEĞİL** (bkz. B1, 04'ün "sınır kayması" hipotezi düzeltildi).
- **Tek metinde >1 ardışık madde (çok-madde birleştirme): 39 anahtar.** Hepsi MASTER'da tek
  📜 blokta gruplanmış küme kartlar; üye maddeler kapsamda AYRI listelenmemiş (boş patika düğümü
  oluşmuyor — bilinçli tasarım, B3'te kanıt).
- **Sadece 25/66 kanunda görsel/kart var** (müşterek 1-25; KANUN_BILGI yalnız bu 25'i tanır).
  Branş kanunları (CMK, KTK, Orman… law_id 26-66) **0 kart** — bilinen üretim durumu.

---

## B1 — [04'ÜN P0/P1 HİPOTEZİ DÜZELTİLDİ] "İlk MADDE N ≠ kart no" vakalarının hepsi bilinçli küme kart

04 raporu 7 vakayı "üretici blok-sınırı 1 madde geriden kesiyor (off-by-one)" diye işaretledi.
**Bu hipotez yanlış.** 7 vakanın HER BİRİ, içerik fabrikası MASTER md'sinde bilinçli olarak
BİRDEN ÇOK maddeyi tek karta gruplayan "küme/birleşik" karttır; kart ID'si grubun bir TEMSİLCİ
maddesidir (en küçük üye olmak zorunda değil). Üretici (`madde-metni-uret.mjs:155-162`) ID'deki
`MADDE NN-` numarasını anahtar yapıp tüm 📜 bloğu olduğu gibi saklar — metin sadık, yalnız ilk
"Madde" başlığı (en küçük üye) anahtardan farklı görünür.

| metin anahtarı | ilk başlık | MASTER ID etiketi (kanıt) | kart var mı? | beklenen madde metinde? |
|---|---|---|---|---|
| `Türk Bayrağı m.2` | Madde 1 | `2893 MADDE 02-1` — "m.1+2 Amaç + şekil" | `bayrak_m2_1` | **EVET** (1+2) |
| `Personel Yön m.24` | MADDE 23 | `PERSONELYON MADDE 24-1` — "m.23-24 Kişisel sorumluluk" | `personelyon_m24_1` | **EVET** (23+24) |
| `6284 Uyg. Yön m.34` | MADDE 33 | `6284UYG MADDE 34-1` — "m.33-34 İtiraz" | `aileuyg_m34_1` | **EVET** (33+34) |
| `Resmî Yazışma m.38` | MADDE 36 | `RESMIYAZISMA MADDE 38-1` — "m.36/38 Yetki+Yürürlük" | *kart yok (öksüz)* | EVET (36,38,39) |
| `İzin Yön m.8` | MADDE 7 | `JGKIZIN MADDE 08-1` — "m.7-8 İzin sıra çizelgesi" | *kart yok (öksüz)* | EVET (7+8) |
| `İzin Yön m.22` | MADDE 20 | (m.20-22 küme) | *kart yok (öksüz)* | EVET (20+22) |
| `Jandarma Teşkilat Yön m.25` | MADDE 26 | `JANDYON MADDE 25-1` — "**m.25-35 Tutuklu/Hükümlü sevk (küme)**" | `jandteskyon_m25_1` | **HAYIR** |

- **Öneri:** Bu 7 satır için düzeltme = "üreticiyi düzelt" DEĞİL. İçerik tasarımı kasıtlı.
  Tek gerçek problem son satır (B2).
- Kanıt (Türk Bayrağı): MASTER satır 35 → `📜 **Metin:** "Madde 1 – … Madde 2 – …"`,
  başlık satır 34 "m.1+2 Amaç ve Bayrağın Şekli".

## B2 — [P2, tek gerçek içerik açığı] Jandarma Teşkilat Yön. m.25 küme kartında m.25'in KENDİ metni yok

- **Ne:** `jandteskyon_m25_1` kartı "m.25-35 sevk/nakil kümesi" temsilcisi; `Jandarma Teşkilat
  Yön m.25` metni m.26/27/29/32/33 fıkralarını içeriyor, **m.25'in literal metni YOK**.
- **Kanıt:** MASTER `25_JANDARMA_TESKILAT_YON_MASTER.md:115-116`, 📜 blok "MADDE 26- … MADDE 27-
  … MADDE 29- … MADDE 32- … MADDE 33-" (m.25 başlığı blokta yok).
- **Neden P0 değil:** İçerik bilinçli küme; SEED_KAPSAM[17]'de m.25 kümenin TEMSİLCİSİ olarak
  tek başına listeli, m.26-35 ayrı düğüm DEĞİL (B3) → "yanlış madde gösteriliyor" değil,
  "temsilci madde başlığı altında küme kuralları" durumu.
- **Kalan risk:** Sınav m.25'in kendine özgü (sevk/nakil kapsam tanımı) metnini ayrıca sorarsa
  literal metin uygulamada yok. **Doğrula:** m.25 standalone sınav içeriği taşıyor mu?
  Taşıyorsa `MADDE_METINLERI`'ne (el-yazımı, öncelikli — `madde-metinleri.ts:18`) m.25 metnini
  override ekle; taşımıyorsa kart başlığını "m.25-35" netleştirmek yeterli.

## B3 — [DOĞRULANDI, sorun DEĞİL] Çok-madde birleştirme (39 anahtar) boş patika düğümü ÜRETMİYOR

39 küme kartının hepsinde üye maddeler kapsamda (`SEED_KAPSAM`) AYRI listelenmemiş; yalnız
temsilci madde kapsamda. Örnek doğrulamalar (görsel madde no = temsilci, ek üyeler kapsamda yok):

| temsilci kart | metindeki üyeler | kapsamda ayrı düğüm? |
|---|---|---|
| `Personel Yön m.38` | 38,39,40,41 | yalnız 38 (39/40/41 yok) |
| `6284 Uyg. Yön m.42` | 42,43,44,45,46 | yalnız 42 |
| `Jandarma Teşkilat Yön m.52` | 52,54,55,56,57 | yalnız 52 |
| `Sözleşmeli Sb/Asb Yön m.16` | 16,17,18,19 | yalnız 16 |
| `Personel Yön m.46` | 46,47,50 | yalnız 46 |

→ `_patika` (`seed.ts:387`) her kapsam maddesine düğüm açar; üye maddeler kapsamda olmadığı
için **boş düğüm oluşmaz, içerik kaybı yok.** Tasarım tutarlı.
**Tam liste (39):** 2521 Tüfekler m.1/m.8/m.12/m.18; 6284 Ailenin m.1; 6284 Uyg. m.7/m.34/m.39/m.42;
Disiplin m.1/m.20/m.25; Hizmet Esasları m.1/m.26/m.34; İzin m.8/m.22; Jandarma Teşkilat m.1/m.5/m.25/m.39/m.52/m.61;
OHAL m.5/m.12; Personel m.1/m.18/m.24/m.25/m.35/m.38/m.46/m.51/m.54; Resmî Yazışma m.6/m.38;
Sözleşmeli Sb/Asb Yön m.16/m.23; Türk Bayrağı m.2.
- **Kalan kozmetik risk (P3):** Temsilci en küçük üye DEĞİLKEN (m.36/38→38, m.1+2→2, m.33-34→34)
  patika düğüm adı kapsam etiketinden gelir (doğru), ama Ara ekranında (`lib/ara.ts`) kart
  başlığı "m.38" iken metin "MADDE 36" ile başlar → kullanıcı için hafif kafa karışıklığı,
  yanlış bilgi değil.

## B4 — [P2, ters açık] 57 maddede resmî metin HAZIR ama kart/görsel YOK (öksüz metin)

`maddeMetni()` ile çözülebilen ama hiçbir karta bağlı OLMAYAN 57 metin anahtarı. İçerik metni
üretilmiş, görsel PNG üretilmemiş → o maddeler uygulamada hiç görünmüyor. Kanun bazında:

- **İzin Yön (9):** m.6,8,9,10,11,12,16,18,22  *(kanunun yalnız 2 görseli var: m.5, m.20)*
- **Resmî Yazışma (8):** m.1,9,12,14,20,28,30,38
- **2521 Tüfekler Yön (8):** m.1,4,5,7,8,11,12,18  *(yalnız 4 görsel)*
- **Jandarma Kanunu (7):** m.5,6,19,20,22,24,26
- **OHAL (5):** m.4,5,8,10,12
- **KVKK (4):** m.11,12,13,18
- **6136 Ateşli Silahlar (4):** m.4,5,13,15
- **KV Silme Yön (3):** m.4,7,12
- **Bilgi Edinme Yön (3):** m.10,13,14
- **Disiplin (2):** m.2,3  · **Terörle Mücadele (2):** m.5,6 · **Hizmet Esasları Yön (1):** m.34
- **4733 (1):** m.8  *(el-yazımı + sesli, ama görsel registry'de 4733 yok → kartsız)*
- **Öneri:** İçerik/görsel üretim sırasında bu maddelerin görseli üretilince kart otomatik doğar
  (kök-neden: görsel hattı metin hattının gerisinde). Kod düzeltmesi gerekmez; üretim takibi.

## B5 — [TEMİZ] Görsel↔kanun bağ tutarlılığı (d)
- Önek-dışı (KANUN_BILGI'de olmayan) görsel = **0**; bozuk `m<no>` deseni = **0**.
- 25 öneklerin tümü `seed.ts KANUN_BILGI` (138-164) ↔ `madde-metni-uret.mjs ETIKET` (23-49) ile
  birebir; etiket sapması yok. Görsel madde no ile bağlandığı law_id arası çelişki saptanmadı.

---

## Önceliklendirilmiş düzeltme listesi

| # | Önem | Vaka | Etkilenen kart | Önerilen düzeltme | Kök-neden |
|---|---|---|---|---|---|
| 1 | **P2** | Jandarma Teşkilat m.25 küme kartında m.25 literal metni yok | `jandteskyon_m25_1` (1 kart) | m.25 standalone içerik taşıyorsa `MADDE_METINLERI`'ne override ekle; aksi halde kart başlığını "m.25-35 küme" netleştir | İçerik tasarımı (küme); üretici sadık |
| 2 | **P2** | 57 maddede metin hazır, görsel/kart yok | 0 kart (öksüz metin) | Görsel üretim hattını bu maddelere yönlendir → kart otomatik doğar | Görsel hattı metin hattının gerisinde |
| 3 | **P3** | Temsilci ≠ en küçük üye olan küme kartlarda Ara'da başlık/metin baş madde sapması | 7 küme kartı | İsteğe bağlı: kart başlığına üye aralığını yaz ("m.36/38") | Tek-madde_no şeması küme aralığını taşımıyor |
| 4 | — | (a) görseli olup metni eksik kart | **0** | yok | — |
| 5 | — | (d) önek/law tutarsızlığı | **0** | yok | — |

## 04 raporuna göre netleştirmeler (tekrar değil — düzeltme)
- 04 "B1 [P0] Jandarma m.25 yanlış metin" + "6 sınır-kayması [P1] üretici off-by-one" dedi.
  **Bu rapor MASTER kaynağa bakarak gösterdi: 7 vakanın hepsi bilinçli küme kart, üretici
  off-by-one DEĞİL.** Gerçek maddi-hata riski yalnız Jandarma m.25'te ve o da "yanlış madde"
  değil "küme temsilcisinin kendi literal metni yok" — P0 değil P2.
- 04'ün "kısaltma stili / dipnot gürültüsü / aşırı uzunluk" gözlemleri geçerli (bu rapor onları
  yeniden ölçmedi; içerik-kalite ayrı iş).

## Yöntem notu / üretilebilirlik
Tarama betikleri sistem temp'inde (repo'ya yazılmadı); üç registry CommonJS olarak yüklenip
`seed.ts gorselKartlari` + `maddeMetni` mantığı birebir koşuldu. Sonuçlar deterministik;
`npm run madde:uret`/`gorsel:uret` ile registry yenilenince yeniden üretilebilir.
