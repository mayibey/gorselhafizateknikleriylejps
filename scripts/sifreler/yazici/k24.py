# Jandarma Genel Komutanlığı İzin Yönetmeliği — kelime → cevap
import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ortak import yaz
K = [
 ('5','tanim','Sıhhi izinler','izin türlerinden; yıllık, mazeret, sıhhi, yurt dışı','a) Personele verilecek izinler','4) Yurt dışı izinleri.',[],'dört tür'),
 ('5','istisna','kanuni izinlerinden mahsup edilmez','adli makama şüpheli, sanık, tanık, mağdur, bilirkişi çağrısı','d) Adli makamlara','mahsup edilmez.',[],'amir, çağrı ve yol süresine göre gönderir'),
 ('5','makam','vekâlet edenler','vekâlet ettikleri kadronun izin yetkisine sahip','e) İzin vermeye yetkili','yetkisine sahiptir.',[],''),
 ('5','istisna','izinli sayılır','milletlerarası spor müsabakası ve hazırlığına katılan','f) 21/5/1986','izinli sayılır.',[],''),
 ('5','makam','izinden geriye çağrılabilir','asgari yıllık izin planını onaylayan makam; yazılı ya da sözlü','ğ) Görev ve hizmet ihtiyacının','yazılı veya sözlü olarak yapılabilir.',[],'sonradan görevlendirme yazısı; dönüş ve gidiş masrafı Harcırah Kanununa göre ödenir; savaş ve OHAL\'de de çağrılabilir'),
 ('5','sure','günün başlangıç saatidir','izinlerin başlangıç ve bitiş saati','h) İzinlerin başlangıç','günün başlangıç saatidir.',[],'istisnai durumda yetkili amir farklı saat belirleyebilir'),
 ('5','sure','48 saat içerisinde','yurda dönme kararı tebliğ edilen izinli personel döner','i) Yurt dışında izinde','dönüşe geçer.',[],'en kısa yol, en seri vasıta; mücbir sebeple uzatılabilir'),
 ('5','yasak','ilin dışına izinsiz çıkamaz','personel; hafta sonu il dışı izni kanuni izinden düşmez','j) Personel görev yaptığı','mahsup edilmez.',[],''),
 ('5','yasak','Kursiyerlere','planlı tatiller dışında izin verilmez','m) Kursiyerlere','izin verilmez.',[],'geçerli özrü olana kursu veren birim mazeret izni verebilir'),
 ('20','yasak','silahını götüremez','seyahatle yurt dışına giden; şahsi, zati, miri','d) Zorunlu olmadıkça','silahını götüremez.',[],''),
 ('20','yasak','Zorunlu olmadıkça üniforma giyemez','yurt dışında izinli personel','d) Zorunlu olmadıkça','silahını götüremez.',[],''),
 ('20', 'kosul', 'Türk Jandarmasına yaraşır', 'yurt dışındaki izinli personel resmî-özel hayatını böyle düzenler; milletin temsilcisi', 'MADDE 20- (1) İzinli olarak yurt dışında', 'yaraşır bir şekilde düzenlemek zorundadır.', [], ''),
 ('20', 'kosul', 'subay, sözleşmeli subay, astsubay', 'yurt dışı izin kuralları: sözleşmeli astsubay, uzman jandarma, uzman erbaş', 'MADDE 20- (1) İzinli olarak yurt dışında', 'yaraşır bir şekilde düzenlemek zorundadır.', [], 'sivil memur, er-erbaş YOK'),
 ('20', 'kosul', 'meslekî vakar ve ananeyi', 'TSK, SGK ve yabancı askeri-kolluk personeline karşı tavırda muhafaza', 'b) Yurt dışındaki Türk Silahlı Kuvvetleri', 'vakar ve ananeyi muhafaza eder.', [], ''),
 ('20', 'kosul', 'Yabancılarla temasta daha titiz', 'resmî ve özel hayatta olumsuz olaya sebebiyet vermemek için özen', 'c) Yabancılarla temasta', 'özen gösterir.', [], ''),
 ('20', 'kosul', 'meslekî şerefe uygun', 'mevzuat ve malî imkânlarına göre uygun bir meskende yaşamak zorunda', 'ç) Mevzuat ve malî imkânlarına', 'meslekî şerefe uygun bir şekilde yaşamak', [], ''),
 ('20', 'makam', 'istihbarata karşı koyma ve koruyucu', 'birlik/karargâh/kurum amirlikleri uyarıcı bilgi verir; JGK esaslarına uyulur', '(2) Yurt dışına izinli gidecek personele', 'koruyucu güvenlik esaslarına uyar.', [], ''),
 ('20', 'makam', 'bağlı bulunduğu birlik, karargâh', 'yurt dışına izinli gidecek personele uyarıcı bilgiyi bunlar verir', '(2) Yurt dışına izinli gidecek personele', 'uyarıcı bilgiler verilir.', [], ''),
 ('20', 'makam', 'Jandarma Genel Komutanlığınca belirlenen', 'İKK ve koruyucu güvenlik esasları; izinli personel uyar', '(3) İzinli olarak yurt dışında bulunan personel', 'koruyucu güvenlik esaslarına uyar.', [], ''),
 ('5', 'tanim', 'izinler şunlardır', 'izin türleri dört: yıllık, mazeret, sıhhi, yurt dışı', 'a) Personele verilecek izinler şunlardır', '4) Yurt dışı izinleri.', [], ''),
 ('5', 'kosul', 'genel esaslar dâhilinde yürütülür', 'personelin izin işlemleri; özlük işlemlerinin yapıldığı makamlarca', 'MADDE 5- (1) Personelin izin işlemleri', 'makamlarca yürütülür.', [], ''),
 ('5', 'makam', 'özlük işlemlerinin yerine getirildiği', 'her türlü izin işlemini bu makamlar yürütür', 'ç) Personelin her türlü izin', 'makamlarca yürütülür.', [], ''),
 ('5', 'sure', 'en seri vasıta ile', 'dönme kararı tebliğ edilen personel 48 saatte en kısa yoldan', 'i) Yurt dışında izinde bulunup', 'bu süre uzatılabilir.', [], 'mücbir sebeple uzar'),
 ('5', 'kosul', '2803 sayılı Kanunun ek 3', 'savaş ve olağanüstü hallerde izin süreleri kısaltılır/kaldırılır', 'g) Savaş ve olağanüstü hallerde', 'izinden geriye çağrılabilir.', [], ''),
 ('5', 'sira_usul', 'merkezi personel bilgi sisteminin', 'kullanılan izinler buraya işlenir; belgeler birlik ve sayısal özlük dosyasında', 'c) Personelin kullandığı izinler', 'özlük dosyalarında muhafaza edilir.', [], ''),
 ('5', 'sira_usul', 'ayrılış/katılış belgelerinin', 'atamayla ayrılan personelin o yılki izin bilgisi buraya yazılır, onaylanır', 'b) Atama ile birliğinden ayrılan', 'yazılır ve onaylanır.', [], ''),
 ('5', 'ceza', 'izin sıra çizelgelerine aykırı', 'yasal işlem: süresinde dönmeyen, gerçeğe aykırı beyan, çizelgeye aykırı', 'ı) İzinden süresi içinde dönmeyenler', 'yasal işlem yapılır.', [], ''),
 ('5', 'sira_usul', 'görevlendirme yazısı ile yazılı', 'izinden çağırma sözlü olsa da yazıya dökülür; sureti özlük dosyalarında', 'Personelin izinden çağrılması, yazılı veya sözlü', 'birlik ve sayısal özlük dosyalarında', [], 'dönüş ve tekrar gidiş masrafı Harcırah Kanununa göre ödenir'),
]
yaz(24, 'Jandarma Genel Komutanlığı İzin Yönetmeliği', K)
