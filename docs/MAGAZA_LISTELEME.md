# Mağaza Listeleme Metinleri (Google Play)

> Hedef: **Google Play** (Android). İleride App Store eklenirse metinler büyük ölçüde geçerli.
> Karakter sınırları işaretli. Uygulama adı: **MEVZU-JSPS**.

## Uygulama adı (max 30)
- **Önerilen:** `MEVZU-JSPS: Görsel Hafıza` (marka + anahtar kelime). Kısa marka: `MEVZU-JSPS`.

## Kısa açıklama (Play, max 80)
`Jandarma/SG sınavına görsel hafıza kartları ve deneme sınavlarıyla hazırlan.`

## Tam açıklama (TR)
```
JSPS (Jandarma ve Sahil Güvenlik Personeli Sınavı) mevzuatını ezberlemek yerine GÖRSELLE aklında
tut. Her kanun maddesi için görsel hafıza kartları, sesli anlatım ve sınav kapsamına
birebir uygun "patika" ile çalış; her kanunun deneme sınavıyla kendini sına.

• Görsel hafıza kartları — maddeleri karikatürle, kalıcı şekilde öğren
• Deneme sınavları — her kanun için çoktan seçmeli sorular, anında geri bildirim
• Patika — her kanunun sınav kapsamındaki maddeleri tek tek, sırayla
• Sicil & Ödül-Ceza — kanun bitince takdir, ihmal edince geri-besleme; askeri disiplin temasıyla
• Eğitim Planı — sabah/gece/fırsat eğitimi hatırlatmaları
• Madde metinleri — resmî tam metin, çevrimdışı erişim (kaynak: mevzuat.gov.tr)

Kanunu indir, internetsiz çalış. Google ile giriş yapılır; ilerlemen hesabına yedeklenir (cihaz değiştirsen kaybolmaz).

KANUN METİNLERİNİN KAYNAĞI: Uygulamadaki tüm kanun ve mevzuat metinleri Türkiye Cumhuriyeti
resmî mevzuat veritabanından (Mevzuat Bilgi Sistemi) alınmıştır: https://www.mevzuat.gov.tr
Güncel ve bağlayıcı sürüm için daima resmî kaynak esastır.

Not: Bu uygulama bağımsız bir hazırlık aracıdır; Jandarma Genel Komutanlığı, Sahil Güvenlik
Komutanlığı veya herhangi bir resmî kurumla bağlantılı değildir. Sınav başarısını garanti etmez;
resmî mevzuatta güncel kaynak esastır.
```

## Kategori
- Birincil: **Eğitim (Education)** · İkincil: Sınav hazırlık

## Yaş / içerik derecelendirmesi (IARC anketi)
- Kullanıcı içeriği (sohbet/UGC) **YOK**, çevrimiçi etkileşim **YOK** → düşük derece (genelde
  **Herkes / 3+**). Ankette "kullanıcılar arası iletişim" sorularına **HAYIR** işaretle.

## Veri toplama beyanı (Google Data Safety) — GÜNCEL (2 Tem 2026)
> ⚠️ DİKKAT: Bu bölüm 2 Tem 2026'da düzeltildi. Uygulama artık hesap açıyor ve VERİ TOPLUYOR.
> Formun ilk sorusuna **"Evet, veri topluyor/paylaşıyor"** işaretle. Eski "veri toplamıyor" beyanı GEÇERSİZ.

**Genel:** Aktarımda şifreli = **Evet** · Kullanıcı silme talep edebilir = **Evet** (uygulama içi 30 gün + iletisim@) · İzleme (tracking) = **Hayır**

| Veri türü | Toplanıyor | Kimliğe bağlı | Amaç |
|---|---|---|---|
| E-posta adresi | Evet | Evet | Hesap yönetimi, uygulama işlevi |
| Ad (ad + soyad) | Evet | Evet | Uygulama işlevi (Takdir Belgesi kişiselleştirme) |
| Telefon numarası | Evet | Evet | Hesap yönetimi |
| Kullanıcı kimliği (hesap no) | Evet | Evet | Hesap yönetimi |
| Doğum tarihi (diğer bilgi) | Evet | Evet | Uygulama işlevi (18+ doğrulama) |
| Cinsiyet (diğer bilgi) | Evet | Evet | Uygulama işlevi |
| Uygulama etkinliği / ilerleme | Evet | Evet | Uygulama işlevi, kişiselleştirme |
| Satın alma geçmişi (finansal) | Evet | Evet | Uygulama işlevi (IAP; kart/banka verisi Google'da) |
| IP adresi / günlük (diğer) | Evet | Evet | Güvenlik, kötüye kullanımı önleme |
| Geri bildirim mesajı (UGC) | Yalnız gönderilirse | Evet | Destek |

- **Paylaşım (3. taraf):** Google/Supabase/Cloudflare = **işleyen (processor)** → Play tanımında "paylaşım" DEĞİL, "toplama" altında kalır. (Formspree endpoint'i şu an boş; ileride açılırsa geri bildirim "3. tarafla paylaşılıyor" olur.)
- **"Hayır" işaretlenecekler:** Konum, kişiler, takvim, kamera/mikrofon, reklam kimliği, sağlık/fitness.
- **Push token:** şu an üretilmiyor/gönderilmiyor (yalnız lokal bildirim) → beyan etme. v2'de FCM açılırsa "Cihaz kimlikleri" ekle.
- **İçerik derecesi anketi:** kullanıcılar arası iletişim/UGC paylaşımı **YOK** (geri bildirim tek yönlü) → o sorulara Hayır; ama "kişisel veri topluyor mu?" → **Evet**.

## Gerekli ekstra (review için)
- **Gizlilik Politikası URL'si:** `docs/index.html` yayında (GitHub Pages) → Play Console'a + `config.ts > GIZLILIK_URL`'e yaz.
- **Destek e-postası:** iletisim@mevzujsps.com
- Ekran görüntüleri: Android telefon (zorunlu) + 7"/10" tablet (önerilir) · Feature graphic (1024×500, zorunlu)
- **Demo hesap GEREKLİ** (giriş zorunlu) — inceleme için test hesabı bilgisi ver (örn. android.test@mevzujsps.com).
- **Hesap silme web yolu GEREKLİ:** `docs/hesap-sil.html` yayında → Play "hesap silme URL"si olarak ver.
