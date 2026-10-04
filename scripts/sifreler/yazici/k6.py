# 5326 Kabahatler Kanunu — kelime → cevap (kanıt aralıkları metindeki "..." kısaltmalarına girmeyecek şekilde seçildi)
# KURAL (başkan, 4 Eki 2026): SOL = soru KÖKÜNDE göreceğin ifade, SAĞ = doğru ŞIKTA arayacağın kelime.
# Sorulardan geriye doğru yazıldı (198 cevaplı soru + kitapçık kökleri). Para tutarları metindeki ana tutarlardır
# (her yıl yeniden değerlemeyle artar; "2026 yılı için kaç TL" soruları buradan çözülmez).
import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ortak import yaz
K = [
 # m.1-5 — amaç, tanım, kapsam, kanunilik, zaman
 ('1','tanim','amacı','toplum düzeni, genel ahlak, genel sağlık, çevre, ekonomik düzen','(1) Bu Kanunda; toplum düzenini','korumak amacıyla;',[('32','emre aykırılık: kamu düzeni, genel sağlık amacıyla verilen emir'),('42/A','112’yi meşgul etmek amacıyla arama'),('42a','112’yi meşgul etmek amacıyla arama')],'millî güvenlik sayılmaz'),
 ('2','tanim','Kabahat deyiminden','idarî yaptırım öngörülen haksızlık','(1) Kabahat deyiminden','haksızlık anlaşılır.',[],'suçta yargılama ve ceza'),
 ('3','kosul','kanun yoluna ilişkin hükümler','diğer kanunlarda aksine hüküm yoksa','(1) Bu Kanunun; a)','aksine hüküm bulunmaması halinde,',[],''),
 ('3','kosul','Diğer genel hükümleri','para cezası ya da mülkiyetin kamuya geçirilmesi gerektiren tüm fiiller','b) Diğer genel hükümleri','uygulanır.',[],''),
 ('4','kosul','türü, süresi ve miktarı','ancak kanunla belirlenir','(2) Kabahat karşılığı','ancak kanunla belirlenebilir.',[],'fiilin tanımı düzenleyici işlemle doldurulabilir'),
 ('4','kosul','çerçeve hükmün içeriği','idarenin genel ve düzenleyici işlemleri','(1) Hangi fiillerin','de doldurulabilir.',[],'suçta bu yol kapalı'),
 ('4','kosul','kabahat oluşturduğu','kanunda açıkça ya da çerçeve hüküm + düzenleyici işlem','(1) Hangi fiillerin','de doldurulabilir.',[('24','kovuşturmada fiil kabahat çıkarsa mahkeme karar verir')],''),
 ('5','kosul','zaman bakımından uygulamaya','TCK hükümleri kabahatte de uygulanır','(1) 5237 sayılı','kabahatler bakımından da uygulanır.',[],'yaptırımın yerine getirilmesinde derhal uygulama'),
 ('5','kosul','yerine getirilmesi bakımından','derhal uygulama kuralı','Ancak, kabahatler karşılığında','derhal uygulama kuralı geçerlidir.',[],''),
 ('5','kosul','işlenmiş sayılır','davranış anı; netice zamanı önemsiz','(2) Kabahat, failin','dikkate alınmaz.',[],'icraî ya da ihmali davranışın yapıldığı an'),

 # m.7-9 — davranış, tüzel kişi, kast-taksir
 ('7','kosul','işlenebilir','icraî veya ihmali; hem kasten hem taksirle','(1) Kabahat, icraî','davranışla işlenebilir.',[('9','kanunda açık hüküm yoksa kasten ve taksirle işlenebilir'),('15','kesintisiz fiille işlenebilen kabahat tek sayılır')],''),
 ('7','kosul','İhmali davranışla işlenmiş','icraî davranışta bulunma hukukî yükümlülüğü','İhmali davranışla işlenmiş','yükümlülüğün varlığı gereklidir.',[],''),
 ('8','kosul','temsilcilik görevi yapan','tüzel kişi hakkında da yaptırım','(1) Organ veya temsilcilik','idarî yaptırım uygulanabilir.',[],'tüzel kişinin faaliyeti çerçevesinde görev üstlenen de'),
 ('8','kosul','Temsilci sıfatıyla','temsil edilen gerçek kişiye de yaptırım','(2) Temsilci sıfatıyla','idarî yaptırım uygulanabilir.',[],''),
 ('8','kosul','gerçek kişiye ait','iş sahibi hakkında da yaptırım','Gerçek kişiye ait bir işte','idarî yaptırım uygulanabilir.',[],'çalışanın faaliyeti çerçevesinde'),
 ('8','kosul','Birinci ve ikinci fıkra hükümleri','dayanak işlem hukuken geçersiz olsa da uygulanır','(4) Birinci ve ikinci fıkra','geçerli olmaması halinde de uygulanır.',[],''),
 ('9','kosul','açıkça hüküm bulunmayan','hem kasten hem de taksirle','(1) Kabahatler, kanunda','taksirle işlenebilir.',[],'suçta taksir ancak kanunda yazılıysa'),

 # m.11-15 — sorumluluk, teşebbüs, iştirak, içtima
 ('11','istisna','Fiili işlediği sırada','onbeş yaş altına idarî para cezası uygulanamaz','(1) Fiili işlediği sırada','uygulanamaz.',[],''),
 ('11','istisna','Akıl hastalığı','algılama/yönlendirme yeteneği azalmış; onbeş yaş ayrı fıkra','(2) Akıl hastalığı','uygulanmaz.',[],'idarî para cezası uygulanmaz'),
 ('13','istisna','Kabahate teşebbüs','cezalandırılmaz; kanunda hüküm varsa saklı','(1) Kabahate teşebbüs','haller saklıdır.',[],'o hâlde TCK teşebbüs ve gönüllü vazgeçme hükümleri'),
 ('14','kosul','iştirak','her biri fail olarak idarî para cezası','(1) Kabahatin işlenişine','idarî para cezası verilir.',[],''),
 ('14','kosul','Özel faillik niteliğinin','niteliği taşımayan da fail olarak cezalanır','(2) Özel faillik','idarî para cezası verilir.',[],'TCK’da özgü suçta sıfatsız fail olamaz'),
 ('14','kosul','iştirak için','kasten ve hukuka aykırı fiil yeterli','(3) Kabahate iştirak için','varlığı yeterlidir',[],''),
 ('14','kosul','ortaklaşa işlenmesi','suça iştirak hükümleri','ortaklaşa işlenmesi halinde','hükümler uygulanır.',[],'birine suç, diğerine kabahat olan fiil'),
 ('15','kosul','Bir fiil ile birden fazla','en ağır idarî para cezası; başka yaptırımların her biri','(1) Bir fiil ile birden fazla','uygulanmasına karar verilir.',[],''),
 ('15','kosul','Aynı kabahatin','her biri için ayrı ayrı ceza','(2) Aynı kabahatin','idarî para cezası verilir.',[],'kesintisiz fiil karar verilinceye kadar tek'),
 ('15','kosul','Kesintisiz fiille','karar verilinceye kadar tek fiil','Kesintisiz fiille','fiil tek sayılır.',[],''),
 ('15','kosul','suç olarak tanımlanmış','sadece suçtan yaptırım; olmazsa kabahatten','(3) Bir fiil hem kabahat','yaptırım uygulanır.',[],''),

 # m.16-18 — yaptırım türleri, idarî para cezası, mülkiyetin kamuya geçirilmesi
 ('16','tanim','Kabahatler karşılığında','idarî para cezası ve idarî tedbir; hapis yok','(1) Kabahatler karşılığında','idarî tedbirlerden ibarettir.',[('1','Kanunda yaptırım türleri ve sonuçları düzenlenir'),('5','yaptırım kararlarının yerine getirilmesinde derhal uygulama')],''),
 ('16','tanim','İdarî tedbirler,','mülkiyetin kamuya geçirilmesi ve kanunlardaki diğer tedbirler','(2) İdarî tedbirler','diğer tedbirlerdir.',[],''),
 ('17','sayi_oran','alt ve üst sınırı','haksızlık içeriği, failin kusuru, ekonomik durumu','(2) İdarî para cezası, kanunda alt','birlikte göz önünde bulundurulur.',[],'idarî para cezası maktu ya da nispî'),
 ('17','makam','mahalli idareler','kendi bütçelerine; savcılık-mahkeme cezaları Genel Bütçeye','Cumhuriyet başsavcılıkları ve mahkemeler','kendi bütçelerine gelir kaydedilir.',[],''),
 ('17','sure','müsait olma','ilk taksit peşin, bir yılda dört eşit taksit','Kişinin ekonomik durumunun','kalan kısmının tamamı tahsil edilir.',[],'taksit aksarsa kalanın tamamı'),
 ('17','sure','rıza göstermesi halinde','cezayı veren görevli derhal tahsil eder','(6) Kabahat dolayısıyla','derhal kendisi gerçekleştirir.',[],''),
 ('17','sure','ödeme süresi düzenlenmemiş','tebliğden itibaren bir ay','Kanunlarında ödeme süresi','bir ay içinde ödenir.',[],''),
 ('17','sayi_oran','ödeme süresi içinde','%25 indirim; kanun yolu hakkı saklı','İdari para cezasının ödeme süresi','başvurma hakkını etkilemez.',[],'peşin ödeyen dörtte üçünü öder'),
 ('17','sayi_oran','yeniden değerleme','her yıl artırılarak uygulanır; nispîye uygulanmaz','yeniden değerleme oranında','artırılarak uygulanır.',[],''),
 ('18','kosul','konusunu oluşturan','ancak kanunda açık hüküm varsa; kaim değer de','(1) Kabahatin konusunu','karar verilebilir.',[],'kaim değer: m.18/6'),
 ('18','kosul','geçirilen eşya','açık hüküm yoksa Devlete; değerlendirilemezse imha','(4) Eşyanın mülkiyeti','imha edilir.',[],''),
 ('18','kosul','aksi takdirde','Devlete geçer; kanunda yazılıysa ilgili kuruma','(4) Eşyanın mülkiyeti','Devlete geçer.',[],''),
 ('18','kosul','şart değil','fail hakkında para cezası verilmiş olması','(5) Eşyanın mülkiyetinin','şart değildir.',[],''),
 ('18','kosul','geciktirilebilir','kullanılmaz hale getirme, nitelik değiştirme, belli surette kullanma','(2) Mülkiyetin kamuya geçirilmesine ilişkin karar','belli bir süre geciktirilebilir',[],'mülkiyet kararı belli süre ertelenebilir'),

 # m.20-21 — zamanaşımı
 ('20','sure','Soruşturma zamanaşımı','yüzbin+ beş, ellibin+ dört, az üç; nispî sekiz yıl','(2) Soruşturma zamanaşımı süresi','sekiz yıldır.',[],'SORUŞTURMA 5-4-3 (nispî 8) · YERİNE GETİRME 7-5-4-3 (mülkiyet 10)'),
 ('20','sure','Karayolları Trafik','fiili izleyen takvim yılı sonuna kadar tebliğ; yoksa düşer','Ancak, 1111 Askerlik','verilmiş olanlar düşer.',[],'1111, 2839, 2918 ve sayılan kanunlar'),
 ('20','kosul','aynı zamanda suç oluşturması','suçun dava zamanaşımı uygulanır','(5) Kabahati oluşturan fiilin','zamanaşımı hükümleri uygulanır.',[],''),
 ('21','sure','Yerine getirme zamanaşımı','ellibin+ yedi, yirmibin+ beş, onbin+ dört, az üç yıl','(2) Yerine getirme zamanaşımı süresi','üç yıldır.',[],''),
 ('21','sure','Mülkiyetin kamuya geçirilmesine ilişkin','zamanaşımı on yıl','(3) Mülkiyetin kamuya geçirilmesine','on yıldır.',[('18','mülkiyetin kamuya geçirilmesi kararı: kanunda açık hüküm şart'),('27','idarî yaptırım kararına karşı başvuru yolu düzenlenir')],''),
 ('21','sure','işlemeye başlar','soruşturmada fiil/netice; yerine getirmede kesinleşmeyi izleyen takvim yılı','(4) Zamanaşımı süresi, kararın','işlemeye başlar.',[('20','soruşturma zamanaşımı fiilin işlenmesi ya da neticeyle başlar')],''),
 ('21','sure','başlanamaması','zamanaşımı işlemez (durur)','(5) Kanun hükmü gereği','işlemez (durur).',[],''),

 # m.22-26 — karar yetkisi, tutanak, tebliğ
 ('22','makam','idarî yaptırım kararı vermeye','gösterilen idarî kurul, makam, görevli','(1) Kabahat dolayısıyla idarî yaptırım','kamu görevlileri yetkilidir.',[('23','Cumhuriyet savcısı: kanunda açık hüküm varsa')],''),
 ('22','makam','açık hüküm bulunmayan hallerde','kurumun en üst amiri','(2) Kanunda açık hüküm','bu konuda yetkilidir.',[],''),
 ('23','makam','Cumhuriyet savcısı,','kanunda açık hüküm varsa; soruşturmada kendisi de verebilir','(1) Cumhuriyet savcısı','idarî yaptırım kararı verebilir.',[],'kuruma bildirebilir de'),
 ('24','makam','Kovuşturma konusu','mahkeme karar verir','(1) Kovuşturma konusu','idarî yaptırım kararı verilir.',[],''),
 ('25','sira_usul','tutanakta','kimlik-adres, fiil, deliller, karar tarihi, görevli, yer-zaman','(1) İdarî yaptırım kararına ilişkin tutanakta','gösterilerek açıklanır.',[],'listede olmayan şık cevaptır'),
 ('26','sira_usul','ilgili kişiye tebliğ','7201 sayılı Tebligat Kanunu','(1) İdarî yaptırım kararı, 7201','ilgili kişiye tebliğ edilir',[],''),
 ('26','sure','elektronik adresine ulaştığı','izleyen beşinci günün sonunda','Elektronik ortamda yapılan tebligat','yapılmış sayılır.',[],''),

 # m.27-30 — başvuru, ön inceleme, itiraz, vazgeçme
 ('27','sure','sulh ceza mahkemesine','tebliğden itibaren onbeş gün; yoksa kesinleşir','(1) İdarî para cezası ve mülkiyetin','idarî yaptırım kararı kesinleşir.',[],'BAŞVURU 15 GÜN sulh ceza · İTİRAZ 2 HAFTA'),
 ('27','sure','ortadan kalktığı tarihten','en geç yedi gün','(2) Mücbir sebebin','başvuruda bulunulabilir',[],'mücbir sebep'),
 ('27','sira_usul','Başvuru dilekçesi','iki nüsha; bizzat, kanunî temsilci ya da avukat','(3) Başvuru, bizzat','iki nüsha olarak verilir.',[('28','kurum, dilekçenin tebliğinden onbeş gün içinde cevap verir')],'noter onayı aranmaz'),
 ('28','sira_usul','ön inceleme','yetkisizlikte gönderme; süre/karar/hak yoksa ret; aksi usulden kabul','(1) Başvuru üzerine','usulden kabulüne karar verilir.',[],''),
 ('28','sira_usul','reddine','süre geçmiş, karar incelenemez, hak yok; yetkisizlik ret DEĞİL','(1) Başvuru üzerine','usulden kabulüne karar verilir.',[],'yetkisizlikte dosya yetkili mahkemeye'),
 ('28','sure','mahkemeye cevap verir','kurum, dilekçenin tebliğinden onbeş gün','(3) İlgili kamu kurum','mahkemeye cevap verir',[],''),
 ('28','kosul','dahil idarî para cezalarına','on beş bin TL’ye kadar kararlar kesin','(10) Onbeşbin','kararlar kesindir.',[],''),
 ('29','sure','itiraz','Ceza Muhakemesi Kanununa göre iki hafta; dosya üzerinden','(1) Mahkemenin verdiği','dosya üzerinden inceleme yapılarak verilir.',[],''),
 ('30','kosul','Kanun yoluna başvuran','karar verilinceye kadar vazgeçebilir; bir daha başvuramaz','(1) Kanun yoluna başvuran','başvuruda bulunulamaz.',[],''),
 ('30','kosul','geri alabilir','başvuruyu kabul ederek (karar verilinceye kadar)','(2) İlgili kamu kurum','kararını geri alabilir.',[],'ilgili kurum'),

 # m.32-43/B — kabahat türleri (tutar · kim karar verir)
 ('32','ceza','emre aykırı','yüz TL; emri veren makam karar verir','(1) Yetkili makamlar tarafından','emri veren makam tarafından karar verilir.',[],'adlî işlem, kamu güvenliği/düzeni, genel sağlık için hukuka uygun emir'),
 ('33','ceza','Dilencilik','ceza ve el koyma: kolluk/zabıta; mülkiyet: mülkî amir/encümen','(1) Dilencilik yapan','belediye encümeni karar verir.',[('34','kumarda mülkiyete yalnız mülkî amir karar verir')],'elli TL; gelire el konur'),
 ('34','ceza','kumar','bin Türk Lirası; mülkiyete yalnız mülkî amir','(1) Kumar oynayan','mülkî amir karar verir.',[('33','dilencilikte belediye encümeni de karar verebilir')],'ceza ve el koyma: kolluk'),
 ('35','ceza','Sarhoş','elli TL, kolluk; etkisi geçinceye kadar kontrol altında','(1) Sarhoş olarak','kontrol altında tutulur.',[],'huzur ve sükûnu bozacak şekilde'),
 ('36','ceza','gürültü','elli TL; işletmede bin–beşbin; kolluk ya da zabıta','(1) Başkalarının huzur','zabıta görevlileri karar verir.',[],''),
 ('36','ceza','ticarî işletmenin','işletme sahibine bin–beşbin TL','(2) Bu fiilin bir ticarî','idarî para cezası verilir.',[],''),
 ('37','ceza','rahatsız','mal-hizmet satmak için; elli TL, kolluk ya da zabıta','(1) Mal veya hizmet satmak','zabıta görevlileri yetkilidir.',[],''),
 ('38','ceza','işgal','elli TL; yalnız belediye zabıtası verir','(1) Yetkili makamların açık','idarî para cezası verilir.',[],'açık ve yazılı izin yoksa'),
 ('38','ceza','inşaat malzemesi','yığan: yüz–beşyüz TL','meydan, cadde, sokak veya kaldırımlar üzerine','inşaat malzemesi yığan kişiye',[],''),
 ('39','ceza','tütün mamulü','birim amirinin yetkili kıldığı görevli; elli TL','(1) Kamu hizmet binalarının','idarî para cezası verilir',[],'toplu taşımada da elli TL'),
 ('40','ceza','bilgi vermekten kaçınan','elli Türk Lirası; soran görevli verir','(1) Görevle bağlantılı','idarî para cezası verilir.',[],'kimlik ya da adres bilgisi'),
 ('40','ceza','gerçeğe aykırı beyan','elli TL; soran görevli verir; kimlik belirsizse savcıya haber','(1) Görevle bağlantılı','idarî para cezası verilir.',[],'kimlik ya da adres bilgisi vermekten kaçınma da'),
 ('40','sira_usul','kimliği belirlenemeyen','tutulur, savcıya haber; gözaltı, gerekirse tutuklama','kimliği belirlenemeyen kişi tutularak','gerekirse tutuklanır.',[],''),
 ('41','ceza','Evsel atık','yirmi TL idarî para cezası','(1) Evsel atık','idarî para cezası verilir',[],'özgü yerler dışına atan'),
 ('41','makam','belediye sınırları dışında','kolluk; içinde belediye zabıtası','(7) Bu kabahatler dolayısıyla idarî para cezasına belediye','kolluk görevlileri karar verir.',[],''),
 ('41','istisna','kirliliğin','derhal giderirse ceza verilmeyebilir','(8) Bu kabahatler','karar verilmeyebilir.',[],''),
 ('42','ceza','afiş ve ilân','yüz–üçbin TL (alt-üst sınır); aynı içerik tek fiil','(1) Meydanlara/parklara','tek fiil sayılır.',[],'kolluk ya da belediye zabıtası'),
 ('42/A','ceza','meşgul etmek','binbeşyüz TL; il valileri','(1) 112 Acil','idari para cezası verilir.',[('42a','metinde aynı maddenin ikinci kaydı')],''),
 ('42/A','ceza','asılsız','tutanakla tespit; onbeşbin TL; il valileri','(2) 112 Acil','idari para cezası verilir.',[('42a','metinde aynı maddenin ikinci kaydı')],''),
 ('42/A','ceza','bir yıl içinde','iki katı; il valileri','(3) Bu maddede yazılı','iki katı olarak uygulanır.',[('42a','metinde aynı maddenin ikinci kaydı'),('17','taksit: bir yıl içinde dört eşit taksit')],''),
 ('43','ceza','silah','ruhsatsız, görünür taşıma; elli TL, kolluk','(1) Yetkili makamlardan ruhsat','idarî para cezası verilir.',[],'park, meydan, cadde, sokak'),
 ('43/A','ceza','yararına','organ/temsilci, rüşvet-zimmet gibi suç; yargılayan mahkeme','tarafından dolandırıcılık','iki katından az olamaz.',[],'dolandırıcılık, uyuşturucu, ihaleye/edime fesat, rüşvet, aklama, zimmet, kaçakçılık, petrol, terör finansmanı'),
 ('43/A','ceza','tüzel kişiye','organ-temsilci yararına işlerse; menfaatin iki katından az değil; mahkeme','tarafından dolandırıcılık','iki katından az olamaz.',[('36','gürültüde işletme sahibi gerçek ya da tüzel kişiye bin–beşbin')],'onbin TL–elli milyon TL'),
 ('43/B','ceza','sahte','bankaya ibraz edilirse bildirim; yoksa savcı bin–beşbin TL','ibraz edilen paranın sahte','anlaşılması halinde,',[('43b','metinde aynı maddenin ikinci kaydı')],'bankalar ve finansal kuruluşlar'),
]
yaz(6, '5326 sayılı Kabahatler Kanunu', K)
