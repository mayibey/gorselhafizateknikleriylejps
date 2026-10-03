# Altın Özet kart denetimi — görev tanımı

Başkan (uygulama sahibi) Harekât Merkezi'ndeki Altın Özet kartlarında "çok fazla alakasız var, ajanlar halüsinasyon görmüş" dedi.
Senin işin: sana verilen kanunların HER kartını resmî madde metnine karşı tek tek kontrol etmek ve bozuk olanları düzeltmek.

## Girdi
- `scratchpad/denetim/kanun_<id>.json` — kartlar uygulamanın gösterdiği haliyle:
  - `kartlar[]`: `id`, `madde`, `baslik`, `hukum` (kartın üstündeki açıklama), `sinavda_boyle_yazarlar` (kırmızı kutu: sınavda çıkabilecek YANLIŞ ifadeler),
    `dogrusu` (yeşil kutu: o yanlışın doğrusu / kısa özet)
  - `eslesmeyen_tuzaklar[]`: hiçbir karta bağlanamayan tuzaklar (`madde`, `yanlis`, `dogru`)
  - `resmi_metin_paketi`: resmî madde metinlerinin bulunduğu JSON (`maddeler[]` = {no, metin}). TEK DOĞRU KAYNAK BU. Büyükse Read ile parça parça oku.
- NOT: Paketlerde bazı madde metinleri 4000/9000 karakterde KESİK olabilir. Kesik kısma dayanan bir kartı "yanlış" sayma; emin değilsen dokunma.

## Her kart için kontrol et
1. **hukum** resmî metinle uyumlu mu? Sayı, süre, makam, oran, kim/ne yapar doğru mu? Madde numarası doğru mu?
2. **sinavda_boyle_yazarlar** gerçekten bu kartın konusuyla ilgili ve gerçekten YANLIŞ mı? (Başka bir maddenin/konunun yanlışı buraya düşmüşse = alakasız.
   Resmî metne göre aslında doğru olan bir ifade "yanlış" diye yazılmışsa = hatalı.)
3. **dogrusu** bu kartın konusuyla ve kırmızı kutudaki yanlışla ilgili mi, resmî metne göre doğru mu? Kısa ve net mi?
   (Örnek hata: "Sözleşmeli subay rütbeleri" kartında Doğrusu "Sözleşme 3-9 yıl arası" — konu dışı.)
4. Eşleşmeyen tuzaklar: doğru mu, hangi karta ait olmalı (kart id ver) ya da tamamen silinmeli mi?

## Çıktı
`scratchpad/denetim/sonuc_<parti>.json` (Write aracıyla; heredoc KULLANMA) — YALNIZ sorunlu kartlar, şu dizi:
```json
[
  {"kanun_id": 13, "kart_id": "13-5", "sorun": "alakasiz_dogrusu", "aciklama": "tek cümle neden",
   "duzeltme": {"hukum": "…(yalnız değişecekse)", "sinavda_boyle_yazarlar": ["…"], "dogrusu": ["…"]}},
  {"kanun_id": 13, "tuzak_index": 2, "sorun": "eslesmeyen_tuzak", "aciklama": "…", "duzeltme": {"karta_bagla": "13-7"} }
]
```
- `sorun` değerleri: `hukum_hatali` · `yanlis_aslinda_dogru` · `alakasiz_yanlis` · `alakasiz_dogrusu` · `dogrusu_hatali` · `eslesmeyen_tuzak`
- `duzeltme` içinde yalnız DEĞİŞEN alanları ver. `sinavda_boyle_yazarlar` ve `dogrusu` verirsen TAM listeyi ver (eskisinin yerine geçer).
  Kırmızı kutu boş kalacaksa `"sinavda_boyle_yazarlar": []`. Eşleşmeyen tuzağı silmek için `{"sil": true}`.
- `tuzak_index` = `eslesmeyen_tuzaklar` dizisindeki sıra (0'dan).
- Yeni metin yazarken: resmî metne dayan, madde no'yu parantezle ekle (örn. "(m.3/e)"), kısa ve düzgün Türkçe. "kaçırdığın" kelimesini KULLANMA.
- Doğrusu, yanlışın birebir düzeltilmiş hali olmalı (yanlış "binbaşı da sayılır" → doğru "Sözleşmeli subay rütbeleri teğmen, üsteğmen ve yüzbaşıdır (m.3/e)").

## Kurallar
- Kod/uygulama dosyalarına, md içerik dosyalarına DOKUNMA; yalnız sonuç JSON'unu yaz.
- Sorunsuz kartları listeye koyma. Ezberden sayı yazma; metinde yoksa yazma.
- Bitince kısa rapor: kaç kart kontrol edildi, kaç sorun (türlerine göre), emin olamadıkların.
