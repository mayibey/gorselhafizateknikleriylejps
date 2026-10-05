# 3713 sayılı Terörle Mücadele Kanunu — kelime → cevap
# KURAL (başkan, 4 Eki 2026): SOL = soru KÖKÜNDE göreceğin ifade, SAĞ = doğru ŞIKTA arayacağın kelime.
# Sorulardan geriye doğru yazıldı (79 cevaplı soru + kitapçık kökleri); kanıt resmî metin. Kapsam: m.1-4, 7, 8, 15, 19-22.
# Tuzak çiftleri: m.3 suçları DOĞRUDAN terör suçu · m.4 suçları ancak ÖRGÜT FAALİYETİ çerçevesinde (orman yakma KASTEN) ·
#                 propaganda 1-5 yıl, basın-yayınla yarı artar, okul-yurt-dernekte iki kat · yüz kapatma 3-5 yıl, molotofla alt sınır 4 ·
#                 vatandaşa SOSYAL YARDIMLAŞMA FONU (m.22) · kamu görevlisine 2330 NAKDİ TAZMİNAT, 30 yıl ikramiye, 10 yıl konut (m.21).
# Not: bankadaki "teslim ol / doğrudan ve duraksamadan hedefe" soruları Ek madde 2'den; Emir kapsamında olmadığı için satır yazılmadı.
# Not: m.21 metni 6000 karakterde kesik; (h) bendinin sonrası yok.
import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ortak import yaz
K = [
 # m.1 — terör tanımı
 ('1','tanim','yöntemler','terörün: baskı, korkutma, yıldırma, sindirme, tehdit (biriyle yeter); kandırma YOK','(Değişik birinci fıkra: 15/7/2003-4928/20 md.) Terör;','tehdit yöntemlerinden biriyle,',[('7', 'm.7: örgüt kurma ve propagandada da cebir, şiddet, tehdit yöntemleri geçer')],'cebir ve şiddet kullanarak; beş yöntemden birinin kullanılması yeterli'),
 ('1','tanim','suç teşkil eden eylemler','terör: örgüte mensup kişi veya kişilerce girişilir','amacıyla bir örgüte mensup','suç teşkil eden eylemlerdir.',[('21', 'm.21: terör eylemine muhatap kamu görevlisine 2330 uygulanır'), ('22', 'm.22: terör eyleminden zarar gören vatandaşa Fon yardımı')],'her türlü suç teşkil eden eylem; amaçlar: Cumhuriyetin nitelikleri, bölünmez bütünlük, Devlet otoritesi, temel haklar, iç-dış güvenlik, genel sağlık'),

 # m.2 — terör suçlusu
 ('2','tanim','terör suçlusu','mensup: suç işlemese de; mensup değil: örgüt adına işlerse','Birinci maddede belirlenen amaçlara','terör suçlusu sayılır',[('1','m.1 metninin sonunda m.2 başlığı “Terör suçlusu” yer alır')],'tek başına ya da beraber suç işleyen mensup da'),

 # m.3 ve m.4 — terör suçları
 ('3','tanim','yazılı suçlar, terör suçlarıdır','302/307/309/311-315/320 ve 310 birinci fıkra: doğrudan terör suçu','(Değişik: 29/6/2006-5532/2 md.) 26/9/2004','terör suçlarıdır.',[],'örgüt faaliyeti şartı aranmaz; 303-306 ve 308 hiç YOK (ör. 303 düşmanla işbirliği, 304 savaşa tahrik)'),
 ('4','kosul','faaliyeti çerçevesinde işlendiği takdirde','terör suçu sayılır: silah, KASTEN orman yakma, hapisli kaçakçılık','(Değişik: 29/6/2006-5532/3 md.) Aşağıdaki suçlar','terör suçu sayılır:',[],'birçok Ceza Kanunu suçu, 6136 silah, hapisli kaçakçılık, OHAL bölgesi olayları, kültür varlığı da; taksirle orman yakma YOK'),

 # m.7 — örgüt, propaganda, yüz kapatma
 ('7','ceza','terör örgütü kuranlar','yöneten ve üye de Türk Ceza Kanunu 314’e göre','(Değişik: 29/6/2006-5532/6 md.) Cebir ve şiddet','maddesi hükümlerine göre cezalandırılır.',[],'cebir-şiddet ve baskı-tehdit yöntemiyle, m.1 amaçlarına yönelik örgüt'),
 ('7','ceza','örgütün yöneticisi olarak cezalandırılır','örgütün faaliyetini düzenleyenler','Örgütün faaliyetini düzenleyenler','örgütün yöneticisi olarak cezalandırılır.',[],''),
 ('7','ceza','propagandasını yapan kişi','bir-beş yıl hapis','(Değişik ikinci fıkra: 11/4/2013-6459/8 md.) Terör örgütünün;','hapis cezası ile cezalandırılır.',[],'yöntemleri meşru gösteren, öven, teşvik eden'),
 ('7','ceza','basın ve yayın','yarı oranında artar; yayın sorumlusuna bin-beşbin gün adli para','Bu suçun basın ve yayın yolu ile','adli para cezasına hükmolunur.',[],'yayın sorumlusu suça iştirak etmemiş olsa da'),
 ('7','kosul','Haber verme sınırlarını aşmayan','suç oluşturmaz; eleştiri amaçlı da','(Ek cümle:17/10/2019-7188/13 md.) Haber verme','suç oluşturmaz.',[],'düşünce açıklaması'),
 ('7','ceza','üyesi veya destekçisi olduğunu','toplantı dışında da: amblem asma-taşıma/slogan atma/ses cihazıyla yayın/amblemli üniforma','b) Toplantı ve gösteri yürüyüşü sırasında','üniformanın giyilmesi.',[],'üye-destekçi olduğunu belli ederse propaganda cezası; kayıt, bulundurma, derleme DEĞİL'),
 ('7','ceza','yüzünü tamamen veya kısmen','kapatana üç-beş yıl hapis','(Ek fıkra: 27/3/2015-6638/10 md.) Terör örgütünün propagandasına','hapis cezasıyla cezalandırılır.',[],'propagandaya dönüşen toplantıda kimliğini gizlemek için tamamen veya kısmen kapatan'),
 ('7','ceza','molotof ve benzeri patlayıcı','alt sınır dört yıldan az olamaz','Bu suçu işleyenlerin cebir ve şiddete','dört yıldan az olamaz.',[],'yüz kapatan cebir-şiddet kullanır ya da silah, patlayıcı bulundurursa'),
 ('7','ceza','öğrenci yurtlarında','cezanın iki katı','kuruluşlarına veya bunların yan kuruluşlarına','cezanın iki katı hükmolunur.',[],'dernek, vakıf, siyasi parti, işçi-meslek kuruluşu binası, öğretim kurumu da'),
 ('7','kosul','örgütüne üye olmamakla birlikte','propaganda, bildiri yayma, kanunsuz toplantıya katılma: ayrıca üyelik cezası YOK','(Ek fıkra: 11/4/2013-6459/8 md.) Terör örgütüne üye','ayrıca ceza verilmez.',[],'örgüt adına işlese de Ceza Kanunu 314 üçüncü fıkrasından ceza verilmez'),

 # m.8/A-8/B — nitelikli hal, tüzel kişi
 ('8','ceza','kamu görevinin sağladığı nüfuz','yarı oranında artırılır','Nitelikli hal Madde 8/A-','yarı oranında artırılır.',[],'kamu görevinin sağladığı nüfuzu kötüye kullanma'),
 ('8','ceza','tüzel kişi','özgü güvenlik tedbirleri (Türk Ceza Kanunu 60)','Tüzel kişilerin sorumluluğu Madde 8/B-','güvenlik tedbirlerine hükmolunur.',[('20', 'm.20/A: gerçek veya tüzel kişilerin zararının tazmini için şerh')],'tüzel kişinin faaliyeti çerçevesinde işlenirse'),

 # m.15 — avukat ücreti
 ('15','sayi_oran','avukat','ücreti: soruşturmada en fazla üç; mağdur-şikâyetçi-katılan-davalı-davacıya bir (davacıda Bakan onayı)','(Değişik: 29/6/2006-5532/11 md.) Terörle mücadelede','ilgili Bakanın onayına tabidir.',[('20', 'm.20/A: tazminat davası reddinde davacı aleyhine maktu avukatlık ücreti')],'Silahlı Kuvvetler, mülki amir, istihbarat, kolluk, görevlendirilen personel; vatandaşa ve tanığa YOK; tarifesiz'),
 ('15','makam','Avukatların ücretlerinin ödenmesine ilişkin','esas-usul: Milli Savunma ve İçişleri müşterek yönetmeliği','Avukatların ücretlerinin ödenmesine','yönetmelikle düzenlenir.',[],'ödeme kurum bütçesindeki ödenekten'),

 # m.19 — para ödülü
 ('19','kosul','para ödülü','işlenişine iştirak etmemişe verilebilir; İçişleri yönetmeliği','(Değişik:18/10/2018-7148/28 md.) İşlenişine','yönetmelikle belirlenir.',[],'verilebilir = takdiri; miktar ve usul İçişleri Bakanlığı yönetmeliğiyle'),
 ('19','kosul','kimliklerini bildiren','para ödülü verilebilir; usul İçişleri yönetmeliği','(Değişik:18/10/2018-7148/28 md.) İşlenişine','yönetmelikle belirlenir.',[],'suçu ortaya çıkaran, delil ele geçirten, yakalatan da; işlenişe iştirak etmemiş olmalı'),

 # m.20 — koruma tedbirleri
 ('20','makam','koruma tedbirleri','Devlet alır; görevliler, açık hedef olanlar; esas-usul Cumhurbaşkanınca','(Değişik: 29/6/2006-5532/14 md.) Terörle mücadelede görev veren','Cumhurbaşkanınca çıkarılacak bir yönetmelik ile belirlenir.',[('19', 'm.19 metninin sonunda m.20 başlığı “Koruma tedbirleri” yer alır')],'adli, istihbari, idari, askeri görevli, kolluk, görevden ayrılan, açık hedef olan, suçun aydınlatılmasına yardım eden'),
 ('20','makam','ihtiyaç duyulan araç ve gereçler','Adalet ve İçişleri bakanlıklarınca temin edilir','Koruma için ihtiyaç duyulan araç','bakanlıklarınca temin edilir.',[],'ağır ceza hâkimi ve savcının korunma talebi öncelikle ve ivedilikle'),
 ('20','kosul','koruma tedbirleri; talep halinde','düzenleme yapılır: estetik cerrahi/nüfus kaydı/ehliyet/evlenme cüzdanı/diploma/askerlik/mal varlığı/sosyal güvenlik','Bu koruma tedbirleri; talep halinde','hususlarda düzenleme yapılır.',[],'fizyolojik görünüm değişikliği dahil'),
 ('20','makam','emekli personel','meskende korunması zorunluysa Cumhurbaşkanlığınca belirlenen konut','(Değişik: 11/2/2014-6519/57 md.) Korumaya alınmış','konutlardan yararlandırılır.',[],'yönetmelik ise Cumhurbaşkanınca; gizliliğe İçişleri ve kurumlar uyar'),
 ('20','gorev_yetki','görevlerinden ayrılmış olsalar dahi','olsa da kendisi, eş ve çocuklarının canına taarruzda silah kullanabilir','Yukarıda sayılanlardan kamu görevlileri','silah kullanmaya yetkilidirler.',[],'görevden ayrılmış olsa da; terör suçlularının taarruzunu savmak için'),
 ('20','kosul','şerhin konulduğu tarihten itibaren','iki yıl içinde hukuk mahkemesi kararı yoksa kendiliğinden terkin','Kovuşturmaya yer olmadığına dair','şerh kendiliğinden terkin edilir.',[],'zarar tazmini için savcı talebiyle sulh ceza hâkimi ya da mahkeme koyar; kovuşturmaya yer olmadığı kesinleşince de kalkar'),

 # m.21 — terör mağduru kamu görevlisi
 ('21','kosul','engelli hâle gelen','2330 sayılı Nakdi Tazminat Kanunu','kamu görevlilerinden yurtiçinde','Kanun hükümleri uygulanır.',[],'yaralanan, ölen, öldürülen de; sıfatı kalkmış olsa da'),
 ('21','kosul','aylığın toplam tutarı','görevdeki emsalinin aylığından az olamaz; emeklide emekli aylığından','a) (Değişik: 28/2/1995 - 4082/6 md.)','emekli aylığından az olamaz.',[],'malul ve ölenin dul-yetimine bağlanan aylık'),
 ('21','sure','emekli ikramiyesi','30 yıl hizmet yapmış gibi','a) (Değişik: 28/2/1995 - 4082/6 md.)','emekli ikramiyesi ödenir.',[],'ağır malul ve ölenin dul-yetimine en yüksek devlet memuru aylığı üzerinden'),
 ('21','sure','kamu konutlarından yararlanmakta','on yıl kirasız; özel tahsisli hariç','b) (Değişik birinci ve ikinci cümle','yararlanmaya devam edebilirler.',[],'malul ve dul-yetim; konutsuza on yıl kira yardımı; yurtdışı özel tahsisliye bir yıl'),
 ('21','makam','aylık kira yardımının','üst limit: Maliye yönetmeliği (Aile, Milli Savunma, İçişleri görüşüyle)','(Ek cümleler: 4/7/2012-6353/75 md.) Bütün hak sahipleri','Maliye Bakanlığınca çıkarılan yönetmelikle belirlenir.',[],'bugün Hazine ve Maliye Bakanlığı'),
 ('21','kosul','tanıtım kartlarını ibraz','bütün kamu hastanelerinde muayene-tedavi','e) (Ek: 28/2/1995 - 4082/6 md.; Değişik: 29/6/2006-5532/15 md.)','muayene ve tedavi edilirler.',[],'Emekli Sandığının verdiği kart; malul ve dul-yetim'),
 ('21','kosul','gönüllü köy korucularından','malul olursa 2330 sayılı Kanuna göre aylık; erbaş-er de','h) (Değişik: 4/7/2012-6353/75 md.)','düzenlenen haklardan yararlandırılır.',[],'geçici veya gönüllü korucu; terörle mücadele görevinde yaralanıp engelli olursa'),

 # m.22 — terörden zarar gören vatandaş
 ('22','makam','Terör eylemlerinden dolayı yaralananların','Devlet tarafından tedavi','(Değişik: 13/11/1995 - 4131/2 md.) Terör eylemlerinden','Devlet tarafından yapılır.',[],''),
 ('22','makam','kaybına uğrayan vatandaşlara','yardım: Sosyal Yardımlaşma ve Dayanışmayı Teşvik Fonundan','Zarar gören, can ve mal kaybına','öncelikle yardım yapılır.',[('20', 'm.20: savcı ve hâkimin korunma talepleri öncelikle yerine getirilir')],'vatandaşa; kamu görevlisine 2330 Nakdi Tazminat (m.21)'),
 ('22','kosul','Sosyal Yardımlaşma ve Dayanışmayı Teşvik','şehit çocuğu öğrenimi de; emekli ikramiyesi DEĞİL','Zarar gören, can ve mal kaybına','öğrenim masrafları karşılanır.',[],'30 yıl ikramiye ve konut m.21’de, kamu görevlisine'),
 ('22','kosul','ilk ve orta öğrenim çağındaki','şehit çocuklarının masrafı; yükseköğretim değil','Bu fondan ilk ve orta','öğrenim masrafları karşılanır.',[],'ilk ve orta öğrenim çağındakiler'),
 ('22','makam','Yardımın kapsam ve ölçüsü','Fon Kurulu tespit eder','Yardımın kapsam ve ölçüsü','Fon Kurulunca tespit edilir.',[],'Fonun mahalli yetkililerince belirlenen miktarı aşmamak kaydıyla'),
]
yaz(7, '3713 sayılı Terörle Mücadele Kanunu', K)
