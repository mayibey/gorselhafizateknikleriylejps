# Görev: Altın Özet kartlarına düzgün "Doğrusu" cümlesi yaz

Kartlarda yeşil "Doğrusu" kutusu şu an cümle değil, kelime parçası: örneğin
`genel ve özel bütün kolluk kuvvet ve teşkilatının amiridir · derhal (m.11/A)` ya da yalnız kart başlığı ya da "…" ile kesik.
Başkan bunları "saçma" buldu. Senin işin her kart için **tek, düzgün Türkçe cümle** yazmak.

## Girdi
`scratchpad/denetim/dogru_girdi_<parti>.json` — her öğe: `kanun_id`, `kanun`, `kart_id`, `baslik`, `hukum` (kartın üstündeki açıklama, denetlenmiş),
`sinavda_boyle_yazarlar` (kırmızı kutu: sınavda çıkan YANLIŞ ifadeler), `simdiki_dogrusu` (bozuk olan).

## Kural
- Doğrusu = kırmızı kutudaki yanlışın **birebir düzeltilmiş hali**, kısa tam cümle, sonunda madde no parantezle. Örnek:
  - Kırmızı: `"yalnız genel kolluğun amiridir"; "derhal" yerine "en kısa sürede" konur`
    → Doğrusu: `Vali, ildeki genel ve özel bütün kolluk teşkilatının amiridir; kolluk valinin emirlerini derhal yerine getirir (m.11/A)`
  - Kırmızı: `yetki "garnizon komutanına" verilir` → Doğrusu: `Sınır ve kıyı emniyetini vali sağlar ve yürütür; yetki garnizon komutanına ait değildir (m.11/B)`
- Kırmızı kutuda birden çok yanlış varsa hepsini karşılayan tek cümle (gerekirse iki cümle, liste olarak 2 öğe).
- Kırmızı kutu boşsa: hükmün sınavda en çok sorulacak çekirdeğini tek cümleyle yaz.
- Bilgi YALNIZ `hukum` alanından gelir; yeni sayı/süre/makam ekleme. Hükümle çelişen bir şey yazma.
- 25 kelimeyi geçme. Düzgün, doğal Türkçe; "kaçırdığın" kelimesini kullanma; jargon yok.

## Çıktı
`scratchpad/denetim/dogru_sonuc_<parti>.json` (Write aracıyla; heredoc KULLANMA), girdideki HER öğe için:
```json
[{"kanun_id": 5, "kart_id": "5-12", "sorun": "dogrusu_hatali", "aciklama": "parça doğrusu", "duzeltme": {"dogrusu": ["…cümle… (m.11/A)"]}}]
```
Başka dosyaya dokunma. Bitince kısa rapor: kaç kart, emin olamadıkların.
