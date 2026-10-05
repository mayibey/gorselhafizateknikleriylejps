# Resmî Yazışmalarda Uygulanacak Usul ve Esaslar Hakkında Yönetmelik — kelime → cevap
# KURAL (başkan, 4 Eki 2026): SOL = soru KÖKÜNDE göreceğin ifade, SAĞ = doğru ŞIKTA arayacağın kelime.
# Sorulardan geriye doğru yazıldı (148 cevaplı soru + kitapçık kökleri); kanıt resmî metin.
# Not: "İlgi" tek başına SOL yapılmadı (her kökte "ile ilgili" geçer); "satır boşluğu" ailesi ayrı satırlarda.
import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ortak import yaz
K = [
 # m.1-2 — amaç, kapsam, dayanak
 ('1','tanim','Yönetmeliğin amacı','hızlı ve güvenli alışveriş; uygulama birliği','MADDE 1- (1) Bu Yönetmeliğin amacı','uygulama birliğini sağlamaktır.',[],'e-imzalı ve el yazısıyla imzalı yazışmanın kuralları'),
 ('1','tanim','kuruluşlarını kapsar','bütün kamu kurum ve kuruluşları','(2) Bu Yönetmelik, bütün','kuruluşlarını kapsar.',[],''),
 ('2','kosul','dayanılarak hazırlanmıştır','1 sayılı Cumhurbaşkanlığı Teşkilatı Kararnamesi m.6 ve m.7','MADDE 2- (1) Bu Yönetmelik, 1 sayılı','dayanılarak hazırlanmıştır.',[],''),

 # m.3 — tanımlar (tanımdaki ayırt edici ifade → kavram)
 ('3','tanim','Belgenin hazırlanmasından tasfiyesine','aidiyet zinciri','a) Aidiyet zinciri:','tasfiyesine kadar olan sürecini,',[],''),
 ('3','tanim','periyodik olarak alınan zaman damgası','arşiv imza','b) Arşiv imza:','korunan elektronik imzayı,',[],'kriptografik metotların koruması zamanla azalır'),
 ('3','tanim','delil teşkil ederek','belge','c) Belge: Herhangi','kayıt altına alınmış her türlü bilgiyi,',[],'e-imza ya da el yazısıyla imzalı, kayıtlı her bilgi'),
 ('3','tanim','Merkezi Kayıt Sistemi','DETSİS; Dijital Dönüşüm Ofisi yürütür','ç) Devlet Teşkilatı','tanımlandığı sistemi,',[],'e-Yazışma Teknik Rehberini de DDO yayımlar'),
 ('3','tanim','paraf yerine geçecek','elektronik onay','e) Elektronik onay:','elektronik ortamda alınmasını,',[],'güvenli e-imza kullanılmayan durumlarda'),
 ('3','tanim','EBYS içerisinde','elektronik ortam','f) Elektronik ortam:','gönderildiği ortamı,',[],''),
 ('3','tanim','imzalama ve şifreleme','e-Yazışma Teknik Rehberi (Dijital Dönüşüm Ofisi)','g) e-Yazışma Teknik Rehberi:','yayımlanan güncel rehberi,',[],''),
 ('3','tanim','Kâğıt ortamında','fiziksel ortam','ğ) Fiziksel ortam:','yapılan işlemleri,',[],''),
 ('3','tanim','Biçimli belge','form','h) Form:','Biçimli belgeyi,',[],'FORM biçimli belge, FORMAT dosya türü'),
 ('3','tanim','Elektronik dosya türleri','format','ı) Format:','dosya türlerini,',[],''),
 ('3','tanim','ekleme, değiştirme, silme','günlük rapor','i) Günlük rapor:','ihtiva eden kayıtları,',[],''),
 ('3','tanim','Münhasıran imza sahibine','güvenli elektronik imza','j) Güvenli elektronik imza:','sağlayan elektronik imzayı,',[],''),
 ('3','tanim','Çok Gizli','kurumsal belge kayıt sistemiyle sayı alınır','m) Kurumsal belge kayıt sistemi:','tutulan elektronik kaydı,',[],'EBYS kullanamayan idare ve olağanüstü durum belgeleri de'),
 ('3','tanim','Olağanüstü durum:','güvenlik zafiyeti, uzun elektrik kesintisi, EBYS çalışmaz; mevzuat gereği DEĞİL','n) Olağanüstü durum:','hazırlanması gereken durumları,',[],'mevzuat gereği fiziksel hazırlama = zorunlu hâl'),
 ('3','tanim','iletişim sağlamak amacıyla','resmî yazışma','o) Resmî yazışma:','yürüttükleri süreci,',[],''),
 ('3','tanim','sınıflama şeması','standart dosya planı (Devlet Arşivleri)','ö) Standart dosya planı:','sınıflama şemasını,',[],''),
 ('3','tanim','Bir belgeyi tanımlayan','üstveri','p) Üstveri:','benzeri tüm bilgileri,',[],'gönderici, konu, tarih, sayı'),
 ('3','tanim','ek veya ekleri','üst yazı (ekler hariç)','r) Üst yazı:','hariç kısmını,',[],''),
 ('3','tanim','karar verme yetkisine','yetkili makam','s) Yetkili makam:','sahip görevlileri,',[],''),
 ('3','tanim','doğrulanan zaman kaydı','zaman damgası','ş) Zaman damgası:','zaman kaydını,',[],'elektronik sertifika hizmet sağlayıcısı doğrular'),
 ('3','tanim','fiziksel ortamda hazırlanması gereken hâller','zorunlu hâl','t) Zorunlu hâl:','gereken hâlleri,',[],'olağanüstü durum: güvenlik zafiyeti, EBYS çalışmaz'),

 # m.4-5 — ortam ve nüsha
 ('4','kosul','kuruluşlarınca resmî yazışmalar','elektronik ortamda, güvenli e-imzayla','MADDE 4- (1) Kamu kurum ve kuruluşlarınca','elektronik ortamda saklanır.',[],'e-Yazışma Teknik Rehberine uygun'),
 ('4','kosul','muhatapları ile paylaşılır','elektronik ortamda saklanır','Bu belgeler, elektronik ortamda','elektronik ortamda saklanır.',[],''),
 ('4','yasak','çıktısı alınarak','el yazısıyla imzalanmaz, fiziksel saklanmaz','Ayrıca güvenli elektronik imza ile imzalanan belgeler, çıktısı','fiziksel ortamda saklanmaz.',[],''),
 ('4','istisna','el yazısıyla imzalanan belgelerle','zorunlu hâl veya olağanüstü durumda; fiziksel ortam','(2) Zorunlu hâllerde','fiziksel ortam şartlarına göre gerçekleştirilir.',[],''),
 ('5','sayi_oran','nüsha olarak hazırlanır','tek nüsha (e-imzalı belge)','(1) Elektronik ortamda güvenli','tek nüsha olarak hazırlanır.',[],''),
 ('5','sayi_oran','olağanüstü durumlarda hazırlanacak belgeler','en az iki nüsha; paraflı nüsha idarede','(2) Zorunlu hâllerde','iki nüsha olarak düzenlenir.',[('6','aynı ifade + üst yazı ise kâğıdın bir yüzü')],'E-İMZA TEK, KÂĞIT EN AZ İKİ'),

 # m.6-9 — kâğıt, yazı tipi, kenar, logo
 ('6','sayi_oran','dikkate alınarak hazırlanır','belgeler: A4 (210x297 mm) boyutu','MADDE 6- (1) Belgeler, A4','dikkate alınarak hazırlanır.',[],'ekler farklı form, format, ebatta olabilir'),
 ('6','kosul','Belge ekleri farklı','form, format veya ebatta hazırlanabilir','(2) Belge ekleri farklı','ebatlarda hazırlanabilir.',[],'üst yazı A4 boyutunda; eklerde farklı yazı tipi de olabilir (m.7)'),
 ('6','sira_usul','belgelerin üst yazıları için','kâğıdın bir yüzü; eklerde iki yüz','(3) Zorunlu hâllerde','her iki yüzü de kullanılabilir.',[],''),
 ('7','sayi_oran','harf büyüklüğü','Times 12, Arial 11; en az 9, iletişimde 8','Harf büyüklüğünün Times','8 puntoya kadar düşürülebilir.',[],'eklerde farklı yazı tipi ve punto olabilir'),
 ('7','sayi_oran','yazı tipi','Times New Roman veya Arial','MADDE 7- (1) Hazırlanan belgelerde','normal yazı stilinde kullanılır.',[],'normal yazı stili'),
 ('8','sayi_oran','üst, sol ve sağ kenarından','1,5 cm boşluk','MADDE 8- (1) Belgenin yazı alanı','1,5 cm boşluk bırakılarak düzenlenir.',[],''),
 ('8','sayi_oran','logo kullanmak istediğinde','üst boşluğu 0,5 cm','İdare, logo kullanmak','0,5 cm olarak düzenlenir.',[],''),
 ('9','sayi_oran','logo kullanılabilir','en fazla iki','Belge üzerinde en fazla','en fazla iki logo kullanılabilir (Örnek 1).',[],''),
 ('9','kosul','kurumsal logo','tercihen (zorunlu değil)','MADDE 9- (1) İdareler, tercihen','kurumsal logo kullanabilir.',[],''),
 ('9','sira_usul','logo kullanıldığında','üst idare solda, alt idare sağda','Belge üzerinde iki ayrı logo','alt olan idareye ait logo sağda kullanılır.',[],'kavram/etkinlik logosu: idare solda, diğeri sağda'),

 # m.10 — başlık (antet)
 ('10','tanim','antet','GÖNDEREN idarenin adı; T.C. ilk satır, ortalı','MADDE 10- (1) Başlık (antet)','küçük harflerle ortalanarak yazılır.',[],'idare adı BÜYÜK, birim adı ilk harfler büyük'),
 ('10','kosul','İdarelerin il ve ilçe teşkilatlarında','5442 İl İdaresi Kanunu','(3) İdarelerin il ve ilçe','olduğu gibi yazılır (Örnek 2).',[],'ikinci satıra mülki idarenin adı'),
 ('10','sira_usul','Dış temsilciliklerde','il ve ilçe teşkilatındaki gibi','Dış temsilciliklerde başlıklar','olduğu gibi yazılır (Örnek 2).',[],''),
 ('10','kosul','Başlığın yazımında','DETSİS başlık kayıtları esas','(6) Başlığın yazımında','esas alınır.',[],''),
 ('10','sira_usul','bağlı veya ilgili idarelerde','ikinci satıra bağlı olunan idare; dört satır','Ancak bağlı veya ilgili idarelerde','yazılabilir (Örnek 2).',[],''),
 ('10','sira_usul','merkezî teşkilata bağlı','merkezî ve taşra teşkilatı adları','(5) Doğrudan merkezî','adlarına yer verilir (Örnek 2).',[],''),
 ('10','sira_usul','Bölge müdürlüklerinde','hangi bölge teşkilatı olduğu yazılır','(4) Bölge müdürlüklerinde','olduğu yazılır (Örnek 2).',[],''),

 # m.11 — sayı
 ('11','tanim','“Sayı:”','zorunlu; E/Z/O-DETSİS no-dosya planı kodu-kayıt no','MADDE 11- (1) Belgelerde sayı','konulur (Örnek 3).',[('13','“Konu:” yan başlığı “Sayı:” yan başlığının bir alt satırına')],''),
 ('11','tanim','zorunlu hâller için','Z (E elektronik, O olağanüstü)','“Sayı:” sırasıyla','konulur (Örnek 3).',[],''),
 ('11','sira_usul','standart dosya planı kodu','aralarına kısa çizgi (-)','“Sayı:” sırasıyla','kısa çizgi işareti (-) konulur (Örnek 3).',[],''),
 ('11','kosul','kayıt numarası','EBYS’den alınır; eşsiz olmalı','Kayıt numarası, belge hazırlanırken','eşsiz olması zorunludur.',[],'zorunlu hâlde imzadan SONRA alınır'),
 ('11','sira_usul','el yazısıyla imzalandıktan sonra','zorunlu hâlde kayıt numarası alınır','Zorunlu hâllerde hazırlanan belgenin kayıt','kurumsal belge kayıt sistemi üzerinden alınır',[],''),
 ('11','sira_usul','başlığın son satırından itibaren','iki satır boşluk, yazı alanının solundan','(2) “Sayı:” yan başlığı','solundan başlanarak yazılır (Örnek 3).',[],''),
 ('11','sira_usul','EBYS’ye erişim sağlandığında','belge ve üstveri EBYS’ye kaydedilir','(3) Olağanüstü durumlarda belge','EBYS’ye kaydedilir.',[],'olağanüstü durumda numara kurumsal belge kayıt sisteminden'),

 # m.12 — tarih
 ('12','sira_usul','Tarih;','sayıyla aynı satırda, en sağda; ay harfle → işaretsiz','MADDE 12- (1) Tarih;','herhangi bir işaret konulmaz (Örnek: 10 Ekim 2019).',[],'gün.ay.yıl rakamla, aralarda nokta'),
 ('12','sayi_oran','Gün ve ay iki haneli','yıl dört haneli','Gün ve ay iki haneli','dört haneli olarak düzenlenir',[],''),
 ('12','kosul','belge tarihi olarak','son yetkilinin e-imza zaman damgası','(2) Belgenin en son yetkili','üstveri alanında yer alır.',[('20','olur belgesinde olur makamının e-imza tarihi esas')],''),
 ('12','kosul','belgenin imzalandığı zamanı belirtir','zorunlu/olağanüstü belgede tarih = imza tarihi','(3) Zorunlu hâllerde veya olağanüstü durumlarda hazırlanan belgede','imzalandığı tarihte kayıt altına alınır.',[],''),
 ('12','istisna','tebliğ-tebellüğ','tarih metnin sonunda olabilir','(4) Tutanak, rapor','metnin bitiminde yer alabilir.',[],'tutanak ve rapor da'),

 # m.13 — konu
 ('13','sira_usul','Konu:','Sayı’nın hemen altında; kelime baş harfleri büyük','MADDE 13- (1) “Konu:” yan başlığı','konulmaksızın yazılır (Örnek 3).',[],'sonunda noktalama yok'),
 ('13','sira_usul','hizasını geçmeyecek biçimde','dikey orta','Belgenin konusu, yazı alanının','konulmaksızın yazılır (Örnek 3).',[],''),
 ('13','tanim','kısa ve öz bilgi','konu bölümü','(2) Konu, belgenin','barındırır (Örnek 3).',[],''),

 # m.14 — muhatap
 ('14','sira_usul','özel hukuk tüzel kişisi','BÜYÜK harf + yönelme eki','(2) Muhatabın idare veya özel hukuk','getirilerek yazılır.',[],'muhatap adı DETSİS kaydına göre'),
 ('14','sira_usul','muhatap bölümüne','gerçek kişiye Sayın; çok muhataba DAĞITIM YERLERİNE','Muhatap gerçek kişi ise','ibaresi yazılır (Örnek 15, 16).',[],'adı ilk harf büyük, SOYADI büyük'),
 ('14','sira_usul','Cumhurbaşkanı Yardımcısı','CUMHURBAŞKANI YARDIMCISINA; birden fazlaysa alt satırda Sayın','Cumhurbaşkanı Yardımcısı’nın muhatap','büyük harflerle yazılır (Örnek 4).',[],''),
 ('14','sira_usul','konunun son satırından itibaren','iki satır boşluk, sayfa ortalanarak','(1) Muhatap, belgenin','sayfa ortalanarak yazılır.',[],''),
 ('14','kosul','bağlı, ilgili veya ilişkili','doğrudan gönderilebilir; bilgi gerekirse bağlı olunan idare aracılığıyla','(4) Bağlı, ilgili veya ilişkili','(Örnek 6/A, 6/B).',[],''),
 ('14','sira_usul','Mülki idareye veya dış temsilciliğe','bağlı teşkilatta: ilk satır mülki idare BÜYÜK; birim parantez içinde','(5) Mülki idareye','doğrudan muhatap birime gönderilir.',[],'aynı mülki idare içi yazışma doğrudan birime'),
 ('14','sira_usul','belgenin gideceği yerin adresi','muhatap satırının altına, ortalanarak','(3) İdare dışına','birden fazla satıra yazılabilir.',[],''),

 # m.15 — ilgi
 ('15','tanim','belgenin bağlantılı olduğu diğer belge','İlgi bölümü','(1) İlgi, belgenin','belirtildiği bölümdür.',[],'birden fazlaysa önceki tarihliden başlanır'),
 ('15','sira_usul','İlginin birden fazla olması','önceki tarihliden başlanır (eskiden yeniye)','(5) İlginin birden fazla','konularak kullanılır (Örnek 7).',[],'sıra harfleri: küçük harf + “)”'),
 ('15','sira_usul','ilgi bölümü','önceki tarihli önce; kişiden ise başvurusu/dilekçesi','(5) İlginin birden fazla','biçiminde yazılır (Örnek 9).',[],'isimsiz-tarihsiz dilekçe de ilgi tutulabilir'),
 ('15','sira_usul','ilginin sonuna','nokta (.)','(7) İlgide,','nokta (.) işareti konulur (Örnek 7).',[],'“… tarihli ve … sayılı …” ibaresi'),
 ('15','sira_usul','muhatapta bulunmadığı durumlarda','ek olarak iletilebilir','(8) İlgide belirtilen belge','ek olarak muhatabına iletilebilir (Örnek 7).',[],''),
 ('15','istisna','muhatap idarenin daha önce','gönderdiği belge ilgide: idare adı belirtilmez','Ancak ilgi tutulan belgenin','idare adı belirtilmez (Örnek 7).',[],'normalde gönderen idare adı, tarih ve sayı'),
 ('15','sira_usul','yan başlıklarından sonra','iki nokta (:) aynı hizada','(3) “Sayı”, “Konu” ve “İlgi”','aynı hizada yazılır (Örnek 7).',[],''),
 ('15','sira_usul','Gerçek kişi ve tarih bilgisi','“İsimsiz ve tarihsiz başvuru/dilekçe.”','(10) Gerçek kişi ve tarih','biçiminde yazılır.',[],''),
 ('15','sira_usul','muhatap bölümünün son satırından itibaren','iki satır boşluk, yazı alanının solundan','(2) “İlgi:” yan başlığı','solundan başlanarak yazılır (Örnek 7).',[],''),

 # m.16 — metin
 ('16','tanim','“İlgi” ile “İmza” arasındaki kısım','metin alanı (Muhatap/İlgi ile İmza arası)','MADDE 16- (1) Metin alanı','arasındaki kısımdır.',[],''),
 ('16','sayi_oran','metin başlangıcı','İlgi varsa bir satır, yoksa iki satır','(2) “İlgi” ile metin','iki satır boşluk bulunur (Örnek 8).',[],''),
 ('16','sayi_oran','içeriden başlanır','1,25 cm; paragraflar arası boşluksuz','(4) Paragrafa 1,25 cm','satır boşluğu bırakılmaz (Örnek 8).',[],'metin iki yana hizalı'),
 ('16','sayi_oran','kesir','virgülle ayrılır (10.545,72)','Sayılarda kesirler','(Örnek: 10.545,72).',[],''),
 ('16','sayi_oran','çok haneli sayılar','sondan üçlü gruplar, araya nokta','(7) Dört ve dörtten çok haneli','(Örnek: 1.452; 25.126; 326.197).',[],''),
 ('16','sira_usul','kısaltma kullanılacak','önce açık biçim, sonra parantezde kısaltma','(11) Metin içinde kısaltma','(KEP)).',[],''),
 ('16','sira_usul','üst ve aynı düzeydeki','… arz ederim','a) Yazışma yapan makamlar','ibaresiyle bitirilir.',[],'asta “… rica ederim.”'),
 ('16','sira_usul','hiyerarşi','üste-eşite arz, asta rica ederim','a) Yazışma yapan makamlar','ibaresiyle bitirilir.',[('9','logo: hiyerarşide üst idare solda'),('22','paraf hiyerarşisinden sonra Koordinasyon seçilir')],''),
 ('16','sira_usul','dağıtımlı olarak','… arz ve rica ederim (arz/rica)','b) Üst, aynı düzey','ibaresiyle bitirilir.',[],''),
 ('16','istisna','İdari İşler Başkanı tarafından','“Rica ederim.” (bakanlıklarla yazışma)','ç) 1 sayılı','“Rica ederim.” ibaresiyle bitirilir.',[],'bakanlıklarla yazışmada'),
 ('16','sira_usul','imza yetkisini devreden makam','devredenin hiyerarşisine göre arz/rica','d) Belge, imza yetkisini','ibarelerinden uygun olanı ile bitirilir.',[],''),
 ('16','sira_usul','Muhatabı gerçek kişi','Saygılarımla / İyi dileklerimle / Bilgilerinize sunulur','e) Muhatabı gerçek kişi','ibareleriyle bitirilebilir.',[],''),
 ('16','sira_usul','ikinci satırda parantez','birinci satırdaki muhatap idareye göre arz/rica','c) Muhatap kısmında','ibarelerinden uygun olanı ile bitirilir.',[],''),
 ('16','sira_usul','sayfa tutan üst yazılarda','sayı-tarih-konu-muhatap-ilgi ilk sayfa; imza-ek-dağıtım son sayfa','(5) Birden fazla sayfa','sadece son sayfada yer verilir (Örnek 9).',[],'iletişim ve doğrulama bilgisi her sayfada'),
 ('16','yasak','yabancı kelimeye','zorunlu olmadıkça yer verilmez; anlamı parantezde','Belge içinde zorunlu olmadıkça','parantez içinde anlamı belirtilir.',[],''),
 ('16','sira_usul','Türk Dil Kurumu','Yazım Kılavuzu ve Türkçe Sözlük güncel yayımı','(8) Belge, Türk Dil Kurumu','anlamlı ve özlü olarak yazılır.',[],''),
 ('16','istisna','uluslararası kuruluş','yabancı dil olabilir; Türkçe tercümesi saklanır','Ancak muhatabı yabancı ülke','ilişkilendirilerek saklanır.',[],''),
 ('16','sira_usul','alıntılar','tırnak içinde ve/veya italik','(9) Metin içinde yer alan alıntılar','olarak yazılabilir.',[],''),
 ('16','sira_usul','maddelendirme','küçük harf + kapama parantezi “)”','(10) Metin içinde harfler','konularak kullanılır.',[],'ilgi sıralaması da böyle'),
 ('16','sira_usul','noktalama işaretlerinden sonra','bir karakter boşluk; noktalama bitişik','(3) Metindeki kelime','harfe bitişik yazılır.',[],''),
 ('16','sira_usul','Metin içinde geçen sayılar','rakamla veya harfle yazılabilir','(6) Metin içinde geçen sayılar','harfle de gösterilebilir.',[],''),

 # m.17 — imza
 ('17','sayi_oran','Metnin bitiminden itibaren','iki-dört satır boşluk; en sağda ortalı','(1) Metnin bitiminden','yer verilir (Örnek 9).',[],'ad, soyad, altında unvan'),
 ('17','sira_usul','kâğıda işlemesini sağlayacak','mavi renkli kalem','El yazısıyla atılan imza','mavi renkli kalemle atılır.',[('21', 'paraf da mavi kalemle atılır')],''),
 ('17','sira_usul','imza yetkisi devredilen makam','ikinci satıra “Vali a.”, “Genel Müdür a.”; vekâlette V.','(9) Belgeyi imza yetkisi','yetki devredenin unvanı kullanılmaz.',[('16', 'bitiş ibaresi devredenin hiyerarşisine göre')],'iç yazışmada devredenin unvanı yok'),
 ('17','sira_usul','Belge vekâleten imzalandığında','ikinci satıra “Genel Müdür V.”, “Başkan V.”','(10) Belge vekâleten','ikinci satıra yazılır (Örnek 10).',[],'YETKİ DEVRİ a., VEKÂLET V.'),
 ('17','sira_usul','iki yetkili tarafından imzalanması','üst unvan SAĞDA; ikiden fazlada en üst EN SOLDA','(11) Belgenin iki yetkili','sıralanır (Örnek 11).',[],'soldan sağa unvan sırası'),
 ('17','yasak','elektronik imza ile imzalandığına dair','hiçbir ibare, şekil konmaz','Elektronik ortamda yapılan yazışmalarda, yetkili','yer verilmez.',[],''),
 ('17','makam','imza yetkisi bulunan görevlilere','idarece güvenli e-imza temin edilir','(5) Resmî yazışma sürecinde','temin edilir.',[],''),
 ('17','makam','Cumhurbaşkanlığı ile yapacakları yazışmalar','bakan veya bakan yardımcısı; bağlı kurumda en üst yönetici','(8) Bakanlıklar ile','en üst yönetici tarafından imzalanır.',[],''),
 ('17','sira_usul','Akademik unvanlar veya rütbeler','adın önüne ya da bir satır altına','Akademik unvanlar veya rütbeler','kısaltılarak yazılabilir.',[],'ilk harfleri büyük'),
 ('17','sira_usul','Belgeyi imzalayanın adı','ad ilk harf büyük, SOYAD büyük; unvan altta','(2) Belgeyi imzalayanın','küçük harflerle yazılır.',[],''),
 ('17','sira_usul','son sayfadan önceki','imzalanır ya da paraflanır','Zorunlu hâllerde veya olağanüstü durumlarda rapor','ya imzalanır ya da paraflanır.',[],'son sayfa yetkililerce imzalanır'),
 ('17','makam','idareler arası yazışmalarda','yetki devri yönergesine göre seçilir','(7) İdareler arası','yönergesine göre seçilir.',[],''),

 # m.18 — ek
 ('18','sira_usul','Belge ekleri','gönderilmezse “Ek konulmadı”; ebat zorunlu değil','(5) Belge eklerinin','“Ek konulmadı”',[('6','ekler farklı form, format, ebatta olabilir'),('7','eklerde farklı yazı tipi ve punto olabilir')],'ayrı gönderilen ekler üst yazıyla ilişkilendirilir'),
 ('18','sira_usul','“Ek:” başlığı','imza bölümünden sonra, yazı alanının solundan','MADDE 18- (1) Belgede ek','solundan başlanarak yazılır.',[],'olur belgesinde oluru alınan makamın imzasından sonra'),
 ('18','sira_usul','birden fazla ek','Ek: altında numaralanır; sağ üstte EK-1, EK-2','(2) Belgenin sadece','(Örnek: EK-1, EK-2).',[],'tek ekte Ek: başlığının sağına'),
 ('18','sira_usul','Ek listesi','ayrı sayfada “EK LİSTESİ”; üst yazıda “Ek: Ek Listesi”','(4) Ek listesi','şeklinde gösterilir (Örnek 13).',[],''),
 ('18','kosul','gönderilemeyen veya alınamayan belge ekleri','üst yazıyla ilişkilendirilip ayrı gönderilebilir','(6) Güvenlik gerekçesi','ayrı olarak muhafaza edilebilir.',[],''),
 ('18','kosul','eklenecek elektronik dosyalar','Birlikte Çalışabilirlik Esasları formatında','(3) Elektronik ortamda hazırlanan belgelere','formatlarda oluşturulur.',[],''),

 # m.19 — dağıtım
 ('19','sira_usul','“Dağıtım:” başlığı','ek varsa Ek’ten SONRA, yoksa imzadan sonra; solda','(1) Belgenin birden fazla muhataba','solundan başlanarak yazılır (Örnek 14).',[],'EK ÖNCE, DAĞITIM SONRA'),
 ('19','sira_usul','gereğini yerine getirme durumunda','“Gereği:” kısmına, Dağıtım başlığının altına','(2) Belgenin gereğini','“Dağıtım:” başlığının altına yazılır',[('3', 'belge tanımında işlemin yerine getirilmesi'), ('33', 'talepleri yerine getirme süresi')],''),
 ('19','sira_usul','bilgi sahibi olması istenenler','“Bilgi:” kısmına','(2) Belgenin gereğini','“Bilgi:” kısmına yazılır.',[('14', 'bağlı idarenin bilgi sahibi olması gerekiyorsa onun aracılığıyla')],''),
 ('19','sira_usul','“Bilgi:” kısmı','Gereği ile aynı satırda, ortaya doğru','(2) Belgenin gereğini','“Dağıtım:” başlığının altına yazılır (Örnek 14).',[],''),
 ('19','sira_usul','“Bilgi:” kısmı yoksa','muhatap adları doğrudan Dağıtım altına','(2) Belgenin gereğini','“Dağıtım:” başlığının altına yazılır (Örnek 14).',[],''),
 ('19','sira_usul','sığmayacak kadar uzunsa','ayrı sayfada “DAĞITIM LİSTESİ”; Ek de olabilir','(3) Dağıtımlı belgeler','üst yazıya eklenebilir (Örnek 16).',[('18','ek listesi sığmazsa ayrı sayfada EK LİSTESİ')],''),

 # m.20-24 — olur, paraf, koordinasyon, doğrulama, iletişim
 ('20','sira_usul','makam oluru','birim yöneticisi teklif eder, olur makamı imzalar','MADDE 20- (1) Makam oluru','güvenli elektronik imza ile imzalanır.',[],'zorunlu hâlde el yazısıyla'),
 ('20','sira_usul','başka makamlar varsa','“Uygun görüşle arz ederim.”','(4) Oluru teklif eden birim','“Uygun görüşle arz ederim.” ibaresi yazılır',[],'yazı alanının solunda'),
 ('20','sira_usul','olur için makama','ortaya büyük harfle “OLUR”','(2) Belge, olur için makama','“OLUR” yazılır.',[],'belge tarihi: olur makamının imza tarihi'),
 ('21','kosul','paraf bilgileri','üstveride tutulur; muhataba paylaşılmaz','Güvenli elektronik imza ile imzalanan belgeye ait paraf','paraf bilgileri paylaşılmaz.',[],''),
 ('21','sira_usul','Fiziksel ortamda hazırlanan belgelerde','paraf idarede kalan nüshada; sonda, sol kenarda','Fiziksel ortamda hazırlanan belgelerde paraflar','sol kenarında yer alır (Örnek 19/B).',[],'mavi kalemle'),
 ('21','sira_usul','Elektronik ortamda hazırlanan belgelerde','paraf: güvenli e-imza veya elektronik onay','(2) Elektronik ortamda hazırlanan belgelerde paraf,','elektronik onay ile atılır.',[],''),
 ('21','sira_usul','Paraf bölümünde','kısaltmasız; ast-üst ilişkisine uygun','MADDE 21- (1) Paraf bölümünde','ast-üst ilişkisine uygun olarak belirtilir.',[],'tarih, unvan, ad, soyad'),
 ('21','sure','Günlük raporlar','her gün zaman damgalı; saklama süresi belgeden kısa olamaz','Günlük raporlar, günlük olarak','daha kısa olamaz.',[],'elektronik onaylar günlük raporlarda kayıtlı'),
 ('22','sira_usul','birden fazla birimin iş birliği','paraf hiyerarşisinden sonra “Koordinasyon”','MADDE 22- (1) İdare içinde','belirtilir (Örnek 20).',[],'iş birliğine katılanların unvan, ad, soyadı'),
 ('23','sira_usul','belge doğrulama kodu','ikinci satırda (ilk satır e-imza ibaresi)','MADDE 23- (1) Elektronik ortamda','en sağ kısmında yer alır (Örnek 21).',[],'ilk satır: “Bu belge, güvenli elektronik imza ile imzalanmıştır.”'),
 ('23','sira_usul','karekod','İletişim bilgileri alanının en sağında','Belge doğrulama bilgilerini içeren','en sağ kısmında yer alır (Örnek 21).',[],'doğrulama kodu ikinci satırda'),
 ('23','sira_usul','Belge doğrulama işlemi','doğrulama kodu ve karekodla, e-Devlet üzerinden','(2) Belge doğrulama işlemi','üzerinden sağlanır.',[],''),
 ('24','sira_usul','İletişim bilgileri;','solda idare adresi, KEP; sağda bilgi alınacak kişi','MADDE 24- (1) İletişim bilgileri;','çizgi ile ayrılır (Örnek 21).',[],'sayfa sonuna, çizgiyle ayrılır'),

 # m.25-27 — gizlilik, süreli belge, sayfa no
 ('25','kosul','Hizmete Özel','tüm işlemler elektronik ortamda','MADDE 25- (1) “Hizmete Özel”','elektronik ortamda gerçekleştirilir.',[('31','Hizmete Özel dışındaki gizlilik dereceliler fiziksel gönderilir')],'Özel ve üstü fiziksel'),
 ('25','kosul','gizlilik dereceli belgeler','Özel ve üstü fiziksel; Hizmete Özel elektronik','MADDE 25- (1) “Hizmete Özel”','fiziksel ortamda gerçekleştirilir.',[('31','gönderimde Hizmete Özel dışı gizliler fiziksel, kriptolu yetkili idare elektronik')],''),
 ('25','makam','gizlilik derecesinin belirlenmesinden','imzacı yetkili makam (hazırlayan değil)','(3) Belgenin imzacısı','belirlenmesinden sorumludur.',[],''),
 ('26','sure','ACELE','derhâl ve süratle cevap','(2) “ACELE” ibaresi','belirtilen süre içinde cevap verilir.',[('31','zarfta ACELE sağ üst köşede kırmızı büyük harfle')],'GÜNLÜDÜR: belirtilen süre içinde'),
 ('26','sure','“GÜNLÜDÜR” ibaresi taşıyan belgelere','belirtilen süre içinde cevap; süre metinde yazılır','“GÜNLÜDÜR” ibaresi taşıyan belgelere','ilgili üstveri alanında belirtilir.',[],''),
 ('26','sira_usul','süreli belgelerde','ACELE/GÜNLÜDÜR sağ üst köşe, kırmızı; yalnız ilk sayfa','(3) Elektronik ortamda veya zorunlu','sadece birinci sayfada belirtilir (Örnek 9).',[],'e-imzalıda üstveride ve üst yazıda'),
 ('26','sira_usul','KİŞİYE ÖZEL','ilgilisine teslim; zarf açılmadan yetkili birimce kaydedilir; yalnız ilgili tasarruf','(5) “KİŞİYE ÖZEL” ibaresi taşıyan belgenin zarfı','ilgilinin talebi ile EBYS’ye kaydedilir.',[('31', 'zarfın sağ üst köşesinde kırmızı büyük harfle')],''),
 ('27','sira_usul','sayfa numarası','iletişim bilgilerinin altında, ortada; toplamın kaçıncısı','MADDE 27- (1) Birden fazla sayfa','gösterecek şekilde belirtilir (Örnek 9).',[],''),

 # m.28-29 — üstveri, çoğaltma
 ('28','kosul','belgenin üstveri elemanları','ayrılmaz bütün; görüntüyle fark olamaz','(3) Elektronik ortamda güvenli elektronik imza ile imzalanan belgenin üstveri','arasında fark olamaz.',[],''),
 ('28','kosul','belge görüntüsü üzerinde','üstveriyle fark olamaz (tarih, sayı aynı)','(3) Elektronik ortamda güvenli elektronik imza ile imzalanan belgenin üstveri','arasında fark olamaz.',[('20','olur tarihi belge görüntüsü üzerinde gösterilir')],''),
 ('28','kosul','asgari olarak','kullanılacak üstveri: e-Yazışma Teknik Rehberi elemanları; idare ilave edebilir','MADDE 28- (1) Güvenli elektronik imza','üstveri elemanları kullanabilir.',[],''),
 ('29','sira_usul','örnek çıkartılması hâlinde','“ASLI GİBİDİR” + yetkili görevli imzası','(2) Zorunlu hâllerde','asıl belge gibi kabul edilir.',[],'ad, soyad, unvan, tarih'),
 ('29','sira_usul','belgenin çoğaltılması','yetkilendirilmiş görevli çıktı alır; kod-karekodla doğrulanır','MADDE 29- (1) Güvenli elektronik imza','şekilde yapılır.',[],''),
 ('29','istisna','ASLI GİBİDİR','fiziksel/eski kâğıt örneğe; e-imzalıya konmaz','(2) Zorunlu hâllerde','asıl belge gibi kabul edilir.',[],''),

 # m.30-32 — gönderme, alma, ret
 ('30','sure','hazırlanmamış bir belge','ikinci iş günü sonuna kadar, sebepleriyle','(4) İdare, başka bir idareden','sonuna kadar bildirir.',[],'şifre açılamazsa da ikinci iş günü'),
 ('30','kosul','reddetme hakkı','e-Yazışma Teknik Rehberi’ne uygun değilse','(4) İdare, başka bir idareden','reddetme hakkına sahiptir.',[],''),
 ('30','kosul','bir taraf aracılığıyla','üçüncü taraf; kayıt altına alınarak','MADDE 30- (1) Güvenli elektronik imza','kayıt altına alınarak yapılması esastır.',[],'anlaşmayla başka iletim mekanizması da olabilir'),
 ('30','kosul','İdarenin bildirimde bulunmaması hâlinde','açılmış ve uygun kabul edilmiş sayılır','İdarenin bildirimde bulunmaması','kabul edilmiş sayılır.',[],''),
 ('30','sure','belgenin şifresini açamazsa','reddeder; ikinci iş günü sonuna kadar bildirir','(7) İdare, e-Yazışma','bildirir ve hem bu bildirimi',[],''),
 ('30','sira_usul','şifreleme sertifikaları','sertifika hizmet sağlayıcısından temin; DETSİS’te paylaşılır','Kullanılacak şifreleme sertifikaları','DETSİS üzerinden paylaşılır.',[],''),
 ('30','kosul','veri depolama araçlarıyla','iletilebilir; gönderme-alma kaydı tutulur','(2) Güvenli elektronik imza ile imzalanan belgeler, veri','kayıt tutulur.',[],''),
 ('31','istisna','dilekçe','“arz ederim” olmasa da işleme alınır','(7) Kişiler tarafından','engel değildir.',[('15','ilgide kişiden gelen: …’ın … tarihli başvurusu/dilekçesi')],''),
 ('31','sira_usul','iletiminin mümkün olmadığı durumlarda','elektronik aslına erişim amacıyla','MADDE 31- (1) Muhatabına elektronik','fiziksel ortamda gönderilir.',[],'çıktıyı yetkilendirilmiş görevli alır'),
 ('31','sira_usul','etiket','ilk sayfanın ön/arka yüzüne basılır','(5) İdareler, fiziksel','yüzüne basılır.',[],'en az Örnek 23 unsurları'),
 ('31','sira_usul','Belge zarflanarak muhatabına iletildiğinde','sol üst gönderen, tarih-sayı; ortada muhatap; ACELE sağ üst kırmızı','(2) Belge zarflanarak','büyük harflerle belirtilir (Örnek 22).',[],'kısaltma kullanılmaz'),
 ('31','kosul','“Hizmete Özel” haricindeki gizlilik dereceli','fiziksel gönderilir; kriptolu yetkili idare elektronik','(3) “Hizmete Özel” haricindeki','elektronik ortamda da gönderebilir.',[],''),
 ('31','sira_usul','fiziksel ortamda gelen belgenin','alındığı tarih ve üstveri EBYS’ye kaydedilir','(4) İdareye fiziksel','kayıt sistemine kaydedilir.',[],''),
 ('31','sira_usul','havale, talimat','üst yazının ilk sayfası ön-arka yüzüne kaşe basılabilir','(6) Birime fiziksel ortamda gelen','tarafından belirlenir.',[],'kaşenin şeklini ilgili birim belirler'),
 ('32','sira_usul','belgenin muhatabı olunmadığı bilgisi','gönderene elektronik iletilir; asıl muhatap belliyse ona','MADDE 32- (1) İdareye muhatabı','elektronik ortamda muhafaza edilir.',[],''),
 ('32','sira_usul','belgenin asıl muhatabı anlaşılamıyorsa','gönderene iade edilir','(2) İdareye muhatabı olmadığı hâlde fiziksel','gönderene iade edilir.',[],'muhatap belliyse aslı ona, suret alınır'),

 # m.33-39 — süreler, tekit, uyarı, kılavuz, yürürlük
 ('33','sure','belge talepleri','en geç beş iş günü','İdareler, ilgili mevzuattaki','içinde yerine getirir.',[],'ilgili mevzuattaki özel hükümler saklı'),
 ('33','sure','görüş talepleri','en geç on beş iş günü','İdareler, ilgili mevzuattaki','içinde yerine getirir.',[],''),
 ('33','sure','talep yazıları','günlü yazılır','MADDE 33- (1) İdare içi','günlü yazılır.',[],''),
 ('33','kosul','Talebin ulaştığı tarih','elektronikte EBYS giriş kaydı zamanı','Talebin ulaştığı tarih','girdiği zamanı ifade eder.',[],''),
 ('34','sira_usul','süresi içinde cevap verilmemesi durumunda','tekit yazısı yazılabilir','MADDE 34- (1) Belgeye süresi','tekit yazısı yazılabilir (Örnek 24).',[],''),
 ('35','istisna','uygun olarak yazılmayan belgelere','önce uyarı; sürerse gerekçeyle iade (süreli hariç)','MADDE 35- (1) Bu Yönetmeliğe','iade edilebilir.',[],''),
 ('36','makam','tereddütleri gidermeye','Cumhurbaşkanlığı İdari İşler Başkanlığı','(3) Bu Yönetmelik ile ilgili eğitim','İdari İşler Başkanlığı yetkilidir.',[],'eğitim stratejisi de'),
 ('36','makam','Yönetmelik Kılavuzu','İdari İşler Başkanlığı hazırlar ve duyurur','MADDE 36- (1) Cumhurbaşkanlığı','hazırlanır ve duyurulur.',[],''),
 ('36','kosul','ek düzenleme yapabilir','idareler, Yönetmeliğe aykırı olmamak kaydıyla','(2) İdareler,','ek düzenleme yapabilir.',[],''),
 ('37','kosul','yapılan atıflar','bu Yönetmeliğe yapılmış sayılır','(2) Diğer mevzuatta','yapılmış sayılır.',[],'2014 tarihli eski yönetmelik yürürlükten kalktı'),
 ('38','sure','takip eden ayın','birinci günü yürürlüğe girer','MADDE 38- (1) Bu Yönetmelik','yürürlüğe girer.',[],''),
 ('39','makam','Yönetmelik hükümlerini','Cumhurbaşkanı yürütür','MADDE 39- (1) Bu Yönetmelik','yürütür.',[],''),
 ('Geçici','sure','kurulan EBYS’ler','altı ay içinde uyumlu hâle getirilir','GEÇİCİ MADDE -1 (1) Bu Yönetmeliğin','uyumlu hâle getirilir.',[],'sonra kurulanlar baştan uyumlu'),
 ('Geçici','sure','kullanıcı hesaplarını','üç ay içinde temin, DETSİS’e kayıt','(2) 30 uncu maddenin','faal olarak kullanımını sağlar.',[],''),
]
yaz(15, 'Resmî Yazışmalarda Uygulanacak Usul ve Esaslar Hakkında Yönetmelik', K)
