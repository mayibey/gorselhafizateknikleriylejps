# 4678 TSK'da İstihdam Edilecek Sözleşmeli Subay ve Astsubaylar Hakkında Kanun — kelime → cevap
import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ortak import yaz
K = [
 ('3','tanim','nasıp onayı tarihine kadar','ön sözleşme; askerî eğitime alınma','a) (Değişik: 16/6/2009-5907/1 md.) Ön sözleşme','kapsayan sözleşmeyi,',[],''),
 ('3','sure','hizmet yükümlülüğü getiren','sözleşme: üç yıldan az, dokuz yıldan fazla olmayan','b) Sözleşme : Türk','yazılı bir belgeyi,',[],''),
 ('4','sure','otuziki yaşını','lisansüstü mezunu sözleşmeli subay adayı yaş sınırı; lisans yirmiyedi','Sözleşmeli subay kaynaklarını','bitirmemiş olanlar teşkil eder.',[],'ocak ayının ilk günü; düzeltilmemiş nüfus kaydı'),
 ('4','sayi_oran','% 85 veya daha üstünde','TSK\'da/yedek subaylıkta sicil şartı','Türk Silahlı Kuvvetlerinde istihdam edilenler ile yedek subay','olması şarttır.',[('8','sözleşmeli astsubayda da aynı % 85 şartı')],'sıralı üstlerden olumlu nitelik belgesi de'),
 ('4','yasak','Askeri hakim sınıfına','sözleşmeli subay alınmaz','Askeri hakim sınıfına','personel alınmaz.',[],'TSK\'dan ilişiği kesilenler de alınmaz'),
 ('6','kosul','teğmen rütbesine nasbedilirler','askerî eğitimi başarıyla bitiren sözleşmeli subay adayı','Madde 6 – Sözleşmeli subay adayları','teğmen rütbesine nasbedilirler.',[('10','astsubay adayı: astsubay çavuş')],''),
 ('6','kosul','talebe bakılmaksızın uzatılabilir','seferberlik, savaş, alıkonulma; MSB ya da İçişleri onayı','Sözleşme süreleri; terörle mücadele','talebe bakılmaksızın uzatılabilir.',[('10','sözleşmeli astsubayda aynı kural')],'Kuvvet, JGK, SGK komutanının lüzum göstermesiyle'),
 ('7','sure','yedinci fiilî hizmet yılı','muvazzaf subaylığa başvuru başlangıcı; onikinci yıl sonuna kadar','Muvazzaf subaylığa geçiş için','istifa edemezler.',[('11','astsubay dördüncü yıldan başvurur')],'SUBAY YEDİDE, ASTSUBAY DÖRTTE BAŞVURUR'),
 ('7','sure','onbeş yıl hizmet etmedikçe istifa','muvazzaf subaylığa geçenler','Muvazzaf subaylığa geçiş için','istifa edemezler.',[('11','astsubaylıkta da onbeş yıl')],'yaş şartı uygulanmaz'),
 ('8','sure','yirmidört yaşını','dört yıldan az yükseköğrenimli astsubay adayı; dört yıl+ yirmiyedi','(Değişik birinci fıkra: 26/6/2012-6336/21 md.) Sözleşmeli astsubay kaynaklarını','bulunanlar teşkil eder.',[],''),
 ('8','kosul','aynı şartları haiz uzman erbaşlardan','sözleşmeli astsubay kaynağı','(Değişik birinci fıkra: 26/6/2012-6336/21 md.) Sözleşmeli astsubay kaynaklarını','bulunanlar teşkil eder.',[],'kısa dönem/erbaş-er terhisliler de olabilir'),
 ('10','kosul','astsubay çavuş rütbesine','eğitimi bitiren sözleşmeli astsubay adayı','Madde 10 – Sözleşmeli astsubay adayları','astsubay çavuş rütbesine nasbedilirler.',[],''),
 ('11','sure','dördüncü fiilî hizmet yılı','muvazzaf astsubaylığa başvuru; onikinci yıl sonuna kadar','Muvazzaf astsubaylığa geçiş için','istifa edemezler.',[('7','subay yedinci yıldan')],''),
 ('12','sure','en az üç ay önce','sözleşme yenileme bildirimi; yoksa kendiliğinden sona erer','Her sözleşme süresinin sona erme','kendiliğinden sona erer.',[],''),
 ('12','yasak','tek taraflı olarak fesh edemezler','sözleşmeli subay/astsubay, süre dolmadan','Sözleşmeli subay veya astsubaylar, sözleşme süreleri','fesh edemezler.',[],''),
 ('12','sure','iki katı kadar','yurt dışı altı ay+ öğrenim/kurs: sözleşme uzar','Subay veya astsubay nasbedildikten sonra','geçen süreler kadar uzatılır.',[],'yurt içi TSK hesabına öğrenim: geçen süre kadar'),
 ('12','sure','sürelerin yarısı kadar uzatılır','yurt içi tıp/diş uzmanlığı, doktora','hekimliğinde veya eczacılıkta','yarısı kadar uzatılır.',[],'YURT DIŞI İKİ KAT, YURT İÇİ BİR KAT, UZMANLIK YARIM'),
 ('12','istisna','devlet hizmet yükümlülüğüne tâbi olmazlar','sözleşmeli tabip subaylar (sözleşmesi feshedilenler hariç)','Sözleşme süresi sona ermeden sözleşmesi fesih','başlayabilirler.',[],'TUS kazanan üç yıl kıt\'a hizmetinden sonra uzmanlığa'),
 ('13','kosul','üçte birine','askeri eğitime katılmama: ön sözleşme feshi; kazayla bir kez tekrar','d) Askeri eğitimin üçte birine','eğitime alınırlar.',[],''),
 ('13','ceza','bir ay ve daha fazla','hürriyeti bağlayıcı ceza: sözleşme feshi (taksirli hariç)','e) Taksirli suçlar hariç','mahkum olmak.',[],''),
 ('13','sayi_oran','toplam sekiz defa','iki amirden bir yılda: fesih; otuz gün oda hapsi de','f) (Değişik: 31/1/2013-6413/45 md.) Son olarak verilen','disiplin cezası almak.',[],''),
 ('13','kosul','Milli Savunma Bakanlığınca uygun görülmemek','yabancıyla evlilik: sözleşme feshi','ı) Yabancı uyruklu','Türk vatandaşlığından çıkarılmak.',[],'vatandaşlık kaybı da'),
 ('13','sure','doksan günü geçmek','bir sözleşme yılında sıhhi izin: fesih (kaza, kanser vb. hariç)','hariç olmak kaydıyla, bir sözleşme yılı','doksan günü geçmek.',[],''),
 ('15','sure','rütbe verilmeksizin bir üst dereceye','subay onbeşinci, astsubay onsekizinci yılda; sicil yüzde altmış','Sözleşmeli subaylardan onbeşinci','bir yılını tamamlamış olmak.',[],'derecede üç yıl, üçüncü kademede bir yıl'),
 ('16','sure','en çok on yılı','idarece yenilenmeyenlerin sağlık hakkı; hizmet süresi kadar','a) Kendi kusurları olmaksızın','en çok on yılı,',[],''),
 ('16','sure','en çok beş yılı','kendi isteğiyle yenilemeyenler; hizmetin yarısı kadar','b) Sözleşme süresi sonunda kendi','en çok beş yılı,',[],'İDARE YENİLEMEDİ ON, KENDİ İSTEMEDİ BEŞ'),
 ('16','sure','oniki ayı geçmemek üzere tedavi','sağlıktan sözleşmesi bitenlere net maaşın üçte ikisi yardım','Sözleşmeleri sağlık nedeniyle sona erenlerden','kurumlarınca ödeme yapılır.',[],''),
 ('3', 'tanim', 'yürürlüğe girdiği ay ve günü', 'sözleşme yılı: bu tarihten itibaren geçen her bir yıllık süre', 'Sözleşme yılı: Sözleşmenin yürürlüğe', 'her bir yıllık süreyi,', [], ''),
]
yaz(13, "4678 sayılı TSK'da İstihdam Edilecek Sözleşmeli Subay ve Astsubaylar Hakkında Kanun", K)
