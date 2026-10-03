# Görev: Check-up'ta sorusu olmayan Altın Özet noktaları için soru yaz

Başkan: "m.11'de anlatılan şey check-up sorularında yoktu; içerik yeterli mi emin olmak lazım." Bu noktaların hiçbir soruyla
karşılanmadığı ölçüldü. Senin işin her nokta için sınav tarzında soru yazmak.

## Girdi
`scratchpad/denetim/soru/girdi_<parti>.json` — her öğe: `kanun_id`, `kanun`, `kart_id`, `madde`, `baslik`, `hukum`, `tuzak`, `resmi_metin_paketi`.
Resmî metin paketi (`maddeler[]` = {no, metin}) TEK DOĞRU KAYNAKTIR. Sorunun cevabını mutlaka resmî metinden doğrula; hüküm ile metin çelişiyorsa metne uy.
Metin pakette kesikse ve doğrulayamıyorsan o noktayı ATLA (çıktıya koyma, raporda say).

## Soru biçimi (ATA-AÖF sınav tarzı)
- Her nokta için 1 soru; hüküm iki ayrı bilgi içeriyorsa en fazla 2.
- Kök: "<Kanun adı>'na göre, …" ile başlar; açık ve tek doğru cevaplı. Olumsuz kök kullanırsan "DEĞİLDİR / YANLIŞTIR" büyük harfle.
  Öncüllü (I-II-III) soru da yazabilirsin (partinin yaklaşık 1/4'ü).
- 5 şık (A-E), aynı tür ve uzunlukta; çeldiriciler gerçekçi (yakın sayı, karıştırılan makam, benzer kavram). Kartın `tuzak` alanını çeldirici olarak kullan.
- Doğru şıkkın yerini dengele: partide A/B/C/D/E aşağı yukarı eşit dağılsın, art arda aynı harf 3'ten fazla olmasın.
- Açıklama: neden doğru + madde no ("m.11/D'ye göre …"), 1-3 cümle, düzgün Türkçe. "kaçırdığın" kelimesini KULLANMA.

## Çıktı
`scratchpad/denetim/soru/sonuc_<parti>.json` (Write aracıyla; heredoc KULLANMA):
```json
[{"i": "EK-5-5-16-1", "kanun_id": 5, "kart_id": "5-16",
  "k": "5442 sayılı İl İdaresi Kanunu'na göre, …?", "s": ["…","…","…","…","…"], "d": 2,
  "a": "m.11/B'ye göre …", "y": "5442 m.11/B", "z": "orta"}]
```
- `i` = "EK-<kanun_id>-<kart_id>-<sıra>" (benzersiz). `d` = doğru şıkkın 0-tabanlı sırası. `y` = "<kanun no veya kısa adı> m.<madde>" — madde numarası kartın maddesiyle aynı olmalı (check-up madde eşlemesi buna bakar).
- Başka dosyaya dokunma. Bitince rapor: kaç soru, atlanan noktalar (neden), doğru şık dağılımı.
