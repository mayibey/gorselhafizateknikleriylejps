# Bilgi Edinme Hakkı Kanununun Uygulanmasına İlişkin Yönetmelik — kelime → cevap
import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ortak import yaz
K = [
 ('2','istisna','köyler hariç','mahalli idareler kapsamda, köyler değil','Madde 2 - Bu Yönetmelik; merkezi','faaliyetlerinde uygulanır.',[],'Merkez Bankası, üniversiteler, meslek kuruluşları kapsamda'),
 ('4','tanim','kopyasının verilmesini','erişim; kopya olmazsa aslını inceleme, not alma','e) Bilgi veya belgeye erişim','izin verilmesini,',[],'içeriğini görme ya da işitme de'),
 ('5','kosul','karşılıklılık ilkesi','yabancılar; kendileriyle ilgili bilgi, Türkçe başvuru','Türkiye\'de ikamet eden yabancılar','Türkçe olarak yapılır.',[],'yabancı tüzel kişi: faaliyet alanıyla ilgili'),
 ('5','makam','Dışişleri Bakanlığınca Resmi Gazetede','karşılıklılık ülkeleri ilan edilir','Karşılıklılık ilkesi kapsamında bulunan','ilan edilir.',[],''),
 ('4', 'tanim', 'kayıtlarında yer alan', 'bilgi (tanım); belge: yazılı, basılı, çoğaltılmış dosya, evrak, film', 'c) Bilgi: Kurum ve kuruluşların', 'dosya, evrak, kitap', [], ''),
 ('2', 'kosul', 'T.C. Merkez Bankası ve üniversiteler', 'kapsamda açıkça sayılı; kamu tüzel kişiliğini haiz kurumlar', 'Madde 2 - Bu Yönetmelik; merkezi idare', 'meslek kuruluşlarının faaliyetlerinde uygulanır.', [], ''),
 ('2', 'kosul', 'bağlı, ilgili veya ilişkili', 'merkezi idare kamu idarelerinin bu kuruluşları da kapsamda', 'Madde 2 - Bu Yönetmelik; merkezi idare', 'meslek kuruluşlarının faaliyetlerinde uygulanır.', [], ''),
 ('2', 'kosul', 'enstitü, teşebbüs, teşekkül, fon', 'kamu tüzel kişiliği haiz kuruluş adları (ve sair); vakıf sayılmamış', 'Madde 2 - Bu Yönetmelik; merkezi idare', 'meslek kuruluşlarının faaliyetlerinde uygulanır.', [], ''),
 ('2', 'kosul', 'birlik veya şirketlerinin', 'mahalli idarelerin bağlı-ilgili kuruluşları ile birlikte kapsamda; köyler hariç', 'Madde 2 - Bu Yönetmelik; merkezi idare', 'meslek kuruluşlarının faaliyetlerinde uygulanır.', [], ''),
 ('2', 'kosul', 'kamu kurumu niteliğindeki meslek kuruluşlarının', 'faaliyetleri bakımından Yönetmelik kapsamında', 'Madde 2 - Bu Yönetmelik; merkezi idare', 'meslek kuruluşlarının faaliyetlerinde uygulanır.', [], ''),
 ('2', 'kosul', 'madde metninden çıkarılmıştır', '“, İMKB” ibaresi 864 sayılı Cumhurbaşkanı Kararı ile', '(1) [Dipnot (1) 10/4/2019 tarihli', 'madde metninden çıkarılmıştır.]', [], ''),
 ('3', 'tanim', '31 inci maddesi uyarınca', '4982 sayılı Bilgi Edinme Hakkı Kanunu; dayanak', 'Madde 3 - Bu Yönetmelik, 9/10/2003', '31 inci maddesi uyarınca hazırlanmıştır.', [], ''),
 ('5', 'kosul', 'Herkes, Kanun ve bu Yönetmelikte', 'bilgi edinme hakkına sahiptir; yaş, vatandaşlık, sıfat şartı yok', 'Madde 5 - Herkes', 'bilgi edinme hakkına sahiptir.', [], ''),
 ('5', 'kosul', 'başvurular Türkçe olarak yapılır', 'yabancıların başvurusu; uluslararası sözleşmelerden doğan haklar saklı', 'Bu kapsamdaki başvurular Türkçe', 'hak ve yükümlülükleri saklıdır.', [], ''),
 ('4', 'tanim', 'başvuran gerçek ve tüzel kişileri', 'başvuru sahibi tanımı', 'b) Başvuru sahibi', 'gerçek ve tüzel kişileri,', [], ''),
 ('4', 'tanim', 'teyp ve video kaseti', 'belge tanımı: dosya, evrak, kroki, film, fotoğraf, harita, elektronik kayıt', 'd) Belge', 'haber ve veri taşıyıcılarını,', [], 'kayda geçmemiş sözlü açıklama belge DEĞİL'),
 ('4', 'tanim', 'Bilgi Edinme Değerlendirme Kurulunu', 'Kurul tanımı; Yönetmelikte yedi kavram tanımlı; veri sorumlusu YOK', 'f) Kurul', 'Bilgi Edinme Değerlendirme Kurulunu,', [], 'kurum ve kuruluş, başvuru sahibi, bilgi, belge, erişim, Kurul, Kanun'),
 ('4', 'tanim', 'her türlü veriyi', 'bilgi tanımı (kurum kayıtlarındaki, Kanun kapsamındaki veri)', 'c) Bilgi', 'her türlü veriyi,', [], ''),
]
yaz(19, 'Bilgi Edinme Hakkı Kanununun Uygulanmasına İlişkin Esas ve Usuller Hakkında Yönetmelik', K)
