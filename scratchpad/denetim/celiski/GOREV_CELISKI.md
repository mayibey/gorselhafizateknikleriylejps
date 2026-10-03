# GÖREV: Resmî metne aykırı ya da yanlış maddeye bağlı Altın Özet kartlarını düzelt

Madde bloğu ve kırmızı kutu ajanları bazı kartlarda gerçek içerik hatası ya da yanlış madde eşlemesi buldu. Her birini
**resmî metinden doğrula** ve gerçekten hatalıysa düzeltme kaydı yaz.

## Girdi
1. `scratchpad/denetim/kart_celiski.json` — liste `[kanun_id, madde, "KART_CELISKI: <kart id> — açıklama"]`.
2. Aşağıdaki EK LİSTE (raporlardan).
3. Doğrulama kaynağı: `scratchpad/denetim/blok/girdi/kanun_<id>.json` → `maddeler[].resmi_metin` (kapsam maddeleri) ve
   `diger_maddeler_kisa`; tam metin gerekirse `gemini_calisma/girdi/resmi_metin/kanun_<id>.json` (`maddeler[] = {no, metin}`).
   Kartın şu anki hâli: `C:/Users/GIGABYTE/AppData/Local/Temp/claude/D--GorselHafizaTeknikleriyleJSPS/1cb33cb3-f233-47d5-9f06-b8d257742241/scratchpad/calisma/veri2-<brans>.json`
   içinde `kanun[].n[]` (`i` = kart id; `b` başlık, `h` hüküm, `yz` sınavda böyle yazarlar, `dg` doğrusu, `m` madde listesi).
   Kanunun hangi branş dosyasında olduğunu bilmiyorsan `veri2-jandarma.json` (müşterek + jandarma), `veri2-maliye.json`,
   `veri2-personel.json`, `veri2-tabip.json`, `veri2-istihkam.json` dosyalarına bak. YALNIZ OKU.

### EK LİSTE
- 25-2, 25-3, 25-4 (6136): içerik doğru, fıkra atıfları bir kaymış; doğrusu sırasıyla m.4/2, m.4/3, m.4/4 (m.15/4 "4 üncü maddenin üçüncü fıkrası" diyor).
- 21-14: m.18'e bağlı ama anlattığı kural m.29/2.
- 31-8 → m.55 · 31-10 → m.57 (içerik doğru, madde yanlış) · 31-7 → m.54 + "son karardan sonra Türkiye'de kalma hakkı bulunmayanlar" şartı eksik.
- 34-33 → m.112 · 34-36 → m.118 · 36-15 → m.26 · 39-5 → m.26 · 42-0 → m.2 · 42-2 → m.4 · 44-2 → m.21 · 44-3, 44-4 → m.23 ·
  45-7, 45-8 → m.11-12 · 45-10 → m.13 · 45-12 → m.9 · 45-13 → m.8 (madde eşlemeleri; içerik doğru).
- 23-36: resmî kaynak kullanan eserde izin YAZMADAN önce (m.22/5-b), gizli kitaplardan yararlanan eserde BASIM VE YAYIMDAN önce (m.22/5-c); kart iki durumu karıştırıyor.
- 22-25: "tebliğ gününü" değil "tebliğ gününü izleyen işgünü" işe başlanır (kısaltma yanıltıcı).
- 4-4 (7201): komşu/yönetici/kapıcıya bildirme kaydı (listede açıklaması var).

NOT: 26-80, 26-24, 26-33 (CMK 38/A, 110/A, 128/A) için madde düzeltmesi YAZMA — sistem bunları artık otomatik doğru maddeye bağlıyor.

## Çıktı
`scratchpad/denetim/celiski/sonuc.json` — düzeltilecek her kart için bir kayıt (duzeltmeler.json biçimi):
```json
[{"kanun_id": 14, "kart_id": "14-16", "sorun": "hukum_hatali", "aciklama": "m.5: banka teminat mektupları ve Türkiye'de yerleşik sigorta şirketlerinin kefalet senetleri yasağın dışında",
  "duzeltme": {"hukum": "…", "sinavda_boyle_yazarlar": ["“…”"], "dogrusu": ["… (m.5)"], "madde": ["5"], "baslik": "…"}}]
```
- `duzeltme` içine YALNIZ değişecek alanları yaz; yazdığın alan kartın o alanının TAM son hâli olur.
- `sinavda_boyle_yazarlar` ile `dogrusu` birlikte verilir, aynı sayıda ve sırada: kırmızı kutu sınav şıkkı gibi düz YANLIŞ cümle
  (“ ” içinde; "denir", "yanlış", "doğrusu" gibi açıklama yok), yeşil kutu onun düzeltilmiş hâli (en çok 25 kelime, sonunda "(m.X)").
- Yalnız madde eşlemesi yanlışsa yalnız `madde` ver (ör. `{"madde": ["55"]}`), metne dokunma.
- `sorun`: `hukum_hatali` · `dogrusu_hatali` · `madde_hatali` · `eksik_kayit`.
- Doğrulayamadığın (resmî metin kesik/yok) kalemi düzeltme; `scratchpad/denetim/celiski/rapor.md`'ye yaz.
- Dil: düzgün Türkçe; "kaçırdığın" yasak. Başka dosyaya dokunma, internet kullanma. Yardımcı betik gerekirse yalnız
  `scratchpad/denetim/celiski/tmp/` altına yaz.

Bitince kısa Türkçe rapor: kaç kart düzeltildi (türlerine göre), hangileri doğrulanamadı.
