# Sınav ölçümünün bulduğu düzeltme + eksik satırları yazıcı betiklere (scripts/sifreler/yazici/kN.py) işler
import sys, os
sys.stdout.reconfigure(encoding='utf-8')
Y = 'D:/GorselHafizaTeknikleriyleJSPS/scripts/sifreler/yazici'

DUZELT = {
 22: [("'tebliğ günü işe başlar'", "'tebliğ gününü izleyen işgünü içinde işe başlar'"),
      ("'tebliğ gününü,'", "'işe başlamak zorundadırlar.'")],
 2:  [("'657 sayılı Devlet Memurları Kanunu'", "'Jandarma Hizmetleri Sınıfı özlük işleri; 657 (rütbelilerin nasıp-terfisi değil)'")],
}
EKLE = {
 1: [('1','tanim','suç işlenmesini önlemektir','amaç listesi: hak-özgürlük, kamu düzeni, hukuk devleti, sağlık-çevre, toplum barışı','(1) Ceza Kanununun amacı','suç işlenmesini önlemektir.',[],'sınav: "amaçları arasında sayılmayan" sorusu'),
     ('1','tanim','türleri düzenlenmiştir','düzenlenenler: ceza sorumluluğu esasları, suçlar, ceza ve güvenlik tedbirleri','Kanunda, bu amacın gerçekleştirilmesi','türleri düzenlenmiştir.',[],'"suça iten sebepler" listede yok'),
     ('2','tanim','açıkça suç saymadığı','suçta ve cezada kanunîlik ilkesi; idarenin düzenleyici işlemiyle suç konulamaz','(1) Kanunun açıkça suç saymadığı','suç ve ceza konulamaz.',[],''),
     ('37','kosul','fiili birlikte gerçekleştiren','her biri fail olarak sorumlu (müşterek faillik)','(1) Suçun kanuni tanımında yer alan fiili birlikte','fail olarak sorumlu olur.',[],''),
     ('40','kosul','en azından teşebbüs aşamasına','iştirakten sorumluluk için suçun varmış olması gerekir','(3) Suça iştirakten dolayı','varmış olması gerekir.',[],''),
     ('39','tanim','hususunda yol göstermek','yardım eden; araçları sağlamak da (azmettirme değil)','b) Suçun nasıl işleneceği hususunda','araçları sağlamak.',[],''),
     ('42','tanim','ağırlaştırıcı nedenini oluşturması','bileşik suç (tanım): biri diğerinin unsuru; tek fiil sayılır','(1) Biri diğerinin unsurunu','bileşik suç denir.',[],'')],
 2: [('5','kosul','mülki taksimat esas alınır','jandarma birliklerinin kuruluş ve konuşlarının düzenlenmesinde; geçici bölge teşkilatı kurulabilir','Jandarma birliklerinin kuruluş ve konuşlarının','bölge teşkilatı da kurulabilir.',[],''),
     ('6','makam','nizam hükümlerinin icrasını','Jandarma Genel Komutanı sorumlu; teşkilatın sevk ve idaresinden','Jandarma Genel Komutanı, Teşkilatın sevk','uygulanmasından sorumludur.',[],''),
     ('11','kosul','silah kullanma yetkisine sahiptir','jandarma, kanunlarda öngörülen (görevin gereği olarak)','Jandarma, kendisine verilen görevlerin ifası','silah kullanma yetkisine sahiptir.',[],'yönetmelik/genelge/emirle değil, kanunla'),
     ('13','kosul','statü ve rütbelerine göre','nasıp-terfi, mali-sosyal haklar: 926, 4678, 3466, 3269, 6191 sayılı kanunlar','Ancak, nasıp ve terfi, aylık','tabi personel hakkındaki hükümler uygulanır.',[],'657 bu listede yok (o, Jandarma Hizmetleri Sınıfı için)')],
 3: [('6','tanim','sendika üyeliği, sağlığı','özel nitelikli; ırk, etnik köken, siyasi düşünce, inanç, din, kılık-kıyafet','(1) Kişilerin ırkı, etnik kökeni','özel nitelikli kişisel veridir.',[],'eğitim durumu listede YOK'),
     ('6','tanim','ceza mahkûmiyeti ve güvenlik tedbirleriyle','özel nitelikli; sağlık, cinsel hayat, dernek-vakıf-sendika üyeliği, biyometrik, genetik','(1) Kişilerin ırkı, etnik kökeni','özel nitelikli kişisel veridir.',[],'')],
 4: [('24','sira_usul','aynı elinin diğer bir parmağı','sol baş parmağı yoksa; el yoksa sağ elinin baş parmağı','Sol elinin baş parmağı bulunmıyan','diğer parmaklarından biri bastırılır.',[],'')],
 5: [('4','makam','İl genel idaresinin başı','vali; il genel idaresinin başı (ilçede kaymakam)','İl genel idaresinin başı','mercii validir.',[('27','ilçe genel idaresinin başı kaymakam')],''),
     ('9','makam','ilin genel idaresinden Cumhurbaşkanına',"valiler sorumlu; Cumhurbaşkanı yardımcıları ve bakanlar valiye re'sen emir verir",'Valiler, ilin genel idaresinden','emir ve talimat verirler.',[],''),
     ('57','tanim','hukuk işleri müdürü, defterdar','il idare kurulu; milli eğitim, bayındırlık, sağlık, tarım, veteriner müdürleri de','İl idare kurulu, valinin başkanlığı','vali muavinini görevlendirebilir.',[],'gençlik-spor, emniyet, jandarma listede yok')],
 7: [('1','tanim','korkutma, yıldırma, sindirme veya tehdit','terör yöntemleri (cebir ve şiddet kullanarak; baskı da)','Terör; cebir ve şiddet kullanarak','bölünmez bütünlüğünü bozmak,',[('7','örgüt kuran, yöneten, üye: TCK 314')],'"kandırma" yöntemler arasında yok'),
     ('15','kosul','Terörle mücadelede görev alan','TSK personeli, mülki idare amirleri, istihbarat-kolluk görevlileri, diğer görevli personel','Terörle mücadelede görev alan Türk Silahlı','en fazla üç avukatın',[],'avukat ücreti bunlara ödenir; mağdur vatandaşa değil')],
 10: [('3','sure','ilk işgünü içinde mülkî amirin','kolluk amirinin koruyucu tedbir evrakı; kırksekiz saatte onaylanmazsa kalkar','Kolluk amiri evrakı en geç','kendiliğinden kalkar.',[],'')],
 12: [('8','ceza','usul ve kurallara riayet etmeden','kınama; usulsüz sözlü, yazılı veya elektronik müracaat/şikâyet','(2) Kınama cezasını gerektiren fiiller','müracaat veya şikâyette bulunmak.',[],'')],
 13: [('3','tanim','Sözleşme yılı','sözleşmenin yürürlüğe girdiği ay ve günden itibaren her yıllık süre','Sözleşme yılı: Sözleşmenin yürürlüğe','her bir yıllık süreyi,',[],'')],
 14: [('3','tanim','mantıksal bağlantısı bulunan','elektronik imza (tanım); kimlik doğrulama amaçlı elektronik veri','b) Elektronik imza: Başka bir elektronik','kullanılan elektronik veriyi,',[],'')],
 15: [('6','sayi_oran','A4 (210x297 mm)','belge boyutu; ekler farklı form ve ebatta olabilir','MADDE 6- (1) Belgeler, A4','farklı form, format veya ebatlarda hazırlanabilir.',[],''),
      ('3','tanim','hazırlanmasından tasfiyesine kadar','aidiyet zinciri (belgenin süreci)','a) Aidiyet zinciri: Belgenin','tasfiyesine kadar olan sürecini,',[],''),
      ('3','tanim','delil teşkil ederek aidiyet zincirini','belge (tanım); e-imza ya da el yazısıyla imzalanmış kayıtlı bilgi','c) Belge: Herhangi bir bireysel','kayıt altına alınmış her türlü bilgiyi,',[],'')],
 16: [('5','sure','Ocak ayının ilk günü itibariyle','yaş hesabı: düzeltilmemiş nüfus kaydı, müracaat yılı (subay yirmi yedi)','mürâcaat yapılan yılın Ocak ayının','otuz iki yaşını bitirmemiş olanlar',[('6','subay adayı niteliklerinde aynı kural'),('9','astsubay adayı: dört yıl+ yirmi yedi, azı yirmi dört')],'lisansüstü otuz iki')],
 17: [('3','tanim','yerleşik ve yaygın inancı','asayiş (tanım); dirlik ve düzenin varlığı konusunda kamuda oluşan','dirlik ve düzenin varlığı konusunda','yerleşik ve yaygın inancı,',[],''),
      ('3','tanim','talep ya da yasağın','emir (tanım); söz, yazı ve sair suretle ifadesi','ç) Emir: Göreve ait','sair suretle ifadesini,',[],''),
      ('19','tanim','gazino, pavyon, meyhane, bar','umuma açık istirahat-eğlence yeri: konaklama, içkili yer, sinema-kahvehane-kıraathane, oyun yeri','otel, motel, pansiyon, kamping','sinema, kahvehane ve kıraathane;',[],'düğün salonu listede yok'),
      ('42','kosul','sözlü emirler derhal yerine getirilir','sayılan acele hallerde; yazılı istenemez; sorumluluk emri verene aittir','ı) Umuma açık yerlerde yapılan her türlü toplantı','sorumluluk emri verene aittir.',[],'haller: can-ırz emniyeti, devlet güvenliği suçları, toplantı-yürüyüş düzeni, tıkanmış yol, kaçanın yakalanması')],
 19: [('4','tanim','kayıtlarında yer alan','bilgi (tanım); belge: yazılı, basılı, çoğaltılmış dosya, evrak, film','c) Bilgi: Kurum ve kuruluşların','dosya, evrak, kitap',[],'')],
 22: [('4','tanim','teknik bilgi ve beceri gerektiren','ihtisas: özel hizmet alanı (branş: alt hizmet alanı)','ğ) İhtisas: Jandarma Genel Komutanlığı','özel hizmet alanlarını,',[],''),
      ('4','tanim','Bakan: İçişleri Bakanını','Personel Yönetmeliğinde Bakan = İçişleri Bakanı','c) Bakan: İçişleri Bakanını','ç) Bakanlık: İçişleri Bakanlığını,',[],''),
      ('7','tanim','Öğretmen','Öğretmen yalnız subay listesinde; Astsubaylar listesinde yok','11) Maliye 12) Öğretmen','b) Astsubaylar 1) Jandarma',[],'')],
 23: [('4','tanim','bir emir komuta altında toplanan','birlik (tanım); taktik ve idari birimler','e) Birlik: Görevin yapılması','taktik ve idari birimleri,',[],''),
      ('10','tanim','tüm görevlerin düzenleyicisidir','emir; göreve ilişkin ve mevzuata uygun olması şart','(1) Emir tüm görevlerin','mevzuata uygun olması şarttır.',[],'')],
}
for lid in sorted(set(DUZELT) | set(EKLE)):
    p = f'{Y}/k{lid}.py'; s = open(p, encoding='utf-8').read()
    for a, b in DUZELT.get(lid, []):
        assert s.count(a) == 1, (lid, a); s = s.replace(a, b)
    if lid in EKLE:
        i = s.rfind('\n]\nyaz('); assert i > 0, lid
        s = s[:i] + '\n' + ''.join(' ' + repr(t) + ',\n' for t in EKLE[lid]).rstrip('\n') + s[i:]
    open(p, 'w', encoding='utf-8').write(s)
    print('k%d: %d düzeltme, %d ekleme' % (lid, len(DUZELT.get(lid, [])), len(EKLE.get(lid, []))))
