# Sözleşmeli Subay ve Astsubay Yönetmeliği — kelime → cevap
# KURAL (başkan, 4 Eki 2026): SOL = soru KÖKÜNDE göreceğin ifade, SAĞ = doğru ŞIKTA arayacağın kelime.
# Sorulardan geriye doğru yazıldı (147 cevaplı soru + kitapçık kökleri). Metinde kesilen kısımlar
# (m.8/m.11 engel hâllerinin devamı: soruşturma, görevden uzaklaştırma) yazılmadı.
# Tuzak çiftleri: adaylıkta sicil %85 / muvazzaflığa geçişte %90 · subay 7. yıl / astsubay 4. yıl ·
#                 dilekçe 6 ay önce / bildirim 3 ay önce · ilk sözleşme Temin Merkezi / sonrakiler Tayin Dairesi.
import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ortak import yaz
K = [
 # m.3 — tanımlar
 ('3','tanim','kararnamesinin onay tarihine','ön sözleşme (eğitim başı → nasıp onayı)','a ) (Değişik:RG-11/2/2010-27490) Ön sözleşme','kapsayan sözleşmeyi (EK-A, EK-B),',[],'asıl sözleşme eğitimi bitirenle 3-9 yıl'),
 ('3','sure','hizmet yükümlülüğü','en az üç, en çok dokuz yıl','b) Sözleşme: Türk','yazılı bir belgeyi,',[('13','tabip subaylar devlet hizmet yükümlülüğüne tabi değil'),('6','tabip devlet hizmet yükümlülüğü saklı tutulur')],''),
 ('3','tanim','olmak için müracaat etmiş','aday adayı (ön sözleşme henüz yok)','c) Sözleşmeli Subay/Astsubay Aday Adayı','yapılmamış olanları,',[],''),
 ('3','tanim','yetiştirilmek amacıyla ön sözleşme','subay adayı / astsubay adayı','ç) Sözleşmeli Subay Adayı','askeri eğitime alınanları,',[],'ön sözleşmeyle eğitime alınan'),
 ('3','tanim','rütbe','subay: teğmen/üsteğmen/yüzbaşı; astsubay: çavuş→kıdemli üstçavuş; binbaşı-başçavuş YOK','e) Sözleşmeli Subay:','kıdemli üstçavuş rütbelerini haiz astsubayları,',[('8', 'raportör herhangi bir rütbeden olabilir'), ('11', 'raportör herhangi bir rütbeden olabilir'), ('13', 'rütbe bekleme 926’ya göre'), ('14', 'uzatma rütbe yaş haddini geçemez'), ('32', 'üst rütbeye yükselmede nasıp 30 Ağustos')],''),
 ('3','tanim','emsal','subay: harp okulu; astsubay: meslek yüksekokulu mezunu muvazzaf','ğ) (Ek:RG-11/2/2010-27490) Emsal','mezun olan muvazzaf astsubayları,',[('13','emsalinden fazla okunan süre rütbe beklemeden düşülmez'),('22','sağlık yardımı emsalin net maaşının üçte ikisi')],''),
 ('3','tanim','Sözleşme yılı:','yürürlük ay-gününden her bir yıllık süre','h) (Ek:RG-11/2/2010-27490) Sözleşme yılı','her bir yıllık süreyi,',[],''),
 ('3','tanim','mesleki sınav','yazılı, mülakat, fiziki yeterlilik testi','ı) (Ek:RG-11/2/2010-27490) (Değişik:RG-1/10/2025-33034) Mesleki sınav','değerlendirme testini,',[('8','muvazzaf subaylığa geçişte mesleki sınav şartı'),('11','muvazzaf astsubaylığa geçişte mesleki sınav şartı')],'muvazzaflığa geçişte'),

 # m.5-6 — kaynak ve subay adayı nitelikleri
 ('5','sure','ayının ilk günü','Ocak; subay yirmiyedi-otuziki; astsubay yirmiyedi-yirmidört','(Değişik fıkra:RG-27/3/2013-28600)Sözleşmeli subay kaynaklarını','otuz iki yaşını bitirmemiş olanlar',[('6', 'subay adayı niteliklerinde aynı yaş kuralı'), ('9', 'astsubay adayı: dört yıl+ yirmi yedi, azı yirmi dört')],'yaş hesabı: düzeltilmemiş nüfus kaydıyla, müracaat yılının Ocak ilk günü itibarıyla BİTİRMEMİŞ olmak'),
 ('5','yasak','askerî okul','ilişiği kesilen alınmaz/alınamaz; yedek, kısa dönem, 1111 terhisli olabilir','Askerî okullardan ve Türk Silahlı','sözleşmeli subay veya astsubay olabilirler.',[],'her ne sebeple olursa olsun ilişiği kesilen'),
 ('5','yasak','sözleşmeli subay statüsünde personel','askerî hâkim sınıfına alınmaz','Askerî hâkim sınıfına','personel alınmaz.',[],''),
 ('6','sure','subay adaylarında','aranan: yirmi yedi yaş (lisansüstü otuz iki); dört yıllık fakülte','Sözleşmeli subay adaylarında aranacak','yüksekokul mezunu olmak.',[('9', 'astsubay adayında yaş dört yıl+ yirmi yedi, azı yirmi dört')],'Türk vatandaşı, sağlık, güvenlik soruşturması da'),
 ('6','sayi_oran','fakülte veya yüksekokul','en az 4 yıl süreli (astsubayda MYO da)','3) En az 4 yıl süreli','yüksekokul mezunu olmak.',[('5','subay kaynağı en az dört yıllık fakülte-yüksekokul')],''),
 ('6','sayi_oran','aldıkları sicil','%85 ve üstü; sıralı üstlerden olumlu nitelik belgesi','c) (Ek:RG-11/2/2010-27490) Türk Silahlı Kuvvetlerinde istihdam','almaları zorunludur.',[('9','astsubay adayında da % 85 ve nitelik belgesi')],'muvazzaflığa geçişte %90'),
 ('6','kosul','Öğrenimini kendi adına yapmış olmak','askerlik ve tabip devlet hizmet yükümlülüğü saklı','9) (Ek:RG-19/6/2013-28682)Öğrenimini kendi','hükümler saklıdır).',[('9', 'astsubay adayında da aynı şart')],'kuruma hizmet-tazminat borcu olmamalı'),
 ('6','kosul','özel kuvvetler kursu','doğrudan ÖKK’ya alınacakta özel sağlık şartı','(Ek cümle:RG-23/7/2015-29423)Doğrudan Özel Kuvvetler','sağlık şartlarına sahip olmak.',[('9','astsubay adayında da aynı'),('15','ÖKK eğitiminde başarısızlık fesih sebebi')],''),

 # m.8 — muvazzaf subaylığa geçiş
 ('8','sure','muvazzaf subaylığa','geçiş: yedinci (yedi) yıla başlamış, onikinciyi bitirmemiş; mesleki sınav','Muvazzaf subaylığa geçişle ilgili','bitirmemiş olmak.',[('13', 'muvazzafa geçende fazla okunan süre rütbe beklemeden düşülür')],'SUBAY 7 · ASTSUBAY 4'),
 ('8','sayi_oran','ortalama','sicil ortalaması %90 ve üstü','3) Başvurduğu yıla kadar','daha fazlası olmak.',[('11','muvazzaf astsubaylıkta da %90')],'adaylıkta %85'),
 ('8','sira_usul','aşama','yazılı, fiziki yeterlilik testi, mülakat','1) Muvazzaf subaylığa geçiş sınavları','üç aşamalı yapılır.',[('11','astsubayda da üç aşama'),('9','seçim ve sınav aşamalarında başarılı er-erbaşa öncelik')],''),
 ('8','sayi_oran','üç bin metre','her testte en az elli; ortalama altmış','3) Fiziki yeterlilik ve değerlendirme testinden','en az altmış puan olması gerekir.',[('11','astsubayda da aynı')],'şınav, mekik, üç bin metre'),
 ('8','sayi_oran','en az üç doktor','heyet raporuyla iki test üzerinden değerlendirilir','Sağlık sorunu nedeniyle herhangi bir teste','iki test üzerinden yapılır.',[('11','astsubayda da aynı')],'iki teste girmeyen başarısız'),
 ('8','sayi_oran','Heyet, biri başkan olmak üzere','en az üç, en çok beş kişiden oluşur','Heyet, biri başkan','en çok beş kişiden oluşur.',[('11', 'astsubayda da aynı')],'oy hakkı olmayan raportör olabilir'),
 ('8','sayi_oran','Mülakat sınavına katılan adayın','asgari yetmiş puan','Mülakat sınavına katılan adayın','şartı aranır.',[('11', 'astsubayda da yetmiş')],''),
 ('8','sayi_oran','başarı sıralamasına esas','yazılı %55, fiziki %15, mülakat %30; ceza puanı ×0,118','6) Başarı sıralamasına esas değerlendirme notu','ceza puanı olarak düşülmesi ile belirlenir.',[('11','astsubayda da aynı oranlar')],'YAZILI 55 · FİZİKİ 15 · MÜLAKAT 30'),
 ('8','sayi_oran','katsayı','0,118 ile çarpılıp ceza puanı olarak düşülür','6) Başarı sıralamasına esas değerlendirme notu','ceza puanı olarak düşülmesi ile belirlenir.',[('11','astsubayda da 0,118')],''),
 ('8','sayi_oran','komando temel kursunu','üç puan; ihtisas kursuna iki puan daha','Bu nota komando temel kursunu','ilave edilir.',[('11', 'astsubayda da aynı')],''),
 ('8','sayi_oran','Terörle Mücadele Kanunu kapsamında','malul olup göreve devam edene ilave on puan','12/4/1991 tarihli ve 3713 sayılı Terörle','ilave on puan verilir.',[('11','astsubayda da on puan')],''),
 ('8','sayi_oran','hamile','yazılı %63, mülakat %37 (fiziki yok)','7) Fiziki yeterlilik ve değerlendirme testine katılmasına','hesaplanır.',[('11','astsubayda da aynı')],'harp/vazife malulü de'),
 ('8','sira_usul','notlarının eşitliği halinde','üstünlük sırası: yazılı notu, sicil ortalaması, fiili hizmet, kıdem','8) Başarı sıralamasına esas değerlendirme notlarının','öncelik tanınır.',[('11', 'astsubayda da aynı')],''),
 ('8','sayi_oran','disiplin cezası','bir yıl: on puan-dört ceza; üç yıl: yirmi puan-sekiz ceza','1) En son alınan disiplin cezasının','toplam sekiz defa',[('11', 'muvazzaf astsubaylıkta da aynı eşik'), ('15', 'fesih: bir yılda iki amirden sekiz ceza')],'en az iki farklı amirden'),

 # m.9 — astsubay adayı nitelikleri
 ('9','sure','yüksek öğrenim','dört yıl+ yirmi yedi; daha az yirmi dört','2) (Değişik:RG-27/3/2013-28600) Düzeltilmemiş','yirmi dört yaşını bitirmemiş olmak.',[('5','astsubay kaynağında da aynı yaşlar')],'subayda yirmi yedi, lisansüstü otuz iki'),
 ('9','kosul','öğrenim','astsubay: Genelkurmay branşında fakülte-MYO; subay: lisans fakülte','2) (Değişik:RG-27/3/2013-28600) Düzeltilmemiş','meslek yüksekokullardan mezun olmak.',[('5','yüksek öğrenim süresine göre yaş'),('6','subay adayı öğrenimini kendi adına yapmış olmalı'),('13','fazla öğrenim süresi rütbe beklemeden düşülür'),('14','yurt dışı öğrenimde sözleşme iki katı uzar')],''),
 ('9','kosul','öncelikli olarak tercih','eşit puanda sözleşmeli er-erbaş kökenli aday','(Ek fıkra:RG-17/5/2011-27937) Sözleşmeli erbaş','öncelikli olarak tercih edilir.',[],''),

 # m.11 — muvazzaf astsubaylığa geçiş
 ('11','sure','muvazzaf astsubaylığa','geçiş: dördüncü yıla başlamış, onikinciyi bitirmemiş; nitelik belgesi, mesleki sınav','Muvazzaf astsubaylığa geçiş ile ilgili','bitirmemiş olmak.',[('13', 'muvazzaf astsubaylığa geçende fazla okunan süre düşülür')],'subay yedinci yıldan'),

 # m.12-13 — sözleşme süresi, rütbe bekleme
 ('11','sure','fiili hizmet yılına başlamış','subay yedinci, astsubay dördüncü yıla başlamış','Muvazzaf astsubaylığa geçiş ile ilgili','bitirmemiş olmak.',[('8','muvazzaf subaylığa geçişte yedinci yıl')],'ikisi de on ikinci yılı bitirmemiş'),
 ('12','sure','Sözleşme süreleri','en az üç, azami dokuz yıl; sınıf-branş yönergesiyle komutanlıklar','Madde 12 - Sözleşme süreleri en az üç yıl','ayrıca belirleyebilirler.',[('14','sözleşme süreleri yurt dışı öğrenimde iki katı uzar'),('15','sözleşme süreleri bitmeden tek taraflı fesih yok')],'sınırlar yönergeyle aşılamaz'),
 ('13','kosul','rütbe bekleme süreleri','926 sayılı Kanunda muvazzaflar için olan süreler','Madde 13 - Sözleşmeli subayların','belirlenen süreler uygulanır.',[],'RÜTBE 926 · SAĞLIK 211'),
 ('13','kosul','kadro açığı','terfi şartlarını haizse sözleşme sonuna kadar derece ilerlemesi','Sözleşmeli subaylardan üst rütbede kadro açığı','derece ilerlemesi yaparlar.',[],''),
 ('13','kosul','seviyede birden fazla yapılan eğitimler','rütbe bekleme süresinden düşülmez','Aynı seviyede birden fazla','düşme yapılmaz.',[],''),
 ('13','sure','Fazla öğrenim süreleri','fazla bir yıl→bir; fazla iki yıl→2 ya da 1+1','Fazla öğrenim süreleri;','bir sonraki rütbede ise 1 yıldır.',[],'iki yılda birer yıl müspet sicil şartı'),
 ('13','istisna','tabip subaylar','devlet hizmet yükümlülüğü YOK; uzmanlığa üç yıl kıta hizmetinden sonra','Sözleşme süresi sona ermeden sözleşmesi fesih','uzmanlık eğitimine başlayabilirler.',[],'sözleşmesi feshedilenler hariç'),

 # m.14 — yenileme ve uzatma
 ('14','sira_usul','sözleşmesini yenilemek','isteyenler: altı ay önceden dilekçeyle ilk amirine','a) Sözleşmeli subay ve astsubaylardan, sözleşmesini yenilemek','ilk amirine müracaat eder.',[],'DİLEKÇE 6 AY · BİLDİRİM 3 AY'),
 ('14','sira_usul','Sözleşmenin yenilenmesi ve uzatılması','dilekçe ilk amire (Genelkurmay’a değil); nihai karar komutanlık','Madde 14 - Sözleşmenin yenilenmesi','Sahil Güvenlik Komutanlığına gönderilir.',[],'EK-C nitelik belgesiyle, silsile yoluyla'),
 ('14','makam','nihai karar','Kuvvet Komutanlığı, Jandarma Genel Komutanlığı, Sahil Güvenlik Komutanlığı verir','Sözleşmenin yenilenip yenilenmemesi konusundaki nihai','tarafından verilir.',[],'komisyon değerlendirir'),
 ('14','sure','gidiş ve dönüş','altı ay+ yurt dışı: geçen sürenin iki katı','c) Sözleşmeli subay ve astsubay nasbedildikten','geçen sürenin iki katı kadar;',[],'yurt içi TSK hesabına öğrenim: geçen süre kadar'),
 ('14','sure','yabancı memleket','altı ay veya daha uzun; süre iki katı uzar','c) Sözleşmeli subay ve astsubay nasbedildikten','geçen sürenin iki katı kadar;',[],''),
 ('14','sure','sözleşmeyi yenileyeceklerine dair','en az üç ay önce yazılı; yoksa kendiliğinden sona erer','d) Her sözleşme süresinin sona erme','kendiliğinden sona erer.',[],''),
 ('14','sure','kendiliğinden sona erer','üç ay önce yazılı bildirim (dilekçe altı ay önce)','d) Her sözleşme süresinin sona erme','kendiliğinden sona erer.',[],''),
 ('14','sure','Yurtdışına sürekli göreve atanan','devraldığı-devrettiği tarihler arası kadar uzar','e) Yurtdışına sürekli göreve','süre kadar uzatılır.',[],''),
 ('14','sure','uzatılan sözleşme süreleri','5434’teki rütbe yaş haddini geçemez','f) Sözleşmeli subay ve astsubayların, yurtiçi','yaş haddini geçemez.',[],''),
 ('14','sure','aylıksız izin','izin süresi kadar uzar','g) (Ek:RG-28/2/2014-28927 Mükerrer)926 sayılı','izin süresi kadar uzatılır.',[('15','doğum izni sıhhi izin hesabına girmez')],''),
 ('14','sure','kuvvet değiştirerek','önceki sözleşmenin kalan kısmı kadar','ğ ) (Ek:RG-18/3/2016-29657)926 sayılı Kanunun 24','kalan kısmı kadardır.',[],''),

 # m.15 — fesih
 ('15','yasak','tek taraflı','süre bitmeden feshedemez','MADDE 15 – (Değişik:RG-11/2/2010-27490) Sözleşmeli subay','tek taraflı olarak feshedemezler.',[],''),
 ('15','yasak','sözleşme süreleri sona ermeden','tek taraflı feshedemezler','MADDE 15 – (Değişik:RG-11/2/2010-27490) Sözleşmeli subay','tek taraflı olarak feshedemezler.',[('13', 'sözleşmesi süre bitmeden feshedilen tabip devlet hizmetine tabi')],''),
 ('15','kosul','adaylarının ön sözleşmeleri','başarısızlık/disiplinsizlik/sağlık kurulu/şart kaybı/üçte bir devamsızlık; yüz kızartıcı DEĞİL','Sözleşmeli subay veya sözleşmeli astsubay adaylarının ön sözleşmeleri','eğitime alınırlar.',[],'yüz kızartıcı suç asıl sözleşmenin fesih sebebi'),
 ('15','kosul','göreve devam edemez kararı','yetkili sağlık kurullarınca verilirse: fesih','Sözleşmeli subay veya sözleşmeli astsubay adaylarının ön sözleşmeleri','eğitime alınırlar.',[],'ön sözleşme fesih sebebi'),
 ('15','kosul','askerî eğitimin','üçte birine katılmamak; kazada bir kez tekrar','ç) Askerî eğitimin üçte birine','eğitime alınırlar.',[],'ön sözleşme feshi'),
 ('15','kosul','eğitim ve öğretimde','başarısız olmak (sınıf okulu, ÖKK eğitimi)','a ) (Değişik:RG-23/7/2015-29423)Türk Silahlı','eğitimde başarısız olmak.',[],''),
 ('15','kosul','ahlaki durum','TSK’da görev yapamayacağı sicil-kanaat raporuyla anlaşılırsa','b) Disiplinsizlik ve ahlaki','raporu ile anlaşılmak.',[],''),
 ('15','kosul','mahkûm','taksirli hariç bir ay+ hürriyeti bağlayıcı; yüz kızartıcı suçlar','d) Taksirli suçlar hariç','cezaya mahkûm olmak.',[('6','subay adayı bu suçlardan mahkûm olmamalı'),('9','astsubay adayı bu suçlardan mahkûm olmamalı')],'taksirle yaralama engel değil'),
 ('15','sayi_oran','oda hapsi','bir yılda otuz gün; ya da iki amirden sekiz ceza','e) (Değişik:RG-12/4/2014-28970) Son olarak','daha fazla disiplin cezası almak.',[],'hizmet yerini terk etmeme de'),
 ('15','kosul','Yabancı uyruklu kişilerle yapılan evliliklerde','Genelkurmay uygun görmezse fesih; vatandaşlık kaybı da','ğ) Yabancı uyruklu','Türk vatandaşlığından çıkarılmak.',[('26', 'yabancıyla evlenen 926’nın muvazzaf hükümlerine tabi')],''),
 ('15','sure','Kanser, tüberküloz','toplam ve fiilen üç yılı geçmeyen tedavi hariç','2) Kanser, tüberküloz','hava değişimine tabi tutulanlar,',[],'sıhhi izin doksan günü geçerse fesih'),
 ('15','kosul','ayırma cezası','yüksek disiplin kurulları verirse fesih','j) (Ek:RG-12/4/2014-28970) Haklarında yüksek','verilmiş olmak.',[('8','ayırma cezası gerektiren disiplinsizlik muvazzaflığa engel'),('11','ayırma cezası gerektiren disiplinsizlik muvazzaflığa engel')],''),

 # m.22 — sağlık hakları
 ('22','sure','kusur','olmaksızın yenilenmezse: hizmet süresi kadar, en çok on yıl','a) Kendi kusurları olmaksızın','en çok on yılı,',[('9', 'kusursuz sözleşmesi feshedilen sözleşmeli er-erbaşa öncelik')],'İDARE YENİLEMEZSE ON · KENDİ İSTEMEZSE BEŞ'),
 ('22','sure','kendi istekleriyle','hizmetin yarısı kadar, en çok beş yıl','b) Sözleşme süresi sonunda kendi','en çok beş yılı',[('9', 'kendi isteğiyle ayrılan sözleşmeli er-erbaşa öncelik')],''),
 ('22','makam','muayene ve tedavi','askerî hastanede; yoksa garnizon sevkiyle kamu sağlık kuruluşu','geçmemek üzere muayene ve tedavi hizmetleri','ücretsiz olarak verilmeye devam edilir.',[],''),
 ('22','kosul','sağlık işlemlerinde','sözleşmeli ve bakmakla yükümlü olduğu kimseler; 211 muvazzaf hükümleri','MADDE 22 – (Değişik:RG-11/2/2010-27490) Sözleşmeli subay','muvazzaf subay ve astsubaylara ilişkin hükümleri uygulanır.',[],'926 değil 211'),

 # m.26, 30-32 — disiplin, seçim, yetkili makam, nasıp
 ('26','kosul','disiplin ve ceza hükümleri','sözleşmeli→muvazzaf, subay adayı→yedek subay adayı, astsubay adayı→temel eğitimdeki aday','Madde 26 – (Değişik:RG-11/2/2010-27490) Sözleşmeli subay','tatbik edilir.',[],'yedek astsubay adayı denmez'),
 ('26','kosul','Jandarma Genel Komutanlığına mensup','mülki hizmet suçunda 2803 sayılı Kanun','Jandarma Genel Komutanlığına mensup','ilgili hükümleri uygulanır.',[],''),
 ('30','sira_usul','aday adayları','fiziki yetenek, kültür-meslek bilgisi, mülakat; yabancı dil yok','Madde 30 - Sözleşmeli subay ve astsubay aday adayları','mülakata tabi tutulurlar.',[],''),
 ('30','kosul','Sözleşmeli Subay veya Astsubay Olur','tam teşekküllü askerî hastane raporu; ihtiyaç kadarıyla ön sözleşme','Yapılacak değerlendirmeler sonucunda','adayı olurlar.',[],''),
 ('31','makam','ilk sözleşme','ilki Personel Temin Merkezi; müteakipler Tayin/Atama Daire Başkanı','MADDE 31 – (Değişik:RG-16/2/2008-26789) Sözleşmeli','Tayin/Atama Daire Başkanı veya eşidi birim amiridir.',[('32','yenileme tarihlerinde ilk sözleşme imza tarihi esas')],'İLK SÖZLEŞME TEMİN MERKEZİ · SONRAKİLER TAYİN DAİRESİ'),
 ('32','sure','kademe ilerlemesi','takvim yılının 30 Ağustos’u','Bu personelin subaylık/astsubaylık nasıpları','30 Ağustos’u itibar olunur.',[],'nasıp ne zaman olursa olsun'),
 ('32','sure','yenileme tarihleri','ilk sözleşme imza tarihi','Ancak sözleşme yenileme tarihleri','esas alınır.',[],''),
 ('32','istisna','Nasıp düzeltmesinden ötürü','maaş farkı ödenmez, özlük hakkı verilmez','Nasıp düzeltmesinden ötürü','özlük hakları verilmez.',[],''),
]
yaz(16, 'Sözleşmeli Subay ve Astsubay Yönetmeliği', K)
