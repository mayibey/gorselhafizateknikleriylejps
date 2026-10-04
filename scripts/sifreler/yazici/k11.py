# 2893 sayılı Türk Bayrağı Kanunu — kelime → cevap
# KURAL (başkan, 4 Eki 2026): SOL = soru KÖKÜNDE göreceğin ifade, SAĞ = doğru ŞIKTA arayacağın kelime.
# Sorulardan geriye doğru yazıldı (69 cevaplı soru); kanıt resmî metin. Kapsam: tüm maddeler (m.1-12).
# Tuzak çiftleri: kamu kurumunda bayrak SÜREKLİ çekili · 10 Kasım yarıya (kanunda), diğer yas hâllerini CUMHURBAŞKANLIĞI ilan eder ·
#                 çekilir-indirilirken TÖREN yapılır / selam CEPHE alınarak · masaya örtü yalnız RESMİ YEMİN töreninde ·
#                 aykırı bayrağı YETKİLİ AMİR toplatır / idari para cezasını MÜLKİ AMİR verir.
import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ortak import yaz
K = [
 # m.1-2 — amaç, tanım
 ('1','tanim','amacı','üç: şekli, yapımı, korunması','Bu Kanunun amacı','usulleri belirlemektir.',[],'esas ve usulleri belirlemek'),
 ('2','tanim','şekil ve oran','ekli cetveldeki; beyaz ay-yıldızlı albayrak','Türk Bayrağı, bu Kanuna ekli','albayraktır.',[],''),
 ('2','tanim','özel bayrak','sembolik bayrak, özel işaret, flama, flandra, fors; yönetmelikte; sancak-arma yok','Bayrak ile özel bayrakların','yönetmelikte gösterilir.',[],'standartları ve kumaşı yönetmelikte'),

 # m.3 — çekme, indirme, tören
 ('3','sure','kamu kurum','sürekli çekili kalır','(Değişik: 14/7/1999 - 4409/1 md.) Kamu kurum','sürekli çekili kalır.',[('7','m.7: yönetmelikte belirlenecek kamu kurumları dışındakiler amblemde kullanamaz')],'yalnız mesai saatinde değil'),
 ('3','makam','gereken biçimde','o mahaldeki yetkili amirler','Bayrak törenlerinin gereken biçimde','yetkili amirler sorumludur.',[],'tören sorumluluğu'),
 ('3','kosul','takıl','kurum, temsilcilik, deniz vasıtası; yetkili aracı; konut yok','Bayrak, kamu kurum ve kuruluşlarıyla','yetkililerin araçlarına takılır.',[],'kamu kurumu ve yurt dışı temsilciliğe, kamu ve kişilerin deniz vasıtasına çekilir; yetkililerin aracına takılır'),
 ('3','sira_usul','indirilirken','tören yapılır; usulü yönetmelikte','Bayrak çekilirken ve indirilirken','tören yapılır.',[],'selamlama ise m.5: cephe alınarak'),

 # m.4-6 — yarıya çekme, selam, örtme
 ('4','makam','yarıya','yas: 10 Kasım; diğer hâlleri Cumhurbaşkanlığı ilan eder','Türk Bayrağı, yas alameti olarak','Cumhurbaşkanlığınca ilan edilir.',[('3','m.3 metninin sonunda m.4 başlığı “Bayrağın Yarıya Çekilmesi” yer alır')],'eskiden Başbakanlık'),
 ('5','sira_usul','selam','cephe alınarak','Çekilmesi ve indirilmesi esnasında','cephe alınarak selamlanır.',[('4','m.4 metninin sonunda m.5 başlığı “Bayrağın Selamlanması” yer alır')],'çekme, indirme ve tören geçişlerinde'),
 ('6','kosul','örtül','Cumhurbaşkanı-şehit tabutu, açılışta Atatürk heykeli, yeminde masalara; kürsüye yok','Türk Bayrağı, Cumhurbaşkanlığı yapmış','masalara örtülebilir.',[('5','m.5 metninin sonunda m.6 başlığı “Bayrağın Örtülebileceği Yerler” yer alır')],'yönetmelikte belirlenen asker ve sivillerin tabutu da; sporcu omzu, iş insanı tabutu yok'),
 ('6','kosul','adetler','diğer kullanılma şekli yönetmelikte','Ayrıca milli orf','yönetmelikte gösterilir.',[],'millî örf ve âdetler gözetilir'),

 # m.7 — yasaklar
 ('7','yasak','kullanılamaz','yırtık, sökük, yamalı, delik, kirli, soluk, buruşuk','Türk Bayrağı, yırtık','herhangi bir şekilde kullanılamaz.',[],'manevi değeri zedeleyecek şekilde de'),
 ('7','yasak','serilemez','masalara, kürsülere; resmi yemin töreni hariç','Resmi yemin törenleri dışında','örtü olarak serilemez.',[],'yemin töreninde masaya örtülebilir (m.6)'),
 ('7','yasak','benzeri eşya','Bayrağın şekli yapılamaz; elbise-üniforma olarak giyilemez','Oturulan veya ayakla basılan','şeklinde giyilemez.',[],'oturulan, ayakla basılan yere konulamaz'),
 ('7','yasak','hakaret','sözle, yazıyla, hareketle edilemez; yırtılamaz, yakılamaz, yere atılamaz','Türk Bayrağına sözle','gerekli özen gösterilmeden kullanılamaz.',[],'saygısızlık da yasak'),
 ('7','yasak','amblem','parti, dernek, vakıf amblem-flamasında esas-fon olamaz','Hiçbir siyasi parti','fon teşkil edecek şekilde kullanılamaz.',[],'yönetmelikte belirlenen kamu kurumları hariç'),
 ('7','makam','aykırı fiiller','yetkililerce derhal önlenir, soruşturma yapılır','Bu Kanuna ve yönetmeliğe aykırı fiiller','gerekli soruşturma yapılır.',[],''),

 # m.8 — yasak ve ceza
 ('8','yasak','satmak','yasak; aykırı Bayrak yetkili amirce toplatılır','(Değişik: 23/1/2008-5728/421 md.) Bu Kanuna','yetkili amirlerince toplatılır.',[],'yapmak, satmak, kullanmak'),
 ('8','makam','yapılan Bayrak','o mahallin yetkili amirlerince toplatılır','Bu yasağa aykırı olarak yapılan','yetkili amirlerince toplatılır.',[],'para cezasını ise mülki amir verir'),
 ('8','makam','para ceza','mahalli mülki amir verir; Kabahatler m.32','Bu Kanun hükümlerine aykırı davranışta','idarî para ceza verilir.',[],'fiil suç oluşturmuyorsa'),
 ('8','ceza','suç oluşturmadığı','mülki amirce idari para cezası','Bu Kanun hükümlerine aykırı davranışta','idarî para ceza verilir.',[],'toplatmayı ise yetkili amir yapar'),

 # m.9-12 — yönetmelik, yürürlük, yürütme
 ('9','makam','uygulanmasına ilişkin','Cumhurbaşkanınca çıkarılan yönetmelik','Bu Kanunun ilgili maddelerinde','Cumhurbaşkanınca çıkarılan yönetmelikte gösterilir',[],'eskiden tüzük'),
 ('10','tanim','yürürlükten kaldır','1936 tarihli 2994 sayılı eski Bayrak Kanunu','29 Mayıs 1936','yürürlükten kaldırılmıştır.',[('9','m.9 metninin sonunda m.10 başlığı yer alır')],''),
 ('11','sure','yürürlüğe gir','yayımından altı ay sonra','Bu Kanun yayımı tarihinden','yürürlüğe girer.',[('12','m.12 metninin sonunda değişikliklerin yürürlük tablosu yer alır')],''),
 ('12','makam','yürütür','Bakanlar Kurulu','Bu Kanun hükümlerini','Bakanlar Kurulu yürütür.',[],''),
]
yaz(11, '2893 sayılı Türk Bayrağı Kanunu', K)
