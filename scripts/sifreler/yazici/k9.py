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
]
yaz(9, '5816 sayılı Atatürk Aleyhine İşlenen Suçlar Hakkında Kanun', K)
