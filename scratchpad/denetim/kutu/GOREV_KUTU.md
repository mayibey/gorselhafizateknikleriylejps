# GÖREV: Altın Özet kartlarında "Sınavda böyle yazarlar" + "Doğrusu" kutularını temizle

## Bağlam
Uygulamadaki her Altın Özet kartı şöyle görünür (başkanın istediği düzen):
1. **Hüküm** (üstte, kanunun söylediği)
2. **Sınavda böyle yazarlar** (kırmızı kutu): sınav şıkkında çıkabilecek **YANLIŞ cümle**, aynen şıkta yazacağı gibi.
3. **Doğrusu** (yeşil kutu): o yanlış cümlenin **düzeltilmiş hali**, kısa özet cümle.

Girdideki kartlarda kırmızı kutu bozuk: yanlış cümle yerine bir **açıklama** duruyor. Örnek:
- Bozuk: `listeye "ekonomik düzeni korumak" eklenir (o, Kabahatler Kanununun amacıdır)`
- Olması gereken kırmızı: `“Ekonomik düzeni korumak Türk Ceza Kanununun amaçları arasındadır.”`
- Olması gereken yeşil: `Ekonomik düzeni korumak Kabahatler Kanununun amacıdır; TCK'nın amaçları arasında yer almaz (m.1)`

## Girdi
`scratchpad/denetim/kutu/girdi/kanun_<id>.json` → `kartlar[]`:
`id`, `madde`, `baslik`, `hukum`, `tuzak_satiri` (bozuk açıklama; malzeme olarak kullan), `mevcut_dogrusu` (varsa önceki yeşil kutu),
`ayni_maddenin_tuzaklari` (aynı maddenin yanlış/doğru çiftleri; malzeme), `resmi_metin` (kartın maddelerinin resmî metni — **tek doğru kaynak**).

## Çıktı
`scratchpad/denetim/kutu/sonuc/kanun_<id>.json` — girdideki **her kart için bir kayıt**:
```json
[{"kanun_id": 1, "kart_id": "1-3", "sorun": "kirmizi_kutu", "aciklama": "kısa not",
  "duzeltme": {"sinavda_boyle_yazarlar": ["“Ekonomik düzeni korumak Türk Ceza Kanununun amaçları arasındadır.”"],
               "dogrusu": ["Ekonomik düzeni korumak Kabahatler Kanununun amacıdır; TCK'nın amaçları arasında yer almaz (m.1)"]}}]
```

## Kurallar
- **sinavda_boyle_yazarlar**: 1-2 cümle (gerekirse 3). Her biri “ ” içinde, sınav şıkkı gibi düz bir **yanlış iddia**. Hükmün tek bir
  öğesi bozulmuş olsun: makam, süre, sayı, kapsam, istisna, "zorunlu/ihtiyari" gibi. **Açıklama yok**: "denir", "yazılır", "yanlış",
  "doğrusu", "oysa", "aslında", "tuzak" gibi kelimeler yasak. Resmî metne göre **gerçekten yanlış** olmalı ve **kartın kendi
  konusuna** ait olmalı.
- **dogrusu**: `sinavda_boyle_yazarlar` ile **aynı sayıda ve aynı sırada**. Her biri karşısındaki yanlışın birebir düzeltilmiş hali;
  tam, düzgün Türkçe cümle; en çok 25 kelime; **sonunda madde atfı** "(m.11/A)". `mevcut_dogrusu` doğru ve uygunsa kullan.
- Sayılar resmî metindeki gibi. Metinde olmayan sayı, süre, makam yazma.
- Hüküm (hukum) resmî metne aykırıysa: düzeltmeye `"hukum": "…"` de ekle ve `aciklama`'ya `KART_CELISKI: …` yaz. Değilse hükme dokunma.
- **Hükme körü körüne güvenme (3 Eki dersi):** her kartta önce hükmü resmî metinle karşılaştır. İstisna kalıplarını dikkatle oku:
  "X ve Y DIŞINDAKİ teminat sözleşmeleri e-imzayla yapılamaz" = X ve Y e-imzayla YAPILABİLİR (5070 m.5; bir kart bunu tersine
  yazmıştı ve kırmızı kutu da o yanlış hükme göre kurulmuştu). Kutuyu her zaman resmî metne göre kur.
- Kartın konusu tuzağa elverişsizse (ör. yalnız tanım ve tuzak üretmek zorlama olacaksa) bile hükmün bir öğesini bozarak yanlış cümle
  kur; çok istisnai durumda `{"kanun_id": .., "kart_id": "..", "atla": "gerekçe"}`.
- Dil: düzgün, doğal Türkçe. **"kaçırdığın" kelimesini asla kullanma.**

## Denetçi (her kanundan sonra ZORUNLU)
```
python scripts/harekat-masasi/kutu_denetle.py scratchpad/denetim/kutu/sonuc/kanun_<id>.json
```
"HATA 0" görene kadar düzelt. Denetçi açıklama kalıbını, resmî metinde aynen geçen "yanlış" cümleyi (doğru olabilir), sayı/madde
atfı/uzunluk sorunlarını ve eksik kartı yakalar. Doğru bir sayı işaretlenirse `aciklama`'ya `SAYI_ONAY: <sayı> — gerekçe` yaz.

## Çalışma biçimi
Partindeki kanunları sırayla yap; her kanun bitince dosyasını yaz ve denetle. JSON'u dosya yazma aracıyla yaz (heredoc yok).
Başka dosyaya dokunma, internet kullanma. Bitince kısa Türkçe rapor: kanunlar ve kart sayıları, denetçi sonucu, KART_CELISKI listesi.
