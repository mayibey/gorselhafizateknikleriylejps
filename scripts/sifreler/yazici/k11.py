# 2893 Türk Bayrağı Kanunu — kelime → cevap
import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ortak import yaz
K = [
 ('3','kosul','sürekli çekili kalır','kamu kurum ve kuruluşlarında Türk Bayrağı','(Değişik: 14/7/1999 - 4409/1 md.) Kamu kurum','sürekli çekili kalır.',[],''),
 ('3','makam','yetkili amirler sorumludur','bayrak törenlerinden, o mahaldeki','Bayrak çekilirken ve indirilirken tören','yetkili amirler sorumludur.',[],''),
 ('4','sure','yarıya çekilir','10 Kasım; diğer haller Cumhurbaşkanlığınca ilan','Türk Bayrağı, yas alameti','Cumhurbaşkanlığınca ilan edilir.',[],''),
 ('5','sira_usul','cephe alınarak','Bayrak selamlanır; çekilirken, indirilirken, tören geçişinde','Çekilmesi ve indirilmesi esnasında','selamlanır.',[],''),
 ('6','kosul','tabutlarına','Cumhurbaşkanlığı yapmış kişiler, şehitler, yönetmelikteki asker-sivil','Türk Bayrağı, Cumhurbaşkanlığı yapmış','masalara örtülebilir.',[],'açılışta Atatürk heykellerine de'),
 ('6','istisna','resmi yemin törenlerinde','masaya örtülebilir; başka amaçla serilemez','Türk Bayrağı, Cumhurbaşkanlığı yapmış','masalara örtülebilir.',[('7','yemin töreni dışında masaya, kürsüye serilemez')],''),
 ('7','yasak','uniforma şeklinde giyilemez','Bayrak giyilemez','Elbise veya uniforma','giyilemez.',[],'oturulan, basılan yere konulamaz; yırtık, soluk kullanılamaz'),
 ('7','yasak','esas veya fon teşkil edecek','parti, dernek, vakıf amblem ve flamasında kullanılamaz','Hiçbir siyasi parti','kullanılamaz.',[],''),
 ('8','makam','toplatılır','yönetmeliğe aykırı bayraklar; mahallin yetkili amiri','Bu Kanuna ve çıkarılacak yönetmeliğe','yetkili amirlerince toplatılır.',[],'aykırı bayrak yapmak, satmak, kullanmak yasak'),
 ('8','ceza','fiilleri suç oluşturmadığı takdirde','mülki amir; Kabahatler Kanunu m.32 idarî para cezası','Bu Kanun hükümlerine aykırı davranışta','idarî para ceza verilir.',[],''),
 ('9','makam','diğer esaslar, Cumhurbaşkanınca','Bayrak Kanunu\'nun yönetmelikte düzenlenen hususları','Bu Kanunun ilgili maddelerinde','yönetmelikte gösterilir',[],''),
 ('2', 'tanim', 'ekli cetvelde gösterilen', 'Türk Bayrağı tanımı: şekil ve oranlar cetvelde; beyaz ay-yıldızlı albayrak', 'Türk Bayrağı, bu Kanuna ekli cetvelde', 'ay - yıldızlı albayraktır.', [], ''),
 ('2', 'tanim', 'flama, flandra ve fors', 'özel bayraklar: sembolik bayrak, özel işaret de; standartları yönetmelikte', 'Bayrak ile özel bayrakların', 'yönetmelikte gösterilir', [], 'arma, sancak özel bayraklardan DEĞİL'),
 ('2', 'kosul', 'hangi kumaş ve maddelerden', 'yönetmelikte gösterilir (bayrak ve özel bayrakların standartları)', 'Bayrak ile özel bayrakların', 'yönetmelikte gösterilir', [], ''),
 ('6', 'kosul', 'ATATÜRK heykellerine', 'açılış törenlerinde Bayrak örtülebilir; yemin töreninde masalara', 'Türk Bayrağı, Cumhurbaşkanlığı yapmış', 'masalara örtülebilir.', [], 'kürsüye, protokol masasına örtü YOK'),
 ('6', 'kosul', 'diğer kullanılma şekil ve yeri', 'yönetmelikte gösterilir; millî örf ve âdetler gözetilerek', 'Ayrıca milli orf ve adetler', 'yönetmelikte gösterilir.', [], ''),
 ('6', 'kosul', 'Cumhurbaşkanlığı yapmış kişilerin', 'cenazede tabuta Bayrak: şehitler, yönetmelikteki asker ve sivil kişiler de', 'Türk Bayrağı, Cumhurbaşkanlığı yapmış', 'masalara örtülebilir.', [], ''),
 ('1', 'tanim', 'şekli, yapımı ve korunması', 'Kanunun amacı: bu üç konudaki esas ve usuller', 'Bu Kanunun amacı Türk Bayrağının', 'esas ve usulleri belirlemektir.', [], ''),
 ('3', 'kosul', 'deniz vasıtalarına çekilir', 'kamu kurumları, yurt dışı temsilcilikleri, gerçek-tüzel kişilerin deniz araçları', 'Bayrak, kamu kurum ve kuruluşlarıyla', 'deniz vasıtalarına çekilir.', [], 'özel konutlar sayılmamış'),
 ('3', 'kosul', 'yetkililerin araçlarına takılır', 'yurt içinde ve yurt dışında; çekilir-indirilirken tören yapılır', 'Yurt içinde ve yurt dışında yetkililerin', 'tören yapılır.', [], ''),
 ('7', 'yasak', 'yırtık, sökük, yamalı, delik', 'kirli, soluk, buruşuk; manevi değeri zedeleyecek şekilde kullanılamaz', 'Türk Bayrağı, yırtık', 'herhangi bir şekilde kullanılamaz.', [], ''),
 ('7', 'yasak', 'yırtılamaz, yakılamaz, yere atılamaz', 'gerekli özen gösterilmeden kullanılamaz; onarım yasağı yok', 'Bayrak yırtılamaz', 'gösterilmeden kullanılamaz.', [], ''),
 ('7', 'gorev_yetki', 'yetkililerce derhal önlenir', 'Kanuna/yönetmeliğe aykırı fiiller; gerekli soruşturma yapılır', 'Bu Kanuna ve yönetmeliğe aykırı fiiller', 'gerekli soruşturma yapılır.', [], ''),
 ('11', 'sure', 'altı ay sonra yürürlüğe', 'Kanun yayımı tarihinden altı ay sonra yürürlüğe girer', 'Bu Kanun yayımı tarihinden', 'yürürlüğe girer.', [], ''),
 ('8', 'makam', 'mahalli mülki amir tarafından', 'Kabahatler Kanunu m.32 idarî para cezası (fiil suç değilse)', 'Bu Kanun hükümlerine aykırı davranışta', 'idarî para ceza verilir.', [], ''),
]
yaz(11, '2893 sayılı Türk Bayrağı Kanunu', K)
