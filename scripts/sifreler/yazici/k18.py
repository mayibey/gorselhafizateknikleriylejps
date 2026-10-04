# Kişisel Verilerin Silinmesi, Yok Edilmesi veya Anonim Hale Getirilmesi Yönetmeliği — kelime → cevap
import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ortak import yaz
K = [
 ('8','tanim','ilgili kullanıcılar için','silme: erişilemez ve tekrar kullanılamaz','(1)Kişisel verilerin silinmesi','hale getirilmesi işlemidir.',[('9','yok etme: hiç kimse erişemez, geri getirilemez')],''),
 ('9','tanim','hiç kimse tarafından','yok etme: geri getirilemez','(1) Kişisel verilerin yok edilmesi','hale getirilmesi işlemidir.',[('8','silme: yalnız ilgili kullanıcılar için erişilemez')],''),
 ('10','tanim','eşleştirilse dahi','anonim hâle getirme','(1) Kişisel verilerin anonim','hale getirilmesidir.',[],'kimliği belirli kişiyle ilişkilendirilemez'),
 ('11','sure','ilk periyodik imha işleminde','imha politikası olan sorumlu bu zamanda siler','(1) Kişisel veri saklama','anonim hale getirir.',[],''),
 ('11','sure','altı ayı geçemez','periyodik imha aralığı','(2) Periyodik imhanın','altı ayı geçemez.',[],'politikada belirlenir'),
 ('11','sure','üç ay içinde','imha politikası olmayan veri sorumlusu siler','(3) Kişisel veri saklama','anonim hale getirir.',[],'POLİTİKASI OLAN: ilk periyodik imha (en çok altı ay) · OLMAYAN: üç ay'),
 ('11','makam','süreleri kısaltabilir','Kurul; telafisi güç zarar ve açık hukuka aykırılıkta','(4) Kurul','süreleri kısaltabilir.',[],''),
 ('8', 'tanim', 'erişilemez ve tekrar kullanılamaz', 'silme tanımı: ilgili kullanıcılar için; bir işlemdir', '(1)Kişisel verilerin silinmesi', 'hale getirilmesi işlemidir.', [], ''),
 ('9', 'makam', 'teknik ve idari tedbirleri almakla', 'veri sorumlusu yükümlüdür (yok etme)', '(2) Veri sorumlusu, kişisel verilerin yok edilmesiyle', 'tedbirleri almakla yükümlüdür.', [('8', 'silmede de veri sorumlusu tedbir almakla yükümlü; silme ilgili kullanıcı erişimi'), ('10', 'anonim hale getirmede de veri sorumlusu tedbir almakla yükümlü')], ''),
 ('9', 'tanim', 'geri getirilemez ve tekrar', 'yok etme tanımı: hiç kimse erişemez, geri getiremez, kullanamaz', '(1) Kişisel verilerin yok edilmesi', 'hale getirilmesi işlemidir.', [], ''),
]
yaz(18, 'Kişisel Verilerin Silinmesi, Yok Edilmesi veya Anonim Hale Getirilmesi Hakkında Yönetmelik', K)
