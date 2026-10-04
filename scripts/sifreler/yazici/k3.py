# 6698 KVKK — kelime → cevap
import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ortak import yaz
K = [
 ('3','tanim','özgür iradeyle açıklanan','açık rıza (tanım)','a) Açık rıza','özgür iradeyle açıklanan rızayı,',[],'belirli konu + bilgilendirme + özgür irade'),
 ('3','tanim','amaçlarını ve vasıtalarını belirleyen','veri sorumlusu','ı) Veri sorumlusu','gerçek veya tüzel kişiyi,',[('3','veri işleyen: sorumlunun yetkisiyle onun adına işleyen')],'kayıt sisteminin kurulmasından sorumlu'),
 ('3','tanim','onun adına kişisel verileri işleyen','veri işleyen','ğ) Veri işleyen','gerçek veya tüzel kişiyi,',[],''),
 ('3','tanim','başka verilerle eşleştirilerek dahi','anonim hâle getirme','b) Anonim hâle getirme','ilişkilendirilemeyecek hâle getirilmesini,',[],'kimlikle ilişkilendirilemez'),
 ('4','kosul','ilkelere uyulması zorunludur','dürüstlük, doğru-güncel, belirli-açık-meşru amaç, sınırlı-ölçülü, gerekli süre','(2) Kişisel verilerin işlenmesinde','süre kadar muhafaza edilme.',[],'beş genel ilke'),
 ('5','istisna','açık rızası aranmaksızın','kanun, fiili imkânsızlık, sözleşme, hukuki yükümlülük, alenileştirme, hak, meşru menfaat','(2) Aşağıdaki şartlardan','meşru menfaatleri için veri işlenmesinin zorunlu olması.',[],'yedi hal'),
 ('5','istisna','kendisi tarafından alenileştirilmiş olması','alenileştirilmiş veri: açık rıza aranmaz','d) İlgili kişinin kendisi','alenileştirilmiş olması.',[],''),
 ('5','istisna','meşru menfaatleri','açık rıza aranmaz; temel haklara zarar vermemek kaydıyla','f) İlgili kişinin temel hak','zorunlu olması.',[],'veri sorumlusunun meşru menfaati'),
 ('6','tanim','kılık ve kıyafeti','özel nitelikli kişisel veri','(1) Kişilerin ırkı','özel nitelikli kişisel veridir.',[],'ırk, etnik köken, siyasi düşünce, inanç, din, dernek-vakıf-sendika üyeliği, sağlık, cinsel hayat, ceza mahkûmiyeti'),
 ('6','tanim','biyometrik ve genetik','özel nitelikli kişisel veri','(1) Kişilerin ırkı','özel nitelikli kişisel veridir.',[],''),
 ('6','yasak','işlenmesi yasaktır','özel nitelikli veri; ancak sayılan hallerde mümkün','(3) (Değişik:2/3/2024-7499/33 md.) Özel nitelikli','işlenmesi yasaktır.',[],'açık rıza, kanun, fiili imkânsızlık, alenileştirme, hak, sağlık (sır saklayanlar), istihdam-sosyal güvenlik, vakıf-dernek üyeleri'),
 ('6','istisna','Sır saklama yükümlülüğü altında','sağlık verisi işlenebilir: koruyucu hekimlik, teşhis, tedavi','e) Sır saklama','amacıyla gerekli olması,',[],'sağlık hizmetlerinin planlanması, finansmanı da'),
 ('6','istisna','kâr amacı gütmeyen','vakıf, dernek: üyelerine yönelik özel veri işleyebilir','g) Siyasi, felsefi, dini veya sendikal','yönelik olması,',[],'üçüncü kişilere açıklanmamak kaydıyla'),
 ('6','makam','yeterli önlemlerin','Kurul belirler; özel nitelikli veri için','(4) Özel nitelikli','alınması şarttır.',[],''),
 ('7','kosul','sebeplerin ortadan kalkması','silinir, yok edilir veya anonim hâle getirilir','(1) Bu Kanun ve ilgili','anonim hâle getirilir.',[],'resen ya da ilgili kişinin talebiyle; veri sorumlusu'),
 ('28','istisna','konutta yaşayan aile fertleriyle','aile içi faaliyet; Kanun kapsamı dışında','konutta yaşayan aile','faaliyetler kapsamında işlenmesi.',[],'üçüncü kişiye verilmemek kaydıyla'),
 ('28','istisna','önleyici, koruyucu ve istihbari','Kanun uygulanmaz; kamu kurumlarının önleyici faaliyeti','ç) Kişisel verilerin millî savunmayı','istihbari faaliyetler kapsamında işlenmesi.',[],'millî savunma, güvenlik, kamu düzeni, ekonomik güvenlik'),
 ('28','istisna','talep etme hakkı hariç','kısmi istisnada tazminat hakkı kalır; aydınlatma, haklar, sicil uygulanmaz','(2) Bu Kanunun amacına','aşağıdaki hâllerde uygulanmaz:',[],'m.10, 11, 16'),
 ('28','istisna','disiplin soruşturma veya kovuşturması','denetleme, düzenleme, disiplin: aydınlatma ve haklar kısmen uygulanmaz','c) Kişisel veri işlemenin kanunun','kovuşturması için gerekli olması.',[],'suç önleme/soruşturma, alenileştirilmiş veri, bütçe-vergi de'),
 ('6', 'tanim', 'sendika üyeliği, sağlığı', 'özel nitelikli; ırk, etnik köken, siyasi düşünce, inanç, din, kılık-kıyafet', '(1) Kişilerin ırkı, etnik kökeni', 'özel nitelikli kişisel veridir.', [], 'eğitim durumu listede YOK'),
 ('6', 'tanim', 'ceza mahkûmiyeti ve güvenlik tedbirleriyle', 'özel nitelikli; sağlık, cinsel hayat, dernek-vakıf-sendika üyeliği, biyometrik, genetik', '(1) Kişilerin ırkı, etnik kökeni', 'özel nitelikli kişisel veridir.', [], ''),
]
yaz(3, '6698 sayılı Kişisel Verilerin Korunması Kanunu', K)
