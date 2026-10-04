# 2935 sayılı Olağanüstü Hal Kanunu — kelime → cevap
# KURAL (başkan, 4 Eki 2026): SOL = soru KÖKÜNDE göreceğin ifade, SAĞ = doğru ŞIKTA arayacağın kelime.
# Sorulardan geriye doğru yazıldı (76 cevaplı soru + kitapçık kökleri); kanıt resmî metin. Kapsam: m.1-3, m.9, m.11, m.22, m.23.
# Tuzak çiftleri: (a) AFET-SALGIN-BUNALIM OHAL'i → m.9 tedbirleri; para, mal, çalışma yükümlülüğü yalnız burada ·
#                 (b) ŞİDDET OHAL'i → m.11 ek tedbirleri (sokağa çıkma, toplantı, silah, dernek, basın); MGK görüşü uzatma-kaldırmada da ·
#                 İLAN en çok ALTI ay (Cumhurbaşkanı) · UZATMA her defasında DÖRT ay (Meclis).
# Not: "ilan" ve "tedbir" birçok maddede geçen geniş kelimeler; karışma notları satırlarda.
import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ortak import yaz
K = [
 # m.1 — amaç ve ilan sebepleri
 ('1','tanim','Kanunun amacı','ilan usulleri ve uygulanacak hükümler','Bu Kanunun amacı','uygulanacak hükümleri belirlemektir.',[],'OHAL ilanı, usulleri ve OHAL’de uygulanacak hükümler'),
 ('1','kosul','durumlar','(a) afet, salgın, ekonomik bunalım; (b) yaygın şiddet; savaş yok','a) Tabii afet','Durumlarında olağanüstü hal ilan edilmesi',[('2','m.2: kamu görevlilerinin durumlarındaki değişiklikler kapsamda')],'seferberlik, savaş, dış tehdit OHAL sebebi sayılmaz'),
 ('1','kosul','salgın hastalık','(a) bendi; afet ve ekonomik bunalım da','a) Tabii afet','ağır ekonomik bunalım,',[('2','m.2: para, mal, çalışma yükümlülüğü yalnız bu hâllerde'),('3','m.3/a: Cumhurbaşkanı bu sebeplerle ilan eder'),('9','m.9: afet ve salgın OHAL’inde alınacak tedbirler')],'deprem, sel = tabii afet'),

 # m.2 — kapsam
 ('2','kosul','para, mal','çalışma dahil; yalnız afet, salgın, bunalım OHAL’inde','Bu Kanun; olağanüstü hal ilanına tabii afet','çalışma yükümlülükleri',[],'şiddet (b) OHAL’inde para, mal, çalışma yükümlülüğü YOK'),
 ('2','kosul','her türü için','hak sınırlama, tedbir, görevli, yönetim usulü; para-mal değil','olağanüstü hallerin her türü için','olağanüstü yönetim usullerine ilişkin hükümleri kapsar.',[],'seçim zamanı, vergi muafiyeti kapsamda yok'),
 ('2','kosul','nasıl sınırlan','OHAL’in her türü için ayrı ayrı geçerli','olağanüstü hallerin her türü için','olağanüstü yönetim usullerine ilişkin hükümleri kapsar.',[],'temel hak ve hürriyetlerin sınırlanması veya durdurulması'),
 ('2','gorev_yetki','kamu hizmeti görevlileri','yetkiler ve durumlarındaki değişiklikler','kamu hizmeti görevlilerine','değişiklikler yapılacağına',[],''),

 # m.3 — ilan, süre, uzatma, Meclis onayı
 ('3','makam','ilan','Cumhurbaşkanı; en çok altı ay','Cumhurbaşkanı:1','olağanüstü hal ilan edebilir.',[('1','m.1: OHAL ilan edilmesi sebepleri ve amaç'),('2','m.2: ilan edilen OHAL’de yükümlülükler ve kapsam'),('9','m.9: afet ve salgın OHAL’i ilanında tedbirler'),('11','m.11: şiddet OHAL’i ilanında ek tedbirler'),('22','m.22: OHAL ilan edilen ilde valinin yardım istemi'),('23','m.23: OHAL ilanından sonra silah kullanma yetkisi')],'Milli Güvenlik Kurulu görüşünü alarak; eskiden Bakanlar Kurulu'),
 ('3','makam','görüşünü','Milli Güvenlik Kurulu','b) Anayasa ile kurulan','görüşünü de aldıktan sonra;',[],'ilan kararından önce Cumhurbaşkanı alır'),
 ('3','makam','kapsamını değiştir','Milli Güvenlik Kurulu görüşü; (b) şiddet OHAL’inde','Cumhurbaşkanı, olağanüstü halin bu maddenin','görüşünü alır.',[],'süreyi uzatma ve kaldırmada da; bu kural yalnız (b) bendi için yazılı'),
 ('3','sure','uzat','dört ay; Meclis, Cumhurbaşkanı istemiyle','Meclis, olağanüstü hal süresini değiştirebilir.','olağanüstü hali kaldırabilir.',[],'her defasında; İLAN ALTI, UZATMA DÖRT'),
 ('3','makam','süresini değiştir','Meclis (TBMM)','Meclis, olağanüstü hal süresini değiştirebilir.','olağanüstü hali kaldırabilir.',[],'kaldırma yetkisi de Meclisin'),
 ('3','sira_usul','Resmi Gazete','yayımlanır; hemen Meclisin onayına sunulur',"Olağanüstü hal kararı Resmi Gazete'de",'onayına sunulur.',[],'Meclis onayı olmadan süresiz yürürlük YOK'),
 ('3','sira_usul','tatilde','derhal toplantıya çağrılır','Türkiye Büyük Millet Meclisi tatilde ise','toplantıya çağrılır.',[],''),
 ('3','sira_usul','sebeplerle alındığı','Türkiye radyo ve televizyonuyla; gerekirse diğer araçlarla','Olağanüstü hal kararının hangi','diğer araçlarla ilan edilir.',[],'sebep, bölge ve süre ilan edilir; diğer araçlara Cumhurbaşkanı karar verir'),
 ('3','kosul','bütününde','bölgesinde ya da tüm yurtta','Yurdun bir veya birden fazla','olağanüstü hal ilan edebilir.',[],'yalnız bir bölgede ilan şartı yok'),

 # m.9 — afet ve salgın OHAL'i tedbirleri
 ('9','gorev_yetki','tedbir','afet-salgında: öğrenime ara, bina yıkma; sokağa çıkma, silah, dernek yok','Tabii afet ve tehlikeli salgın hastalıklar sebebiyle','imha etmek,',[('2','m.2: halin gerektirdiği tedbirlerin nasıl alınacağı kapsamda'),('11','m.11: şiddet OHAL’inde m.9’a ek tedbirler; sokağa çıkma, silah, dernek orada'),('22','m.22/b: valinin aldığı tedbirleri kolluk uygulayamazsa bölge valisi')],'yerleşimi yasaklama-boşaltma, eğlence yeri denetimi, personel izni, haberleşmeye elkoyma, gıda kontrolü de'),
 ('9','gorev_yetki','deniz ve hava','ulaştırma araçlarının giriş-çıkışı kayıtlanır, yasaklanır','j) Kara, deniz ve hava','kayıtlamak veya yasaklamak.',[],'trafik düzenine ilişkin tedbirler'),

 # m.11 — şiddet OHAL'i ek tedbirleri
 ('11','gorev_yetki','kamu düzeni','ek: sokağa çıkma, toplantı, silah, dernek, basın; çalışma yükümlülüğü yok','Bu Kanunun 3 üncü maddesinin birinci fıkrasının (b) bendi gereğince','a) Sokağa çıkmayı sınırlamak veya yasaklamak,',[('1','m.1/b: kamu düzeninin ciddi bozulması OHAL sebebi'),('3','m.3/b: aynı sebeple Cumhurbaşkanı ilan eder')],'m.9 tedbirleri de alınır; gıda kontrolü m.9’dan gelir, ek tedbir değil'),
 ('11','gorev_yetki','Sokağa çıkma','yalnız şiddet (b) OHAL’inde; afet OHAL’inde yok','Bu Kanunun 3 üncü maddesinin birinci fıkrasının (b) bendi gereğince','a) Sokağa çıkmayı sınırlamak veya yasaklamak,',[],'sınırlama veya yasaklama'),
 ('11','gorev_yetki','gösteri yürüyüş','yalnız şiddet (b) OHAL’inde: yasaklama, erteleme, izne bağlama','m) Kapalı ve açık yerlerde','gerekiyorsa dağıtmak,',[],'yer ve zaman tayini, izletme, dağıtma da'),
 ('11','sure','Dernek faaliyet','üç ay; her dernek için ayrı karar','o) (Ek: 14/11/1984 - 3076/1 md.) Dernek','durdurmak,',[],'yalnız şiddet (b) OHAL’inde'),
 ('11','sure','işçi çıkart','üç ay; izne bağlama veya erteleme','n) (Ek: 14/11/1984 - 3076/1 md.) İşçinin','izne bağlamak veya ertelemek,',[],'işçinin isteği, ahlak, sağlık, emeklilik, süre bitimi hariç'),
 ('11','gorev_yetki','kimlik belirleyici','bölge sakinleri ve hariçten girenler (d bendi)','d) Olağanüstü hal ilan edilen bölge sakinleri','mecburiyeti koymak,',[],'belge taşıma mecburiyeti'),
 ('11','makam','sınır ötesi','valinin talebi; ilgili komutan icra eder; Genelkurmay kanalı, Hükümet müsaadesi','p) (Ek: 25/7/1986','harekat planlayıp icra etmek.',[],'komşu ülkeyle mutabakat; mahdut hedefli; vali emir vermez'),

 # m.22 — il valisinin yardım istemi
 ('22','makam','ani ve olağanüstü','en yakın askeri komutanlıktan yardım','İl valisi, ani ve olağanüstü','yardım gönderilmesini isteyebilir.',[],'bölge valisinin güçleri gelene kadar'),
 ('22','makam','bildirir','bölge valisi ve İçişleri Bakanlığına','İl valisi ayrıca bu durumu','İçişleri Bakanlığına bildirir.',[],'askerî yardım istediğini'),
 ('22','makam','olayları önle','önce emrindeki kolluk; yetmezse bölge valisi','b) İllerinde bu Kanunun 3 üncü maddesinin (b)','bölge valisine başvururlar.',[],'ani olayda en yakın askerî komutanlık'),
 ('22','makam','emrindeki kolluk','yetmezse bağlı olduğu bölge valisine','b) İllerinde bu Kanunun 3 üncü maddesinin (b)','bölge valisine başvururlar.',[],'gönderilen kolluk il valisinin emrine girer'),
 ('22','makam','yardım istem','afette mevcut yetkiler; şiddette kolluk, bölge valisi, askeri','a) İllerinde bu Kanunun 3 üncü maddesinin birinci fıkrasının (a)','bölge valisine başvururlar.',[],'(a) ve (b) için ayrı usul'),
 ('22','sure','istekleri','gecikmeksizin yerine getirilir','İl valisinin yukarıda açıklanan istekleri','gecikmeksizin yerine getirilir.',[],'ilgililerce'),
 ('22','makam','görev ve yetkiler','il valisi (askeri yardım isteyince)','İl valisinin askeri birliklerden yardım','il valilerince yerine getirilir.',[],'bölge valisine ait görev ve yetkiler; m.21 uygulanır'),

 # m.23 — silah kullanma
 ('23','gorev_yetki','teslim ol','doğruca ve duraksamadan hedefe ateş; yalnız (b) OHAL’inde','Olağanüstü halin, bu Kanunun 3 üncü','hedefe ateş edebilirler.',[],'silahla karşılık veya meşru müdafaa hâlinde de'),
 ('23','sira_usul','soruşturma','tutuksuz yapılır','Ayrıca haklarındaki soruşturma','tutuksuz yapılır.',[],'İç Hizmet K. m.87 ve 1481 sayılı K. m.3 uygulanır'),
 ('23','gorev_yetki','silah kullanma yetkisi','kanunlardaki silah kullanma şartlarından biri gerçekleşince','Olağanüstü hal ilanından sonra kolluk','silah kullanma yetkisini haizdirler.',[('22','m.22 metninin sonunda m.23 başlığı yer alır')],'kolluk, özel kolluk ve silahlı kuvvetler'),
]
yaz(8, '2935 sayılı Olağanüstü Hal Kanunu', K)
