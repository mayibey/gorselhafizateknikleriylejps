# 5442 İl İdaresi Kanunu — kelime → cevap
# KURAL (başkan, 4 Eki 2026): SOL = soru KÖKÜNDE göreceğin ifade, SAĞ = doğru ŞIKTA arayacağın kelime.
# Sorulardan geriye doğru yazıldı (147 cevaplı soru + kitapçık kökleri). Sınav kapsamı 13 madde (Ek-1);
# m.66 (toplumsal olay cezası), Ek-1 (hava meydanı) ve m.11'in metinde kesilen son kısmı (TSK görevlendirme) yazılmadı.
import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ortak import yaz
K = [
 # m.1-2 — bölünüş, kuruluş ve değişiklik yetkileri
 ('1','tanim','Türkiye','illere, iller ilçelere, ilçeler bucaklara bölünür; coğrafya, ekonomi, kamu hizmeti','(Değişik: 12/5/1964-469/1 md.) Türkiye','bucaklara bölünmüştür.',[],'merkezi idare kuruluşu bakımından'),
 ('2','makam','İl ve ilçe kurulması','kanunla; ilçenin başka ile bağlanması da','A) İl ve ilçe kurulması','kanun ile;',[],'İL-İLÇE KANUN · BUCAK-SINIR CB ONAYI · KÖY KURMA MÜTALAA · KÖY ADI İÇİŞLERİ'),
 ('2','makam','Bucak kurulması','Cumhurbaşkanı onayı (sınır, köy bağlama da); ilçe-il bağlama kanunla','B) Bucak kurulması','Cumhurbaşkanı onayı ile;',[],'mühim mevki ve tabii arazi adları da CB onayı'),
 ('2','makam','Yeniden köy kurulması','Bayındırlık ve Sağlık bakanlıklarının mütalaası','C) Yeniden köy kurulması','mütalaası alınmak suretiyle;',[],''),
 ('2','makam','köy adlarının değiştirilmesi','İçişleri Bakanlığının tasvibi; köy birleştirme-ayırma da','Ç) Köy ve kasabaların','İçişleri Bakanlığının tasvibiyle yapılır.',[],'aynı ilçede bucak değiştirme de'),
 ('2','sira_usul','İllere, ilçelere, bucaklara','merkez yapılan şehir-kasaba-köyün adı verilir; tarihî ad olabilir','E) İllere, ilçelere, bucaklara','isim olarak verilebilir.',[],''),

 # m.4 — il genel idaresi, vali emrindeki teşkilat
 ('4','makam','İl genel idaresinin başı','vali (ilçede kaymakam)','İl genel idaresinin başı','mercii validir.',[],'mercii de vali'),
 ('4','tanim','teşkilatın her birinin başında bulunanlar','il idare şube başkanları; emrindekiler ikinci derece memur','Bakanlıkların kuruluş mevzuatına göre illerde','ikinci derecede memurlarıdır.',[],''),
 ('4','istisna','valinin emri altında','il teşkilatı (eğitim müdürü de); yargıç, savcı, askerî birlik hariç','Bu teşkilat valinin emri altındadır','bu madde hükmünden müstesnadır.',[],'bakanlıkların il teşkilatı vali emrinde'),
 ('4','istisna','bu madde hükmünden müstesnadır','valinin emrinden: yargıç, savcı, askerî birlik-şube; şube başkanı DEĞİL','Hakimler Kanunu ile İcra','bu madde hükmünden müstesnadır.',[],'askerî fabrika ve müesseseler de'),
 ('4','istisna','yargıç, Cumhuriyet savcısı','Hakimler Kanunu ve İcra-İflas Kanunu','Hakimler Kanunu ile İcra','bu madde hükmünden müstesnadır.',[],'adalet memurları da'),
 ('4','istisna','Hakim','yargı mensubu; valinin emrinden müstesna','Hakimler Kanunu ile İcra','bu madde hükmünden müstesnadır.',[],'vali talimat veremez'),

 # m.9 — valinin sıfatı ve görevleri
 ('9','tanim','idari yürütme vasıtası','Cumhurbaşkanının; ilde vali temsilci, ilçede kaymakam','Vali, ilde Cumhurbaşkanının','idari yürütme vasıtasıdır.',[('27','kaymakam: ilçede Cumhurbaşkanının idari yürütme vasıtası')],'vali hem temsilci hem yürütme vasıtası'),
 ('9','makam','ilin genel idaresinden','Cumhurbaşkanına karşı sorumlu','Valiler, ilin genel idaresinden','Cumhurbaşkanına karşı sorumludur.',[],'İçişleri Bakanına değil'),
 ('9','makam',"valilere re'sen emir ve talimat",'bakanlar ve Cumhurbaşkanı yardımcıları valiye doğrudan emir verir','Cumhurbaşkanı yardımcıları ve bakanlar','emir ve talimat verirler.',[('31', "kaymakamın re'sen verdiği uyarma-kınama kesin")],'yalnız İçişleri Bakanı değil'),
 ('9','makam','mevzuatın verdiği yetkiyi','valiler genel emir çıkarır (kaymakam değil)','Kanun, Cumhurbaşkanlığı kararnamesi ve diğer mevzuatın verdiği','bunları ilan ederler.',[],''),
 ('9','makam','imza yetkisi','hesabat ve teknik işlerde şube başkanına','Ancak valiler hesabata','imza yetkisi verebilirler.',[],'vali adına imza'),
 ('9','makam','denetler, teftiş eder','adli ve askerî teşkilat hariç hepsini denetler','D) Vali, dördüncü maddenin','amir ve memurlariyle de yaptırabilir.',[('31', 'kaymakam da adli-askerî hariç denetler'), ('42', 'bucak teşkilatı bucak müdürünün gözetim ve teftişinde')],'müfettişlere de yaptırabilir'),
 ('9','makam','İlin her yönden genel idare','genel idare ve gidişini düzenlemekten vali sorumlu (ilçede kaymakam)','E) İlin her yönden','denetlemekten sorumludur.',[],''),
 ('9','makam','teşkilatı veya görevli memuru','yakın ilgili şube/daire başkanından ister; yapılması mecburi','F) Vali, ilde teşkilatı','yapılması mecburidir.',[],''),
 ('9','makam','fen kollarına dahil memur','asli vazifeye halel getirmeden; ilgili Bakanlığa bilgi','G) Vali, il içindeki','bilgi verir.',[('31', 'kaymakam valiliğe teklif ederek ister')],''),
 ('9','makam','Cumhuriyet Bayramı','ilde vali, ilçede kaymakam, bucakta bucak müdürü','K) Vali, Cumhuriyet Bayramında','tebrikleri kabul eder.',[('31', 'ilçede kaymakam başkanlık eder'), ('42', 'bucakta bucak müdürü başkanlık eder')],''),

 # m.11 — valinin kolluk yetkileri
 ('11','makam','il sınırları içinde','bütün kolluğun amiri; emri derhal yerine getirilir','A) Vali, il sınırları içinde','derhal yerine getirmekle yükümlüdür.',[],'genel ve özel kolluk'),
 ('11','makam','kıyı emniyeti','vali sağlar ve yürütür (ilçede kaymakam)','B) Memleketin sınır ve kıyı','sağlar ve yürütür.',[('32','ilçede kaymakam sağlar ve yürütür')],''),
 ('11','makam','önleyici kolluk','valinin görevi; huzur, güvenlik, kişi dokunulmazlığı','C) İl sınırları içinde huzur','valinin ödev ve görevlerindendir.',[('32','ilçede önleyici kolluk kaymakamın görevi')],''),
 ('11','sure','on beş günü geçmemek','giriş-çıkış, dolaşma, toplanma, araç, silah kısıtı; okul kapatma YOK','Vali, kamu düzeni veya güvenliğinin','naklini yasaklayabilir.',[],'yalnız vali (kaymakam değil); ruhsatlı silah da'),
 ('11','sure','olağan hayatı durduracak','bozulmada en çok on beş gün; yalnız vali, kaymakam DEĞİL','Vali, kamu düzeni veya güvenliğinin','naklini yasaklayabilir.',[],''),
 ('11','sure','dolaşma','vali en çok on beş gün kısıtlar','Vali, kamu düzeni veya güvenliğinin','naklini yasaklayabilir.',[],''),
 ('11','makam','il içine munhasır','vali değiştirir; kaymakam ancak valinin tasvibiyle','Ç) Jandarma, polis','Bakanlıklarına bilgi verir.',[('32','kaymakam valinin tasvibiyle değiştirir')],'İçişleri ve Gümrük-Tekel’e bilgi'),
 ('11','makam','önleyemedi','İçişleri Bakanlığı + en yakın kara-deniz-hava birliği','Valiler, ilde çıkabilecek','yardım isterler.',[],'hangisinden isteneceğini vali takdir eder'),
 ('11','sira_usul','Acil durumlarda','sözlü, sonra yazılı; geciktirilmeden yerine getirilir','Valinin yaptığı yardım istemi','sözlü olarak yapılabilir.',[],''),
 ('11','makam','kuvvetin çapı','birlik komutanı belirler; görevde kalış süresini vali','Olayların niteliğine göre','vali tarafından belirlenir.',[],'ikisi de koordineli'),
 ('11','makam','işbirliği ve koordinasyon','birlik komutanının görüşüyle vali tespit eder','Güvenlik kuvvetleri ile yardıma gelen','vali tarafından tespit edilir.',[],''),
 ('11','makam','komuta, sevk ve idare','askerî birliklerin en kıdemli komutanı','Ancak, bu askeri birliğin','en kıdemli komutanı tarafından üstlenilir.',[],'jandarma ya da polisle birlikte görevde'),
 ('11','makam','Birden fazla ili içine alan','Cumhurbaşkanı esasları; İçişleri Bakanı bir valiyi görevlendirir','Birden fazla ili içine alan','geçici olarak görevlendirir.',[],''),
 ('11','makam','sınır ötesi harekat','valinin talebi; Genelkurmay kanalı; Cumhurbaşkanı müsaadesi','Olayların sınır illerinde','planlayıp icra edebilir.',[],'komşu ülkenin mutabakatı da'),

 # m.18 — sicil amirliği
 ('18','makam','sicil amiri','validen birinci: kaymakam/muavin/şube başkanı/muhakemat/kolluk; vali diğerine ikinci; bucak YOK','Valiler, vali muavini ile','ikinci derecede sicil amiridirler.',[],'muhakemat müdürü, genel-özel kolluk amiri'),

 # m.27 — ilçe idaresi
 ('27','makam','İlçe genel idaresinin başı','kaymakam (ilde vali)','İlçe genel idaresinin başı','mercii kaymakamdır.',[],''),
 ('27','makam','İlçenin genel idaresinden','kaymakam sorumlu','İlçenin genel idaresinden','kaymakam sorumludur.',[],''),
 ('27','istisna','kaymakamın emri altındadır','ilçe teşkilatı; adli ve askerî hariç','Bu teşkilat (Dördüncü maddenin','kaymakamın emri altındadır.',[],''),

 # m.31 — kaymakamın görevleri
 ('31','ceza','savunmasını aldıktan sonra','kaymakam: uyarma, kınama; bucak müdürü: yalnız uyarma; ağırı teklif','Kaymakam, ilçenin idare şube başkanlariyle','teklif ve talepte bulunabilir.',[('42', 'bucak müdürü savunma alıp yalnız uyarma verir')],'KAYMAKAM UYARMA-KINAMA · BUCAK MÜDÜRÜ YALNIZ UYARMA'),
 ('31','ceza','ikinci derecedeki memur','genel ve özel kolluk amir ve memurlarına da','Kaymakam, ilçenin idare şube başkanlariyle','teklif ve talepte bulunabilir.',[],'şube başkanlarına da'),
 ('31','ceza',"re'sen verilen",'cezalar kesin; tebliğden itibaren sicile geçer',"Kaymakamlarca re'sen verilen",'sicile geçer.',[],''),
 ('31','makam','takdirname','kaymakam verebilir; bucak müdürü yalnız teklif eder','Kaymakam, ilçe memurlarına takdirnamede','takdirnamede verebilir.',[('42','bucak müdürü takdirname için teklif eder')],''),
 ('31','sure','acele hâllerde','8 güne kadar; kendi memuruna bir ay','J) Kaymakam, ilçe idare şube başkanlarına','bir aya kadar izin verebilir.',[],'şube başkanına izin'),
 ('31','sure','tayini kendisine ait memurlara','bir aya kadar (yıllık izinden)','J) Kaymakam, ilçe idare şube başkanlarına','bir aya kadar izin verebilir.',[],''),
 ('31','sira_usul','askerlik muameleleri','kaymakam şubeye yazar; yetersizse valiye bildirir','K) Kaymakamlar, halkın askerlik','keyfiyeti valiye bildirirler;',[],''),
 ('31','sira_usul','olağanüstü hallerde','kaymakam bakanlıklarla yazışır; valiye bilgi verir','Ancak olağanüstü hallerde','valiye bilgi verirler;',[],'normalde yalnız valiyle yazışır'),
 ('31','kosul','işten el çektirebilir','şube başkanını valinin muvafakatiyle; diğerini re’sen','D) Kaymakam, denetlemesi','işten el çektirebilir.',[],''),

 # m.32 — kaymakamın kolluk yetkileri
 ('32','makam','ilçe sınırları içinde','kaymakam bütün kolluğun amiri','A) Kaymakam, ilçe sınırları içinde','derhal yerine getirmekle ödevlidir;',[],'önleyici kolluk da kaymakamda'),
 ('32','makam','kaymakam tarafından verilen emirleri','derhal yerine getirilir','Bu teşkilat amir ve memurları kaymakam','derhal yerine getirmekle ödevlidir;',[],''),
 ('32','makam','geçici veya sürekli olarak','yer değiştirme: kaymakam valinin tasvibiyle; vali doğrudan','D) Kaymakam, valinin tasvibiyle','yerlerini değiştirebilir;',[('11', 'm.11: vali il içinde geçici veya sürekli değiştirir')],''),
 ('32','sira_usul','olağanüstü ve ani olaylar','valiye bilgi verip yardım ister; askere haber verir','Kaymakam, ilçe çevresinde','komutanlara da haber verir;',[('11','vali İçişleri ve askerî birlikten doğrudan ister')],''),
 ('32','makam','kimlik ve nitelikleri','kaymakam bilgi ister; hemen verilir','Buralarda bulunan veya çalışanların','istenilen bilgiler hemen verilir.',[],'işyerleri kaymakamın gözetiminde'),

 # m.42-43 — bucak müdürü
 ('42','tanim','Bucak müdürü,','en büyük Hükümet memuru; yalnız uyarma; kolluk emre mecbur','Bucak müdürü, bucakta en büyük','en büyük Hükümet memuru ve temsilcisidir.',[],'bucağın genel idaresinden sorumlu; ilde vali, ilçede kaymakam'),
 ('42','ceza','uyarma cezası','önce savunma; kesin, sicile geçer','Memurin Kanunundaki usulüne göre savunmalarını','tebliğ tarihinden itibaren sicile geçer.',[],''),
 ('42','ceza','Daha ağır disiplin','vali ve kaymakama teklif (takdirname de)','Daha ağır disiplin','tekliflerde bulunur.',[('31','kaymakam ağır ceza için özel kanuna göre teklif eder')],''),
 ('43','makam','Bucağın güven ve düzeninin','bucak müdürü sorumlu; kolluk emre mecbur','Bucağın güven ve düzeninin','yerine getirmeye mecburdurlar.',[],''),
 ('43','makam','kolluk kuvvetleri bucak müdürünün','müdürün emri altında; emri yerine getirmeye mecbur','Bucağın güven ve düzeninin','yerine getirmeye mecburdurlar.',[],''),
 ('43','makam','Suç işlenmesini önlemek için','bucak müdürü gereken tedbirleri alır','Bucağın güven ve düzeninin','yerine getirmeye mecburdurlar.',[('11', 'm.11: valinin suç önleme tedbirleri'), ('32', 'm.32: kaymakamın suç önleme tedbirleri')],''),

 # m.57-58 — idare kurulları
 ('57','makam','il idare kurulu','valinin başkanlığında (vali muavini de); hukuk/defterdar/eğitim/bayındırlık/sağlık/tarım/veteriner; jandarma/emniyet/malmüdürü/gençlik-spor YOK','İl idare kurulu, valinin başkanlığı','vali muavinini görevlendirebilir.',[('58', 'ilçe kurulunda malmüdürü, başkan kaymakam')],'vali, vali muavinini başkan yapabilir; malmüdürü ilçe kurulunda; 2026 Subay sınavında soruldu (Gençlik ve Spor yok)'),
 ('57','makam','vali muavini','kurul başkanlığına vali görevlendirebilir','İl idare kurulu, valinin başkanlığı','vali muavinini görevlendirebilir.',[('18','vali muavininin birinci sicil amiri vali')],''),
 ('58','makam','ilçe idare kurulu','kaymakam; tahrirat, malmüdürü, hekim, eğitim, tarım, veteriner; defterdar-emniyet YOK','İlçe idare kurulu, kaymakamın','veterinerden teşekkül eder.',[('57', 'il kurulunda defterdar, başkan vali')],'defterdar il kurulunda'),
]
yaz(5, '5442 sayılı İl İdaresi Kanunu', K)
