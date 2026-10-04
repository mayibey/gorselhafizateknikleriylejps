# 2521 sayılı Kanunun Uygulanmasına İlişkin Yönetmelik — kelime → cevap
import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ortak import yaz
K = [
 ('10','makam','münhasıran valilerce verilir','satıcılık (bayilik) belgesi; üç yıl süreli','a) Satıcılık (Bayilik) Belgesi','satıcılık (bayilik) belgesi verilir.',[],'BAYİ = YALNIZ VALİ'),
 ('10','makam','ilçelerde kaymakamlarca verilir','yivsiz tüfek ruhsatnamesi; merkez ilçede vali','b) Yivsiz Tüfek Ruhsatnamesi','ilçelerde kaymakamlarca verilir.',[],''),
 ('10','sure','5 yıl süreli yivsiz tüfek','verildiği tarihten geçerli; harç ödenmiş olmalı','ekleyecekleri dilekçeleri ile','5 yıl süreli yivsiz tüfek ruhsatnamesi düzenlenir.',[],'BAYİLİK ÜÇ YIL, RUHSATNAME BEŞ YIL'),
 ('10','gorev_yetki','kırsal alanda taşıma yetkisi','yivsiz tüfek ruhsatnamesi: bulundurma + meskûn mahal dışı taşıma','Bu belge tüfek sahibine','kırsal alanda taşıma yetkisi sağlar.',[],''),
 ('10','sira_usul','torba veya kılıf içerisinde','şehir içinde yivsiz tüfek boş olarak, bagajda','Söz konusu tüfeklerin köy','nakledilmesi zorunludur.',[],''),
 ('10','kosul','iki yıl süreli ikamet tezkeresi','yabancıya yivsiz tüfek ruhsatı; karşılıklılık, Dışişleri önerisi, İçişleri görüşü, vali','Türkiye’deki yabancı elçilik','yivsiz tüfek ruhsatnamesi verilir.',[],''),
 ('10','istisna','18 yaşını bitirmemiş atıcılık lisansına','poligonda, federasyon özel izniyle, veli sorumluluğunda taşıyıp kullanır','18 yaşını bitirmemiş atıcılık','taşıyıp kullanabilir.',[],''),
 ('13','sure','en geç bir ay içerisinde','satın alınan yivsiz tüfek ruhsata kaydettirilir','Bu şekilde satın alınan','kaydettirilmesi zorunludur.',[],'cins, marka, çap, seri no; tüfek görülerek'),
 ('14','yasak','kamu davası açılmamış olsa bile','meskûn mahalde silah atan: belge verilmez','c) Haklarında','bu suçların birinden mahkum olanlar,',[],''),
 ('14','yasak','ikinden fazla suçtan','hapis ya da ağır para cezası alan: belge verilmez','d) Ateşli silahla işlenenler ile taksirli suçlar hariç değişik','mahkum olanlar,',[],'ateşli silahla işlenen ve taksirli suçlar hariç'),
 ('14','yasak','iki yıldan fazla hürriyeti bağlayıcı','mahkûm olan: belge verilmez','e) Ateşli silahla işlenenler ile taksirli suçlar hariç iki','hüküm giymiş olanlar,',[],'devlet sırrı, terör, yaygın şiddet suçları da'),
 ('14','yasak','6 aydan fazla hürriyeti bağlayıcı','6136 m.12-15 suçlarından mahkum: belge yok','g) 6136 Sayılı','mahkum olanlar,',[],'m.4 yasak aletle suç işleyen de'),
 ('14','kosul','affa uğramış olsalar','yine belge verilmez; adli sicilden silinse bile','Yukarıdaki fıkranın (a), (b)','belge ve izinler verilmez.',[],'suç olmaktan çıkan fiil hariç'),
 ('14','kosul','paraya çevrilmiş olsa dahi','hürriyeti bağlayıcı ceza esas alınır','Bu madde hükümlerinin uygulanmasında','hürriyeti bağlayıcı ceza esas alınır.',[],'kesinleşmiş mahkûmiyet'),
 ('14','yasak','18 yaşını bitirmemiş olanlar','belge verilmez','j) 18 yaşını','belge ve izinler verilmez.',[],'kısıtlı, kamu hizmetinden yasaklı, akıl hastası da'),
]
yaz(20, '2521 sayılı Kanunun Uygulanmasına İlişkin Yönetmelik', K)
