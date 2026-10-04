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
]
yaz(11, '2893 sayılı Türk Bayrağı Kanunu', K)
