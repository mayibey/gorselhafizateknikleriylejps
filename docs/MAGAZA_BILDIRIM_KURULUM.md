# Mağaza Bildirim Ucu — Kurulum ve Çalışma Mantığı

22 Eylül 2026'da kuruldu. Amaç başkanın iki isteği:
1. "İade alınmışsa **anında** erişim kesilsin" (aylık/yıllık/ömür boyu fark etmeksizin)
2. "Apple/Google iade talebinde bize sorup onay bekliyor mu, istediği bilgileri veren sistemimiz var mı?"

Adres: `https://vwmjrvolkbiofpkzzwef.supabase.co/functions/v1/magaza-bildirim`

---

## Hangi koruma ne zaman devreye giriyor

| Katman | Kapsam | Gecikme | Kurulum gerekir mi |
|---|---|---|---|
| Mağaza bildirimi | Apple + Google, her ürün tipi | **anında** | ✅ panelden adres girilmeli |
| İade nöbeti (`iade-nobeti`) | **yalnız Google** | en fazla 15 dk | ❌ kurulu ve çalışıyor |
| Gece denetimi (`uyelik-denetim`) | Apple + Google, tam tarama | en fazla 24 saat | ❌ kurulu ve çalışıyor |

Yani panel adımları yapılmasa bile Android iadeleri 15 dakikada kesiliyor.
**Apple iadelerinin anında kesilmesi ve iade itirazı için panel adımı şart** — Apple'ı toplu
sorgulayabileceğimiz bir uç yok, tek tek sormak da pahalı.

---

## BAŞKANIN YAPACAĞI İKİ PANEL ADIMI

### 1) Apple — App Store Server Notifications ✅ KURULDU (22 Eyl 2026, doğrulandı)
Üretim ve sandbox adresleri girildi. **Canlı kanıt:** Apple'ın kendi test bildirimi tetiklendi →
teslimat sonucu **SUCCESS**, sürüm **2.0**, uygulama `app.mevzujsps.ios`; bizim kayda da düştü
(`TEST: islem numarasi yok, gecildi`). İmza doğrulama kodu **gerçek Apple imzalı bildirimle**
sınandı: zincir 3 sertifika, kök parmak izi tuttu, ES256 imza geçerli.
*Not: Apple kaydettikten sonra adresi ~5 dakika yaymıyor; hemen denenirse
`4040007 No App Store Server Notification URL found` döner — panik yok, bekle.*
*Apple sürüm sormuyorsa sorun değil: yeni kurulan adresler V2 olarak çalışıyor (test bunu doğruladı).*

<details><summary>Kurulum adımları (tekrar gerekirse)</summary>

App Store Connect › Uygulama › **App Information** › sayfanın altındaki
**App Store Server Notifications** bölümü:
- **Production Server URL**: `https://vwmjrvolkbiofpkzzwef.supabase.co/functions/v1/magaza-bildirim`
- **Version**: **Version 2** (V1 değil)
- Sandbox URL'ine de aynı adres yazılabilir (zararı yok, test bildirimleri de aynı yere düşer).

Kaydettikten sonra aynı ekrandaki test düğmesiyle deneme bildirimi gönderilebilir.
</details>

### 2) Google — Real-time developer notifications
Play Console › Uygulama › **Monetization setup** › **Real-time developer notifications**:
- Pub/Sub konusu oluştur, konuya push aboneliği ekle.
- Push adresi: `https://vwmjrvolkbiofpkzzwef.supabase.co/functions/v1/magaza-bildirim?anahtar=<ANAHTAR>`
- `<ANAHTAR>` = Supabase gizli değeri `MAGAZA_BILDIRIM_ANAHTARI` (kurulumda üretildi).
- "Send test notification" ile denenebilir.

Google adımı **isteğe bağlı**: iade nöbeti zaten 15 dakikada yakalıyor. Bu adım gecikmeyi
15 dakikadan saniyelere indirir.

---

## AÇIK İŞ — Apple'a iade itirazı için tek cümle gerekiyor

Apple, "bu müşteri ne kadar kullandı" cevabımızı **ancak müşteri veri paylaşımına rıza
göstermişse** dikkate alıyor. Rıza bayrağını `false` gönderince cevabın tamamını reddediyor.
Apple'ın kendi yanıtı (canlı test, 22 Eyl 2026):

```
HTTP 400  errorCode 4000035
"Invalid request. The customer consented field is required and must indicate the customer consented."
```

Kullanım şartlarımızda (`docs/sartlar.html` › 4. ÜYELİK, YAŞ ve ÜCRET) böyle bir cümle **yok**.
Olmayan rızayı "var" diye beyan etmeyiz — bu yüzden `apple_tuketim_rizasi` ayarı **kapalı**
bırakıldı ve mekanizma o güne kadar boşta duruyor.

**Önerilen cümle (başkan onayına sunuldu, henüz EKLENMEDİ):**

> Uygulama mağazası üzerinden bir iade talebinde bulunursan, talebi değerlendirebilmesi için
> Apple'ın/Google'ın istediği kullanım bilgilerini (ör. içeriği ne ölçüde görüntülediğin,
> üyelik süren) ilgili mağazayla paylaşabiliriz.

Cümle eklendikten sonra tek komut:
```sql
insert into uygulama_ayar (anahtar, deger) values ('apple_tuketim_rizasi','1')
on conflict (anahtar) do update set deger='1';
```

---

## Güvenlik temeli — "bildirime değil mağazaya inan"

Uç herkese açık (Apple/Google Supabase kimliği göndermez; fonksiyon `--no-verify-jwt` ile
yayınlanır — aksi hâlde bütün bildirimler 401 alır, ilk denemede bu oldu).

Açıklığı telafi eden kural: **gelen bildirim tek başına hiçbir hakkı silmez.** Her yıkıcı
işlemden önce mağazanın kendi API'sine sorulur:
- Apple → `inApps/v1/transactions/<id>` › `revocationDate`
- Google → `purchases/voidedpurchases`

Canlı doğrulama (22 Eyl 2026): iade edilmemiş gerçek bir üyelik için **sahte iade bildirimi**
gönderildi → cevap `REFUND: Apple iadeyi gostermiyor — DOKUNULMADI`, hak yerinde kaldı.

Ek katman: Apple imzası x5c zinciriyle ve **Apple Root CA G3** parmak iziyle doğrulanır
(`63343abf…9179`; Apple'dan indirilip hesaplandı — ezberden yazılan değer yanlıştı).
İmza denetimi **bilerek engelleyici değil**: engelleyici olsaydı bizim sertifika ayrıştırma
kodumuzdaki tek bir hata bütün bildirimleri sessizce çöpe atardı (üstelik Apple 500 görüp
sonsuza kadar tekrar denerdi). Sahte bildirim zaten mağaza teyidinde eleniyor.

---

## Tuzaklar

- **`voidedpurchases` 30 gün sınırı:** `startTime` 30 günden eski olursa Google
  `400 "must be within [30] days of data"` döner ve liste **komple boş** gelir — iadeler
  sessizce görünmez olur. 29 gün kullanılıyor; denetim özetindeki `google_iade_listesi`
  alanı `"ok"` değilse bu uç bozulmuş demektir.
- **Yeni Supabase fonksiyonu varsayılan olarak JWT ister.** Mağaza uçları `--no-verify-jwt`
  ile yayınlanmalı.
- **500 YALNIZ tekrar denemenin işe yarayacağı hâlde dönülür** (mağazadan teyit alınamadı).
  Bozuk/boş gövdeye 500 dönmek sonsuz tekrar üretir, hiçbir şeyi düzeltmez → ona 200 denir.
  Apple adresi kaydederken **boş gövdeli yoklama** gönderiyor; ilk sürümde ona hata dönüyorduk.
