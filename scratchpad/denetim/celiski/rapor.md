# Çelişkili kartlar: rapor

sonuc.json: 66 kayıt (kart_celiski.json + görevdeki EK LİSTE: 49; sonradan klasöre gelen ek_liste2.json, 19 kalem: 17).
Türlere göre: madde_hatali 30, hukum_hatali 20, dogrusu_hatali 8, eksik_kayit 8.
Yazılan her kayıt resmî metinden doğrulandı. Kendi denetçim (tmp/denetle.py) ve kutu_denetle kurallarıyla sınandı: HATA 0.

## Doğrulanamayan ya da değiştirilmeyen
- **62-1** (İşyeri Açma ve Çalışma Ruhsatları Yönetmeliği m.5). kart_celiski.json'da yok; blok raporunda "şüpheli" diye geçiyordu.
  Kartta "umuma açık yerler için şartlar ruhsat öncesi yerinde kontrol edilir" yazıyor. Resmî metinde bu cümlenin hemen önünde
  "(Mülga cümle:RG-11/12/2025-33104-CK-10681/3 md.)" notu var, ama cümlenin metni de duruyor. Mülga olan bu cümle mi, yoksa
  aradan çıkarılmış başka bir cümle mi, eldeki metinden anlaşılmıyor. Düzeltilmedi; güncel metne bakılmalı. Mülga ise hükümdeki
  son cümle silinmeli.
- **7-19** (3713 Geçici m.19, ek_liste2). Hükümdeki "dört yıl süreyle" elimizdeki resmî metinle birebir aynı. Metindeki 38 numaralı
  dipnotun içeriği yok; madde sonradan uzatıldı mı, süresi doldu mu, doğrulanamadı. Düzeltilmedi.
- **54-12** (ek_liste2: "içerik m.37"). Kart iki maddeyi birlikte anlatıyor. Soruları Merkezi Sınav Komisyonunun hazırlaması,
  sınavın illerde yapılması ve gözlemcileri valiliğin belirlemesi m.36'da; 15 günlük ilan süresi ile 80+20 ve 40+20 soru dağılımı
  m.37'de. Mevcut eşleme (m.36, m.37) yanlış olmadığı için değiştirilmedi. m.36'nın 2 sorusu bu karttaki kurallarla ilgili.

## Kayıt yazılmayan diğer kalemler
- **26-80, 26-24, 26-33**: göreve göre madde düzeltmesi yazılmadı (sistem 38/A, 110/A, 128/A'ya kendisi bağlıyor).
- **4-4**: duzeltmeler.json'daki kirmizi_kutu kaydı (kutu/sonuc/kanun_4.json) hükmü zaten düzeltmiş. Komşu, yönetici ve kapıcıya
  bildirim artık yalnız "adreste bulunmama hâlinde, muhataba haber verilmesi için" diye geçiyor ve m.21/1'e uygun. Ek kayıt
  gerekmedi.

## Uygulama için notlar
- **Sıra:** sonuc.json kutu sonuçlarından SONRA uygulanmalı. Kartlarımın çoğu kutu girdisinde de var. Kutu kaydı sonra gelirse
  yz/dg alanlarımı ezer. Bazı kutu girdileri eski yanlış hükmü ve yanlış "mevcut_dogrusu"yu taşıyor (ör. 41-20, 41-22, 41-24,
  31-16).
  - 14-16'yı kutu ajanı bilerek atlamış ("çelişki düzeltmesiyle yazılacak"); kaydı burada.
  - 1-47 ve 13-16 için kutu kayıtları da var ve resmî metne uygun.
- **52-6**: "Parkların esaslarını MEB belirler" bilgisi m.16'da da, elimizdeki metnin başka bir yerinde de yok. Kart doğrulanabilen
  m.16 içeriğine indirildi: belediyeler park yapar ve yapılmasına izin verir; trafik suç ve ceza tutanağı düzenleyemez.
  - Bu bilgi yönetmeliğin kapsam dışı bir maddesinde (MEB'in görevleri) bulunuyor olabilir.
  - Kartın ★ (çıkmış) işareti düzeltme kaydıyla değiştirilemiyor; gerekirse elle bakılmalı.
- **Bayrakta olmayan ama aynı kartta düzeltilenler** (resmî metinden doğrulandı):
  - 38-9: madde m.9 (deneyler) yerine m.12 ve m.13 oldu.
  - 41-24: madde listesinden m.20 (tutanaklar) çıkarıldı.
  - 47-3: madde sırası m.6, m.5 oldu (15 gün kuralı m.6'da).
  - 99-3: madde listesinden 86 çıkarıldı (3201 sayılı Kanunun maddesi).
  - 122-5: m.54/2'deki "sözleşme yapma süresi içinde teslim ve idarece uygun bulunma" şartı düzeltildi (122-1 ile aynı hata).
  - 39-4 ve 143-4: katalitik konvertörsüz araç cezası araç sahibine verilir.
  - 31-7: (k) bendi, "vizesi iptal edilenler" ve "ihlale teşebbüs edenler" eklendi.
  - 46-0: sit tanımının ikinci yarısı eklendi.
  - 48-0: (b) bendinin kapsamı düzeltildi.
- **Kanun 14 "nasıl soruluyor" notu** (kart değil, kanun notu) resmî metne aykırı. Not "şıkta banka teminat mektubu ya da kefalet
  senedi 'yapılabilir' diye verilir" diyerek bunu tuzak gibi gösteriyor; oysa m.5'e göre ikisi de güvenli e-imza ile yapılabilir.
- **31-16**: izinsiz çalıştıran işverenin yükümlülüğü 4817 m.21/3'e atıfla yazıldı; 4817 metni elde yok.
- **56-11**: CMK m.45-46 metni elde yok; ifade yönetmelikteki gibi bırakıldı.
- **99-3, 99-4, 122-1, 122-5**: uzun hükümlerde yalnız hatalı parça betikle değiştirildi (tmp/ek2_ekle.py, tmp/ek2b_ekle.py);
  hükmün geri kalanı aynı kaldı.
