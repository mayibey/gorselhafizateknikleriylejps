# Jandarma Genel Komutanlığı İzin Yönetmeliği — kelime → cevap
# KURAL (başkan, 4 Eki 2026): SOL = soru KÖKÜNDE göreceğin ifade, SAĞ = doğru ŞIKTA arayacağın kelime.
# Sorulardan geriye doğru yazıldı (95 cevaplı soru); kanıt resmî metin. Kapsam: m.5 (genel esaslar) ve m.20 (yurt dışında uyulacak hususlar).
# Tuzak çiftleri: dört izin (yıllık, mazeret, sıhhi, yurt dışı; ödül izni yok) · yurda dönüş 48 saat, en kısa yol + en SERİ vasıta (ekonomik değil) ·
#                 uyarıcı bilgiyi BİRLİK amirliği verir / esasları JGK belirler · silah (şahsi, zati, miri) götürülmez; üniforma zorunlu olmadıkça giyilmez.
import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ortak import yaz
K = [
 # m.5 — genel esaslar
 ('5','tanim','verilecek izin','dört: yıllık, mazeret, sıhhi, yurt dışı; ödül, hizmet-içi yok','a) Personele verilecek izinler şunlardır:','4) Yurt dışı izinleri.',[],'sayım sırası: 1 yıllık, 2 mazeret, 3 sıhhi, 4 yurt dışı'),
 ('5','kosul','adli makam','şüpheli, sanık, tanık, mağdur, bilirkişi: mahsup edilmez','d) Adli makamlara','kanuni izinlerinden mahsup edilmez.',[],'amir çağrı ve yol süresini dikkate alarak gönderir'),
 ('5','kosul','mahsup','edilmez: bayram il dışı izni; adli çağrı süresi de','Hafta sonu, yılbaşı','kanuni izinlerden mahsup edilmez.',[],'adli çağrı için d) bendi; il dışı izin için j) bendi'),
 ('5','sure','dönüş','çağrılınca: 48 saat; en kısa yol, en seri vasıta','i) Yurt dışında izinde bulunup','süre uzatılabilir.',[],'yurda dönme kararı tebliğ edilince; mücbir sebeple uzar; ekonomik vasıta değil'),
 ('5','kosul','olağanüstü hal','kısaltılır-kaldırılır, izinden geriye çağrılır; 2803 ek 3','g) Savaş ve olağanüstü hallerde','personel izinden geriye çağrılabilir.',[],'savaşta da'),
 ('5','makam','hizmet ihtiyacı','planlamayı onaylayan makam; yazılı-sözlü; masraf Harcırah’tan','ğ) Görev ve hizmet ihtiyacının','kendisine ödenir.',[],'asgari yıllık izin planlamasını onaylayan makam; sözlü çağrı da görevlendirme yazısıyla yazılıya geçer'),
 ('5','sure','bitiş saati','günün başlangıç saati; istisnada amir belirler','h) İzinlerin başlangıç ve bitiş saati','farklı bir saat olarak belirlenebilir.',[],'emniyet-asayiş, ulaşım, hava şartı gibi istisnalar'),
 ('5','yasak','kurs','süresince izin verilmez; planlı tatil, geçerli özür hariç','m) Kursiyerlere','birliğine yazılı olarak bildirilir.',[],'özürlüye kurs bitişini aşmadan kursu veren birim izin verir'),
 ('5','yasak','görev yaptığı il','dışına izinsiz çıkamaz; bayram-tatilde izinle çıkabilir','j) Personel görev yaptığı ilin dışına','kanuni izinlerden mahsup edilmez.',[],'bayram-tatil il dışı izni kanuni izinden düşülmez'),
 ('5','makam','her türlü izin işlemleri','özlük işlemlerini yürüten makamlar','ç) Personelin her türlü izin işlemleri','makamlarca yürütülür.',[],''),
 ('5','sira_usul','kullandığı izinler','merkezi personel bilgi sistemi; birlik ve sayısal özlük dosyası','c) Personelin kullandığı izinler','özlük dosyalarında muhafaza edilir.',[],'izin belgeleri dosyada saklanır'),
 ('5','sira_usul','Atama ile birliğinden ayrılan','ayrılış/katılış belgesine izin bilgisi yazılır','b) Atama ile birliğinden','yazılır ve onaylanır.',[],'bulunulan yıl içinde izin kullanıp kullanmadığı, süre ve tarihler'),
 ('5','kosul','izin belgesinde','her zaman ulaşılabilecek iletişim vasıtası ve adres','l) Personel her zaman','izin belgesinde belirtmek zorundadır.',[],''),
 ('5','ceza','yasal işlem','süresinde dönmeyen, gerçeğe aykırı beyan, çizelgeye aykırı','ı) İzinden süresi içinde','yasal işlem yapılır.',[],'mazeretsiz veya müsaadesiz izin sıra çizelgesine aykırılık'),
 ('5','makam','yerine vekâlet edenler','izin verme yetkisine sahip','e) İzin vermeye yetkili','izin verme yetkisine sahiptir.',[],'vekâlet ettiği kadronun yetkisi'),
 ('5','kosul','spor müsabakaları','organizasyon süresince izinli sayılır','f) 21/5/1986','izinli sayılır.',[],'milletlerarası seviye, yurt içi ve yurt dışı; hazırlık çalışmaları da'),

 # m.20 — izinli olarak yurt dışında uyulacak hususlar
 ('20','kosul','özel hayat','milletimizin ve Jandarmanın temsilcisi; Jandarmaya yaraşır','a) Milletimizin ve Jandarma','düzenlemek zorundadır.',[],'subay, sözleşmeli subay, astsubay, sözleşmeli astsubay, uzman jandarma, uzman erbaş; sivil memur ve er yok'),
 ('20','kosul','tavır ve hareketlerinde','TSK, Sahil Güvenlik, yabancı asker-kolluğa karşı meslekî vakar ve anane','b) Yurt dışındaki Türk Silahlı Kuvvetleri','ananeyi muhafaza eder.',[],''),
 ('20','kosul','yabancılarla temas','daha titiz-dikkatli; olumsuz olaya sebebiyet vermemek','c) Yabancılarla temasta','özen gösterir.',[],'resmî ve özel hayatta'),
 ('20','kosul','mesken','mevzuat ve malî imkâna göre; meslekî şerefe uygun','ç) Mevzuat ve malî','yaşamak zorundadır.',[],''),
 ('20','yasak','üniforma','zorunlu olmadıkça giyemez','d) Zorunlu olmadıkça','üniforma giyemez.',[],'resmî temasta her zaman giyme zorunluluğu YOK'),
 ('20','yasak','Seyahat maksadıyla','şahsi, zati, miri silah götüremez','e) Seyahat maksadıyla','silahını götüremez.',[],'kişisel güvenlik için de götüremez'),
 ('20','makam','uyarıcı bilgiler','birlik/karargâh/kurum amirlikleri verir; konu: hareket tarzı, istihbarata karşı koyma','(2) Yurt dışına izinli gidecek','uyarıcı bilgiler verilir.',[],'koruyucu güvenlik önlemleri de'),
 ('20','makam','istihbarata karşı koyma','koruyucu güvenlik de; esasları Jandarma Genel Komutanlığı belirler, uymak zorunlu','(3) İzinli olarak yurt dışında','güvenlik esaslarına uyar.',[],'uyarıcı bilgiyi birlik verir, esası JGK belirler'),
]
yaz(24, 'Jandarma Genel Komutanlığı İzin Yönetmeliği', K)
