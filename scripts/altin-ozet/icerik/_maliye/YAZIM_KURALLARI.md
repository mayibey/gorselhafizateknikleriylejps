# Altın Özet — Maliye branşı bölüm yazım kuralları

Amaç: JSPS 2026 sınavına hazırlanan Maliye branşı adayı için, her mevzuatın **sınav kapsamındaki maddelerini** "altın nokta" biçiminde anlatan kitap bölümü. Okuyan kişi bu bölümü okuyup o mevzuattan gelecek soruları çözebilmeli.

## Girdi
- Paket: `scripts/altin-ozet/paketler/maliye/pack_<law_id>.json`
  - `ad`, `kapsam_maddeleri` (SINAV KAPSAMI — yalnız bunları anlat; liste "Tamamı" olabilir),
  - `maddeler` [{no, metin}] = RESMÎ madde metni (tek bilgi kaynağın bu; ezberden hüküm/sayı yazma),
  - `cikmis_sorular` [{kok, siklar, rutbe, kitapcik}] = geçmiş sınav soruları ama **KİRLİ**: kelime eşleşmesiyle toplandı, başka mevzuatın soruları karışmış olabilir. Her kökü oku; yalnız kökü/şıkları GERÇEKTEN bu mevzuatın bir hükmünü soranları "çıkmış" say.
  - `banka_sorulari` = bizim soru bankamız (çıkmış DEĞİL; hangi noktaların soru üretmeye elverişli olduğunu görmek için bakabilirsin).
- Biçim örneği (birebir bu yapıyı izle): `scripts/altin-ozet/icerik/ozet_I_ikmal.md` satır 891-935 (Ön Ödeme bölümü).

## Çıktı
Her mevzuat için `scripts/altin-ozet/icerik/_maliye/<law_id>.md` dosyası (Write aracıyla yaz; heredoc KULLANMA). İçerik:

```
## <Mevzuatın tam adı> — Sınav kapsamı: <m.x, y-z … | Tamamı>

### Bu mevzuattan nasıl soruluyor
<1 paragraf: çıkmış sorular hangi noktaları sordu (varsa, somut), hangi kalıplar beklenir, ezberlenecek çekirdek.>

### Altın noktalar
- ★ çıkmış **Başlık** — hüküm (m.x). · **Ne demek:** sade açıklama · *Örnek:* kısa olay · *Tuzak:* sınavın bu hükmü nasıl bozacağı.
- **Başlık** — hüküm (m.x). · **Ne demek:** … · *Tuzak:* …

### Sayılar ve süreler
| Konu | Değer |
|---|---|

### Yetkili makamlar
| Konu | Yetkili |
|---|---|

### "Yanlıştır/değildir" tuzakları
- "<yanlış ifade>" → **<doğrusu>** (m.x).
```

## Kurallar (hepsi zorunlu)
1. **Yalnız resmî metin.** Her hüküm, sayı, süre, oran, makam `maddeler` metninden gelir; madde numarasıyla (m.x veya m.x/y) bağla. Metinde olmayan hiçbir şeyi yazma. Emin olmadığın şeyi yazma.
2. **Kapsam.** Yalnız `kapsam_maddeleri` içindeki maddeleri anlat; kapsam dışı maddeye nokta yazma. Kapsamdaki her maddeye en az bir noktada değin (kısa tanım/amaç maddeleri birleştirilebilir).
3. **★ rozeti cimri.** `★ çıkmış` yalnız, bir çıkmış sorunun fiilen sorduğu hükme konur; satırın BAŞINDA olur (`- ★ çıkmış **Başlık** — …`). Başlığın içine koyma. Kirli (başka mevzuata ait) çıkmış soruyu sayma. Çıkmış yoksa ★ yok ve "nasıl soruluyor" paragrafında "Bu mevzuattan geçmiş kitapçıklarda soru tespit edilmedi" de, beklenen kalıpları yaz.
4. **Kalite çıtası:** noktaların ≥%90'ında *Tuzak:*, ≥%85'inde **Ne demek:**, %10-30'unda *Örnek:*. Ne demek = "çocuğa anlatır gibi" sade Türkçe, jargon açıklanır.
5. **Nokta sayısı** kapsamla orantılı: kısa mevzuat 5-10, orta 12-25, uzun (40+ madde) 30-60 nokta. Bir nokta birden çok yakın maddeyi toplayabilir.
6. **Sayılar/süreler ve makam tabloları** metinde gerçekten geçen değerlerle; boş kalacaksa tabloyu tek satır "—" ile bırakma, ilgili satır yoksa o başlığı yine yaz ve en az bir gerçek satır bul (hemen her mevzuatta vardır).
7. **Tuzaklar bölümü:** 5-12 madde; her biri sınavda şık olarak çıkabilecek yanlış ifade + doğrusu + madde.
8. Türkçe karakterler doğru; Markdown tablolarında `|` karakterini metin içinde kullanma.
9. Bittiğinde kısa rapor ver: dosya adı, nokta sayısı, ★ sayısı ve hangi çıkmış kökleri kabul/ret ettiğin (ret gerekçesi tek cümle), emin olamadığın noktalar.
