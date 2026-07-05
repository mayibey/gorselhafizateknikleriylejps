# Çok-Ajanlı Denetim Sistemi (kendini geliştiren)

> Başkan talimatı (6 Tem): "Ajanlara körü körüne güvenme; hepsi birbirini denetlesin
> ve aksi, her denilene inanmayan çok zeki bir ajan bunları sınasın; ajanlar kendini
> sürekli geliştirsin." + "Ben fark ediyorum da sen neden fark edemiyorsun?"
>
> Bu dosya, yayın öncesi/sonrası denetimin **tekrar kullanılabilir** tarifidir. Yeni bir
> denetim gerekince buradaki promptlarla ajanları kur. Her denetim sonunda "ÇIKARILAN
> DERSLER" bölümüne yeni tuzak eklenir → sistem kendini geliştirir.

## Katmanlar (neden bu yapı)
1. **Bulucular (finder'lar)** — paralel, her biri FARKLI bir açıdan tarar, birbirinden habersiz.
   Tek açı her şeyi bulamaz; körlük dağıtılır.
2. **Aksi doğrulayıcı (adversarial verify)** — her bulguya, onu ÇÜRÜTMEYE çalışan ayrı ajan.
   "Şüpheli ama gerçekçi" → PLAUSIBLE tut; yalnız koddan kanıtlanınca REFUTE. Recall > precision.
3. **Baş-şüpheci (chief-skeptic / meta)** — bulucuların NE KAÇIRDIĞINI sorar: "hangi giriş
   noktası taranmadı? hangi istemci kapısının sunucu karşılığı yok? hangi config fail-open?"
   Çıktısı bir sonraki turun iş listesi olur.

## Bu projeye özel KÖK DERS (neden premium bypass kaçtı)
Kilit ÇAĞIRANA devredilmişti (/akis kilidi vardı ama arama/sınav/zor-detay/sesli-nöbet
kapısızdı). **Ders: güvenlik kapısını EN ÇAĞIRAN yere değil, EN DAR MEKANİZMAYA koy**
(paylaşılan hook + queue filtresi). Bir giriş noktasını görüp ötekileri varsaymak = kaçış.

## Geliştirilmiş BULUCU promptları (bu denetimin meta katmanının önerdiği 3 açı)

### Bulucu 1 — ENVANTER-ÖNCE (kaçan giriş noktası avcısı)
> "Önce şu KAYNAĞA erişimin TÜM giriş noktalarını LİSTELE (grep: bu ekrana/veriye giden
> her route, arama sonucu, deep-link, indir-aç, paylaş). SONRA her birinde koruma var mı
> tek tek doğrula. Bir tanesinde koruma görüp 'gerisi de vardır' DEME — listedeki HER
> maddeyi işaretle: korumalı / korumasız / emin değilim. Korumasız + 'emin değilim'i raporla."

### Bulucu 2 — İSTEMCİ-KAPI ⟷ SUNUCU-KAPI EŞLEŞTİRME
> "İstemcideki her yetki/ödeme/kilit kontrolü için, SUNUCUDA (RPC/Edge fn/RLS) karşılığı
> var mı bul. İstemci kapısı sunucuda karşılıksızsa = atlatılabilir (istemci kod güvenilmez).
> Ters yön: sunucu bir alanı zorluyor (ör. obfuscatedExternalAccountId) ama istemci
> göndermiyorsa = kırık. Her çifti 'eşleşti / istemci-only / sunucu-only' diye raporla."

### Bulucu 3 — CONFIG/SECRET FAIL-OPEN taraması
> "Env var / secret / uzak-ayar OKUYAN her dalı bul. Değer YOKSA/hatalıysa ne olur?
> Güvenlik/ödeme kapısı AÇIK kalıyorsa (fail-open) = kritik. Kural: kapılar fail-CLOSED
> olmalı (secret unutulursa premium KAPALI kalsın). `=== '1'` gibi 'yalnız açıkça açık'
> yerine `!== '0'` gibi 'yalnız açıkça kapalı' ara. Her okumayı fail-open/fail-closed işaretle."

## ÇIKARILAN DERSLER (her denetimde büyür)
- **6 Tem:** Kilit çağırana devredilince giriş noktaları kaçar → mekanizma seviyesinde kapı.
- **6 Tem:** Edge fn `KILIT === '1'` fail-open idi; secret unutulunca tüm premium açığa
  çıkardı → `!== '0'` fail-closed'a çevrildi (imzali-url, gorsel).
- **6 Tem:** Banner "yıllık ve ömür boyunda geçerli" koşulsuzdu ama yalnız biri Play'de
  hazır olabiliyordu → kapsam GERÇEK duruma bağlandı (fazla vaat = güven kaybı).
- **6 Tem:** Web getStudyCards tüm kartları döndüğü için yerelBosMu web'de hep dolu →
  bulut geri-yükleme web'de hiç tetiklenmiyordu. Platform-nötr sinyal (kutu>0) şart.
- **6 Tem:** obfuscatedExternalAccountId ≠ user.id kontrolü yoktu → başka hesaba ait
  satın alma bu hesaba bağlanabilirdi. Sunucu doğrulamada sahiplik zorunlu.
