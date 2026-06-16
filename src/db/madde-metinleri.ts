/**
 * Orijinal kanun maddelerinin RESMÎ TAM METNİ (offline, kod-içi).
 * Anahtar = madde_no (örn. '4733 m.8'), değer = o maddenin resmî tam metni.
 * MADDE BAZINDA: aynı maddenin birden çok kartı (4733 m.8 → 10 kart) tek metni paylaşır.
 *
 * NOT: Bu DB DEĞİL — kod sabiti. Metin eklemek/düzeltmek için MIGRATION GEREKMEZ
 * (kod her açılışta taze yüklenir; seed kartlarının aksine sürüm bump'ı yok).
 * Görsel/ses registry'leriyle (KART_GORSELLERI/KART_SESLERI) aynı anahtar→değer deseni.
 *
 * Eklemek için: '4733 m.8': `... resmî tam metin ...`, satırı ekle.
 *
 * Bu el-yazımı map'in YANINDA, müşterek MASTER md'lerinden OTOMATİK üretilen
 * KART_MADDE_METINLERI registry'si vardır (`npm run madde:uret`). maddeMetni()
 * önce buraya, sonra üretilen registry'ye bakar (el-yazımı öncelikli).
 */
import { KART_MADDE_METINLERI } from '../assets/kart-madde-metinleri';

export const MADDE_METINLERI: Record<string, string> = {
  // 4733 m.8 "Cezai hükümler" — Resmî konsolide gövde metni (birebir; mülga fıkra
  // işaretleri korunur, YTL/TL ifadeleri orijinal haliyle bırakılmıştır, dipnotlar
  // ve AYM iptal notları gövdeye dahil edilmemiştir). Kaynak: mevzuat.gov.tr konsolide.
  '4733 m.8': `Cezai hükümler
Madde 8 – (Değişik: 3/4/2008-5752/3 md.)

Ticari amaç olmaksızın, kendi ürettiği ürünleri kullanarak şahsi tüketimi için elli kilogramı aşmayan sarmalık kıyılmış tütün elde eden veya üçyüzelli litreyi aşmayan fermente alkollü içki imal edenler haricinde, Gıda, Tarım ve Hayvancılık Bakanlığından tesis kurma ve faaliyet izni almadan; tütün işleyenler veya tütün mamulleri, makaron, yaprak sigara kâğıdı, sigara filtresi, etil alkol, metanol ya da alkollü içki üretmek üzere fabrika, tesis veya imalathane kuran ve işletenler bir yıldan üç yıla kadar hapis ve beşbin günden onbin güne kadar adlî para cezası ile cezalandırılır. Bu Kanunun 6 ncı maddesinin ikinci ve üçüncü fıkralarına aykırı hareket edenler ile tesislerinde izin verilen kategori dışında faaliyette bulunanlara da aynı ceza verilir.

(Mülga ikinci fıkra: 28/3/2013-6455/31 md.)
(Mülga üçüncü fıkra: 28/3/2013-6455/31 md.)
(Mülga dördüncü fıkra: 28/3/2013-6455/31 md.)

Tütün, tütün mamulleri, etil alkol, metanol ve alkollü içkiler piyasasında Gıda, Tarım ve Hayvancılık Bakanlığından gerekli izinleri alarak veya almadan mal veya hizmet üreten, işleyen, ihraç veya ithal eden, pazarlayan, alan veya satan gerçek ve tüzel kişilere aşağıda yazılı idarî yaptırımlar uygulanır:

a) Bu Kanun veya ilgili mevzuat gereğince Gıda, Tarım ve Hayvancılık Bakanlığı tarafından istenilen ticari faaliyetlerini gösterir satış veya faaliyet raporlarını veya bilgi, belge ve numuneleri yazılı uyarıya rağmen belirlenen süre içinde vermeyenlere, yanlış veya yanıltıcı bilgi veya belge verenlere, gerekli tesis ve yerleri incelemeye açmayanlara ellibin Yeni Türk Lirasından ikiyüzellibin Yeni Türk Lirasına kadar idarî para cezası verilir.

b) Üreticiden satın aldıkları tütünleri satış merkezlerine veya Gıda, Tarım ve Hayvancılık Bakanlığına tescil ettirmeyenlere, yazılı sözleşme yapma tarihine uymayanlara, işleme açılış ve kapanışları ile tütün stoklarını ve tütün depolarını süresi içinde bildirmeyenlere, izinsiz standart dışı işleme yapanlara, bu Kanunda tütün eksperi unvanına sahip olanlar tarafından yapılması öngörülen işleri yetkisiz kişilere yaptıranlara, yazılı sözleşme esası veya açık artırma yöntemi ile yapılan alım satım kapsamındaki yükümlülüklerini süresi içinde yerine getirmeyenlere onbin Yeni Türk Lirasından ellibin Yeni Türk Lirasına kadar idarî para cezası verilir. Bu hüküm Gıda, Tarım ve Hayvancılık Bakanlığından izin almadan bir yere mahsus tütün çeşidinin tohum veya fidelerini başka çeşitlere ayrılmış olan yerlere ekenler, dikenler veya bu amaçlarla taşıyanlar hakkında da uygulanır.

c) İzin almadan veya güncelleme yapmadan, ana girdilerde veya ürün ambalajında değişiklik yaparak ürünleri piyasaya arz edenlere ellibin Yeni Türk Lirasından beşyüzbin Yeni Türk Lirasına kadar idarî para cezası verilir.

d) Gıda, Tarım ve Hayvancılık Bakanlığından izin almaksızın işleme veya üretim tesislerinde proje tadilat kapsamındaki işlemleri yapan, kurulu makinelerini ülke içerisinde kısmen veya tamamen aynı firma tarafından kurulan yeni veya eski bir fabrikaya nakleden, başka bir firmaya devreden ya da ülke dışına çıkaranlara veya bildirimde bulunmaksızın faaliyetini sona erdirenlere ellibin Yeni Türk Lirasından beşyüzbin Yeni Türk Lirasına kadar idarî para cezası verilir.

e) Gıda, Tarım ve Hayvancılık Bakanlığından izin almadan veya bildirimde bulunmadan dökme alkollü içkileri piyasaya arz eden, sevkiyatını yapan veya izin verilen yerlerden farklı yerlerde depolayanlara ikiyüzbin Yeni Türk Lirası idarî para cezası verilir.

f) Gıda, Tarım ve Hayvancılık Bakanlığından belge almamış kişilerden ürün alan veya bu kişilere ürün satan ya da belgesinde belirtilen işyeri dışında satış yapan toptan veya perakende tütün mamulü, makaron, yaprak sigara kâğıdı, etil alkol, metanol veya alkollü içki satıcıları ya da açık içki satıcılarına bin Yeni Türk Lirasından onbin Yeni Türk Lirasına kadar idarî para cezası verilir.

g) Gıda, Tarım ve Hayvancılık Bakanlığından satış belgesi almadan tütün mamulleri, makaron, yaprak sigara kâğıdı, etil alkol, metanol ve alkollü içkilerin toptan satışını yapanlara ellibin Yeni Türk Lirası; perakende satışını yapanlara ise beşbin Yeni Türk Lirası idarî para cezası verilir.

h) (Mülga: 28/11/2017-7061/63 md.)

ı) Gıda, Tarım ve Hayvancılık Bakanlığından uygunluk belgesi almadan enfiye, çiğneme, nargile tütünü veya yaprak sigara kâğıdı ya da makaron ile sigara filtresi üretenler ile satan veya satışa arz edenlere (…), beşbin Yeni Türk Lirası idarî para cezası verilir.

j) Yetkili olmadıkları halde, açık olarak içki satışı veya sunumu yapanlar ile satışa sunulan tütün mamulleri, etil alkol, metanol ve alkollü içkileri arz ambalajlarını bozmak veya bunları bölmek suretiyle satanlara bin Yeni Türk Lirasından onbin Yeni Türk Lirasına kadar idarî para cezası verilir.

k) Tütün mamulleri veya alkollü içkilerin, etil alkol, metanol, makaron, sarmalık kıyılmış tütünün ve yaprak sigara kâğıdının tüketicilere satışını (…); internet, televizyon, faks ve telefon gibi elektronik ticaret araçları ya da posta ile sipariş yöntemi kullanarak yapmak üzere satış sistemi kuran veya faaliyette bulunanlara yirmibin Yeni Türk Lirasından yüzbin Yeni Türk Lirasına kadar idarî para cezası verilir. (Ek ikinci cümle: 13/2/2011-6111/175 md.) Satışın internet ortamında yapılması halinde, 4/5/2007 tarihli ve 5651 sayılı İnternet Ortamında Yapılan Yayınların Düzenlenmesi ve Bu Yayınlar Yoluyla İşlenen Suçlarla Mücadele Edilmesi Hakkında Kanunda öngörülen usullere göre erişimin engellenmesine karar verilir ve bu karar hakkında da anılan Kanun hükümleri uygulanır.

l) Tütün mamulleri veya alkollü içkileri satış yerlerindeki raf veya standlara, her türlü teşhir ünitesine, reklam ve tanıtımına ilişkin mevzuata ve Gıda, Tarım ve Hayvancılık Bakanlığı düzenlemelerine aykırılık oluşturacak veya herhangi bir firmaya üstünlük sağlayacak şekilde yerleştirenlere otuzbin Yeni Türk Lirası idarî para cezası verilir.

m) Tütün mamulleri (…) kullanımını ve satışını özendirici veya teşvik edici kampanya, promosyon, reklam ve tanıtım yapılmasını önlemek amacıyla Gıda, Tarım ve Hayvancılık Bakanlığı tarafından bu Kanun uyarınca yapılan düzenlemelere aykırı hareket edenlere otuzbin Yeni Türk Lirası idarî para cezası verilir.

n) Tütün mamulleri (…); otomatik satış makinesi ile satanlara veya bahis oynatmak veya ödül vermek gibi yollarla verenlere, fiilleri suç oluşturmadığı takdirde ellibin Yeni Türk Lirasından ikiyüzellibin Yeni Türk Lirasına kadar idarî para cezası verilir. (Ek cümle:28/10/2020-7255/13) Eyleme konu makineler hakkında müsadere kararı verilmemiş ise ayrıca mülkiyetin kamuya geçirilmesine karar verilir.

o) (Ek: 13/2/2011-6111/175 md.) Ticari amaçla sarmalık kıyılmış tütün üretenler ile satan veya satışa arz edenlere ürettikleri, sattıkları veya satışa arz ettikleri tütünün;
50 kilograma kadar (50 kilogram dâhil) olması halinde 250 TL.
50 kilogramdan 100 kilograma kadar (100 kilogram dâhil) olması halinde 500 TL.
100 kilogramdan 250 kilograma kadar (250 kilogram dâhil) olması halinde 1.500 TL.
250 kilogramdan 500 kilograma kadar (500 kilogram dâhil) olması halinde 3.000 TL.
500 kilogramdan fazla olması halinde 5.000 TL.
idari para cezası verilir.

ö) (Ek:28/10/2020-7255/13 md.) 6 ncı maddenin onikinci fıkrasına aykırı hareket edenlere, kullanımı zorunlu olan miktar ile fiili kullanım miktarı arasındaki farkın, kullanımı zorunlu olan miktara oranının;
1) Yüzde on ve altında olması halinde, kullanmadığı her bir kilogram karşılığında sekiz Türk Lirası,
2) Yüzde otuz ve altında olması halinde, kullanmadığı her bir kilogram karşılığında on Türk Lirası,
3) Yüzde otuzun üzerinde olması halinde, kullanmadığı her bir kilogram karşılığında Oniki Türk Lirası,
idari para cezası uygulanır.

p) (Ek:28/10/2020-7255/13 md.) Mevzuatta tanımlanmış amacı dışında ya da teknik düzenlemesine uygun olmayan etil alkolü bulunduranlara, satışa sunanlara veya satanlara yirmibin Türk Lirasından yüzbin Türk Lirasına kadar idari para cezası verilir.

r) (Ek:30/11/2022-7423/4 md.) Makaron ve sigara üretim tesislerinde, Tarım ve Orman Bakanlığına bildirimde bulunmadan ve 4/1/1961 tarihli ve 213 sayılı Vergi Usul Kanununun mükerrer 257 nci maddesinin birinci fıkrasının (6) numaralı bendi kapsamında vergi güvenliğini sağlamak amacıyla kullanılması zorunluluğu getirilen özel etiket ve işaretlerle ürünlerini etiketlemeden veya işaretlemeden makine çalışma testleri, ürün denemeleri veya deneme üretimi yapanlara, onbin Türk lirasından az olmamak üzere, üretilen her bir adet başına bir Türk lirası idari para cezası verilir.

s) (Ek:30/11/2022-7423/4 md.) Makaron ve sigara üretim tesislerinde, makine çalışma testleri, ürün denemeleri veya deneme üretimi kapsamında üretilen makaron ve sigaraları süresi içerisinde imha etmeyenlere, onbin Türk lirasından az olmamak üzere, üretilen her bir adet başına bir Türk lirası idari para cezası verilir.

Yukarıda sayılan fiiller dışında, bu Kanun ile 4250 sayılı Kanuna veya bu kanunlara göre yürürlüğe konulmuş yönetmeliklere ya da Gıda, Tarım ve Hayvancılık Bakanlığınca verilen belgelerde yer alan şartlara uyulmadığının tespiti halinde, ilgili gerçek ve tüzel kişiler uyarılır ve aykırılığın giderilmesi için uygun bir süre verilir. Her işlem için verilecek süre Gıda, Tarım ve Hayvancılık Bakanlığınca belirlenir. Verilen süre sonunda aykırılığın devam etmesi halinde veya aykırılığın giderilmesinin mümkün olmadığı hallerde süre verilmeksizin Gıda, Tarım ve Hayvancılık Bakanlığınca verilen belgeler iptal edilir.

İdarî para cezaları, fiillerin tekrarı halinde, bir önceki cezanın iki katı olarak verilir. Beşinci fıkranın (c) bendinde sayılan fiillerin tekrarı halinde ayrıca ihlale konu ürünün piyasaya arzının bir yıla kadar durdurulmasına; (a), (b), (d), (e), (f), (j), (k), (l), (m), (n), (o), (p), (r) ve (s) bentlerinde sayılan fiillerin, ilk fiilin işlenmesinden sonraki beş yıl içinde üçüncü defa işlenmesi halinde ise belgelerin iptaline karar verilir. Satış belgesi iptal edilen satıcılar, satış belgesi iptaline konu işyerinde aynı işletme adı altında faaliyette bulunan üçüncü kişiler ile satış belgesi iptal edilen satıcılarca belge iptaline konu işyerinin farklı işletme adı altında fiilen işletilmesi halinde, bu işletme üzerine kayıtlı görünen üçüncü kişiler adına iki yıl süreyle yeni belge başvurusunda bulunulamaz.

(Değişik sekizinci fıkra:30/11/2022-7423/4 md.) Bu Kanuna, 4250 sayılı Kanuna, 213 sayılı Kanunun 359 uncu maddesinin (d) fıkrasına veya 21/3/2007 tarihli ve 5607 sayılı Kaçakçılıkla Mücadele Kanununun 3 üncü maddesinin onuncu, onaltıncı, onyedinci, onsekizinci, yirminci ve yirmibirinci fıkralarına aykırı fiillerden dolayı haklarında kesinleşmiş mahkûmiyet kararı olanlara, bu Kanun kapsamında yürütülen faaliyetlere ilişkin hiçbir belge verilmez, verilmiş olanlar Tarım ve Orman Bakanlığınca iptal edilir. (Değişik ikinci cümle: 27/12/2023-7491/38 md.) Bu Kanuna, 4250 sayılı Kanuna, 213 sayılı Kanunun 359 uncu maddesinin (d) fıkrası ile 5607 sayılı Kanunun 3 üncü maddesinin onuncu, onaltıncı, onyedinci, onsekizinci, yirminci ve yirmibirinci fıkralarına aykırı fiillerden soruşturma ve/veya kovuşturma başlatılması durumunda bu Kanun kapsamında yürütülen faaliyetlere ilişkin verilen belgeler, durumun Bakanlığa yargı merciince bir hafta içerisinde bildirilmesiyle veya sair suretlerle Bakanlıkça ıttıla edilmesi durumunda, belgenin düzenlendiği tesis veya işyeri dikkate alınarak askıya alınır. Askıya alma süresince söz konusu tesis veya işyeri için başkaca bir belge düzenlenmez. Tüzel kişilerin organ veya temsilcisi ya da organ veya temsilci olmamakla birlikte bu tüzel kişinin faaliyeti çerçevesinde görev üstlenen bir kişi tarafından tüzel kişinin yararına işlenmesi durumunda da askıya alma işlemi uygulanır. Bakanlıkça askıya alma işleminin kaldırılıp kaldırılmayacağı altı ayda bir değerlendirilir. Ancak kovuşturmaya yer olmadığına dair kararın kesinleşmesi üzerine ya da mahkûmiyet dışında bir hüküm veya hükmün açıklanmasının geri bırakılmasına karar verilmesi halinde kesinleşmesi beklenmeksizin Bakanlık tarafından askıya alma işlemi ortadan kaldırılır.

Beşinci fıkranın (f), (g), (h), (ı), (j), (n), (o), (p), (r) ve (s) bentlerinde yazılı fiiller hakkında idarî yaptırım uygulamaya ve bu fiillerin konusunu oluşturan her türlü eşyanın mülkiyetinin kamuya geçirilmesi kararını vermeye mahalli mülkî amirler, diğer bentlerde yazılı fiiller hakkında idarî para cezası vermeye Gıda, Tarım ve Hayvancılık Bakanlığı yetkilidir. Mahalli mülkî amirlerce uygulanan idarî yaptırımlar onbeş gün içinde Gıda, Tarım ve Hayvancılık Bakanlığına iletilir.

Bu Kanun hükümlerine göre verilen idarî yaptırım kararlarına karşı 6/1/1982 tarihli ve 2577 sayılı İdari Yargılama Usulü Kanunu hükümlerine göre kanun yoluna başvurulabilir. Ancak, idare mahkemesinde dava, işlemin tebliği tarihinden itibaren onbeş gün içinde açılır. İdare mahkemesinde iptal davası açılmış olması, kararın yerine getirilmesini durdurmaz.

İdarî yaptırımlara ilişkin olarak bu Kanunda hüküm bulunmayan hallerde 30/3/2005 tarihli ve 5326 sayılı Kabahatler Kanunu hükümleri uygulanır.

(Ek fıkra: 28/3/2013-6455/31 md.) Gıda, Tarım ve Hayvancılık Bakanlığı piyasa faaliyetlerine ilişkin olarak tütün, tütün mamulleri, etil alkol, metanol ve alkollü içkiler piyasasında mal veya hizmet üreten, işleyen, ihraç veya ithal eden, pazarlayan, alan veya satan gerçek ve tüzel kişiler ile bunların yetkilileri hakkında açılan kamu davalarını katılan sıfatıyla takip edebilir. Bu konularla ilgili olarak suç duyurusunda bulunabileceği gibi mevzuatın uygulanması açısından, adli ve mülki makamlardan yaptırım talebinde bulunabilir.

(Ek fıkra: 28/3/2013-6455/31 md.) Bu Kanuna göre idari para cezalarının veya idari yaptırımların uygulanması, bu Kanunun diğer hükümlerinin ve diğer kanunlarda yer alan ceza ve tedbirlerin uygulanmasına engel teşkil etmez.

(Ek fıkra: 28/3/2013-6455/31 md.) Her türlü uyuşturucu madde, alkollü içki, tütün ve tütün mamulleri bağımlılığı ile mücadele etmek amacıyla Türkiye Yeşilay Cemiyetine 5018 sayılı Kanunun 29 uncu maddesi hükmüne tabi olmaksızın yardım yapılmak üzere, Sağlık Bakanlığı bütçesinde gerekli ödenek öngörülür.`,

  // === TCK Genel Hükümler — Partİ 1 (19 madde: m.2-5, 20-23, 35-45) ===
  // Kaynak: mevzuat.gov.tr konsolide (Lexpera Sürüm 51 ile teyitli). Birebir; m.35
  // 4/6/2025-7550 ile değişik (güncel oranlar). Kamu İdaresi (247-266) ve Milli
  // Savunma (317-325) ayrı partide gelecek.
  'TCK m.2': `Suçta ve cezada kanunîlik ilkesi
MADDE 2 –

(1) Kanunun açıkça suç saymadığı bir fiil için kimseye ceza verilemez ve güvenlik tedbiri uygulanamaz. Kanunda yazılı cezalardan ve güvenlik tedbirlerinden başka bir ceza ve güvenlik tedbirine hükmolunamaz.

(2) İdarenin düzenleyici işlemleriyle suç ve ceza konulamaz.

(3) Kanunların suç ve ceza içeren hükümlerinin uygulanmasında kıyas yapılamaz. Suç ve ceza içeren hükümler, kıyasa yol açacak biçimde geniş yorumlanamaz.`,

  'TCK m.3': `Adalet ve kanun önünde eşitlik ilkesi
MADDE 3 –

(1) Suç işleyen kişi hakkında işlenen fiilin ağırlığıyla orantılı ceza ve güvenlik tedbirine hükmolunur.

(2) Ceza Kanununun uygulamasında kişiler arasında ırk, dil, din, mezhep, milliyet, renk, cinsiyet, siyasal veya diğer fikir yahut düşünceleri, felsefi inanç, milli veya sosyal köken, doğum, ekonomik ve diğer toplumsal konumları yönünden ayrım yapılamaz ve hiçbir kimseye ayrıcalık tanınamaz.`,

  'TCK m.4': `Kanunun bağlayıcılığı
MADDE 4 –

(1) Ceza kanunlarını bilmemek mazeret sayılmaz.

(2) (Mülga: 29/6/2005-5377/1 md.)`,

  'TCK m.5': `Özel kanunlarla ilişki
MADDE 5 –

(1) Bu Kanunun genel hükümleri, özel ceza kanunları ve ceza içeren kanunlardaki suçlar hakkında da uygulanır.`,

  'TCK m.20': `Ceza sorumluluğunun şahsiliği
MADDE 20 –

(1) Ceza sorumluluğu şahsidir. Kimse başkasının fiilinden dolayı sorumlu tutulamaz.

(2) Tüzel kişiler hakkında ceza yaptırımı uygulanamaz. Ancak, suç dolayısıyla kanunda öngörülen güvenlik tedbiri niteliğindeki yaptırımlar saklıdır.`,

  'TCK m.21': `Kast
MADDE 21 –

(1) Suçun oluşması kastın varlığına bağlıdır. Kast, suçun kanuni tanımındaki unsurların bilerek ve istenerek gerçekleştirilmesidir.

(2) Kişinin, suçun kanuni tanımındaki unsurların gerçekleşebileceğini öngörmesine rağmen, fiili işlemesi halinde olası kast vardır. Bu halde, ağırlaştırılmış müebbet hapis cezasını gerektiren suçlarda müebbet hapis cezasına, müebbet hapis cezasını gerektiren suçlarda yirmi yıldan yirmibeş yıla kadar hapis cezasına hükmolunur; diğer suçlarda ise temel ceza üçte birden yarısına kadar indirilir.`,

  'TCK m.22': `Taksir
MADDE 22 –

(1) Taksirle işlenen fiiller, kanunun açıkça belirttiği hallerde cezalandırılır.

(2) Taksir, dikkat ve özen yükümlülüğüne aykırılık dolayısıyla, bir davranışın suçun kanuni tanımında belirtilen neticesi öngörülmeyerek gerçekleştirilmesidir.

(3) Kişinin öngördüğü neticeyi istememesine karşın, neticenin meydana gelmesi halinde bilinçli taksir vardır; bu halde taksirli suça ilişkin ceza üçte birden yarısına kadar artırılır.

(4) Taksirle işlenen suçtan dolayı verilecek olan ceza failin kusuruna göre belirlenir.

(5) Birden fazla kişinin taksirle işlediği suçlarda, herkes kendi kusurundan dolayı sorumlu olur. Her failin cezası kusuruna göre ayrı ayrı belirlenir.

(6) Taksirli hareket sonucu neden olunan netice, münhasıran failin kişisel ve ailevi durumu bakımından, artık bir cezanın hükmedilmesini gereksiz kılacak derecede mağdur olmasına yol açmışsa ceza verilmez; bilinçli taksir halinde verilecek ceza yarıdan altıda bire kadar indirilebilir.`,

  'TCK m.23': `Netice sebebiyle ağırlaşmış suç
MADDE 23 –

(1) Bir fiilin, kastedilenden daha ağır veya başka bir neticenin oluşumuna sebebiyet vermesi halinde, kişinin bundan dolayı sorumlu tutulabilmesi için bu netice bakımından en azından taksirle hareket etmesi gerekir.`,

  'TCK m.35': `Suça teşebbüs
MADDE 35 – (İkinci fıkra değişik: 4/6/2025-7550/8 md.)

(1) Kişi, işlemeyi kastettiği bir suçu elverişli hareketlerle doğrudan doğruya icraya başlayıp da elinde olmayan nedenlerle tamamlayamaz ise teşebbüsten dolayı sorumlu tutulur.

(2) Suça teşebbüs halinde fail, meydana gelen zarar veya tehlikenin ağırlığına göre, ağırlaştırılmış müebbet hapis cezası yerine ondört yıldan yirmibir yıla kadar, müebbet hapis cezası yerine on yıldan onsekiz yıla kadar hapis cezası ile cezalandırılır. Diğer hallerde verilecek cezanın dörtte birinden dörtte üçüne kadarı indirilir.`,

  'TCK m.36': `Gönüllü vazgeçme
MADDE 36 –

(1) Fail, suçun icra hareketlerinden gönüllü vazgeçer veya kendi çabalarıyla suçun tamamlanmasını veya neticenin gerçekleşmesini önlerse, teşebbüsten dolayı cezalandırılmaz; fakat tamam olan kısım esasen bir suç oluşturduğu takdirde, sadece o suça ait ceza ile cezalandırılır.`,

  'TCK m.37': `Faillik
MADDE 37 –

(1) Suçun kanuni tanımında yer alan fiili birlikte gerçekleştiren kişilerden her biri, fail olarak sorumlu olur.

(2) Suçun işlenmesinde bir başkasını araç olarak kullanan kişi de fail olarak sorumlu tutulur. Kusur yeteneği olmayanları suçun işlenmesinde araç olarak kullanan kişinin cezası, üçte birden yarısına kadar artırılır.`,

  'TCK m.38': `Azmettirme
MADDE 38 –

(1) Başkasını suç işlemeye azmettiren kişi, işlenen suçun cezası ile cezalandırılır.

(2) Üstsoy ve altsoy ilişkisinden doğan nüfuz kullanılmak suretiyle suça azmettirme halinde, azmettirenin cezası üçte birden yarısına kadar artırılır. Çocukların suça azmettirilmesi halinde, bu fıkra hükmüne göre cezanın artırılabilmesi için üstsoy ve altsoy ilişkisinin varlığı aranmaz.

(3) Azmettirenin belli olmaması halinde, kim olduğunun ortaya çıkmasını sağlayan fail veya diğer suç ortağı hakkında ağırlaştırılmış müebbet hapis cezası yerine yirmi yıldan yirmibeş yıla kadar, müebbet hapis cezası yerine onbeş yıldan yirmi yıla kadar hapis cezasına hükmolunabilir. Diğer hallerde verilecek cezada, üçte bir oranında indirim yapılabilir.`,

  'TCK m.39': `Yardım etme
MADDE 39 –

(1) Suçun işlenmesine yardım eden kişiye, işlenen suçun ağırlaştırılmış müebbet hapis cezasını gerektirmesi halinde, onbeş yıldan yirmi yıla; müebbet hapis cezasını gerektirmesi halinde, on yıldan onbeş yıla kadar hapis cezası verilir. Diğer hallerde cezanın yarısı indirilir. Ancak, bu durumda verilecek ceza sekiz yılı geçemez.

(2) Aşağıdaki hallerde kişi işlenen suçtan dolayı yardım eden sıfatıyla sorumlu olur:
a) Suç işlemeye teşvik etmek veya suç işleme kararını kuvvetlendirmek veya fiilin işlenmesinden sonra yardımda bulunacağını vaat etmek.
b) Suçun nasıl işleneceği hususunda yol göstermek veya fiilin işlenmesinde kullanılan araçları sağlamak.
c) Suçun işlenmesinden önce veya işlenmesi sırasında yardımda bulunarak icrasını kolaylaştırmak.`,

  'TCK m.40': `Bağlılık kuralı
MADDE 40 –

(1) Suça iştirak için kasten ve hukuka aykırı işlenmiş bir fiilin varlığı yeterlidir. Suçun işlenişine iştirak eden her kişi, diğerinin cezalandırılmasını önleyen kişisel nedenler göz önünde bulundurulmaksızın kendi kusurlu fiiline göre cezalandırılır.

(2) Özgü suçlarda, ancak özel faillik niteliğini taşıyan kişi fail olabilir. Bu suçların işlenişine iştirak eden diğer kişiler ise azmettiren veya yardım eden olarak sorumlu tutulur.

(3) Suça iştirakten dolayı sorumlu tutulabilmek için ilgili suçun en azından teşebbüs aşamasına varmış olması gerekir.`,

  'TCK m.41': `İştirak hâlinde işlenen suçlarda gönüllü vazgeçme
MADDE 41 –

(1) İştirak halinde işlenen suçlarda, sadece gönüllü vazgeçen suç ortağı, gönüllü vazgeçme hükümlerinden yararlanır.

(2) Suçun;
a) Gönüllü vazgeçenin gösterdiği gayreti dışında başka bir sebeple işlenmemiş olması,
b) Gönüllü vazgeçenin bütün gayretine rağmen işlenmiş olması,
hallerinde de gönüllü vazgeçme hükümleri uygulanır.`,

  'TCK m.42': `Bileşik suç
MADDE 42 –

(1) Biri diğerinin unsurunu veya ağırlaştırıcı nedenini oluşturması dolayısıyla tek fiil sayılan suça bileşik suç denir. Bu tür suçlarda içtima hükümleri uygulanmaz.`,

  'TCK m.43': `Zincirleme suç
MADDE 43 –

(1) Bir suç işleme kararının icrası kapsamında, değişik zamanlarda bir kişiye karşı aynı suçun birden fazla işlenmesi durumunda, bir cezaya hükmedilir. Ancak bu ceza, dörtte birinden dörtte üçüne kadar artırılır. Bir suçun temel şekli ile daha ağır veya daha az cezayı gerektiren nitelikli şekilleri, aynı suç sayılır. Mağduru belli bir kişi olmayan suçlarda da bu fıkra hükmü uygulanır.

(2) Aynı suçun birden fazla kişiye karşı tek bir fiille işlenmesi durumunda da, birinci fıkra hükmü uygulanır.

(3) Kasten öldürme, kasten yaralama, işkence ve yağma suçlarında bu madde hükümleri uygulanmaz.`,

  'TCK m.44': `Fikri içtima
MADDE 44 –

(1) İşlediği bir fiil ile birden fazla farklı suçun oluşmasına sebebiyet veren kişi, bunlardan en ağır cezayı gerektiren suçtan dolayı cezalandırılır.`,

  'TCK m.45': `Cezalar
MADDE 45 –

(1) Suç karşılığında uygulanan yaptırım olarak cezalar, hapis ve adlî para cezalarıdır.`,

  // === TCK Kamu İdaresine Karşı Suçlar — Partİ 2b ===
  // 250 irtikap, 252 rüşvet, 255 nüfuz ticareti, 257 görevi kötüye kullanma,
  // 266 araç/gereçleri suçta kullanma. Kaynak: mevzuat.gov.tr resmî metin (birebir;
  // fıkra değişiklik notları korundu). (Bu grubun kalan maddeleri ayrı partide.)
  'TCK m.250': `İrtikap
MADDE 250 –

(1) (Değişik: 2/7/2012-6352/86 md.) Görevinin sağladığı nüfuzu kötüye kullanmak suretiyle kendisine veya başkasına yarar sağlanmasına veya bu yolda vaatte bulunulmasına bir kimseyi icbar eden kamu görevlisi, beş yıldan on yıla kadar hapis cezası ile cezalandırılır. Kamu görevlisinin haksız tutum ve davranışları karşısında, kişinin haklı bir işinin gereği gibi, hiç veya en azından vaktinde görülmeyeceği endişesiyle, kendisini mecbur hissederek, kamu görevlisine veya yönlendireceği kişiye menfaat temin etmiş olması halinde, icbarın varlığı kabul edilir.

(2) Görevinin sağladığı güveni kötüye kullanmak suretiyle gerçekleştirdiği hileli davranışlarla, kendisine veya başkasına yarar sağlanmasına veya bu yolda vaatte bulunulmasına bir kimseyi ikna eden kamu görevlisi, üç yıldan beş yıla kadar hapis cezası ile cezalandırılır.

(3) İkinci fıkrada tanımlanan suçun kişinin hatasından yararlanarak işlenmiş olması halinde, bir yıldan üç yıla kadar hapis cezasına hükmolunur.

(4) (Ek: 2/7/2012-6352/86 md.) İrtikap edilen menfaatin değeri ve mağdurun ekonomik durumu göz önünde bulundurularak, yukarıdaki fıkralara göre verilecek ceza yarısına kadar indirilebilir.`,

  'TCK m.252': `Rüşvet
MADDE 252 – (Değişik: 2/7/2012-6352/87 md.)

(1) Görevinin ifasıyla ilgili bir işi yapması veya yapmaması için, doğrudan veya aracılar vasıtasıyla, bir kamu görevlisine veya göstereceği bir başka kişiye menfaat sağlayan kişi, dört yıldan oniki yıla kadar hapis cezası ile cezalandırılır.

(2) Görevinin ifasıyla ilgili bir işi yapması veya yapmaması için, doğrudan veya aracılar vasıtasıyla, kendisine veya göstereceği bir başka kişiye menfaat sağlayan kamu görevlisi de birinci fıkrada belirtilen ceza ile cezalandırılır.

(3) Rüşvet konusunda anlaşmaya varılması halinde, suç tamamlanmış gibi cezaya hükmolunur.

(4) Kamu görevlisinin rüşvet talebinde bulunması ve fakat bunun kişi tarafından kabul edilmemesi ya da kişinin kamu görevlisine menfaat temini konusunda teklif veya vaatte bulunması ve fakat bunun kamu görevlisi tarafından kabul edilmemesi hâllerinde fail hakkında, birinci ve ikinci fıkra hükümlerine göre verilecek ceza yarı oranında indirilir.

(5) Rüşvet teklif veya talebinin karşı tarafa iletilmesi, rüşvet anlaşmasının sağlanması veya rüşvetin temini hususlarında aracılık eden kişi, kamu görevlisi sıfatını taşıyıp taşımadığına bakılmaksızın, müşterek fail olarak cezalandırılır.

(6) Rüşvet ilişkisinde dolaylı olarak kendisine menfaat sağlanan üçüncü kişi veya tüzel kişinin menfaati kabul eden yetkilisi, kamu görevlisi sıfatını taşıyıp taşımadığına bakılmaksızın, müşterek fail olarak cezalandırılır.

(7) Rüşvet alan veya talebinde bulunan ya da bu konuda anlaşmaya varan kişinin; yargı görevi yapan, hakem, bilirkişi, noter veya yeminli mali müşavir olması halinde, verilecek ceza üçte birden yarısına kadar artırılır.

(8) Bu madde hükümleri;
a) Kamu kurumu niteliğindeki meslek kuruluşları,
b) Kamu kurum veya kuruluşlarının ya da kamu kurumu niteliğindeki meslek kuruluşlarının iştirakiyle kurulmuş şirketler,
c) Kamu kurum veya kuruluşlarının ya da kamu kurumu niteliğindeki meslek kuruluşlarının bünyesinde faaliyet icra eden vakıflar,
d) Kamu yararına çalışan dernekler,
e) Kooperatifler,
f) Halka açık anonim şirketler,
adına hareket eden kişilere, kamu görevlisi sıfatını taşıyıp taşımadıklarına bakılmaksızın, görevlerinin ifasıyla ilgili bir işin yapılması veya yapılmaması amacıyla doğrudan veya aracılar vasıtasıyla, menfaat temin, teklif veya vaat edilmesi; bu kişiler tarafından talep veya kabul edilmesi; bunlara aracılık edilmesi; bu ilişki dolayısıyla bir başkasına menfaat temin edilmesi halinde de uygulanır.

(9) Bu madde hükümleri;
a) Yabancı bir devlette seçilmiş veya atanmış olan kamu görevlilerine,
b) Uluslararası veya uluslarüstü mahkemelerde ya da yabancı devlet mahkemelerinde görev yapan hâkimlere, jüri üyelerine veya diğer görevlilere,
c) Uluslararası veya uluslarüstü parlamento üyelerine,
d) Kamu kurumu ya da kamu işletmeleri de dahil olmak üzere, yabancı bir ülke için kamusal bir faaliyet yürüten kişilere,
e) Bir hukuki uyuşmazlığın çözümü amacıyla başvurulan tahkim usulü çerçevesinde görevlendirilen vatandaş veya yabancı hakemlere,
f) Uluslararası bir anlaşmaya dayalı olarak kurulan uluslararası veya uluslarüstü örgütlerin görevlilerine veya temsilcilerine,
görevlerinin ifasıyla ilgili bir işin yapılması veya yapılmaması ya da uluslararası ticari işlemler nedeniyle bir işin veya haksız bir yararın elde edilmesi yahut muhafazası amacıyla; doğrudan veya aracılar vasıtasıyla, menfaat temin, teklif veya vaat edilmesi ya da bunlar tarafından talep veya kabul edilmesi halinde de uygulanır.

(10) Dokuzuncu fıkra kapsamına giren rüşvet suçunun yurt dışında yabancı tarafından işlenmekle birlikte;
a) Türkiye'nin,
b) Türkiye'deki bir kamu kurumunun,
c) Türk kanunlarına göre kurulmuş bir özel hukuk tüzel kişisinin,
d) Türk vatandaşının,
tarafı olduğu bir uyuşmazlık ya da bu kurum veya kişilerle ilgili bir işlemin yapılması veya yapılmaması için işlenmesi halinde, rüşvet veren, teklif veya vaat eden; rüşvet alan, talep eden, teklif veya vaadini kabul eden; bunlara aracılık eden; rüşvet ilişkisi dolayısıyla kendisine menfaat temin edilen kişiler hakkında, Türkiye'de bulundukları takdirde, resen soruşturma ve kovuşturma yapılır.`,

  'TCK m.255': `Nüfuz ticareti
MADDE 255 – (Değişik: 2/7/2012-6352/89 md.)

(1) Kamu görevlisi üzerinde nüfuz sahibi olduğundan bahisle, haksız bir işin gördürülmesi amacıyla girişimde bulunması için, doğrudan veya aracılar vasıtasıyla, kendisine veya bir başkasına menfaat temin eden kişi, iki yıldan beş yıla kadar hapis ve beşbin güne kadar adli para cezası ile cezalandırılır. Kişinin kamu görevlisi olması halinde, verilecek hapis cezası yarı oranında artırılır. İşinin gördürülmesi karşılığında veya gördürüleceği beklentisiyle menfaat sağlayan kişi ise, bir yıldan üç yıla kadar hapis cezası ile cezalandırılır.

(2) Menfaat temini konusunda anlaşmaya varılması halinde dahi, suç tamamlanmış gibi cezaya hükmolunur.

(3) Birinci fıkrada belirtilen amaç doğrultusunda menfaat talebinde bulunulması ve fakat bunun kabul edilmemesi ya da menfaat teklif veya vaadinde bulunulması ve fakat bunun kabul edilmemesi hallerinde, birinci fıkra hükmüne göre verilecek ceza yarı oranında indirilir.

(4) Nüfuz ticareti suçuna aracılık eden kişi, müşterek fail olarak, birinci fıkrada belirtilen ceza ile cezalandırılır.

(5) Nüfuz ticareti ilişkisinde dolaylı olarak kendisine menfaat sağlanan üçüncü gerçek kişi veya tüzel kişinin menfaati kabul eden yetkilileri, müşterek fail olarak, birinci fıkrada belirtilen ceza ile cezalandırılır.

(6) İşin gördürülmesi amacıyla girişimde bulunmanın müstakil bir suç oluşturduğu hallerde kişiler ayrıca bu suç nedeniyle cezalandırılır.

(7) Bu madde hükümleri, 252 nci maddenin dokuzuncu fıkrasında sayılan kişiler üzerinde nüfuz ticareti yapılması halinde de uygulanır. Bu kişiler hakkında, Türkiye'de bulunmaları halinde, vatandaş veya yabancı olduklarına bakılmaksızın, resen soruşturma ve kovuşturma yapılır.`,

  'TCK m.257': `Görevi kötüye kullanma
MADDE 257 –

(1) Kanunda ayrıca suç olarak tanımlanan haller dışında, görevinin gereklerine aykırı hareket etmek suretiyle, kişilerin mağduriyetine veya kamunun zararına neden olan ya da kişilere haksız bir menfaat sağlayan kamu görevlisi, altı aydan iki yıla kadar hapis cezası ile cezalandırılır.

(2) Kanunda ayrıca suç olarak tanımlanan haller dışında, görevinin gereklerini yapmakta ihmal veya gecikme göstererek, kişilerin mağduriyetine veya kamunun zararına neden olan ya da kişilere haksız bir menfaat sağlayan kamu görevlisi, üç aydan bir yıla kadar hapis cezası ile cezalandırılır.

(3) (Mülga: 2/7/2012-6352/105 md.)`,

  'TCK m.266': `Kamu görevine ait araç ve gereçleri suçta kullanma
MADDE 266 –

(1) Görevi gereği olarak elinde bulundurduğu araç ve gereçleri bir suçun işlenmesi sırasında kullanan kamu görevlisi hakkında, ilgili suçun tanımında kamu görevlisi sıfatı esasen göz önünde bulundurulmamış ise, verilecek ceza üçte biri oranında artırılır.`,
};

/** Madde metnini döndürür; yoksa null. Saf lookup (DB/IO yok).
 *  Öncelik: el-yazımı MADDE_METINLERI (yüksek kaliteli TCK/4733) → üretilen registry
 *  (KART_MADDE_METINLERI, müşterek MASTER md'lerinden `npm run madde:uret`). */
export function maddeMetni(maddeNo: string): string | null {
  return MADDE_METINLERI[maddeNo] ?? KART_MADDE_METINLERI[maddeNo] ?? null;
}
