# 6284 Ailenin Korunması ve Kadına Karşı Şiddetin Önlenmesine Dair Kanun — kelime → cevap
import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ortak import yaz
K = [
 ('2','tanim','Aile mahkemesi hâkimini','Kanundaki hâkim','c) Hâkim','Aile mahkemesi hâkimini,',[],''),
 ('2','tanim','yedi gün yirmidört saat','Şiddet önleme ve izleme merkezleri (ŞÖNİM)','f) Şiddet önleme ve izleme merkezleri','yürüten merkezleri,',[],''),
 ('2','tanim','aynı haneyi paylaşmasa da','ev içi şiddet; aile mensubu sayılanlar arasında da','b) Ev içi şiddet','ekonomik şiddeti,',[],'fiziksel, cinsel, psikolojik, ekonomik'),
 ('3','makam','geçici maddi yardım','mülkî amirin koruyucu tedbiri','(1) Bu Kanun kapsamında korunan kişilerle ilgili olarak aşağıdaki tedbirlerden','geçici maddi yardım yapılması.',[],'barınma, rehberlik-danışmanlık, geçici koruma, kreş de mülkî amir'),
 ('3','makam','Hayatî tehlikesinin bulunması hâlinde','mülkî amir geçici koruma; kolluk da gecikmede alabilir','ç) Hayatî tehlikesinin','geçici koruma altına alınması.',[],'talep üzerine ya da resen'),
 ('3','sure','kreş imkânının','mülkî amir; çocuklu korunan kişiye dört ay, çalışıyorsa iki ay','d) Gerekli olması hâlinde, korunan kişinin çocukları','kreş imkânının sağlanması.',[],'aylık net asgari ücretin yarısını geçmemek üzere'),
 ('3','sure','kırksekiz saat içinde onaylanmayan','kolluğun aldığı koruyucu tedbir kalkar; mülkî amir onayı','(2) Gecikmesinde sakınca bulunan hâllerde birinci fıkranın (a) ve (ç)','kendiliğinden kalkar.',[('5','önleyici tedbirde hâkim onayı yirmidört saat')],'MÜLKİ AMİR KIRK SEKİZ, HÂKİM YİRMİ DÖRT; evrak ilk işgünü onaya'),
 ('4','makam','İşyerinin değiştirilmesi','hâkimin koruyucu tedbiri','(1) Bu Kanun kapsamında korunan kişilerle ilgili olarak aşağıdaki koruyucu','ayrı yerleşim yeri belirlenmesi.',[('10','işyeri değişikliği kararını kişinin tabi olduğu mevzuata göre yetkili merci uygular')],'ayrı yerleşim yeri de hâkim'),
 ('4','makam','aile konutu şerhi','hâkim; TMK şartları ve korunan kişinin talebi','c) 22/11/2001','aile konutu şerhi konulması.',[],''),
 ('4','makam','Tanık Koruma Kanunu','hâkim; kimlik değişikliği, aydınlatılmış rıza','ç) Korunan kişi bakımından hayatî','değiştirilmesi.',[],'diğer tedbirler yetersizse'),
 ('5','makam','derhâl uzaklaştırılması','hâkimin önleyici tedbiri; konut korunan kişiye tahsis','b) Müşterek konuttan','tahsis edilmesi.',[],'EVİ TERK EDEN MAĞDUR DEĞİL, ŞİDDET UYGULAYAN'),
 ('5','kosul','zimmetinde bulunan silahı','kamu görevlisi de kurumuna teslim eder (önleyici tedbir)','ğ) Silah taşıması zorunlu','kurumuna teslim etmesi.',[],'ruhsatlı silahlar kolluğa teslim'),
 ('5','sure','yirmidört saat içinde onaylanmayan','kolluğun aldığı önleyici tedbir kalkar; hâkim onayı','(2) Gecikmesinde sakınca bulunan hâllerde birinci fıkranın (a), (b), (c) ve (d)','kendiliğinden kalkar.',[('3','koruyucu tedbirde mülkî amir onayı kırksekiz saat')],''),
 ('5','kosul','talep edilmese dahi tedbir nafakasına','hâkim hükmedebilir; şiddet uygulayan geçimi sağlıyorsa','(4) Şiddet uygulayan, aynı zamanda','tedbir nafakasına hükmedebilir.',[],'TMK nafakası yoksa'),
 ('7','kosul','herkes bu durumu','ihbar edebilir; kamu görevlisi gecikmeksizin işlem yapar','(1) Şiddet veya şiddet uygulanma tehlikesinin varlığı','ihbar edebilir.',[],''),
 ('8','sure','en çok altı ay için','tedbir kararı süresi; uzatılabilir, değiştirilebilir','(2) Tedbir kararı ilk defasında','en çok altı ay için verilebilir.',[],'talep: ilgili, Bakanlık, kolluk, Cumhuriyet savcısı'),
 ('8','kosul','delil veya belge aranmaz','koruyucu tedbir kararı için','(3) Koruyucu tedbir kararı verilebilmesi','delil veya belge aranmaz.',[],'önleyici tedbir geciktirilmeksizin verilir'),
 ('8','sira_usul','sadece korunan kişiye tebliğ','tedbir talebinin reddi kararı','Tedbir talebinin reddine','sadece korunan kişiye tebliğ edilir.',[],'tedbir kararı iki tarafa da'),
 ('8','sira_usul','zorlama hapsinin uygulanacağı ihtarı','tebliğ ve tefhimde yapılır','(5) Tedbir kararının tefhim','ihtarı yapılır.',[],''),
 ('9','sure','aile mahkemesine itiraz edilebilir','tedbir kararına; tefhim/tebliğden iki hafta','(1) Bu Kanun hükümlerine göre verilen kararlara','aile mahkemesine itiraz edilebilir.',[],''),
 ('9','sure','İtiraz mercii kararını bir hafta','verir; itiraz üzerine karar kesin','(3) İtiraz mercii','kesindir.',[],'İTİRAZ İKİ HAFTA, KARAR BİR HAFTA'),
 ('10','kosul','engel teşkil etmez','tedbir kararının tebliğ edilmemesi uygulamayı engellemez','(5) Tedbir kararının ilgililere','engel teşkil etmez.',[],''),
 ('10','makam','kolluk birimi görevli ve yetkilidir','tedbirin uygulanması; yerleşim yeri ya da tedbirin uygulanacağı yer','(3) Korunan kişinin geçici koruma','kolluk birimi görevli ve yetkilidir.',[],''),
 ('12','yasak','ses ve görüntüleri dinlenemez','teknik takipte yasak; hâkim kararıyla teknik araç kullanılabilir','(1) Bu Kanun hükümlerine göre verilen tedbir kararlarının uygulanmasında','kayda alınamaz.',[],''),
 ('13','ceza','fiili bir suç oluştursa bile','zorlama hapsi üç günden on güne; hâkim kararıyla','(1) Bu Kanun hükümlerine göre hakkında tedbir','zorlama hapsine tabi tutulur.',[],'tedbire aykırılık'),
 ('13','ceza','onbeş günden otuz güne','tekrarında zorlama hapsi; toplam altı ayı geçemez','(2) Tedbir kararının gereklerine','altı ayı geçemez.',[],'İLK 3-10 GÜN, TEKRAR 15-30, TOPLAM 6 AY'),
 ('13','makam','Zorlama hapsine ilişkin kararlar','Cumhuriyet başsavcılığınca yerine getirilir','(3) Zorlama hapsine','yerine getirilir.',[],''),
 ('3', 'sure', 'ilk işgünü içinde mülkî amirin', 'kolluk amirinin koruyucu tedbir evrakı; kırksekiz saatte onaylanmazsa kalkar', 'Kolluk amiri evrakı en geç', 'kendiliğinden kalkar.', [], ''),
]
yaz(10, '6284 sayılı Ailenin Korunması ve Kadına Karşı Şiddetin Önlenmesine Dair Kanun', K)
