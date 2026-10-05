# 4678 TSK'da İstihdam Edilecek Sözleşmeli Subay ve Astsubaylar Hakkında Kanun — kelime → cevap
# KURAL (başkan, 4 Eki 2026): SOL = soru KÖKÜNDE göreceğin ifade, SAĞ = doğru ŞIKTA arayacağın kelime.
# Sorulardan geriye doğru yazıldı (116 cevaplı soru + kitapçık kökleri). Subay–astsubay tuzak çiftleri
# (7. / 4. yıl, teğmen / astsubay çavuş, 27-32 / 27-24 yaş, 15. / 18. yıl derece) aynı satırda yan yana.
import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ortak import yaz
K = [
 # m.3 — tanımlar
 ('3','tanim','Ön sözleşme:','askerî eğitim başından nasıp onayına; sonra asıl sözleşme','a) (Değişik: 16/6/2009-5907/1 md.) Ön sözleşme','kapsayan sözleşmeyi,',[],''),
 ('3','sure','hizmet yükümlülüğü','en az üç, en çok dokuz yıl','b) Sözleşme : Türk','yazılı bir belgeyi,',[('12','tabip subaylar devlet hizmet yükümlülüğüne tabi değil')],'eğitimi başaranla yapılan yazılı belge'),
 ('3','tanim','astsubay aday','ön sözleşmeyle askerî eğitime alınan','d) Sözleşmeli astsubay adayı','askerî eğitime alınanları,',[('10','astsubay adayı eğitimi bitirince astsubay çavuş'),('13','aday ön sözleşmesinin fesih sebepleri')],'subay adayı da aynı'),
 ('3','tanim','rütbe','subay: teğmen/üsteğmen/yüzbaşı; astsubay: çavuş→kıdemli üstçavuş; binbaşı YOK','e) Sözleşmeli subay : Bu Kanunda','kıdemli üstçavuş rütbelerini haiz astsubayları,',[('6', 'subay adayı teğmen rütbesine nasbedilir'), ('10', 'astsubay adayı astsubay çavuş rütbesine nasbedilir'), ('12', 'rütbe bekleme süreleri 926’ya göre'), ('15', 'rütbe verilmeksizin derece yükselmesi'), ('11', 'm.11 metninin sonunda sonraki bölüm başlığı yer alır')],'binbaşı ve başçavuş yok'),
 ('3','tanim','temel askerlik','subaylık veya astsubaylık anlayışı','g) (Değişik: 16/6/2009-5907/1 md.) Askeri eğitim','anlayışı kazandırma eğitimini,',[],'okul, kurum, sınıf okulu, kıta, eğitim merkezinde'),
 ('3','tanim','emsal','subay: harp okulu; astsubay: meslek yüksekokulu mezunu muvazzaf','h) (Ek: 16/6/2009-5907/1 md.) Emsal','mezun olan muvazzaf astsubayları,',[('12','emsalinden fazla okunan süre rütbe beklemeden düşülmez'),('15','emsali muvazzafın mali haklarından aynen yararlanır'),('16','sağlık yardımı emsalin net maaşının üçte ikisi')],'nasbedildikleri yıl mezun olanlar'),
 ('3','tanim','yürürlüğe girdiği ay ve günü','sözleşme yılı','ı) (Ek: 16/6/2009-5907/1 md.) Sözleşme yılı','her bir yıllık süreyi,',[],''),
 ('3','tanim','Sözleşme yılı:','yürürlük ay-gününden itibaren her bir yıl','ı) (Ek: 16/6/2009-5907/1 md.) Sözleşme yılı','her bir yıllık süreyi,',[],''),

 # m.4 — sözleşmeli subay kaynağı ve nitelikleri
 ('4','sure','Sözleşmeli subay kaynak','dört yıllık fakülte; yirmiyedi yaş (lisansüstü otuziki)','Sözleşmeli subay kaynaklarını','bitirmemiş olanlar teşkil eder.',[],'düzeltilmemiş nüfus kaydı, ocak ayının ilk günü'),
 ('4','sure','ocak ayının ilk günü','subay yirmiyedi (lisansüstü otuziki); astsubay yirmiyedi (önlisans yirmidört)','Sözleşmeli subay kaynaklarını','bitirmemiş olanlar teşkil eder.',[('8','astsubay: dört yıl+ yirmiyedi, daha az yirmidört')],'yaşını BİTİRMEMİŞ olmak'),
 ('4','yasak','Askeri okul','alınmaz; askerlik yapan-terhis eden olabilir','Askeri okullardan ve Türk Silahlı Kuvvetlerinden her ne','sözleşmeli subay olabilirler.',[('8','astsubayda istisna: kısa dönem ya da 1111’e tabi erbaş-er')],'her ne sebeple olursa olsun ilişiği kesilen'),
 ('4','kosul','Sözleşmeli subaylık için','vatandaşlık, öğrenim, sağlık, kamusal hak, güvenlik soruşturması, sınav','Sözleşmeli subaylık için genel olarak','g) Yapılacak olan sınavlarda başarılı olmak.',[],'sayılan suçlardan mahkûmiyet olmaması da'),
 ('4','kosul','hükmün açıklanmasının geri','yüz kızartıcı suçlar, firar, üste hakaret; taksirli suç yok','e) Cezaları ertelenmiş','mahkum olmamak.',[('8','astsubayda aynı liste'),('13','fesih sebebi: aynı suçlardan mahkûmiyet')],'ertelense, affa uğrasa da engel'),
 ('4','yasak','hakim sınıf','sözleşmeli subay alınmaz','Askeri hakim sınıfına','personel alınmaz.',[],''),
 ('4','yasak','statüsünde personel','askerî hâkim sınıfına alınmaz','Askeri hakim sınıfına','personel alınmaz.',[],''),

 # m.6 — subay sözleşme süreleri
 ('6','kosul','askerî eğitime alınır','ön sözleşme yapılarak; başarırsa sözleşme','Madde 6 – Sözleşmeli subay adayları','teğmen rütbesine nasbedilirler.',[('10','astsubay adayı da ön sözleşmeyle eğitime alınır')],''),
 ('6','kosul','nasbedilirler','subay teğmen; astsubay astsubay çavuş','Madde 6 – Sözleşmeli subay adayları','teğmen rütbesine nasbedilirler.',[('10','astsubay adayı astsubay çavuş rütbesine nasbedilir')],''),
 ('6','sure','Sözleşme süre','en az üç, en çok dokuz yıl; ayrıntısı yönetmelikte','Sözleşme süreleri üç yıldan az','yönetmelikte belirlenir.',[('10', 'astsubayda da üç-dokuz yıl'), ('12', 'sözleşme süreleri yurt dışı öğrenimde uzar'), ('8', 'm.8 metnindeki dipnotta bu ibare geçer'), ('13', 'm.13: sözleşme süresi bitmeden idarece fesih sebepleri'), ('16', 'm.16: sözleşme süresince sağlık ve sosyal haklar')],'kuvvet, sınıf, branş ve yetiştirme maliyetine göre; astsubayda da aynı'),
 ('6','kosul','talebe bakılmaksızın','savaş, seferberlik, alıkonma; komutan lüzumu, Milli Savunma-İçişleri onayıyla uzatılır','Sözleşme süreleri; terörle mücadele','talebe bakılmaksızın uzatılabilir.',[('10', 'astsubayda aynı kural')],'Kuvvet, Jandarma, Sahil Güvenlik komutanı lüzum gösterir; durum sürdükçe uzar'),
 ('6','kosul','rütbe yaş haddini','5434 sayılı Emekli Sandığı Kanunu','Ancak sözleşmeli subaylardan rütbe yaş','5434 sayılı Kanun hükümleri uygulanır.',[('10','astsubayda da 5434')],''),
 ('6','kosul','yenilenebilir','şartı taşıyanın talebiyle; yaş haddinde 5434 uygulanır','Yönetmelikte belirlenen şartları taşıyanların','Kanun hükümleri uygulanır.',[('10', 'astsubayda da talep hâlinde yenilenir'), ('16', 'yenilenmeyenlerin sağlık hakkı'), ('11', 'm.11 metninin sonunda sonraki bölüm başlığı yer alır')],''),

 # m.7 — muvazzaf subaylığa geçiş
 ('7','sure','fiilî hizmet yıl','subay yedinci, astsubay dördüncü yıldan; ikisi onikinciye kadar','Muvazzaf subaylığa geçiş için','bitimine kadar başvuru yapılabilir.',[('11', 'astsubay dördüncü yıldan onikinciye'), ('15', 'derece için subay onbeşinci, astsubay onsekizinci yıl')],'SUBAY 7-12 · ASTSUBAY 4-12'),
 ('7','sure','istifa','nasbedildikleri tarihten onbeş yıl (subay ve astsubay)','Bu şekilde muvazzaf subaylığa geçirilenler','istifa edemezler.',[('11','muvazzaf astsubaylıkta da onbeş yıl'),('13','orada istifade sözcüğü geçer, istifa kuralı yok'),('15','orada istifade sözcüğü geçer, istifa kuralı yok'),('16','orada istifade sözcüğü geçer, istifa kuralı yok')],''),
 ('7','istisna','öğretim üyesi','fiilî hizmet yılı şartı aranmaz','Türk Silahlı Kuvvetleri bünyesinde bulunan','şartı aranmaz.',[],'atamalı olarak görev yapanlar'),
 ('7','istisna','Muvazzaf subaylığa geçirileceklerde','926’nın yaş hükümleri uygulanmaz','Muvazzaf subaylığa geçirileceklerde','hükümler uygulanmaz.',[('11', 'astsubayda 926 m.68 yaş hükmü uygulanmaz')],''),

 # m.8 — sözleşmeli astsubay kaynağı
 ('8','sure','yükseköğrenim','dört yıl+ yirmiyedi, daha az yirmidört yaş','(Değişik birinci fıkra: 26/6/2012-6336/21 md.) Sözleşmeli astsubay kaynaklarını','bulunanlar teşkil eder.',[],'subayda lisans yirmiyedi, lisansüstü otuziki'),
 ('8','kosul','astsubay kaynak','fakülte-MYO mezunu ve aynı şartlı uzman erbaş','(Değişik birinci fıkra: 26/6/2012-6336/21 md.) Sözleşmeli astsubay kaynaklarını','bulunanlar teşkil eder.',[],'uzman erbaş yalnız astsubay kaynağında'),
 ('8','sayi_oran','sicil tam notu','yüzde 85 ve üstü; sıralı üstlerden olumlu nitelik belgesi','Türk Silahlı Kuvvetlerinde istihdam edilenler ile yedek astsubay','almaları zorunludur.',[('4','sözleşmeli subayda da % 85 ve nitelik belgesi'),('15','derece yükselmede sicil ortalaması % 60')],''),

 # m.10-11 — astsubay sözleşme süreleri ve muvazzaflığa geçiş
 ('10','kosul','astsubay çavuş rütbesine','askerî eğitimi bitiren sözleşmeli astsubay adayı','Madde 10 – Sözleşmeli astsubay adayları','astsubay çavuş rütbesine nasbedilirler.',[],'subay adayı teğmen'),
 ('11','sure','muvazzaf astsubaylığa','geçiş: talep edene; dördüncü fiilî hizmet yılı → onikinci (dört-oniki)','Sözleşmeli astsubaylardan yönetmelikte','bitimine kadar başvuru yapılabilir.',[('10', 'm.10 metninin başında bölüm başlığı yer alır'), ('12', 'muvazzaf astsubaylığa geçende fazla okunan süre düşülür')],'subay yedinci yıldan'),

 # m.12 — rütbe bekleme, yenileme, uzama
 ('12','sure','yenileyeceklerine dair','en az üç ay önce yazılı; yoksa kendiliğinden sona erer','Her sözleşme süresinin sona erme','kendiliğinden sona erer.',[],''),
 ('12','yasak','tek taraflı','süre bitmeden feshedemez','Sözleşmeli subay veya astsubaylar, sözleşme süreleri','fesh edemezler.',[],''),
 ('12','yasak','sona ermeden','tek taraflı feshedemezler','Sözleşmeli subay veya astsubaylar, sözleşme süreleri','fesh edemezler.',[],''),
 ('12','sure','rütbe bekleme süreleri','926 sayılı Kanunda muvazzaflar için olan süreler (27.7.1967)','Madde 12 – Sözleşmeli subay ve astsubayların rütbe','belirlenen süreler uygulanır.',[('11','m.11 metninin sonunda sonraki bölüm başlığı yer alır')],''),
 ('12','kosul','kadro açığı','sözleşme sonuna kadar derece ilerlemesi','Sözleşmeli subaylardan üst rütbede kadro açığı','derece ilerlemesi yaparlar.',[],'terfi şartlarını taşıyorsa'),
 ('12','sure','kurs','yurt dışı altı ay+: sürenin iki katı uzar','Subay veya astsubay nasbedildikten sonra; yabancı','geçen sürenin iki katı kadar;',[],'TSK hesabına yurt içi öğrenim: geçen süre kadar'),
 ('12','sure','sürekli göreve','devraldığı-devrettiği tarihler arası kadar uzar','Yurt dışına sürekli göreve atanan','tarihler arasındaki süre kadar,',[],''),
 ('12','sure','doktora eğitimini','sürelerin yarısı kadar uzar','hekimliğinde veya eczacılıkta doktora','yarısı kadar uzatılır.',[],'tıpta uzmanlık da yarısı kadar'),
 ('12','sure','aylıksız izin','izin süresi kadar uzar','926 sayılı Türk Silahlı Kuvvetleri Personel Kanunu hükümlerine göre aylıksız','izin süresi kadar uzatılır.',[('13','doğum izni (aylıklı ya da aylıksız) sıhhi izin hesabına girmez')],'YURT DIŞI İKİ KAT · YURT İÇİ BİR KAT · UZMANLIK YARIM'),
 ('12','sure','uzatılan sözleşme süreleri','5434’teki rütbe yaş haddini geçemez','Sözleşmeli subay ve astsubayların, yurt içi','yaş haddini geçemez.',[],''),
 ('12','istisna','tabip subaylar','devlet hizmet yükümlülüğü YOK; uzmanlığa üç yıl kıta hizmetinden sonra','Sözleşme süresi sona ermeden sözleşmesi fesih','uzmanlık eğitimine başlayabilirler.',[],'sözleşmesi süresinden önce feshedilenler hariç'),

 # m.13 — idarece fesih
 ('13','kosul','askeri eğitimin','üçte birine katılmamak; kazada bir kez tekrar','d) Askeri eğitimin üçte birine','eğitime alınırlar.',[],'ön sözleşme feshi'),
 ('13','sayi_oran','oda hapsi','bir yılda otuz gün; ya da iki amirden sekiz ceza','f) (Değişik: 31/1/2013-6413/45 md.) Son olarak','daha fazla disiplin cezası almak.',[],'hizmet yerini terk etmeme cezası da'),
 ('13','sayi_oran','disiplin amirinden','bir yılda toplam sekiz defa','f) (Değişik: 31/1/2013-6413/45 md.) Son olarak','daha fazla disiplin cezası almak.',[],'en az iki amirden'),
 ('13','sure','hava değişimi','doksan gün; yatarak tedavi, doğum izni, görev kazası hariç','3) Tedavi kurumlarında yatarak','doksan günü geçmek.',[('16','sıhhi izinle sözleşmesi bitenin sağlık hakkı')],'bir sözleşme yılında'),
 ('13','kosul','hürriyeti bağlayıcı','bir ay ve fazlası (taksirli hariç)','e) Taksirli suçlar hariç','cezaya mahkum olmak.',[],''),
 ('13','kosul','Yabancı uyruklu','evliliği Milli Savunma uygun görmezse fesih; vatandaşlık kaybı da','ı) Yabancı uyruklu','Türk vatandaşlığından çıkarılmak.',[],''),
 ('13','kosul','yıkıcı, bölücü','yasadışı faaliyet: fesih sebebi','g) Yasadışı siyasi','tespit edilmek.',[],'irticai faaliyet de'),
 ('13','kosul','Terörle Mücadele Kanunu','malul istekli uzatılabilir (faydalı, uygun, sağlıklı)','Sözleşmeli subay ve astsubaylardan 12/4/1991','şartıyla uzatılabilir.',[],''),

 # m.15-16 — aylık, derece, sağlık hakları
 ('15','kosul','malî ve sosyal hak','emsal muvazzafın haklarından aynen','Sözleşmeli subay ve sözleşmeli astsubaylar, emsali rütbe','aynen istifade ederler.',[],''),
 ('15','sure','rütbe verilmeksizin','subay onbeşinci, astsubay on sekizinci yıl; sicil yüzde 60','Sözleşmeli subaylardan onbeşinci','bir yılını tamamlamış olmak.',[],'derecede üç yıl, üçüncü kademede bir yıl'),
 ('15','sure','müteakip yıllarda','her yıl kademe; şartlıysa üç yılda bir derece','Bunlara, müteakip yıllarda','derece ilerlemesi yaptırılır.',[],''),
 ('16','sure','Sözleşme süresi sonunda','kendi isteğiyle yenilemeyene: hizmetin yarısı kadar, en çok beş yıl','b) Sözleşme süresi sonunda kendi','en çok beş yılı,',[],'İDARE YENİLEMEZSE ON · KENDİ İSTEMEZSE BEŞ'),
 ('16','sure','kusur','hizmet süresi kadar, en çok on yıl','a) Kendi kusurları olmaksızın','en çok on yılı,',[],'idare yenilemediyse'),
 ('16','istisna','ücretsiz','başka kurumdan hakkı doğan yararlanamaz','ücretsiz olarak verilmeye','asker hastanelerinden yararlanamazlar.',[],''),
 ('16','sayi_oran','sağlık yardımı','oniki ayı geçmez; emsal net maaşın 2/3’ü; kesinti yok','Sözleşmeleri sağlık nedeniyle sona erenlerden','Bu ödemeden hiçbir kesinti yapılmaz.',[],''),
 ('16','kosul','sosyal hakları ve sağlık işlemlerinde','211 sayılı Kanunun muvazzaf hükümleri','Sözleşmeli subay ve sözleşmeli astsubaylar ile bunların','hükümleri uygulanır.',[],'sözleşme süresince'),
]
yaz(13, "4678 sayılı TSK'da İstihdam Edilecek Sözleşmeli Subay ve Astsubaylar Hakkında Kanun", K)
