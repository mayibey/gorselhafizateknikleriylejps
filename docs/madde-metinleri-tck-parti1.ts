// ============================================================================
// TCK MADDE METİNLERİ — PARTİ 1 / Genel Hükümler (19 madde)
// Kaynak: mevzuat.gov.tr konsolide metni (Lexpera Sürüm 51 ile teyitli, güncel).
// Kanun metinleri kamuya açıktır (FSEK m.31).
//
// KULLANIM: Aşağıdaki anahtar/değer çiftlerini src/db/madde-metinleri.ts içindeki
// MADDE_METINLERI map'ine EKLE. Mevcut '4733 m.8' anahtarına DOKUNMA. Anahtarlar
// cards.madde_no ile BİREBİR eşleşir. Değerler düz string + \n (4733 m.8 ile aynı şema).
//
// NOT: Bu parti yalnız Genel Hükümler kartlarını kapsar (m.2-5, 20-23, 35-45).
// Kamu İdaresine Karşı Suçlar (247-266) ve Milli Savunmaya Karşı Suçlar (317-325)
// ayrı partide gelecek.
//
// GÜNCELLİK UYARILARI:
//  - m.35: 4/6/2025-7550 sayılı Kanunla değişik (güncel ceza oranları işlendi).
// ============================================================================

export const MADDE_METINLERI_TCK_PARTI1: Record<string, string> = {
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
};
