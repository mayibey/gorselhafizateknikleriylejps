# Bilgi Edinme Hakkı Kanununun Uygulanmasına İlişkin Esas ve Usuller Hakkında Yönetmelik — kelime → cevap
# KURAL (başkan, 4 Eki 2026): SOL = soru KÖKÜNDE göreceğin ifade, SAĞ = doğru ŞIKTA arayacağın kelime.
# Sorulardan geriye doğru yazıldı (49 cevaplı soru); kanıt resmî metin. Kapsam: m.2-5.
# Tuzak çiftleri: mahalli idarelerde KÖYLER HARİÇ · Merkez Bankası ve üniversiteler DAHİL, İMKB 864 ile ÇIKARILDI ·
#                 BİLGİ = kayıttaki veri / BELGE = veri taşıyıcısı · erişimde ÖNCE KOPYA · hak HERKESİN ·
#                 yabancı: ilgi + karşılıklılık, başvuru TÜRKÇE; ülkeleri DIŞİŞLERİ ilan eder.
# Not: "bilgi edinme, esas ve usul" yönetmeliğin adında, yani her kökte geçer; satırlarda ayırt edici kelime seçildi.
import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ortak import yaz
K = [
 # m.2 — kapsam
 ('2','istisna','mahalli idare','köyler hariç; bağlı-ilgili kuruluş, birlik ve şirketleri dahil','Madde 2 - Bu Yönetmelik;','faaliyetlerinde uygulanır.',[],'özel bankalar, özel hukuk tüzel kişileri kapsamda değil'),
 ('2','kosul','merkezi idare','bağlı, ilgili veya ilişkili kuruluşlarıyla','Madde 2 - Bu Yönetmelik; merkezi idare','ilişkili kuruluşlarının,',[],''),
 ('2','kosul','Merkez Bankası','üniversitelerle birlikte dahil; İMKB (Menkul Kıymetler Borsası) çıkarıldı','Madde 2 - Bu Yönetmelik;','madde metninden çıkarılmıştır.',[],'kamu tüzel kişiliğini haiz kuruluşlar arasında'),
 ('2','tanim','İMKB','864 sayılı Cumhurbaşkanı Kararıyla çıkarıldı','[Dipnot (1)','madde metninden çıkarılmıştır.',[],''),
 ('2','kosul','kamu tüzel kişiliği','enstitü/teşebbüs/teşekkül/fon; Merkez Bankası-üniversite dahil; vakıf YOK','kamu tüzel kişiliğini haiz','bütün kamu kurum ve kuruluşlarının',[],''),
 ('2','kosul','meslek kuruluş','faaliyetlerinde uygulanır; dahil','ve kamu kurumu niteliğindeki meslek','faaliyetlerinde uygulanır.',[],'kamu kurumu niteliğindeki meslek kuruluşları'),

 # m.3 — dayanak
 ('3','tanim','hazırlanmıştır','4982 sayılı Kanunun 31. maddesi','Madde 3 - Bu Yönetmelik,','uyarınca hazırlanmıştır.',[],'9/10/2003 tarihli Bilgi Edinme Hakkı Kanunu'),

 # m.4 — tanımlar
 ('4','tanim','her türlü veri','bilgi; belge ise veri taşıyıcısı','c) Bilgi:','her türlü veriyi,',[],'kurum kayıtlarındaki veri'),
 ('4','tanim','Belge:','yazılı-basılı evrak, film, fotoğraf, harita, elektronik kayıt; sözlü açıklama değil','d) Belge:','veri taşıyıcılarını,',[],'dosya, kitap, kroki, plan, teyp ve video kaseti de'),
 ('4','sira_usul','erişim','önce kopya; mümkün değilse aslını inceleme, not, görme-işitme','e) Bilgi veya belgeye erişim:','işitmesine izin verilmesini,',[],'kopya mümkünken yalnız inceletmek yanlış'),
 ('4','tanim','Başvuru sahibi:','başvuran gerçek ve tüzel kişiler','b) Başvuru sahibi:','gerçek ve tüzel kişileri,',[],''),

 # m.5 — hak sahipleri
 ('5','kosul','sahiptir','herkes; yaş-sıfat şartı yok','Madde 5 - Herkes,','bilgi edinme hakkına sahiptir.',[],'reşit olmayan da başvurabilir'),
 ('5','kosul','yabancı','kendisi-faaliyetiyle ilgili + karşılıklılık; başvuru Türkçe',"Türkiye'de ikamet eden yabancılar",'Türkçe olarak yapılır.',[],'ikamet eden yabancı ve faaliyetteki yabancı tüzel kişi; kendi dilinde başvuru yok'),
 ('5','makam','karşılıklılık','ülkeleri Dışişleri Bakanlığı Resmî Gazete’de ilan eder','Karşılıklılık ilkesi kapsamında bulunan','Resmi Gazetede ilan edilir.',[],''),
 ('5','kosul','uluslararası sözleşme','hak ve yükümlülükler saklıdır',"Türkiye'nin taraf olduğu",'yükümlülükleri saklıdır.',[],'Yönetmelik karşısında ortadan kalkmaz'),
]
yaz(19, 'Bilgi Edinme Hakkı Kanununun Uygulanmasına İlişkin Esas ve Usuller Hakkında Yönetmelik', K)
