# GECE TEST RAPORU — 2 Temmuz 2026 (otonom gece nöbeti)

> Başkanın emri: "Uygulamayı A'dan Z'ye test et, hataları bul, düzelt, sabah özet sun. Build alma."
> Test ortamı: tarayıcı (localhost:8081, senin açık Brave'in kumanda edildi) + Supabase paneli.
> Build ALINMADI. 4 commit atıldı, hepsi master'da.

---

## 1) BULUNAN VE DÜZELTİLEN SORUNLAR

### 🔴 Google girişi tarayıcıda sonsuz dönüyordu (senin bildirdiğin sorun) — ÇÖZÜLDÜ
- **Neden:** Dönüş adresi her yerde telefonun adresi (`mevzu://`) sabitlenmişti. Tarayıcı o adrese dönemez → pencere dönüp duruyordu. Ayrıca Supabase'in izinli adres listesinde `localhost:3000` vardı ama senin test ettiğin `localhost:8081` YOKTU.
- **Yapılan:** Kod artık platforma bakıyor (telefonda `mevzu://` aynen kaldı, tarayıcıda sayfanın kendi adresi). Supabase paneline `http://localhost:8081` ve `http://localhost:8081/**` eklendi.
- **Doğrulama:** İki farklı hesapla uçtan uca Google girişi yapıldı, pencere kendini kapatıp uygulamaya aldı. Senin `mevzu://` şüphen doğruydu — o zaten ekliydi; ekrandaki teşhis kutusu her durumda "ekle" yazdığı için seni yanıltmış. O metin de düzeltildi.
- Commit: `9604222`

### 🔴 Kartlar tarayıcıda bomboş açılıyordu (görsel + ses gelmiyor) — ÇÖZÜLDÜ
- **Neden:** İçerik deposunu güvenlik için özel (private) yapmıştık; web hâlâ eski açık adresten istiyordu → her istek reddediliyordu.
- **Yapılan:** Web artık telefondaki gibi kısa ömürlü imzalı adresler alıyor (mevcut sunucu fonksiyonu kullanıldı, telefon tarafına dokunulmadı).
- **Doğrulama:** TCK kartları görselleriyle açıldı, ses dosyası yüklendi ve çaldı (sayaç ilerledi), kartlar arası geçişte komşu kart anında geldi.
- Commit: `7b53e69`

### 🔴 EN ÖNEMLİSİ: Hesap değişince ilerleme karışıyordu — ÇÖZÜLDÜ
- **Ne oluyordu:** Çıkış yapıp BAŞKA hesapla girilince önceki kullanıcının ilerlemesi (çalışılan kartlar, sicil, sınavlar) yeni hesaba geçiyor ve onun bulutuna yazılıyordu. Canlı doğruladım: taptaze test hesabı, senin 17/565 ilerlemeni aynen devraldı. Telefonda da aynısı olur (testerlar hesap değiştirirse veriler birbirine bulaşır).
- **Yapılan (üç katman):** (1) Girişte "cihazdaki veri başka hesabın mı?" kontrolü → öyleyse yerel ilerleme tamamen temizlenip yeni hesabın bulutu yükleniyor. (2) Buluta kaydetme artık "bu veri gerçekten bu hesabın" doğrulaması yapmadan İTMİYOR (yarış durumlarında yanlış hesabın bulutunu kirletme/ezme ihtimali kapandı). (3) İlk girişte cihazdaki anonim ilerleme hesaba bağlanmaya devam ediyor (o davranış bozulmadı).
- **Doğrulama:** Sen 17/565 korundun; test hesabı 0/565'ten başladı; bulut kayıtları temiz. Bulaşan eski kayıtları Supabase'den elle sildim.
- Commit: `a83d6b9`

### 🟡 Eski/yanlış metinler — DÜZELTİLDİ
- Hesap ekranı "Giriş yapmak isteğe bağlıdır" diyordu (giriş zorunlu — eski metin kalmış).
- Gizlilik metni geri bildirimlerin "Formspree'ye" gittiğini söylüyordu — gerçekte kendi veri tabanımıza gidiyor (yanlış üçüncü-taraf beyanı KVKK açısından kötüydü).
- Teşhis kutusu (yalnız geliştirici görür) yanıltıcı "ekle" emri → "listede OLMALI" oldu.
- Commit: `0135511`

## 2) TEST EDİLİP SAĞLAM ÇIKANLAR ✅
- Tanıtım ekranı → Başla → giriş ekranı akışı.
- Google girişi: mevcut kullanıcı doğrudan içeri; YENİ kullanıcı profil adımına (ad/soyad/telefon/doğum/cinsiyet/rütbe/branş tek ekranda — "Branşını seç" doğrulaması da çalışıyor).
- Türkçe doğum tarihi seçici (gün/ay/yıl), cinsiyet ve rütbe/branş seçimleri.
- Karargah: sınav geri sayımı, günün maddesi (özet sızması YOK, tıklayınca DOĞRUDAN o maddenin kartı açılıyor ✓).
- Mevzuat: 23 kanun listesi, filtre çipleri, favori, "Başla" → Patika.
- Patika: harita, madde düğümleri, kart sayıları.
- Kart akışı: görsel tam boy, yakınlaştırma katmanı, Sesli Anlatım (gerçek mp3, hız kontrolü, ±10sn), "Anlatım bitti — öğrendin mi?" penceresi, Öğrendim/Tekrar Hatırlat ilerletmesi, Madde Metni paneli (resmî metin + kaynak bağlantısı kodda mevcut).
- Karttan Hata/Öneri Bildir → mesaj kart bilgisiyle (TCK m.2) Supabase tablosuna DÜŞTÜ (panelden doğruladım, test kaydını sonra sildim).
- Ara: tek/çok kelime, kapsam çipleri, vurgulu sonuçlar, sonuçtan doğrudan karta gitme.
- Talim: kanunlar 20'şerlik testlere bölünmüş (TCK 3 test ✓), soru çözme, doğru/yanlış + açıklama, "Önceki" (salt görüntüleme), yarıda bırak → kaldığın yerden devam.
- Evsaf: kişisel bilgiler, ilerleme sayaçları, ayarlar (branş/rütbe/hesap), Eğitim Planı (bildirim saatleri ekranı), Premium (web'de doğru "yalnız Android'de satın alınır" notu), Gizlilik metni ekranı, Çıkış.

## 3) SANA SORULACAKLAR (karar bekliyor) ❓
1. **TCK m.25 (Meşru savunma) içerikte yok.** Set şu maddeleri kapsıyor: 1-5, 20-23, 35-45, 247-266, 317-325. "meşru savunma" araması bu yüzden sonuçsuz. Müfredat bilinçli mi böyle, yoksa m.24-34 arası (hukuka uygunluk nedenleri) eklenecek mi?
2. **Hesap değişiminde branş/rütbe cihazda kalıyor** (ilerleme artık temizleniyor ama branş seçimi kalıyor; yeni giren kişi öncekinin branşını görür, Ayarlar'dan değiştirebilir). Bunu da sıfırlayayım mı? (Küçük iş, onay yeterli.)
3. **Web'de ekranlar bulut yüklemesinden önce okuyor** (sayfa yenilenince ilk 1-2 saniye 0 görünüp sekme değişince doğru sayı geliyor). Telefonda yaşanmaz (veri cihazda). Web sadece test aracı olduğu için düzeltmeye değer mi?
4. Arama sonucu başlıklarında "KVKK m.4 — Madde 4" gibi tekrar var (başlık alanı sadece "Madde 4" yazıyor). İçerik üretiminde başlıklar zenginleşecek mi, yoksa gösterimi mi sadeleştireyim?

## 4) NOTLAR
- Evsaf'taki "Örnek kayıt ekle / Temizle" düğmeleri ve TEŞHİS kutuları YALNIZ geliştirici modunda görünüyor — gerçek kullanıcı görmez, sorun değil.
- Test hesabı respectylmz2 "Gece Devriyesi" adıyla profil oluşturdu (testte kullandım; istersen Supabase'den silersin).
- Bu düzeltmeler JS tarafında → telefonda görünmesi için bir SONRAKİ build'e girecek (build almadım, emrin gereği). vCode 12'lik değişiklik listesine bunlar da eklendi sayılır.
- Tip denetimi her commit'te 0 hata; web + native veri katmanı paritesi (4-dosya kuralı) korundu.
