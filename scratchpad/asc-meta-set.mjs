import { api } from './asc.mjs';
const LOC = 'c3c76536-4aa2-4235-aaee-5be17d9b82f8'; // tr localization

const description = `ÖNEMLİ: Bu uygulama hiçbir resmî kurumla (Jandarma Genel Komutanlığı, Sahil Güvenlik Komutanlığı, Jandarma ve Sahil Güvenlik Akademisi vb.) bağlantılı, onlar tarafından desteklenen ya da yetkilendirilen bir uygulama DEĞİLDİR. Bağımsız bir sınav hazırlık uygulamasıdır. "JSPS" yalnızca hazırlanılan sınavı tanımlamak için kullanılmıştır.

Mevzu — Görsel Hafıza ve Oyunlarla JSPS Sınavına Hazırlık

Kuru kanun metnini ezberlemek zordur ve çabuk unutulur. Mevzu, mevzuatı AKILDA KALICI hale getiren üç şeyi bir araya getirir: her maddeye özel görsel hafıza kartları, oynadıkça öğreten oyunlar ve her kanunun deneme sınavı.

GÖRSEL HAFIZA KARTLARI
Her kanun maddesi; başlığı, tematik bir sahnesi ve "aklına çivile" özetiyle tek bir görsele dönüşür. Beyin görseli düz metinden çok daha iyi hatırlar — madde gözünün önüne gelir.

OYUN MERKEZİ — 14 OYUN
Ezber yok, oyun var. Oynadıkça mevzuat aklında kalır, hem de sıkılmadan:
- Çengel Bulmaca — maddeyi harf harf çöz
- Boşluk Doldurma — eksik kelimeyi bul
- Doğru mu Yanlış mı — 60 saniyede karar ver
- Rütbe Merdiveni — er'den generale, bilgini rütbeye çevir
- Adam Asmaca, Kim Yapar?, Hangi Kanun?, Ceza Terazisi, Sıraya Diz ve daha fazlası
- Er Meydanı — canlı rakiple 1'e 1 soru düellosu, ligde yüksel
Oyunlar çıkmış sınav sorularından türetilmiştir.

DENEME SINAVLARI & ZAYIF MEVZİ
Her kanun için çoktan seçmeli sorular, anında geri bildirim. Yanlış yaptığın maddeler "zayıf mevzi" olarak işaretlenir; onları tekrar çalışarak eksiğini kapatırsın.

DAHA FAZLASI
- Sesli anlatım — kartları dinleyerek tekrar et
- Patika — kanunun maddelerini sırayla, ilerledikçe açılan yol
- Orijinal madde metni — kartın yanında tam metin (kaynak: mevzuat.gov.tr)
- İlerleme takibi, çalışma serisi ve hazırlık yüzdesi
- İndir, çevrimdışı çalış — ilerlemen hesabına yedeklenir, cihaz değiştirsen kaybolmaz

KANUN METİNLERİNİN KAYNAĞI
Uygulamada gösterilen tüm kanun ve mevzuat metinleri, Türkiye Cumhuriyeti resmî mevzuat veritabanından (Mevzuat Bilgi Sistemi) alınmıştır: https://www.mevzuat.gov.tr
Metinler bilgilendirme amaçlıdır; güncel ve bağlayıcı sürüm için daima resmî kaynak esastır. İlgili kaynağa uygulama içinde madde metni ekranından da erişilebilir.

KİMLER İÇİN?
JSPS / Jandarma ve Sahil Güvenlik Akademisi giriş ve terfi sınavlarına hazırlanan herkes.

Çalış, oyna, hatırla. Mevzuatın hepsi tek yerde.`;

const keywords = 'jandarma,sahil güvenlik,mevzuat,sınav,kanun,deneme,hafıza,TCK,akademi,uzman erbaş,oyun';

const whatsNew = `Yeni Oyun Merkezi: 14 oyunla mevzuatı oynayarak öğren — Çengel Bulmaca, Boşluk Doldurma, Doğru mu Yanlış, Rütbe Merdiveni, Er Meydanı (canlı 1v1) ve daha fazlası.
Patika yenilendi: bölüm bölüm ilerleyen, tamamladıkça açılan harita.
Sesli anlatım artık her kart açılışında otomatik başlıyor.
Çalışma sırasında ekran kapanmıyor.
Çeşitli iyileştirmeler ve hata düzeltmeleri.`;

const promo = 'Mevzuatı ezberlemeden öğren: her maddeye özel görsel kart, 14 oyun ve deneme sınavları tek uygulamada.';

const body = { data: { type: 'appStoreVersionLocalizations', id: LOC, attributes: { description, keywords, whatsNew, promotionalText: promo } } };
const r = await api(`appStoreVersionLocalizations/${LOC}`, { method: 'PATCH', body: JSON.stringify(body) });
console.log('META PATCH:', r.status, r.status === 200 ? 'OK' : JSON.stringify(r.body).slice(0, 400));
console.log('keywords uzunluk:', keywords.length, '| promo:', promo.length);
