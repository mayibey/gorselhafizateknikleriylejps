# 2521 sayılı Kanunun Uygulanmasına İlişkin Yönetmelik (av tüfekleri) — kelime → cevap
# KURAL (başkan, 4 Eki 2026): SOL = soru KÖKÜNDE göreceğin ifade, SAĞ = doğru ŞIKTA arayacağın kelime.
# Sorulardan geriye doğru yazıldı (25 cevaplı soru); kanıt resmî metin. Kapsam: m.10, m.13, m.14.
# Tuzak çiftleri: YİVSİZ TÜFEK RUHSATNAMESİ 5 yıl (merkezde vali, ilçede kaymakam) · BAYİLİK belgesi 3 yıl (yalnız vali) ·
#                 satın alınan tüfek BİR AY içinde kaydettirilir · mahkûmiyet KESİNLEŞMİŞ olmalı, paraya çevrilse de hapis esas ·
#                 TAKSİRLİ suçlar engel değil.
import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ortak import yaz
K = [
 # m.10 — belgeler
 ('10','sure','yivsiz tüfek ruhsatname','5 yıl; merkezde vali, ilçede kaymakam','b) Yivsiz Tüfek Ruhsatnamesi:','5 yıl süreli yivsiz tüfek ruhsatnamesi düzenlenir.',[('13','m.13: engeli olmayana mülki amirlik düzenler; satın alınan tüfek bir ayda kaydedilir')],'bayilik belgesi ise 3 yıl; kırsalda taşıma, şehirde boş ve kılıfta'),
 ('10','sure','bayilik','3 yıl; münhasıran vali; sağlık raporu: bedeni-ruhi sakınca yok','a) Satıcılık (Bayilik) Belgesi:','satıcılık (bayilik) belgesi verilir.',[],'iş yeri belgesi, sabıka beyanı, taahhütname, kimlik no, iki fotoğraf da'),

 # m.13 — satın alma ve kayıt
 ('13','kosul','engel','engeli olmayana mülki amirlik ruhsat düzenler; engelliye verilmez','(Değişik:RG-22/4/2009-27208) Bu Yönetmelik hükümlerine göre av tüfeği','yivsiz tüfek ruhsatnamesi düzenlenir.',[('10','m.10: ruhsat başvurusunda silah taşımaya engel hâl için sağlık raporu istenir')],'mahalli mülki amirlik'),
 ('13','sure','satın al','yivsiz tüfek belgeyle; alan bir ayda cins-marka-çap-seri kaydettirir; tarih YOK','Bu silahları satın almak isteyenler','kaydettirilmesi zorunludur.',[('14', 'm.14/h: uyuşturucu satın alma suçundan mahkûm olana izin verilmez')],'belgeyi veren makama kaydettirilir'),
 ('13','sira_usul','görülerek','ruhsatnameye kayıt sırasında tüfek görülür','Ruhsatname üzerine tüfeklerin','tespitinin yapılması esastır.',[],''),

 # m.14 — izin verilmeyecek hâller
 ('14','yasak','izni ve belgesi','silah suçu, terör, uyuşturucu, kısıtlı, akıl hastası; taksirli hariç','(Değişik:RG-11/06/1998-23369) Aşağıda belirtilen','j) 18 yaşını bitirmemiş olanlar,',[],'18 yaşını bitirmeyen, kamu hizmetinden yasaklı da; yapım, alım, satım, taşıma, bulundurma izni verilmez'),
 ('14','yasak','umuma mahsus yol','kamu davası açılmasa da izin-belge verilmez','c) Haklarında','birinden mahkum olanlar,',[],'zorunlu olmadan meskûn mahalde silah atan da'),
 ('14','yasak','affa uğra','a-h bentlerinde yine verilmez; suç olmaktan çıkan fiil hariç','Yukarıdaki fıkranın (a)','hüküm giymiş olanlara uygulanmaz.',[],'adli sicilden silinse bile'),
 ('14','kosul','belirtilen mahkumiyet','kesinleşmiş mahkumiyet','Bu madde de belirtilen mahkumiyet','hürriyeti bağlayıcı ceza esas alınır.',[],''),
 ('14','kosul','paraya çevril','hürriyeti bağlayıcı ceza esas alınır','Bu madde de belirtilen mahkumiyet','hürriyeti bağlayıcı ceza esas alınır.',[],''),
]
yaz(20, '2521 sayılı Kanunun Uygulanmasına İlişkin Yönetmelik', K)
