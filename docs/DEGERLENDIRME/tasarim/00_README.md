# Tasarım Yönü Kararı — README (başkan için)

Bu klasör, **JSPS uygulamasının 3 farklı tasarım yönünü** karşılaştırmak için hazırlandı.
Her yön, gerçek React Native ekranlarının **HTML temsili mockup'ıdır** (birebir kod değil) —
amaç, kod yazmadan önce **görsel/UX yönüne karar vermek**.

Üç yön de aynı 3 ekranı gösterir: **Karargah · Kart Akışı · Mevzuat**.
Marka token'ları (krem premium palet, Playfair Display + Inter, altın aksan) hepsinde sabittir;
değişen şey **his, hiyerarşi ve karakter**.

> Detaylı UX analizi için bkz. **`03_TASARIM_UX.md`** (sorunlar, ölçüm, gerekçeler).

---

## Nasıl görüntülenir

Dosyaları çift tıklayıp **tarayıcıda** aç (kurulum/sunucu gerekmez):

- `yon-a.html` — **Saha Dosyası** (evrim / mevcut çizgi)
- `yon-b.html` — **Komuta Konsolu** (dark-first)
- `yon-c.html` — **Görsel-Önce** (flashcard)

Her dosya 3 telefon çerçevesini yan yana gösterir. Yan yana açıp karşılaştır.

---

## Yön A — “Saha Dosyası” (evrim)

**Konsept:** Bugünkü krem-premium çizginin olgunlaşmış hâli. Resmî bir **personel dosyası /
saha evrakı** dili: net başlıklar, altın ince ayırıcılar, sakin bol boşluk. Risksiz devam.

- **Ekranlar:** Karargah uyarı bandı + Etüt kartı + 3-kutu; Kart Akışı tek kahraman görsel;
  Mevzuat dosya-satırı listesi.
- **Artı:** En düşük geliştirme maliyeti (mevcut bileşenler korunur); marka tutarlı; yaşlı/resmî
  kullanıcı için tanıdık ve güven veren; içerik (kanun) ön planda.
- **Eksi:** Mağaza vitrininde “yeterince çarpıcı değil”, jenerik liste-uygulaması riski; görsel
  hafıza farkı yeterince **satılmıyor**.
- **Risk:** Düşük. Çoğunlukla cilalama; sürpriz yok.

## Yön B — “Komuta Konsolu” (dark-first)

**Konsept:** Lacivert-krom **karanlık zemin**, askerî komuta merkezi hissi. Veri/metrik öne
çıkar (nöbet serisi, ilerleme halkaları, zayıf mevzi sayacı), altın aksanlar koyu zeminde parlar.

- **Ekranlar:** Karargah bir “durum panosu” (HUD); Kart Akışı koyu sahnede ışıklı kart;
  Mevzuat koyu satır + parlak ilerleme barı.
- **Artı:** En **çarpıcı / premium** vitrin; kuruma (Jandarma/SG) tematik olarak çok oturur;
  gece çalışmada göz konforu; rakiplerden net ayrışır.
- **Eksi:** Krem palet kanonik markamız — dark-first **marka kararını değiştirir**; karikatür
  kartların renkleri koyu zeminde dengelenmeli; tüm tema sistemini (token) ikiye katlar.
- **Risk:** Orta–Yüksek. Çift tema bakımı, erişilebilirlik (koyu zeminde kontrast) ve marka
  sapması. En yüksek “vay be” ama en yüksek iş yükü.

## Yön C — “Görsel-Önce” (flashcard)

**Konsept:** Uygulamanın **tek farkını** —görsel hafıza karikatürünü— merkeze alır. Her şey
karta hizmet eder: Karargah’ta bile dev görsel önizleme, listede küçük kart küçük-resimleri.

- **Ekranlar:** Karargah görsel-ağırlıklı (büyük Etüt kart önizlemesi); Kart Akışı tam-ekran
  4-panel sahne + büyük “Öğrendim/Tekrar Hatırlat”; Mevzuat satırlarında kart thumbnail.
- **Artı:** Ürünün **asıl değer önerisini** anında anlatır (“bu uygulama resimle öğretiyor”);
  genç/sınav kitlesi için en cazip; demo/pazarlamada en güçlü.
- **Eksi:** 643MB görsel içeriğe bağımlı — görsel yoksa ekran **boş/iskelet** görünür; metin/
  hukuk içeriği geri planda kalır; placeholder’lar bittiği sürece zayıf görünür.
- **Risk:** Orta. Görsel üretim hattı tamamlanana kadar ekranlar eksik hisseder; offline/asset
  stratejisine sıkı bağlı (bkz. `11_SUNUCU_ASSET_OFFLINE.md`).

---

## ÖNERİ

**Önerilen yön: A (Saha Dosyası) tabanı + C’den (Görsel-Önce) kart vurgusu.**

Gerekçe:
1. **A**, mevcut koda en yakın olduğu için **hızlı yayınlanır** ve marka kararını (krem premium,
   `CLAUDE.md` kanonik palet) bozmaz — riski düşük.
2. **C**’nin tek güçlü fikri (kartı kahraman yapmak) Kart Akışı + Karargah Etüt kartında
   **seçici olarak** alınır; böylece ürünün farkı satılır ama 643MB içerik tamamlanmadan ekranlar
   boş kalmaz (placeholder fallback A’dan gelir).
3. **B (dark-first)** etkileyici ama **marka + erişilebilirlik + çift tema bakım** maliyeti bu
   aşamada erken. İleride **opsiyonel “gece modu”** olarak değerlendirilebilir, ana yön değil.

Karar netleşince ilgili ekran düzenlemeleri `03_TASARIM_UX.md`’deki bulgularla eşleştirilerek
uygulanmalı.

---

> Not: Bu mockup'lar **karar aracıdır**; uygulama koduna/asset'e dokunulmadı. Onaylanan yön,
> ayrı bir keşif + fix iş kalemi olarak hayata geçirilir (proje kuralı: keşifsiz fix yok).
