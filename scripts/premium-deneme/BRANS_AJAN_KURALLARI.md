# Branş sınav provası — ajan kuralları (ZORUNLU, harfiyen uy)

Görev: tek bir branş (veya sana verilen birkaç branş) için JSPS sınav provasının **branş bölümü** sorularını yazmak.
Sorular mevzujsps.com/sinavprovasi sitesinde binlerce adaya gösterilecek. **Tek bir yanlış cevap bile kabul edilmez.**
Hız ikinci planda; doğruluk birinci.

## 1. Ne üreteceksin
- Çalışma klasörü: `D:\GorselHafizaTeknikleriyleJSPS` (komutları buradan çalıştır).
- Çıktı dosyası: `scripts/premium-deneme/kaynak/tahmin-brans-<brans>.json` (UTF-8, JSON dizi).
  - `<brans>` = paket klasörünün adı (ör. `havacilik`, `personel`, `ikmal`).
- **Soru sayısı: 40.** İSTİSNA — **havacılık**: 19 Eylül havacılık sınavında müşterek bölüm 70. soruya kadar sürdü, branş 30 soru.
  Havacılık için İKİ dosya yaz:
  - `tahmin-brans-havacilik-ek.json`: 10 soru, müşterek kök paketlerden (`scripts/altin-ozet/paketler/pack_18.json` … `pack_25.json`), denetle klasörü `''`.
  - `tahmin-brans-havacilik.json`: 30 soru, `havacilik` klasöründen.
- Başka HİÇBİR dosyayı değiştirme. git komutu çalıştırma. Siteyi/üreticileri (prova-uret.py, aciklama.py, birlestir.py) ÇALIŞTIRMA.

## 2. Soru biçimi (her öğe)
```json
{"law": 70, "tip": "duz", "k": "Soru kökü …?", "s": ["DOĞRU cevap", "çeldirici", "çeldirici", "çeldirici", "çeldirici"], "kanit": ["paket metninden birebir cümle parçası"]}
```
- `law`: paketin `law_id`si (dosya adı `pack_<law>.json`).
- `s[0]` HER ZAMAN doğru cevaptır (şıklar sonradan karıştırılır). Tam 5 şık.
- `tip`: `duz` | `olumsuz` | `oncullu` | `vaka`.
- `kanit`: 1–3 öğe. Her öğe paketteki madde metninden **kopyala-yapıştır**, en az ~8 kelime, doğru cevabı içeren/destekleyen cümle.
  İlk kanıt doğru cevabın geçtiği cümle olsun (sitede açıklama olarak bu cümle gösterilir).

## 3. Kaynak: SADECE paket metni
- Paketler: `scripts/altin-ozet/paketler/<brans>/pack_<law>.json` → `maddeler[].metin`. Liste: `<brans>/liste.json`.
  Paketler Ek-1 emrinin kapsadığı maddeleri içerir; **paket dışı madde/bilgi kullanma, kendi bilgine dayanma.**
- Paket metnini python ile oku (`json.load(..., encoding='utf-8')`), kanıtı oradan kopyala.
- KULLANMA:
  - "Mülga", "(Mülga", "MÜLGA", "İptal", "yürürlükten kaldırılmıştır" ifadeli hükümler.
  - "editör teyidi", "yeniden değerleme", "kesin TL" notu taşıyan veya TL tutarı soran hükümler (tutar değişkendir).
  - Dipnot/değişiklik künyesi ("2/7/2018 tarihli ve 703 sayılı KHK'nin … ibaresi") gibi metinler.
  - Anlamı belirsiz, OCR bozuk, yarım kesilmiş cümleler.

## 3A. EK-1 MADDE KAPSAMI (6 Eki eklendi — EN SIK HATA)
- Paketler bazı mevzuatlarda emrin saymadığı maddeleri de içeriyor. **Paket = kapsam DEĞİL.**
- Emrin madde listesi: `scripts/_emir-madde-kapsam.json` → `kapsam[<branş veya "müşterek">][<law>]` = izinli madde numaraları.
  Law orada yoksa emir "Tamamı" demektir (sınır yok). Varsa YALNIZ o numaralı maddelerden soru yaz.
- Ek madde / geçici madde: listede açıkça "Ek Madde N" geçmiyorsa KULLANMA (3713 Ek Madde 2 gibi istisnalar emirde açıkça yazılıdır).
- Bitirmeden: `python -X utf8 scripts/premium-deneme/tahmin/kapsam-denetle.py` → kendi dosyan için "KAPSAM DIŞI" ve "?" satırı KALMAMALI.

## 4. Tekrar yasağı
- 19 Eylül 2026'da sorulmuş sorular (varsa) AYNI bilgiyi tekrar sorma:
  `scratchpad/Subay_Bakim_61_100.md`, `Subay_Havacilik_71_100.md`, `Subay_Maliye_61_100.md`, `Subay_Personel_61_100.md`
  (diğer branşların kitapçığı yok). Önce bu dosyayı oku, sorulan maddeleri/ bilgileri listele, onlardan kaçın.
- `scripts/premium-deneme/kaynak/tahmin-*.json` dosyalarındaki kanıtlarla aynı bilgiyi sorma (ortak yönetmelikler, ör. Harcama Belgeleri law 99, ek 10 için law 18-25).
- Kendi dosyanda iki soru aynı bilgiyi sormasın.

## 5. Dağılım ve tarz (ATA-AÖF / ATAUZEM tarzı)
- Paketteki mevzuata madde sayısıyla orantılı yay; her paketten en az 1 soru (40'tan fazla paket yoksa). Tek kanuna yığma.
- Tip dağılımı (40 soru için): ~28-30 `duz`, 6-8 `olumsuz`, 2-3 `oncullu`, 1-2 `vaka`.
- Kök kalıbı: "<Mevzuatın tam adı>'na göre … hangisidir?" / "… ne kadardır?" / "… kimdir?". Kök tek başına anlaşılır olsun, "?" ile bitsin.
- `olumsuz`: kökte "… aşağıdakilerden hangisi … DEĞİLDİR / … sayılmamıştır / … yanlıştır?" Doğru cevap (s[0]) metinde OLMAYAN/yanlış olan şık;
  diğer 4 şık metinde AÇIKÇA geçen doğrular olmalı ve her biri için kanıt ekle (kanıt 2-3 öğe olabilir).
- `oncullu`: kökte "\nI. …\nII. …\nIII. …" öncülleri; şıklar şu 5'i: "Yalnız I", "Yalnız II", "I ve II", "II ve III", "I, II ve III"
  (doğru olanı s[0]'a koy, diğer 4'ü sırayla). Yanlış öncülün yanlışlığı metinle kanıtlanabilir olsun.
- `vaka`: kısa somut olay ("Bir astsubay … ") + mevzuata göre ne olur.
- Rakam/süre/makam/oran soruları değerli: çeldiriciler aynı türden makul değerler (ör. 15 gün → 7, 10, 30, 60 gün).
- Çeldiriciler: aynı kategoriden, gerçekçi, ama metne göre KESİN yanlış. "Hepsi/Hiçbiri" kullanma. Şıklar arasında doğru cevaba
  eşdeğer/kapsayan ikinci bir doğru OLMASIN. Doğru şık diğerlerinden belirgin uzun olmasın.
- Rütbe nötr yaz (hem subay hem astsubay çözecek). Branşa özel terimleri metindeki gibi kullan.

## 6. Doğrulama (bitirmeden ÖNCE, zorunlu)
1. `python -X utf8 scripts/premium-deneme/denetle.py scripts/premium-deneme/kaynak/tahmin-brans-<brans>.json <brans>` → **sorunlu 0** olmalı.
   (havacılık ek dosyası için klasör argümanı `''`.)
2. Her soruyu tek tek yeniden oku: kanıt cümlesini paketteki maddenin TAMAMIYLA karşılaştır.
   - s[0] metne göre kesin doğru mu? Diğer 4 şık metne göre kesin yanlış mı? Maddenin başka fıkrası bir çeldiriciyi doğru yapıyor mu?
   - Kök "göre" dediği mevzuat, `law` paketiyle aynı mı?
   Şüpheli olan soruyu düzelt ya da başka maddeden yenisiyle değiştir.
3. `python -X utf8 scripts/premium-deneme/tahmin/kapsam-denetle.py` → kendi dosyan için satır çıkmamalı (bkz. 3A).
4. `python -X utf8 -c "import json;q=json.load(open('<dosya>',encoding='utf-8'));print(len(q));import collections;print(collections.Counter(x['tip'] for x in q));print(all(len(x['s'])==5 and len(set(x['s']))==5 for x in q))"` → sayı doğru, `True`.

## 7. Bitince raporla (kısa)
- Dosya yolu, soru sayısı, tip dağılımı, hangi law'dan kaç soru, denetle sonucu.
- 19 Eylül kitapçığından kaçındığın konular (1 satır).
- İçinden emin olmadığın soru varsa numarasıyla söyle (olmamalı; varsa değiştir).
