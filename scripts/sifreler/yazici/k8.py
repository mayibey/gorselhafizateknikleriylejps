# 2935 Olağanüstü Hal Kanunu — kelime → cevap
import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ortak import yaz
K = [
 ('3','sure','altı ayı geçmemek üzere','olağanüstü hal ilanı; en çok altı ay; Cumhurbaşkanı, MGK görüşüyle','Yurdun bir veya birden fazla','olağanüstü hal ilan edebilir.',[],'sebepler: afet, salgın, ağır ekonomik bunalım (a); yaygın şiddet (b)'),
 ('3','sure','dört ayı geçmemek üzere','TBMM, Cumhurbaşkanının istemiyle uzatır','Olağanüstü hal kararı Resmi','olağanüstü hali kaldırabilir.',[],'İLAN ALTI, UZATMA DÖRT; Meclis süreyi değiştirebilir, kaldırabilir'),
 ('3','sira_usul','Türkiye Büyük Millet Meclisinin onayına','OHAL kararı RG\'de yayımlanır; tatildeyse Meclis derhal toplanır','Olağanüstü hal kararı Resmi','olağanüstü hali kaldırabilir.',[],''),
 ('3','makam','Milli Güvenlik Kurulunun görüşünü','ilan öncesi; şiddet (b) halinde uzatma-kaldırmada da','Cumhurbaşkanı, olağanüstü halin','Milli Güvenlik Kurulunun görüşünü alır.',[],''),
 ('3','sira_usul','Türkiye radyo ve televizyonuyla','OHAL kararının sebebi, bölgesi, süresi ilan edilir','Olağanüstü hal kararının hangi','diğer araçlarla ilan edilir.',[],''),
 ('9','gorev_yetki','öğrenime ara vermek','afet ve salgın OHAL tedbiri; öğrenci yurtlarını kapatma da','b) Resmi ve özel her derecedeki','süreli veya süresiz olarak kapatmak,',[],'m.9 tedbirleri şiddet OHAL\'inde de alınabilir'),
 ('9','gorev_yetki','yıllık izinlerini sınırlamak','OHAL hizmetinde görevli personel; afet-salgın tedbiri','d) Bölgede olağanüstü hal','sınırlamak veya kaldırmak,',[],''),
 ('9','gorev_yetki','Tehlike arz eden binaları yıkmak','afet/salgın tedbiri; sağlığa zararlı gıdayı imha','f) Tehlike arz eden','imha etmek,',[],''),
 ('11','gorev_yetki','Sokağa çıkmayı sınırlamak','şiddet OHAL\'inde ek tedbir; sokağa çıkma yasağı','a) Sokağa çıkmayı','yasaklamak,',[],'m.11: yalnız (b) bendi (şiddet) OHAL\'inde'),
 ('11','gorev_yetki','kimlik belirleyici belge taşıma mecburiyeti','şiddet OHAL\'i; bölge sakinleri ve bölgeye girenler','d) Olağanüstü hal ilan edilen bölge sakinleri','mecburiyeti koymak,',[],''),
 ('11','yasak','Ruhsatlı da olsa her nevi','şiddet OHAL\'inde nakli yasaklanabilir','i) Ruhsatlı da olsa','naklini yasaklamak,',[],'5442 m.11\'de vali de on beş gün için yasaklayabilir'),
 ('11','sure','işçi çıkartmalarını','üç ayı aşmamak üzere izne bağlama, erteleme','n) (Ek: 14/11/1984 - 3076/1 md.) İşçinin','izne bağlamak veya ertelemek,',[],''),
 ('11','sure','Dernek faaliyetlerini','her dernek için ayrı karar; üç ayı geçmemek üzere durdurma','o) (Ek: 14/11/1984 - 3076/1 md.) Dernek','durdurmak,',[],''),
 ('11','makam','Hükümetin müsaadesi tahtında','OHAL\'de sınır ötesi harekât; valinin talebi, Genelkurmay kanalı','p) (Ek: 25/7/1986','harekat planlayıp icra etmek.',[],'komşu ülkeyle mutabakat; 5442 m.11\'de "Cumhurbaşkanının müsaadesi"'),
 ('22','makam','bağlı oldukları bölge valisine','il valisi, kolluk yetmezse başvurur (şiddet OHAL\'i)','Olayları önleyemedikleri','il valisinin emrine girer.',[],'afet OHAL\'inde vali mevcut yetkileriyle yardım ister'),
 ('22','makam','il valisinin emrine girer','yardım üzerine gönderilen kolluk','Olayları önleyemedikleri','il valisinin emrine girer.',[],''),
 ('22','makam','en yakın askeri komutanlıktan','il valisi; ani olayda, bölge valisinin güçleri gelene kadar','İl valisi, ani ve olağanüstü','yardım gönderilmesini isteyebilir.',[],'bölge valisine ve İçişleri Bakanlığına bildirir'),
 ('23','gorev_yetki','doğruca ve duraksamadan hedefe ateş','teslim ol emrine uyulmaz, silahla karşılık, meşru müdafaa','Olağanüstü halin, bu Kanunun 3 üncü','hedefe ateş edebilirler.',[],'yalnız şiddet (b) OHAL\'inde'),
 ('23','sira_usul','tutuksuz yapılır','silah kullanan personelin soruşturması','Silah kullanan bütün personel','tutuksuz yapılır.',[],'İç Hizmet K. m.87 ve 1481 sayılı Kanun m.3 uygulanır'),
]
yaz(8, '2935 sayılı Olağanüstü Hal Kanunu', K)
