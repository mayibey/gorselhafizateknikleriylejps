# 5816 sayılı Atatürk Aleyhine İşlenen Suçlar Hakkında Kanun — kelime → cevap
# KURAL (başkan, 4 Eki 2026): SOL = soru KÖKÜNDE göreceğin ifade, SAĞ = doğru ŞIKTA arayacağın kelime.
# Sorulardan geriye doğru yazıldı (49 cevaplı soru); kanıt resmî metin. Kapsam: tüm maddeler (m.1-5).
# Tuzak çiftleri: HATIRAYA hakaret-sövme 1-3 yıl HAPİS · HEYKEL-büst-abide-KABİR tahribi 1-5 yıl AĞIR hapis ·
#                 toplu (iki+), umuma açık yer, basın → YARI nispetinde · ZOR kullanma (teşebbüs de) → BİR MİSLİ (yalnız anıt suçunda) ·
#                 takibat Cumhuriyet savcılığınca RE'SEN (şikâyet gerekmez).
import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ortak import yaz
K = [
 # m.1 — suçlar ve cezalar
 ('1','ceza',"Atatürk'ün hatırasına",'alenen hakaret-sövme: bir-üç yıl hapis',"Atatürk'ün hatırasına alenen",'hapis cezası ile cezalandırılır.',[],'anıt tahribi ise bir-beş yıl ağır hapis'),
 ('1','ceza','heykel','büst/abide/kabir de; tahrip-kırma-bozma-kirletme: bir-beş yıl ağır hapis; portre-çalma YOK',"Atatürk'ü temsil eden heykel",'ağır hapis cezası verilir.',[],'hatıraya hakaret ise bir-üç yıl hapis'),
 ('1','ceza',"Atatürk'ün kabri",'tahrip, kirletme: bir-beş yıl ağır hapis',"Atatürk'ü temsil eden heykel",'ağır hapis cezası verilir.',[],'heykel, büst, abide için de aynı'),
 ('1','ceza','teşvik','asıl fail gibi cezalandırılır; hakaret ve anıt suçunda','Yukarki fıkralarda','asıl fail gibi cezalandırılır.',[],'daha hafif değil'),

 # m.2 — ağırlaştırıcı hâller
 ('2','ceza','yarı nispetinde','toplu, umuma açık yer, basın; gece, tek kişi yok','Birinci maddede yazılı suçlar; iki','yarı nispetinde artırılır.',[],'zor kullanmada ise bir misli'),
 ('2','ceza','basın','yarı nispetinde artar','Birinci maddede yazılı suçlar; iki','yarı nispetinde artırılır.',[],'toplu ve umuma açık yerde de aynı'),
 ('2','ceza','toplu olarak','iki veya daha fazla kişi; yarı nispetinde','Birinci maddede yazılı suçlar; iki','yarı nispetinde artırılır.',[],''),
 ('2','ceza','zor kullanılarak','bir misli artar; teşebbüste de; yalnız anıt suçunda','Birinci maddenin ikinci fıkrasında','bir misli artırılır.',[],'heykel-büst-abide-kabir suçunda; hatıraya hakarette yok'),

 # m.3-5 — takibat, yürürlük, yürütme
 ('3','sira_usul','takibat',"Cumhuriyet savcılığınca re'sen; şikâyet gerekmez",'Bu kanunda yazılı suçlardan','takibat yapılır.',[],'soruşturma usulü; mağdurun şikâyeti beklenmez'),
 ('4','sure','yürürlüğe girer','yayımı tarihinde','Bu kanun yayımı','yürürlüğe girer.',[],''),
 ('5','makam','yürütür','Adalet Bakanı','Bu kanunu','Adalet Bakanı yürütür.',[],''),
]
yaz(9, '5816 sayılı Atatürk Aleyhine İşlenen Suçlar Hakkında Kanun', K)
