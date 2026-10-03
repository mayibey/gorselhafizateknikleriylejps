# GÖREV: Madde blokları (2. aşama) — her madde için özet, "sınavda nasıl soruluyor", "akılda tut", "karıştırılanlar"

## Bağlam
JSPS sınav uygulamasının Harekât Merkezi'nde kullanıcı bir kanunun check-up'ını çözer. Sonra **Bana özel konu özeti** açılır:
yanlış yaptığı her madde için bir **madde bloğu**. Bugün blokta şunlar var: o maddede yanlış yaptığı sorular, o maddenin
**Altın Özet kartları** (hüküm + "Sınavda böyle yazarlar" + "Doğrusu"), sayı/makam ezber satırları, karıştırılan madde düğmeleri.

Şimdi her bloğun **en üstüne** senin yazacağın metinler gelecek:
- **başlık** (maddenin konusu),
- **öz** (maddeyi 2-4 sade cümleyle anlatan paragraf),
- **Sınavda nasıl soruluyor** (soru kalıbı + şıklarda neyin yer değiştirdiği),
- **Akılda tut** (akılda kalıcı kodlama, çağrışım, karşılaştırma),
- **Karıştırılanlar** (bu maddeyle karıştırılan aynı mevzuattaki maddeler ve neden).

Kartlar ayrıntıyı zaten veriyor (hüküm, yanlış ifade, doğrusu). Senin metnin **büyük resmi ve ezber kancasını** verir; kartları
tekrar etme.

## Girdi
`scratchpad/denetim/blok/girdi/kanun_<id>.json` (büyükse parça parça oku):
- `ad`, `kapsam`, `tum_madde_nolari`, `nasil_soruluyor_notu` (o kanunun "nasıl soruluyor" notu),
  `diger_maddeler_kisa` (kapsam dışı maddelerin ilk 160 karakteri; karıştırılan için bağlam).
- `maddeler[]` (yalnız kapsamdaki maddeler):
  - `no`, `resmi_metin` (**tek doğru kaynak**; sonunda dipnot metinleri olabilir, onları hüküm sanma),
  - `kartlar[]` (o maddenin denetlenmiş Altın Özet kartları),
  - `soru_sayisi`, `ornek_sorular[]` (kök, şıklar, doğru şık — sınavın bu maddeyi nasıl sorduğunu buradan çıkar),
  - `tablo_satirlari` (sayı/süre/makam satırları),
  - `karistirilan_adaylari` (yanlış şıkların benzediği maddeler; yalnız ipucu, kendin doğrula).

## Çıktı
`scratchpad/denetim/blok/sonuc/kanun_<id>.json` — kapsamdaki **her madde için bir öğe** içeren JSON listesi, madde sırasıyla:
```json
[
 {"kanun_id": 5, "madde": "2",
  "baslik": "İl, ilçe, bucak ve köy kurma usulü",
  "oz": "İl ve ilçe kurmak, kaldırmak, merkezini ya da adını değiştirmek ancak kanunla olur. Bucak kurmak, sınırları değiştirmek, bir köyü ya da bucağı başka bir ile bağlamak Cumhurbaşkanı onayıyla yapılır. Köy adını değiştirmek, köyleri birleştirmek ya da ayırmak İçişleri Bakanlığının tasvibiyle olur.",
  "sorulur": ["Bir işlem verilip hangi usulle yapıldığı sorulur; şıklarda kanun, Cumhurbaşkanı onayı ve İçişleri Bakanlığının tasvibi yer değiştirir.",
              "Eşleştirme sorularında en sık tuzak, ilçenin başka bir ile bağlanmasını Cumhurbaşkanı onayına bağlamaktır; doğrusu kanundur."],
  "akilda": ["Büyükten küçüğe merdiven: il ve ilçe kanunla, bucak ve sınır Cumhurbaşkanı onayıyla, köy işleri İçişleri Bakanlığının tasvibiyle.",
             "İlçe başka ile geçiyorsa kanun; köy ya da bucak başka ile geçiyorsa Cumhurbaşkanı onayı."],
  "karis": [],
  "kontrol": "Resmî metinle karşılaştırıldı (m.2/A-Ç)."},
 {"kanun_id": 5, "madde": "17", "atla": "yürürlük maddesi"}
]
```

### Alan kuralları
- **madde**: girdideki `no` ile aynı metin ("11", "Ek 1", "Geçici 2").
- **baslik**: en çok 6 kelime, maddenin konusu. Soru kökünden başlık üretme.
- **oz**: 2-4 kısa, sade cümle; en çok 70 kelime. Kim, neyi, hangi sürede, hangi usulle yapar. Çocuğa anlatır gibi açık yaz.
  Sayıları **rakamla** yaz (15 gün, 3 ay, %50).
- **sorulur**: 1-3 satır, her biri en çok 40 kelime. Sınavın bu maddeyi nasıl sorduğu ve şıklarda neyin oynandığı. `ornek_sorular`
  ve `nasil_soruluyor_notu`'na dayan. `soru_sayisi` 0 ise "Beklenen kalıp:" diye başla. Geçmiş sınavda çıktığını ya da "çok
  sorulduğunu" kaynağında yazmıyorsa iddia etme.
- **akilda**: 1-3 satır, her biri en çok 30 kelime. Akılda kalıcı **kodlama**: karşıtlık çifti ("vali resen, kaymakam valinin
  tasvibiyle"), sıralama merdiveni, sayı çağrışımı ("15 gün = yarım ay"), kısaltma ya da kafiye. Kod **bilgiden daha zor
  olmamalı**, zorlama kısaltma yapma. Kod hiçbir bilgiyi çarpıtmamalı; içindeki her sayı ve makam resmî metinde olmalı.
- **karis**: 0-3 öğe `{"madde": "31", "neden": "en çok 15 kelime"}`. Yalnız **aynı mevzuattaki** maddeler. Neden somut olsun
  ("vali 15 gün, kaymakam 8 gün kısıtlayabilir"). `karistirilan_adaylari` yalnız ipucu; gerçekten karışmıyorsa koyma.
  Başka bir mevzuatla karışıyorsa onu `akilda` ya da `sorulur` metninde adıyla söyle.
- **kontrol**: tek satır. "Resmî metinle karşılaştırıldı" + varsa şüphe. Ayrıca:
  - Bir kart resmî metne aykırıysa: `KART_CELISKI: <kart id> — <ne yanlış, doğrusu ne>` (kartları biz düzelteceğiz; sen
    resmî metne göre yaz).
  - Denetçi bir sayıyı işaretler ama sayı doğruysa (ör. başka maddeden geliyor): `SAYI_ONAY: <sayı> — <gerekçe>`.
- **atla**: yalnız mülga, yürürlük, yürütme ya da hüküm taşımayan maddeler için `{"kanun_id": .., "madde": "..", "atla": "gerekçe"}`.
- Dil: düzgün, doğal Türkçe; "sen" diliyle yazılabilir. **"kaçırdığın" kelimesini asla kullanma.** Hitap yok.
- Madde atfı parantezle: "(m.11/A)". Başka mevzuat anılacaksa adıyla: "TCK m.53".

## Doğruluk (en önemli kısım)
- Tek kaynak `resmi_metin`. Ezberden, genel bilgiden sayı, süre, makam, oran yazma. Emin değilsen yazma, `kontrol`'e not düş.
- Değişiklik notlarına dikkat: "(Değişik: ...)", "(Mülga: ...)" ve dipnotlar. Mülga hükmü güncelmiş gibi yazma.
- Kanun numarası, tarih, Resmî Gazete gibi ezber gerektirmeyen bilgileri öze koyma.

## Denetçi (her kanundan sonra ZORUNLU)
```
python scripts/harekat-masasi/blok_denetle.py scratchpad/denetim/blok/sonuc/kanun_<id>.json
```
"HATA 0" görene kadar düzelt. Denetçi biçimi, eksik maddeyi, uzunluğu, yasak kelimeyi ve **resmî metinde olmayan sayıyı** yakalar.

## Çalışma biçimi
- Partindeki kanunları sırayla yap. Her kanunu bitirince dosyasını hemen yaz ve denetle; sonra sıradakine geç.
- JSON'u dosya yazma aracıyla yaz (kabuk heredoc'u kullanma).
- Başka hiçbir dosyayı değiştirme. İnternet kullanma.
- Bitince kısa Türkçe rapor: hangi kanunlar bitti (blok sayısı), denetçi sonucu, **KART_CELISKI listesi**, emin olamadıkların.
