# 6136 Ateşli Silahlar ve Bıçaklar ile Diğer Aletler Hakkında Kanun — kelime → cevap
# KURAL (başkan, 4 Eki 2026): SOL = soru KÖKÜNDE göreceğin ifade, SAĞ = doğru ŞIKTA arayacağın kelime.
# Sorulardan geriye doğru yazıldı (108 cevaplı soru + kitapçık kökleri). Yönetmelik (91/1779) soruları bu
# kanunun metninde olmadığı için yazılmadı; Ek-1 metnindeki "(...)" kısaltmalarına girmeyecek kanıt seçildi.
# Ceza ailesi: SİLAH sokma-yapma-satma 5-12 · birlikte 8-15 · ruhsatsız alma-taşıma 2-4 · evde tek silah 1-3 ·
#              BIÇAK sokma-yapma 2-5 · bıçak satma-taşıma 6 ay-1 yıl · sırf saldırı amacıyla taşıma 3 aya kadar.
import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ortak import yaz
K = [
 # m.1-5 — kapsam, yurda sokma, yapım yasağı
 ('1','tanim','balistik önemi haiz','namlu/sürgü/gövde/çerçeve/silindir/mekanizma başı/çıkarıcı/tırnak/ateşleme iğnesi; dürbün YOK','Madde 1 – (Değişik: 12/6/1979 - 2249/2 md.) Ateşli','bu kanun hükümlerine tabidir.',[('12', 'bu parçaları sokmak, yapmak, satmak: beş-oniki yıl'), ('13', 'bu parçaları ruhsatsız alma-taşıma: iki-dört yıl'), ('2', 'm.2 metnindeki değişiklik notunda geçer')],''),
 ('2','yasak','ülkeye sokulması yasaktır','silah, mermi, salt saldırı aleti; kurum alımları saklı','Milli Savunma Bakanlığı, Jandarma Genel Komutanlığı, Emniyet','ülkeye sokulması yasaktır.',[],'MSB, JGK, EGM, MİT alımları ve 6551 saklı'),
 ('2','istisna','diplomatik ayrıcalık','tek silah ve mermisi; karşılıklılık şartı','A) Tek bir silaha ve bu silahın mermilerine','(Karşılıklı olmak koşuluyla)',[],'akredite diplomatlar'),
 ('2','istisna','armağan edilen','resmî görevde armağan; belgeli, vergisiz','B) Resmi görevle yurt dışına','resmi ödenmeksizin)',[('6','armağan silah belgelerinde süre kaydı aranmaz')],'devlet/hükümet başkanı, genelkurmay başkanı, kuvvet komutanı armağanı'),
 ('2','istisna','tek bir silaha mahsus','elçi, konsolos, daimi subay, güvenlik memuru','C) Memuriyetleri devamınca','yurda sokulmasına izin verilir.',[],'dış temsilciliklerimizde'),
 ('2','istisna','kıta ile gönderilen','kimlik kartındaki silaha izin aranmaz','Yurt dışına kıta ile','izin şartı aranmaz.',[],'subay ve astsubay'),
 ('3','kosul','mermilerinin yapılması','3763, 5591 (MKE) ve 6551 sayılı kanunlar','Madde 3 – (Değişik: 12/6/1979 - 2249/4 md.) Memleket içinde','Kanunların hükümlerine tabidir.',[],''),
 ('4','yasak','yapımı yasak','kama/hançer/saldırma/şişli baston/sustalı/pala/kılıç/kasatura/süngü/oluklu bıçak/topuz/kamçı/boğma teli/muşta; mutfak bıçağı-yivsiz tüfek YOK','Ülke içinde kama','yapımı yasaktır.',[('5', 'yasak bıçağın satışı, taşınması, bulundurulması da yasak')],'yivsiz tüfek ve meslek aletleri tabi değil (ayrı satır)'),
 ('4','yasak','muşta','yapımı yasak salt saldırı-savunma aleti; meslek bıçağı tabi değil','Ülke içinde kama','yapımı yasaktır.',[],'kasap bıçağı gibi meslek aleti izinle yapılır'),
 ('4','istisna','tabi değil','spor ateşsizi, yivsiz tüfek; ev, tıp, sanayi, tarım, meslek aletleri','Yalnız sporda kullanılan','tabi değildir.',[],''),
 ('4','istisna','yivsiz tüfek','Kanuna tabi değil; yivli olan ruhsata tabi','Yalnız sporda kullanılan','tabi değildir.',[('Ek 1','turist avcı yivsiz tüfeğini gümrüğe beyanla getirir'),('2','m.2 metnindeki değişiklik notunda geçer')],''),
 ('4','makam','sanat veya mesleğin icrası','İçişleri yönetmeliğiyle yapım izni','Bunlardan bir sanat veya mesleğin','kurallara göre izin verilir.',[('5','izinli meslek bıçakları satış-taşıma yasağının dışında')],''),
 ('4','kosul','ateşli yivli','avda-sporda bile m.7 ruhsatına tabi','Avda veya sporda kullanılan her nevi','ruhsata tabidir.',[],''),
 ('5','yasak','satınalınması, taşınması','ve bulundurulması yasak; meslek bıçağı hariç','Yurda sokulması ve yapımı yasaklanan','bu yasağın dışındadırlar.',[('1','Kanunun kapsamı: sokma, yapma, satma, taşıma, bulundurma')],'yapım yasağı m.4’te'),
 ('5','yasak','bulundurulması yasa','meslek izni olmayan herkese; izinli bıçak hariç','Yurda sokulması ve yapımı yasaklanan','bu yasağın dışındadırlar.',[],''),

 # m.6 — ruhsat süreleri
 ('6','sure','taşıma ve bulundurma ruhsatları','yenileme harcıyla beş yıl geçerli','Bu Kanun kapsamına giren silahlar için verilen','beş yıl için geçerlidir.',[('Geçici','korucu ruhsatlarının usulü yönetmelikle belirlenir')],''),
 ('6','sure','veriliş sebe','altı ay içinde bildirir; yenilemeyenin ruhsatı iptal','Ruhsatların veriliş sebeplerinin','ruhsatları iptal edilir.',[],'süresi dolup altı ayda yenilemeyen de iptal'),
 ('6','makam','tekrar ruhsat','üçbin TL idari para cezası; mülki amir verir','Ancak, gerekli şartları haiz olan kişilere','mülki amir yetkilidir.',[],''),
 ('6','istisna','süre kaydı aranmaz','Cumhurbaşkanı, bakan, milletvekili, komutan, Jandarma Genel Komutanı, gazi, şehit yakını','Ancak, Cumhurbaşkanı, Başbakan','süre kaydı aranmaz.',[],'emekli astsubay listede yok'),
 ('6','kosul','mermiler için','ayrıca ruhsat aranmaz; ruhsat mermiyi de kapsar','Ruhsata bağlanmış silahlara ait','mermiler için de geçerlidir.',[],'yerli ve yabancı menşeli'),
 ('6','istisna','Silah taşıma ruhsatları','nereden verilmiş olursa olsun; Ek-1 yerleri dışında geçerli','Silah taşıma ruhsatları nereden','yerler dışında geçerlidir.',[],''),
 ('6','kosul','Birden fazla silaha','isteğiyle her biri için ayrı taşıma ruhsatı','Birden fazla silaha sahip','ayrı ayrı taşıma ruhsatı verilir.',[],''),

 # m.7-10 — kimler taşır, toplu arama, devir yasağı, zoralım
 ('7','kosul','uzman erbaş','en az on yıl görev; emniyetten ayrılan da on yıl','emekli subay, astsubay, uzman jandarma ve uzman erbaşlar','emniyet hizmetleri sınıfı personeli,',[],'sözleşmesi uzatılmayan ya da kendi isteğiyle ayrılan'),
 ('7','kosul','mecburi hizmetini tamamlayarak','istifa eden subay, astsubay, uzman jandarma taşıyabilir','emekli subay, astsubay, uzman jandarma ve uzman erbaşlar','emniyet hizmetleri sınıfı personeli,',[],''),
 ('7','istisna','Devlet memurluğundan çıkarılanlar','hariç: tart, ihraç, ayırma, 7068 ile çıkarılan','7068 sayılı Genel Kolluk','çıkarılanlar hariç olmak üzere;',[],''),
 ('7','kosul','muhtarlığı','en az bir dönem muhtar ya da belediye başkanı taşıyabilir','7. Yapılan soruşturma sonucu','bulundurabilirler.',[],'terör irtibatı olan hariç'),
 ('7','makam','valiler tarafından verilecek','Cumhurbaşkanı yönetmeliğine göre vali izin vesikası','5. Cumhurbaşkanınca çıkarılan yönetmelikte','izin vesikasını alanlar,',[],''),
 ('7','sayi_oran','en fazla bir adet','korucu ve muhtar en çok bir silah edinir','Birinci fıkranın (1), (2), (3) ve (4)','en fazla bir adet silahın,',[],''),
 ('7','kosul','belgelere işlenmek','emekli kaydı taşıma-bulundurma izin belgesi yerine geçer','Birinci fıkranın (4) numaralı bendinin (A)','izin belgesi yerine geçer.',[],'kuvvet, EGM, SGK, JGK kaydı'),
 ('8','makam','Lüzum görülen','Cumhurbaşkanı kararıyla valiler; toplu silah araması da','Madde 8 – Lüzum görülen','yapılabilir.',[],''),
 ('9','yasak','başkasına','ruhsatsıza satamaz; geçici de olsa veremez','Madde 9 – Ateşli silah taşımak','başkalarına veremezler.',[],''),
 ('9','kosul','intihar','silahla suç ya da ihmal: vesika geri, bir daha verilmez','Silah bulundurma ve taşıma ruhsatını haiz olan kimsenin','izni verilmez.',[],''),
 ('9','kosul','İkinci kez','yeni müracaatta tek silah izni','İkinci kez silahı çalınan','izni verilebilir.',[],'İKİNCİ KAYIP TEK SİLAH · ÜÇÜNCÜ KAYIP BEŞ YIL'),
 ('9','sure','üçüncü kez','beş yıl izin yok; sonra tek silah','Üçüncü kez silahı çalınan','izni verilebilir.',[],'vesika geri alınır'),
 ('10','makam','zoralımına','tutanakla Millî Savunma Bakanlığına','Mahkemelerce zoralımına','Milli Savunma Bakanlığı emrine verilir.',[],'öncelik MSB, JGK, EGM, MİT, Gümrük Muhafaza'),
 ('10','sayi_oran','polisler','zati tabancayı yarı bedelle, bir adet, öncelikli','Emniyet Genel Müdürlüğünce zati silah','öncelik hakkına sahiptirler.',[],''),

 # m.11 — hatıra ve antika
 ('11','kosul','antika','izin zorunlu; sahibine bırakma-nakil, üstte taşıma yok; vesikayla satış serbest','Hatıra teşkil eden veya antika','satışı serbesttir.',[],''),
 ('11','tanim','antika silah','eskiden kalma, değerli, az rastlanan, artık imal edilmeyen','Antika silah deyimi','ifade eder.',[],'hediye olması hatıra silah ölçütü'),
 ('11','tanim','hatıra silah','yabancı devlet/hükümet, Devlet Başkanı, Başbakan, Genelkurmay hediyesi; belgeli; İstiklal Savaşı','Bu Kanunun uygulanmasında hatıra silah deyimi','Ateşli veya ateşsiz silah ve bıçakları ifade eder.',[],'vali hediyesi yok'),
 ('11','istisna','kılıç, meç','görev nedeniyle verilen; izin belgesi aranmaz','Ancak, görevleri nedeniyle Devletçe','izin belgesi aranmaz.',[],''),

 # m.12 — silah kaçakçılığı ve yapımı
 ('12','ceza','ülkeye sok','silahta beş-oniki yıl hapis; beşyüz-beşbin gün adlî para','Her kim bu Kanunun kapsamına giren ateşli','adlî para cezasıyla cezalandırılır.',[('2','ülkeye sokma yasağı ve istisnaları'),('14','bıçak sokma: iki-beş yıl')],'yapmak, taşımak, satmak da'),
 ('12','ceza','oniki yıla','sokar, yapar, taşır, satar, bu amaçla bulundurur; satın alma değil','Her kim bu Kanunun kapsamına giren ateşli','adlî para cezasıyla cezalandırılır.',[],'ruhsatsız satın alma m.13’te'),
 ('12','ceza','bu amaçla','satmak için bulundurursa da aynı ceza','satar veya satmaya aracılık ederse veya bu amaçla','adlî para cezasıyla cezalandırılır.',[('11','görev için bu amaçla temin edilen kılıç-meç')],'miras yoluyla devralma yok'),
 ('12','ceza','birlikte işle','iki+ kişi: silahta sekiz-onbeş yıl, bin-onbin gün; tek kişi beş-oniki','Birinci fıkrada yazılı suçları üçüncü fıkradaki hal dışında','adlî para cezasına hükmolunur.',[('14', 'bıçakta iki kişi birlikte: ceza bir kat artar'), ('11', 'antika silah izin vesikasıyla birlikte satılır')],''),
 ('12','ceza','beşyüz günden','beşbin güne kadar (hapis beş-oniki)','beş yıldan oniki yıla kadar hapis','adlî para cezasıyla cezalandırılır.',[('13','vahim ruhsatsız silahta da beşyüz-beşbin gün')],''),
 ('12','ceza','örgütün faaliyeti','cezalar bir kat artırılır','Birinci fıkradaki fiillerin, suç işlemek','bir kat artırılır.',[],''),
 ('12','ceza','susturuculu','tüfek, tam otomatik, dürbünlü, hedef noktalayıcı: yarı oranında artar','Ateşli silahın tüfek veya seri','yarı oranında artırılarak hükmolunur.',[],'dürbünsüz tabanca nitelikli değil'),
 ('12','ceza','miktar bakımından vahim','yarı oranında artar; nitelikli silah vahimse bir kat','miktar bakımından vahim olması halinde yukarıdaki','bir kat artırılarak hükmolunur.',[('14','bıçakta miktar vahimse yarı oranında artar')],''),
 ('12','ceza','Kurusıkı','dönüştürme üretim sayılır; vahim değilse üçte birden yarıya indirim','Kurusıkı tabir edilen','yarısına kadar indirilir.',[],''),

 # m.13 — ruhsatsız silah
 ('13','ceza','satın alan','ruhsatsız silah: iki-dört yıl hapis; yüz-beşyüz gün','Bu Kanun hükümlerine aykırı olarak ateşli silahları','adlî para cezasına hükmolunur.',[('15','yasak bıçak satın alan: altı ay-bir yıl')],'taşıyan, bulunduran da'),
 ('13','ceza','mutat','tek silah + mutat mermi evde: bir-üç yıl hapis','Bu Kanunun 12 nci maddesinin dördüncü fıkrasında sayılanlar dışındaki','adlî para cezasıdır.',[],'yasak bıçak bulundurma altı ay-bir yıl'),
 ('13','ceza','takdir edilmemesi','pek az mermi: altı aya kadar hapis','takdir edilmemesi durumunda','adlî para cezasıdır.',[],'en hafif hapis hâli'),
 ('13','ceza','Nakil izin belgesi','onbin-yirmibeşbin TL idari para; mülki idare amiri','Nakil izin belgesi almaksızın','idari para cezasına hükmolunur.',[],''),
 ('13','ceza','ruhsat yenileme işlemlerinde','yükümlülüğe aykırılık: onbin-yirmibeşbin TL idari para','Bu madde kapsamındaki bulundurma ve taşıma fiilinin','idari para cezasına hükmolunur.',[],'vefat, sağlık, devir sebepli ruhsatlandırma'),
 ('13','makam','idari para ceza','mülki idare amiri verir (onbin-yirmibeşbin TL)','Bu madde hükümlerine göre idari para cezası vermeye','mülki idare amiri yetkilidir.',[('6','ruhsat yenilemeyene üçbin TL; mülki amir')],''),

 # m.14-16 — bıçak suçları
 ('14','ceza','4 üncü maddede yazılı','bıçağı sokma/yapma/taşıma: iki-beş yıl hapis; ikiyüz gün+','Her kim, bu Kanun hükümlerine aykırı olarak 4 üncü','adlî para cezası ile cezalandırılır.',[('15', 'bıçak satma, alma, taşıma, bulundurma: altı ay-bir yıl')],''),
 ('14','ceza','azlığı','ceza yarısına kadar indirilir','Suç konusu bıçak ve aletlerin niteliği','yarısına kadar indirilir.',[],''),
 ('14','ceza','teşekkül','beş-on yıl hapis; bin-onbin gün','Birinci fıkradaki eylemleri işlemek amacı ile teşekkül','adlî para cezasına hükmolunur.',[],''),
 ('15','ceza','satanlar, satmaya aracılık','yasak bıçak: altı ay-bir yıl; yirmibeş gün+','Bu Kanun hükümlerine aykırı olarak 4 üncü maddede yazılı olan bıçak veya diğer aletleri veya benzerlerini satanlar','adlî para cezasına hükmolunur.',[],'satın alma, taşıma, bulundurma da'),
 ('15','ceza','sayı veya nitelik','vahimse bıçakta yarıdan bir katına; silahta beş-sekiz yıl','Bu madde kapsamına giren bıçak veya diğer aletlerin veya benzerlerinin sayı','yarıdan bir katına kadar artırılır.',[('13','ruhsatsız silah vahimse beş-sekiz yıl')],''),
 ('15','ceza','günden az ol','bıçak satış-taşıma yirmibeş; bıçak sokma ikiyüz; yasak yer elli','Bu Kanun hükümlerine aykırı olarak 4 üncü maddede yazılı olan bıçak veya diğer aletleri veya benzerlerini satanlar','adlî para cezasına hükmolunur.',[('14','bıçak sokmada ikiyüz günden az olmamak'),('Ek 1','yasak yere silahla girene elli günden az olmamak')],''),
 ('15','ceza','sırf saldırıda','üç aya kadar hapis ya da adlî para','Bu Kanunun 4 üncü maddesinin üçüncü fıkrasında','cezalandırılır.',[],'yivsiz tüfek, meslek bıçağı bile'),
 ('17','sure','meridir','15 Ağustos 1953’ten itibaren yürürlükte','Madde 17 – Bu Kanun','itibaren meridir.',[],'meri = yürürlükte'),
 ('18','makam','Vekilleri Heyeti','yürütür; İcra Vekilleri Heyeti = Bakanlar Kurulu','Madde 18 – Bu Kanunu','İcra Vekilleri Heyeti yürütür.',[],''),
 ('16','istisna','Kaçakçılığın Men','1918 sayılı Kanun bu suçlarda uygulanmaz','Bu Kanunun kapsamına giren suçlarda','hükümleri uygulanmaz.',[],''),

 # Ek-1 — silah taşınamayacak yerler, yabancıların silahı
 ('Ek 1','yasak','taşınama','mahkeme, cezaevi, okul-yurt, miting, sendika, stadyum, grev, Meclis; ibadethane yok','grev ve lokavt yapılmakta olan','Ateşli silahlar taşınamaz.',[],'psikiyatri, parti toplantısı, dernek de'),
 ('Ek 1','ceza','ilgili kanunlarda','yasak yerde aykırı taşımada cezalar iki katı','taşıyan veya bulunduranlar hakkında ilgili kanunlarda','cezaların iki katı hükmolunur.',[],''),
 ('Ek 1','istisna','jandarma personeli','o yerin güvenliğiyle görevli polis-jandarma taşıyabilir; 7/1-4 bentler de','(A) ve (B) bentlerinde sayılan yerlerde 7 nci','silahlarını taşıyabilirler.',[],'Mecliste yalnız görevli polis, jandarma, Muhafız Taburu'),
 ('Ek 1','ceza','daha ağır cezayı gerektiren','elli gün+ adlî para; ruhsat bulundurmaya çevrilir','(A), (B) ve (C) bentlerinde sayılan yerlere silahla giren','silah ruhsatları bulundurmaya çevrilir.',[],'yasak yere silahla girene'),
 ('Ek 1','ceza','silahla giren','elli gün+ adlî para; ruhsat bulundurmaya; beş yıl taşıma yok','(A), (B) ve (C) bentlerinde sayılan yerlere silahla giren','silah ruhsatları bulundurmaya çevrilir.',[],'beş yıl kuralı aynı fıkranın sonunda'),
 ('Ek 1','sure','yıllık süre geç','beş yıl taşıma ruhsatı verilmez','beş yıllık süre geçmediği takdirde','taşıma ruhsatı verilmez.',[],''),
 ('Ek 1','kosul','turist olarak avcılık','gümrüğe beyan + giriş kapısı emniyetinden izin; geçici','Kara Avcılığı Kanunu esaslarına göre','geçici olarak yurda sokabilirler.',[],'atıcılık yarışmasına gelen yabancı da'),
 ('Ek 1','kosul','bilimsel araştırmalar','Emniyet Genel Müdürlüğü izni + gümrük beyanı','Antlaşmalarla yurdumuza görevli olarak gelen','şartıyla yurda sokabilirler.',[],'antlaşmayla görevli gelen yabancı da'),
 ('Ek 1','kosul','geçici olarak yurda sok','turist avcı, atıcılık yarışmacısı, antlaşmalı görevli, bilimsel araştırmacı; ticari YOK','Kara Avcılığı Kanunu esaslarına göre','geçici olarak yurda sokabilirler.',[],''),
 ('Ek 1','kosul','pasaportuna','taşıma izin vesikası yerine geçer','yurda sokulmasına izin verilen silah, silah aksamı','taşıma izin vesikası yerine geçer.',[],''),
 ('Ek 1','kosul','sarfedilmeyen','ülke terk edilirken yurt dışına çıkarılır','sarfedilmeyen mermilerin ülkemiz','yurt dışına çıkarılması zorunludur.',[],''),
 ('Ek','kosul','teslim ettikleri takdirde','üç ay içinde teslim: takibat yok','İzin vesikaları bu suretle iptal edilenler','takibat yapılmaz.',[('Geçici','korucular 90 gün içinde teslim ederse takibat yok')],'silahlar MSB emrine'),
 ('Geçici','sure','gönüllü korucu','90 gün içinde teslim; takibat yok; valiler harçsız ruhsat','442 sayılı Köy Kanununun 74 üncü maddesine göre, mülki amirlerce','ruhsatı düzenlenebilir.',[],'devir, hibe, satış yasak'),
]
yaz(25, '6136 sayılı Ateşli Silahlar ve Bıçaklar ile Diğer Aletler Hakkında Kanun', K)
