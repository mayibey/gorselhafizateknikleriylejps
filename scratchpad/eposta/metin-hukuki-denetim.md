# E-posta metni — olgu ve hukuk denetimi (24 Ağu 2026)

Ben avukat değilim; aşağıdakiler ölçülebilir olgular ve bilinen mevzuat başlıkları.
İşaretlediğim 1 numaralı madde için avukata sormak gerekir.

---

## 🔴 1. EN CİDDİ RİSK — bu mail "ticari elektronik ileti" sayılabilir

**Sorun:** Metnin açılışı **AYLIK ÜYELİK** tanıtımı ve "Premium'a geçebilirsin" çağrısı.
Bu, maili bir *bilgilendirme* olmaktan çıkarıp **ticari elektronik ileti** hâline getirir.

**Neden önemli:** 6563 sayılı Elektronik Ticaretin Düzenlenmesi Hakkında Kanun'a göre
ticari elektronik ileti için:
- alıcının **önceden onayı** gerekir (mevcut müşteriye, satın aldığı hizmetle ilgili
  ileti göndermek istisna sayılır — ama listemizdeki 920 kişinin büyük kısmı **ücretli
  müşteri değil, sadece kayıtlı kullanıcı**),
- onayların **İYS'ye (İleti Yönetim Sistemi) kaydı** zorunludur,
- iletide **gönderenin ticari unvanı, adresi ve iletişim bilgisi** bulunmalıdır,
- **ücretsiz ve kolay ret hakkı** sunulmalıdır.
Uymamanın yaptırımı idari para cezasıdır ve şikâyet üzerine işler.

**İki yoldan biri:**
- **(A) Güvenli yol:** maili tamamen "hizmet bilgilendirmesi" olarak yaz — *aylık üyelik
  tanıtım bölümünü çıkar* ya da tek cümleye indir ("üyelik seçeneklerine aylık seçeneği
  eklendi") ve satış çağrısı ("Premium'a geç") kullanma. Kalan içerik (güncelleme,
  denemeler, oyunlar) zaten hizmetin kendisiyle ilgili bilgilendirmedir.
- **(B) Doğru yol:** İYS kaydı + onay altyapısı kurulup öyle gönderilir. Bu ayrı bir iş.

Şu anki hâliyle (B) yok, o yüzden (A) öneriliyor.

---

## 🔴 2. "14 YENİ OYUN" — sayı yanlış, düzeltilmeli

**Ölçüm:** Oyun Merkezi uygulamaya **6 Ağustos 2026'da 15 oyunla birden** girdi
(commit: "Oyun Merkezi: 14 oyun uygulamaya girdi"). Bugün de **15 oyun** var; bu
güncellemede yeni oyun eklenmedi.

Metin hem "14 yeni oyun ekledik" diyor hem "toplamda 15 oyun" diyor — kendi içinde
çelişiyor ve ikisi de doğru değil.

**Yanıltıcı sayı, reklam mevzuatı açısından düzeltilmesi gereken tek net hata.**

**Önerilen ifade:** *"Oyun Merkezi'nde 15 oyun ve 2.600'den fazla oyun sorusu var."*
(Eski sürümde kalan kullanıcı bunları hiç görmedi; onun için zaten yeni. "Yeni" demeden
de aynı etkiyi verir.)

---

## 🟡 3. "25 çıkmış sınav kitapçığını analiz ettik" — dikkatli yaz

Bunu yazılı olarak duyurmak, elimizde resmî sınav kitapçıkları olduğunu ilan etmek
anlamına gelir. Sorular **birebir kopyalanmadı, türetildi** — bu doğru ve savunulabilir.
Ama cümleyi yumuşatmak daha az dikkat çeker:

**Önerilen:** *"Geçmiş yıllara ait çıkmış sınav sorularını inceleyerek soru havuzumuzu
gerçek sınav yapısına göre yeniden denetledik."*
(Sayı vermeden. "2.336 gerçek sınav sorusu" ifadesi de aynı sebeple çıkarılabilir.)

---

## 🟡 4. Gönderen kimliği eksik

Ticari nitelikli bir mailde gönderenin **ticari unvanı ve adresi** bulunmalı. Şu an
sadece `iletisim@mevzujsps.com` ve `mevzujsps.com` var.

**Eklenmeli (mailin altına):** ticari unvan · adres · e-posta · "Bu iletiyi Mevzu JSPS'e
kayıtlı olduğunuz için aldınız" · **ret hakkı** ("Bu maile ÇIK yazıp cevaplayın").

---

## 🟡 5. KVKK

E-posta adresleri tanıtım amaçlı kullanılıyorsa hukuki dayanak ve aydınlatma gerekir.
Mailin altına **gizlilik politikası bağlantısı** koy.

---

## 🟢 6. "Sizlerden en çok gelen taleplerden biri"

Üstünlük iddiası. Elimizde "en çok istenen özellik" diye bir ölçüm yok.
**Önerilen:** *"Gelen taleplerden birini hayata geçirdik."* (Küçük risk, kolay düzeltme.)

---

## 🟢 7. "Çalış. Hatırla. Kazan." sloganı

"Kazan" tek başına bir başarı garantisi olarak okunabilir. Slogan seviyesinde kaldığı ve
metinde "sınavı kazandırır" gibi bir taahhüt olmadığı için risk düşük. Bırakılabilir.

---

## 🟢 8. Resmî kurumla ilişki

Metin hiçbir yerde Jandarma/Sahil Güvenlik ile bağlantı iddia etmiyor — doğru.
Yine de mağaza açıklamasında ve sitede **"resmî bir kurumla ilişkisi yoktur"** ibaresinin
bulunması iyi olur.

---

## ✅ DOĞRULANAN OLGULAR (hepsi ölçüldü, savunulabilir)

| İddia | Durum |
|---|---|
| Aylık üyelik var | ✅ **Her iki mağazada da AKTİF, 389 TL** (Play: musterek_aylik ACTIVE · App Store: 389 TL) |
| 13 deneme (3+5+5) | ✅ Doğru |
| 900 deneme sorusu | ✅ Doğru (150+250+500) |
| Karma denemeler 100 soru, 1 puan | ✅ Doğru |
| Denemeler herkese ücretsiz | ✅ Doğru |
| TCK ücretsiz | ✅ Doğru |
| Yanlışta kanun+madde gösterimi | ✅ Doğru |
| Puan sıralaması | ✅ Doğru |
| Hata bildir | ✅ Doğru |
| 5.384 kart sorusu | ✅ Ölçüldü |
| 6.391 oyun/düello sorusu | ✅ Ölçüldü |
| 2.600+ oyun sorusu | ✅ Ölçüldü (~2.637) |
| 67 mevzuat (25+42) | ✅ Doğru |
| **19 Eylül sınav tarihi** | ✅ Uygulamadaki geri sayımla aynı (19 Eylül 2026, 14:00) |
| İçerik sunucudan iniyor | ✅ Doğru |
| Oyun Merkezi sunucudan | ✅ Doğru |

## ⚠️ DÜZELTİLEN SAYI

**1.511 görsel kart · 1.512 ses** → aradaki 1 fark: `4733_m8_6.mp3`. 4733 sayılı Kanun'un
görsel kartları hiç üretilmemiş (kodda da not düşülmüş), ses dosyası tek başına kalmış.
**Kullanıcıya etkisi yok** — kart olmadığı için o ses hiç çalmıyor.
Metinde **1.511 görsel kart + 1.511 sesli anlatım** olarak düzeltildi.
