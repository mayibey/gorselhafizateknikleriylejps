# 6698 sayılı Kişisel Verilerin Korunması Kanunu — kelime → cevap
# KURAL (başkan, 4 Eki 2026): SOL = soru KÖKÜNDE göreceğin ifade, SAĞ = doğru ŞIKTA arayacağın kelime.
# Sorulardan geriye doğru yazıldı (85 cevaplı soru + kitapçık kökleri); kanıt resmî metin. Kapsam: m.3-7 ve m.28.
# Tuzak çiftleri: GENEL veri m.5 YEDİ hâl (sözleşme, meşru menfaat var) · ÖZEL NİTELİKLİ m.6 SEKİZ hâl (bu ikisi yok) ·
#                 m.28/1 TAM istisna (Kanun hiç uygulanmaz) · m.28/2 KISMİ istisna (aydınlatma, haklar, sicil yok; zarar giderme kalır).
# Not: "açık rıza" iki satırda bilerek: m.3 tanım sorusu (Açık rıza:) / m.5 rızasız işleme hâlleri — şıkta hangisi geçiyorsa o.
# Not: tanım satırlarındaki iki nokta (Kurul:, Kişisel veri:) tanım sorusunu işaretler; her kökte geçen kanun adıyla karışmasın.
# Not: m.28/1-a metnine başka kanuna ait bir dipnot karışmış; o bölümün kanıtı dipnottan önce kesildi.
import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ortak import yaz
K = [
 # m.3 — tanımlar (tanım sorusu: terim → tanım · "ne ad verilir" sorusu: tanım → terim)
 ('3','tanim','özgür iradeyle açıklanan','açık rıza: belirli konu, bilgilendirilmeye dayanan','a) Açık rıza:','özgür iradeyle açıklanan rızayı,',[],'üç unsur birlikte; zımni, geçmiş, güncel rıza diye tanım yok'),
 ('3','tanim','Anonim hâle getirme:','gerçek kişiyle ilişkilendirilemez; eşleştirilse dahi','b) Anonim hâle getirme:','ilişkilendirilemeyecek hâle getirilmesini,',[],'başka verilerle eşleştirilerek dahi kimlik bulunamaz'),
 ('3','tanim','başka verilerle eşleştiril','anonim hâle getirme','b) Anonim hâle getirme:','ilişkilendirilemeyecek hâle getirilmesini,',[],'veri karartma, genelleştirme diye tanım yok'),
 ('3','tanim','İlgili kişi:','gerçek kişi; tüzel değil','ç) İlgili kişi:','işlenen gerçek kişiyi,',[],'kişisel verisi işlenen gerçek kişi'),
 ('3','tanim','Kişisel veri:','her türlü bilgi; gerçek kişi','d) Kişisel veri:','her türlü bilgiyi,',[],'kimliği belirli veya belirlenebilir gerçek kişiye ilişkin; tüzel kişi bilgisi değil'),
 ('3','tanim','Kişisel verilerin işlenmesi:','otomatik ya da kayıt sistemiyle her türlü işlem','e) Kişisel verilerin işlenmesi:','gerçekleştirilen her türlü işlemi,',[],'otomatik olmayan yol da girer; elde etme, kaydetme, depolama, aktarma, sınıflandırma'),
 ('3','tanim','Kurul:','Koruma Kurulu','f) Kurul:','Kişisel Verileri Koruma Kurulunu,',[],'tam adı Kişisel Verileri Koruma Kurulu'),
 ('3','tanim','Kurum:','Koruma Kurumu','g) Kurum:','Kişisel Verileri Koruma Kurumunu,',[],'tam adı Kişisel Verileri Koruma Kurumu; Başkan = Kurum Başkanı'),
 ('3','tanim','verdiği yetki','veri işleyen (sorumlu adına işler)','ğ) Veri işleyen:','gerçek veya tüzel kişiyi,',[('28', 'm.28/2-c: kanunun verdiği yetkiyle kamu kurumlarının denetleme ve disiplin işi')],'gerçek veya tüzel kişi; bordroyu talimatla işleyen muhasebe firması = veri işleyen'),
 ('3','tanim','amaçlarını ve vasıtalarını','veri sorumlusu; kayıt sistemini kurar-yönetir','ı) Veri sorumlusu:','gerçek veya tüzel kişiyi,',[],'veri işleyen ise onun verdiği yetkiyle, onun adına işler'),
 ('3','tanim','Veri kayıt sistemi:','kriterlere göre yapılandırılmış sistem','h) Veri kayıt sistemi:','işlendiği kayıt sistemini,',[],'tanımlarda Veri Sorumluları Sicili ve veri ihlali bildirimi YOK'),

 # m.4 — genel ilkeler
 ('4','kosul','ilkeler','hukuk-dürüstlük, doğru-güncel, meşru-amaç, sınırlı-ölçülü, gerekli-süre-muhafaza; açık rıza değil','(2) Kişisel verilerin işlenmesinde','süre kadar muhafaza edilme.',[('3','m.3 metninin sonunda m.4 başlığı “Genel ilkeler” yer alır'),('28','m.28/2: Kanunun amacına ve temel ilkelerine uygun olma kaydı')],'beş ilke; süresiz muhafaza, sürekli saklama ilke DEĞİL; açık rıza m.5 işleme şartıdır'),
 ('4','sayi_oran','uyulması zorunlu','beş ilke','(2) Kişisel verilerin işlenmesinde','süre kadar muhafaza edilme.',[],'her hâlde açık rıza alınması ilke sayılmaz'),
 ('4','kosul','uygun olarak işlenebilir','bu Kanun ve diğer kanunlar','(1) Kişisel veriler, ancak','uygun olarak işlenebilir.',[],'öngörülen usul ve esaslara uygun; yalnız bu Kanun değil'),

 # m.5 — genel veride açık rıza ve yedi istisna
 ('5','istisna','açık rıza','yedi: kanun, fiili-imkânsızlık, sözleşme, hukuki-yükümlülük, alenileştirme, hak-tesisi, meşru-menfaat','(2) Aşağıdaki şartlardan birinin','meşru menfaatleri için veri işlenmesinin zorunlu olması.',[('3','m.3/a: açık rızanın tanımı; belirli konu, bilgilendirme, özgür irade'),('6','m.6/3: özel nitelikli veride sekiz hâl; ilki açık rıza')],'kural rızasız işlenemez; özel nitelikli veride SEKİZ hâl, orada sözleşme ve meşru menfaat yok'),
 ('5','kosul','olmaksızın işlenemez','açık rızası (kural)','(1) Kişisel veriler ilgili kişinin açık rızası','olmaksızın işlenemez.',[],'istisnası ikinci fıkradaki yedi hâl'),
 ('5','istisna','rızasını açıklaya','fiili imkânsızlık; hayatı-beden bütünlüğü korunması','b) Fiili imkânsızlık nedeniyle','korunması için zorunlu olması.',[('6','m.6/3-c: özel nitelikli veride de aynı fiili imkânsızlık hâli')],'kendisinin ya da başkasının; baygın hasta, rızasına geçerlilik tanınmayan kişi'),
 ('5','istisna','kurulması veya ifası','sözleşme; taraflarına ait veri','c) Bir sözleşmenin kurulması','işlenmesinin gerekli olması.',[],'doğrudan doğruya ilgili olmak kaydıyla; sipariş-kargo örneği'),
 ('5','istisna','meşru menfaat','temel hak-özgürlüklere zarar vermemek','f) İlgili kişinin temel hak','işlenmesinin zorunlu olması.',[],'özel nitelikli veride meşru menfaat hâli YOK'),

 # m.6 — özel nitelikli kişisel veri
 ('6','tanim','özel nitelikli kişisel veri','ırk-etnik, siyasi-felsefi, din-mezhep, kılık, dernek-sendika, sağlık-cinsel, ceza, biyometrik-genetik; eğitim-adres yok','(1) Kişilerin ırkı','özel nitelikli kişisel veridir.',[('5','m.5 metninin sonunda m.6 başlığı yer alır')],'parmak izi = biyometrik; vakıf üyeliği, güvenlik tedbiri de; telefon, e-posta, eğitim durumu, ev adresi DEĞİL'),
 ('6','yasak','özel nitelikli kişisel verilerin','yasak; sekiz hâlde mümkün; Kurul’un yeterli önlemi şart; meşru-menfaat yok','(3) (Değişik:2/3/2024-7499/33 md.)','yeterli önlemlerin alınması şarttır.',[('5','m.5 metninin sonunda m.6 başlığı yer alır')],'genel veride YEDİ hâl; ikinci fıkra 7499 ile mülga'),
 ('6','istisna','koruyucu hekimlik','sır saklayanlar veya yetkili kurumlar','e) Sır saklama yükümlülüğü','amacıyla gerekli olması,',[],'kamu sağlığı, teşhis, tedavi, bakım; sağlık hizmeti planlama-finansman'),
 ('6','istisna','kâr amacı gütmeyen','üyelere; üçüncü kişilere açıklanmamak kaydıyla','g) Siyasi, felsefi, dini veya sendikal','yönelik olması,',[],'mevcut-eski üye ve düzenli temastakiler; faaliyet alanıyla sınırlı'),

 # m.7 — silme, yok etme, anonim hâle getirme
 ('7','kosul','gerektiren','silinir, yok edilir, anonimleştirilir; resen ya da talep üzerine','(1) Bu Kanun ve ilgili diğer kanun','anonim hâle getirilir.',[],'hukuka uygun işlenmiş olsa bile; veri sorumlusu yapar'),
 ('7','kosul','diğer kanunlarda yer alan','saklıdır','(2) Kişisel verilerin silinmesi','hükümler saklıdır.',[],'silme, yok etme, anonim hâle getirmeye dair hükümler'),
 ('7','makam','usul ve esaslar','yönetmelikle','(3) Kişisel verilerin silinmesine','yönetmelikle düzenlenir.',[('4','m.4/1: bu Kanun ve diğer kanunlardaki usul ve esaslara uygun işleme')],'silme, yok etme, anonim hâle getirme usulü'),

 # m.28 — istisnalar: (1) TAM, Kanun hiç uygulanmaz · (2) KISMİ, aydınlatma-haklar-sicil uygulanmaz
 ('28','istisna','hükümleri','hiç uygulanmaz: aile/istatistik/sanat-bilim/istihbari/yargı; aleni veri-suç önleme kısmi','(1) Bu Kanun hükümleri','aşağıdaki hâllerde uygulanmaz:',[('7', 'm.7/1: bu Kanun ve diğer kanun hükümlerine uygun işlenmiş veri')],'tam istisna beş hâl; kısmi istisnalar ayrı satırda (aydınlatma yükümlülüğü)'),
 ('28','istisna','önleyici, koruyucu','tam istisna; Kanun hiç uygulanmaz','ç) Kişisel verilerin millî savunmayı','istihbari faaliyetler kapsamında işlenmesi.',[],'kanunla görevli kamu kurumunun millî güvenlik, istihbarat faaliyeti'),
 ('28','istisna','veri güvenliği','aile içi: Kanun uygulanmaz; üçüncü kişiye verilmezse','a) Kişisel verilerin, üçüncü kişilere','tamamen kendisiyle',[],'gerçek kişinin kendisi veya aynı konutta yaşayan aile fertleriyle ilgili faaliyet (telefon rehberi)'),
 ('28','istisna','ifade özgürlüğü','ihlal etmemek, suç teşkil etmemek kaydıyla','c) Kişisel verilerin millî savunmayı','ifade özgürlüğü kapsamında işlenmesi.',[],'sanat, tarih, edebiyat, bilim; millî güvenlik, kamu düzeni, özel hayat, kişilik hakları'),
 ('28','istisna','suç işlenmesinin önlenmesi','kısmi: aydınlatma, haklar, sicil yok; zarar giderme kalır','(2) Bu Kanunun amacına','suç soruşturması için gerekli olması.',[],'m.10, m.11 (zararın giderilmesi hakkı hariç) ve m.16 uygulanmaz'),
 ('28','istisna','aydınlatma yükümlülüğü','kısmi: suç önleme, aleni veri, denetim-disiplin, bütçe-vergi','(2) Bu Kanunun amacına','çıkarlarının korunması için gerekli olması.',[],'amaca ve temel ilkelere uygun ve orantılı olmak kaydıyla'),
]
yaz(3, '6698 sayılı Kişisel Verilerin Korunması Kanunu', K)
