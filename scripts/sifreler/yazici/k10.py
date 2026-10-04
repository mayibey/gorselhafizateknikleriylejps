# 6284 Ailenin Korunması ve Kadına Karşı Şiddetin Önlenmesine Dair Kanun — kelime → cevap
# KURAL (başkan, 4 Eki 2026): SOL = soru KÖKÜNDE göreceğin ifade, SAĞ = doğru ŞIKTA arayacağın kelime.
# Sorulardan geriye doğru yazıldı (105 cevaplı soru + kitapçık kökleri).
# Tuzak çiftleri: KORUYUCU (korunana) mülkî amir, kolluk onayı 48 saat · ÖNLEYİCİ (uygulayana) yalnız hâkim, 24 saat ·
#                 itiraz 2 hafta aile mahkemesi, karar 1 hafta kesin · zorlama hapsi ilk 3-10 gün, tekrar 15-30, toplam 6 ay.
import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ortak import yaz
K = [
 # m.1-2 — amaç, ilkeler, tanımlar
 ('1','tanim','amacı','kadın, çocuk, aile bireyi, ısrarlı takip mağduru; tehlikesi olan da','(1) Bu Kanunun amacı;','usul ve esasları düzenlemektir.',[('8','tedbir, Kanunun amacını tehlikeye sokacak şekilde geciktirilemez')],'komşuluk, kamu düzeni yok'),
 ('1','kosul','cinsiyete dayalı şiddet','özel tedbirler ayrımcılık sayılmaz','ç) Bu Kanun kapsamında kadınlara yönelik cinsiyete','ayrımcılık olarak yorumlanamaz.',[],''),
 ('1','kosul','temel ilke','Anayasa ve uluslararası sözleşmeler; eşitlik, sosyal devlet, adil, süratli','(2) Bu Kanunun uygulanmasında','süratli bir usul izlenir.',[],'yalnız Anayasa değil; İstanbul Sözleşmesi'),
 ('2','tanim','Bakanlık:','Aile ve Sosyal Politikalar Bakanlığı','a) Bakanlık:','Sosyal Politikalar Bakanlığını,',[],''),
 ('2','tanim','aynı haneyi paylaşmasa da','ev içi şiddet','b) Ev içi şiddet:','ekonomik şiddeti,',[],'fiziksel, cinsel, psikolojik, ekonomik'),
 ('2','tanim','hâkimini','aile mahkemesi','c) Hâkim:','Aile mahkemesi hâkimini,',[('9','itirazda aynı hâkimse en yakın asliye hukuka')],''),
 ('2','tanim','sonuçlanması muhtemel','fiziksel, cinsel, psikolojik, ekonomik zarar; tehdit-baskı, keyfî özgürlük engeli','d) Şiddet: Kişinin','her türlü tutum ve davranışı,',[],'dinî şiddet, meslekî başarı azalması yok'),
 ('2','tanim','Şiddet mağduru:','doğrudan ya da dolaylı maruz kalan, etkilenen; tehlikesi olan da','e) Şiddet mağduru:','etkilenme tehlikesi bulunan kişileri,',[],''),
 ('2','tanim','izleme merkezleri','yedi gün yirmi dört saat','f) Şiddet önleme ve izleme merkezleri','yürüten merkezleri,',[('13','m.13 metninin sonunda sonraki bölüm başlığı yer alır')],'ŞÖNİM'),
 ('2','tanim','koruyucu ve önleyici','koruyucu korunan kişiye, önleyici şiddet uygulayana','f) Şiddet önleme ve izleme merkezleri','yürüten merkezleri,',[('3','korunan kişi için mülkî amirin koruyucu tedbirleri'),('5','şiddet uygulayan için hâkimin önleyici tedbirleri')],''),
 ('2','tanim','Şiddet uygulayan:','tehlikesi olan da','g) Şiddet uygulayan:','uygulama tehlikesi bulunan kişileri,',[],'fiilen uygulayan ya da uygulama tehlikesi bulunan'),
 ('2','tanim','istem üzerine veya resen','hâkim, kolluk görevlileri ve mülkî amirler','ğ) Tedbir kararı:','tedbir kararlarını,',[],'Cumhuriyet başsavcılığı tanımlarda yok'),

 # m.3 — mülkî amirin koruyucu tedbirleri
 ('3','makam','mülkî amir tarafından','barınma, maddi yardım, rehberlik, geçici koruma, kreş; işyeri-yerleşim hâkimde','(1) Bu Kanun kapsamında korunan kişilerle ilgili olarak aşağıdaki tedbirlerden','kreş imkânının sağlanması.',[('2','m.2 metninin sonunda sonraki maddenin başlığı yer alır')],''),
 ('3','sure','kolluk amiri','evrak ilk işgünü; mülkî amir kırksekiz, hâkim yirmidört saat','(2) Gecikmesinde sakınca bulunan hâllerde birinci fıkranın (a) ve (ç)','kendiliğinden kalkar.',[('5','önleyici tedbirde hâkim onayı yirmidört saat'),('10','kolluk amirince verilen tedbirde kişi Bakanlık müdürlüğüne ulaştırılır')],'KORUYUCU: barınma ve geçici koruma; onaylanmazsa kendiliğinden kalkar'),
 ('3','sure','kreş','dört ay, çalışana iki ay; asgari ücretin yarısını geçmez','d) Gerekli olması hâlinde, korunan kişinin çocukları','kreş imkânının sağlanması.',[],'on altı yaş üstü asgari ücret'),
 ('3','sure','çalışma yaşamına','kreş imkânı (mülkî amir)','d) Gerekli olması hâlinde, korunan kişinin çocukları','kreş imkânının sağlanması.',[],''),
 ('3','kosul','geçici koruma altına','hayatî tehlike bulunması','ç) Hayatî tehlikesinin','geçici koruma altına alınması.',[('10','geçici koruma kararını kolluk uygular')],'talep üzerine ya da resen'),
 ('3','makam','uygun görülecek','benzer tedbirler de (birine, birkaçına)','(1) Bu Kanun kapsamında korunan kişilerle ilgili olarak aşağıdaki tedbirlerden','mülkî amir tarafından karar verilebilir:',[('4','hâkimin koruyucu tedbirlerinde de benzer tedbir'),('5','hâkimin önleyici tedbirlerinde de benzer tedbir')],''),
 ('3','makam','rehberlik ve danışmanlık','psikolojik, meslekî, hukukî, sosyal','c) Psikolojik, meslekî, hukukî','danışmanlık hizmeti verilmesi.',[],'mülkî amir tedbiri'),
 ('3','makam','geçici maddi yardım','diğer kanunlardaki yardımlar saklı','b) Diğer kanunlar kapsamında','geçici maddi yardım yapılması.',[],''),

 # m.4 — hâkimin koruyucu tedbirleri
 ('4','makam','hâkim tarafından','koruyucu: işyeri, ayrı yerleşim, konut şerhi, kimlik; önleyici: uzaklaştırma','(1) Bu Kanun kapsamında korunan kişilerle ilgili olarak aşağıdaki koruyucu','hâkim tarafından karar verilebilir:',[('5','hâkimin önleyici tedbirleri şiddet uygulayana'),('9','hâkim kararlarına itiraz aile mahkemesine'),('3','m.3 metninin sonunda sonraki maddenin başlığı yer alır')],'barınma ve geçici koruma mülkî amirde'),
 ('4','makam','işyerinin değiştirilmesi','hâkimin koruyucu tedbiri; korunan kişiye yönelik','(1) Bu Kanun kapsamında korunan kişilerle ilgili olarak aşağıdaki koruyucu','a) İşyerinin değiştirilmesi.',[('10','işyeri değişikliğini kişinin mevzuatındaki yetkili merci uygular')],''),
 ('4','makam','müşterek yerleşim yerinden','ayrı yerleşim yeri (hâkim)','(1) Bu Kanun kapsamında korunan kişilerle ilgili olarak aşağıdaki koruyucu','ayrı yerleşim yeri belirlenmesi.',[],'evli korunan kişi'),
 ('4','makam','aile konutu şerhi','hâkim; Medenî Kanun şartı ve korunanın talebi','c) 22/11/2001','aile konutu şerhi konulması.',[],''),
 ('4','makam','kimlik ve ilgili','hayatî tehlike + diğer tedbir yetersiz + aydınlatılmış rıza','ç) Korunan kişi bakımından hayatî','değiştirilmesi.',[],'Tanık Koruma Kanununa göre'),

 # m.5 — hâkimin önleyici tedbirleri
 ('5','makam','önleyici tedbir','yalnız hâkim; kolluk gecikmede yalnız a-b-c-d (söz, uzaklaştırma, yaklaşmama)','(1) Şiddet uygulayanlarla ilgili olarak','hâkim tarafından karar verilebilir:',[('2','tanımlarda koruyucu ve önleyici tedbirler'),('8','önleyici tedbir geciktirilmeksizin verilir'),('10','önleyici tedbiri kolluk birimi uygular'),('4','m.4 metninin sonunda sonraki maddenin başlığı yer alır')],'mülkî amir önleyici tedbir veremez'),
 ('5','makam','şiddet tehdidi, hakaret','bulunmaması (önleyici, hâkim)','a) Şiddet mağduruna yönelik olarak şiddet tehdidi','söz ve davranışlarda bulunmaması.',[],''),
 ('5','makam','uzaklaştırıl','müşterek konut korunan kişiye tahsis','b) Müşterek konuttan','tahsis edilmesi.',[],'evden çıkan uygulayan, mağdur değil'),
 ('5','makam','bulundukları konuta','okula ve işyerine yaklaşmaz','c) Korunan kişilere, bu kişilerin bulundukları','işyerine yaklaşmaması.',[],''),
 ('5','makam','tanıklarına','şiddete uğramasa da yakın, tanık, çocuklara yaklaşmama','d) Gerekli görülmesi hâlinde korunan kişinin','çocuklarına yaklaşmaması.',[],'kişisel ilişki hâlleri saklı'),
 ('5','kosul','kamu görevi','zimmetindeki silahı kurumuna teslim','ğ) Silah taşıması zorunlu','kurumuna teslim etmesi.',[],'ruhsatlı silahlar kolluğa'),
 ('5','makam','alkol ya da uyuşturucu','korunanın yanında kullanmama; bağımlıysa hastane dahil tedavi','h) Korunan kişilerin bulundukları yerlerde alkol','muayene ve tedavisinin sağlanması.',[],''),
 ('5','makam','Çocuk Koruma Kanunu','hâkim velayet, kayyım, nafaka, kişisel ilişkiye de karar verir','(3) Bu Kanunda belirtilen tedbirlerle birlikte','karar vermeye yetkilidir.',[],''),
 ('5','kosul','tedbir nafaka','talep olmasa da; geçimi sağlayan şiddet uygulayandan','(4) Şiddet uygulayan, aynı zamanda','tedbir nafakasına hükmedebilir.',[],'Medenî Kanuna göre nafaka yoksa'),
 ('6','kosul','denetimli serbestlik','koruma ve infaz tedbirlerine ilişkin hükümler saklı','(1) Kişinin silah bulundurması','ilişkin kanun hükümleri saklıdır.',[],'silah, uyuşturucu suç oluşturuyorsa'),
 ('7','kosul','resmi makam veya mercilere','herkes ihbar eder; görevli gecikmeksizin işlem yapar','(1) Şiddet veya şiddet uygulanma tehlikesinin varlığı','yetkilileri haberdar etmekle yükümlüdür.',[],''),

 # m.8 — tedbir kararının verilmesi, tebliğ, gizlilik
 ('8','sira_usul','başvurusu üzerine','ilgili, Bakanlık, kolluk, Cumhuriyet savcısı; muhtar yok','(1) Tedbir kararı, ilgilinin talebi','kolluk biriminden talep edilebilir.',[],'en kolay ulaşılan hâkim, mülkî amir ya da kolluktan istenir'),
 ('8','sira_usul','en kolay ulaşılabilecek','yer hâkimi, mülkî amir ya da kolluk birimi','(1) Tedbir kararı, ilgilinin talebi','kolluk biriminden talep edilebilir.',[],''),
 ('8','sure','ilk defasında','en çok altı ay','(2) Tedbir kararı ilk defasında','en çok altı ay için verilebilir.',[],''),
 ('8','sure','devam edeceğinin','resen ya da korunan kişi, Bakanlık, kolluk talebiyle','(2) Tedbir kararı ilk defasında','aynen devam etmesine karar verilebilir.',[],'süre-şekil değişir, kaldırılır, devam eder'),
 ('8','kosul','Koruyucu tedbir','delil veya belge aranmaz; önleyici geciktirilmeksizin','(3) Koruyucu tedbir kararı verilebilmesi','geciktirilmeksizin verilir.',[('4','hâkimin koruyucu tedbirleri'),('10','geçici koruma kararını kolluk uygular'),('2','m.2 metninin sonunda sonraki maddenin başlığı yer alır'),('3','m.3 metninin sonunda sonraki maddenin başlığı yer alır')],''),
 ('8','sure','Önleyici tedbir kararı','geciktirilmeksizin verilir','(3) Koruyucu tedbir kararı verilebilmesi','geciktirilmeksizin verilir.',[('10','önleyici tedbiri kolluk birimi uygular')],''),
 ('8','sira_usul','reddine ilişkin karar','sadece korunan kişiye tebliğ','Tedbir talebinin reddine','sadece korunan kişiye tebliğ edilir.',[('10','başvurunun kabul ya da reddi Bakanlık müdürlüğüne bildirilir')],'tedbir kararı iki tarafa'),
 ('8','sira_usul','tefhim ve tebliğ','aykırılıkta zorlama hapsi ihtarı','(5) Tedbir kararının tefhim','ihtarı yapılır.',[],''),
 ('8','kosul','gizli tutul','korunan ve aile bireylerinin kimlik-adres bilgisi; tebligata ayrı adres','(6) Gerekli bulunması hâlinde, tedbir kararı ile birlikte','ayrı bir adres tespit edilir.',[],'adli sicil yok; ifşaya TCK'),

 # m.9 — itiraz
 ('9','sure','itiraz','iki hafta, aile mahkemesine; merci bir haftada karar verir, kesin','(1) Bu Kanun hükümlerine göre verilen kararlara','kesindir.',[('8','m.8 metninin sonunda bu maddenin başlığı yer alır')],'İTİRAZ 2 HAFTA · KARAR 1 HAFTA · temyiz yok'),
 ('9','makam','daire','izleyen daireye; sonuncuysa birinciye; tek daire asliye hukuka','(2) Hâkim tarafından verilen tedbir kararlarına itiraz','gecikmeksizin gönderilir.',[],''),
 ('9','makam','aynı hâkim','en yakın asliye hukuk mahkemesi','(2) Hâkim tarafından verilen tedbir kararlarına itiraz','gecikmeksizin gönderilir.',[],''),

 # m.10-12 — bildirim, uygulama, kolluk, teknik takip
 ('10','makam','en seri vasıtalarla','Bakanlık il-ilçe müdürlükleri, savcılık ya da kolluk','(1) Bu Kanun hükümlerine göre alınan tedbir kararları','en seri vasıtalarla bildirilir.',[],''),
 ('10','makam','yerine getirilmesinden','yerleşim yeri, bulunduğu ya da tedbir yeri kolluk birimi','(3) Korunan kişinin geçici koruma','kolluk birimi görevli ve yetkilidir.',[],''),
 ('10','kosul','tebliğ edilmemesi','uygulamaya engel değil','(5) Tedbir kararının ilgililere','engel teşkil etmez.',[],''),
 ('10','makam','Barınma yerlerinin yetersiz','kamu sosyal tesis, yurt; mülkî amir, acelede kolluk talebiyle','(6) Hakkında barınma yeri sağlanmasına','geçici olarak barındırılabilir.',[],''),
 ('10','makam','İşyerinin değiştirilmesi yönündeki','kişinin tabi olduğu mevzuata göre yetkili merci uygular','(7) İşyerinin değiştirilmesi','yerine getirilir.',[],''),
 ('11','kosul','Kolluk görevleri','kadın-çocuk hakları ve eşitlik eğitimi almış yeterli personel','(1) Kolluk görevleri, kolluğun merkez','personel tarafından yerine getirilir.',[('10','m.10 metninin sonunda bu maddenin başlığı yer alır')],'yalnız kadın personel şartı yok'),
 ('12','yasak','teknik araç','hâkim kararıyla; ses-görüntü dinlenemez, izlenemez, kaydedilemez','(1) Bu Kanun hükümlerine göre verilen tedbir kararlarının uygulanmasında','kayda alınamaz.',[],''),

 # m.13 — zorlama hapsi
 ('13','ceza','aykırı','ilk üç-on gün; tekrarında onbeş-otuz; toplam altı ay zorlama hapsi','(1) Bu Kanun hükümlerine göre hakkında tedbir','altı ayı geçemez.',[('8','tebliğde zorlama hapsi ihtarı yapılır'),('12','m.12 metninin sonunda bu maddenin başlığı yer alır')],'fiil suç olsa bile; hâkim kararıyla'),
 ('13','makam','ilçe müdürlüklerine','Bakanlığın müdürlüklerine; yerine getiren başsavcılık','(3) Zorlama hapsine','müdürlüklerine bildirilir.',[('10','tedbir kararları da Bakanlık il-ilçe müdürlüklerine bildirilir')],''),
 ('13','makam','zorlama hapsi','toplam altı ay; Cumhuriyet başsavcılığı yerine getirir','(2) Tedbir kararının gereklerine','müdürlüklerine bildirilir.',[('8','tebliğde zorlama hapsi ihtarı yapılır')],'infaz hâkimliği değil'),
]
yaz(10, '6284 sayılı Ailenin Korunması ve Kadına Karşı Şiddetin Önlenmesine Dair Kanun', K)
