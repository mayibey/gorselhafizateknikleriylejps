// ============================================================================
// TCK MADDE METİNLERİ — PARTİ 2b (SON PARTİ)
// Kapsam: Kamu İdaresine Karşı Suçlar — kalan 5 madde:
//   250 (irtikap), 252 (rüşvet), 255 (nüfuz ticareti),
//   257 (görevi kötüye kullanma), 266 (kamu görevine ait araç/gereçleri suçta kullanma)
// Kaynak: Kullanıcının verdiği resmî mevzuat.gov.tr .doc (1_5237_SAYILI_TÜRK_CEZA_KANUNU)
//   metninden BİREBİR çıkarıldı; fıkra değişiklik notları (6352/2012 vb.) korundu.
//   Kanun metinleri kamuya açıktır (FSEK m.31).
//
// KULLANIM: src/db/madde-metinleri.ts içindeki MADDE_METINLERI map'ine EKLE.
//   '4733 m.8', Parti 1 ve Parti 2a anahtarlarına DOKUNMA.
//   Anahtarlar cards.madde_no ile BİREBİR. Değerler düz string + \n.
//
// Bu parti tamamlandığında TCK tekil madde metinleri TAM olur (m.1 + m.2-5 +
// m.20-23 + m.35-45 + m.247-266 işlenenler + m.317-325).
// ============================================================================

export const MADDE_METINLERI_TCK_PARTI2B: Record<string, string> = {
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
