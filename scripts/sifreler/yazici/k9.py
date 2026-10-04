# 5816 Atatürk Aleyhine İşlenen Suçlar — kelime → cevap
import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ortak import yaz
K = [
 ('1','ceza','alenen hakaret eden','bir yıldan üç yıla kadar hapis','Atatürk\'ün hatırasına','cezalandırılır.',[],'sövme de'),
 ('1','ceza','heykel, büst ve abideleri','bir yıldan beş yıla ağır hapis','Atatürk\'ü temsil eden','ağır hapis cezası verilir.',[],'kabrini tahrip, kırma, bozma, kirletme de'),
 ('1','ceza','teşvik eden','asıl fail gibi cezalandırılır','Yukarki fıkralarda','asıl fail gibi cezalandırılır.',[],''),
 ('2','ceza','basın vasıtasiyle','ceza yarı nispetinde artırılır','Birinci maddede yazılı suçlar','yarı nispetinde artırılır.',[],'iki veya daha fazla kişi toplu olarak, umuma açık yerde de yarı'),
 ('2','ceza','zor kullanılarak','tahripte ceza bir misli artırılır','Birinci maddenin ikinci fıkrasında','bir misli artırılır.',[],'teşebbüs de'),
 ('3','sira_usul','re\'sen takibat','Cumhuriyet savcılığı kendiliğinden kovuşturur; şikâyet gerekmez','Bu kanunda yazılı','re\'sen takibat yapılır.',[],''),
 ('2', 'ceza', 'iki veya daha fazla kimseler', 'toplu işlenme; ceza yarı nispetinde artırılır (umumi mahal, basın da)', 'Birinci maddede yazılı suçlar; iki', 'yarı nispetinde artırılır.', [], 'TOPLU, UMUMA AÇIK, BASIN: YARI'),
 ('2', 'ceza', 'umuma açık mahallerde', 'ceza yarı nispetinde artırılır', 'Birinci maddede yazılı suçlar; iki', 'yarı nispetinde artırılır.', [], ''),
 ('2', 'ceza', 'bir misli artırılır', 'heykel/kabir tahribi zor kullanılarak işlenir ya da teşebbüs edilirse', 'Birinci maddenin ikinci fıkrasında yazılı suçlar zor', 'bir misli artırılır.', [], 'ZOR KULLANMA: BİR MİSLİ'),
 ('1', 'ceza', 'kabrini tahrip eden', 'bir yıldan beş yıla kadar ağır hapis; kıran, bozan, kirleten', "Atatürk'ü temsil eden heykel", 'ağır hapis cezası verilir.', [], ''),
 ('1', 'ceza', 'bir yıldan beş yıla', 'heykel, büst, abide, kabir tahribi; hakaret-sövme bir yıldan üç yıla', "Atatürk'ün hatırasına alenen", 'ağır hapis cezası verilir.', [], 'HAKARET 1-3, TAHRİP 1-5'),
 ('3', 'makam', 'Cumhuriyet savcılıklarınca', "re'sen takibat; şikâyete bağlı değil", 'Bu kanunda yazılı suçlardan', "re'sen takibat yapılır.", [], ''),
 ('4', 'sure', 'yayımı tarihinde yürürlüğe', 'Kanun yayımı tarihinde yürürlüğe girer', 'Bu kanun yayımı', 'yürürlüğe girer.', [], ''),
 ('5', 'makam', 'Adalet Bakanı yürütür', 'Kanunu Adalet Bakanı yürütür', 'Bu kanunu Adalet', 'Bakanı yürütür.', [], ''),
]
yaz(9, '5816 sayılı Atatürk Aleyhine İşlenen Suçlar Hakkında Kanun', K)
