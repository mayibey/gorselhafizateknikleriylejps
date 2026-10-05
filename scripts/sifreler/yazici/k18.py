# Kişisel Verilerin Silinmesi, Yok Edilmesi veya Anonim Hale Getirilmesi Hakkında Yönetmelik — kelime → cevap
# KURAL (başkan, 4 Eki 2026): SOL = soru KÖKÜNDE göreceğin ifade, SAĞ = doğru ŞIKTA arayacağın kelime.
# Sorulardan geriye doğru yazıldı (40 cevaplı soru); kanıt resmî metin. Kapsam: m.8-11.
# Tuzak çiftleri: SİLME = İLGİLİ KULLANICILAR için erişilemez · YOK ETME = HİÇ KİMSE için erişilemez + GERİ GETİRİLEMEZ ·
#                 ANONİM = eşleştirilse dahi kimlikle ilişkilendirilemez · periyodik imha en çok ALTI ay · politikası olmayan ÜÇ ay ·
#                 süreleri KURUL kısaltır.
# Not: "silinmesi, yok edilmesi, anonim hale getirilmesi" yönetmeliğin adında, yani her kökte geçer; tanım satırlarında ayırt edici kelime seçildi.
import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ortak import yaz
K = [
 # m.8 — silme
 ('8','tanim','hiçbir şekilde erişilemez','silinmesi: ilgili kullanıcılar; yok edilmesi: hiç kimse','(1)Kişisel verilerin silinmesi','kullanılamaz hale getirilmesi işlemidir.',[('9', 'm.9 yok etme: hiç kimse tarafından erişilemez, geri getirilemez')],'silmede geri getirilemezlik şartı yok'),

 # m.9 — yok etme
 ('9','tanim','hiç kimse tarafından','geri getirilemez; yok edilmesi','(1) Kişisel verilerin yok edilmesi','kullanılamaz hale getirilmesi işlemidir.',[],'erişilemez + geri getirilemez + tekrar kullanılamaz, üçü birlikte; diski parçalamak gibi'),
 ('9','makam','teknik ve idari','veri sorumlusu','(2) Veri sorumlusu, kişisel verilerin yok edilmesiyle','almakla yükümlüdür.',[('8','m.8: silmede de tedbiri veri sorumlusu alır'),('10','m.10: anonim hale getirmede de tedbiri veri sorumlusu alır')],'her türlü teknik ve idari tedbir'),

 # m.10 — anonim hale getirme
 ('10','tanim','eşleştirilse dahi','anonim hale getirme; kimliği belirli-belirlenebilir gerçek kişiyle ilişkilendirilemez','(1) Kişisel verilerin anonim hale getirilmesi','ilişkilendirilemeyecek hale getirilmesidir.',[],'veri kullanılmaya devam edebilir; geri döndürme tekniğiyle dahi ilişkilendirilemez'),

 # m.11 — resen imha süreleri
 ('11','sure','periyodik imha','her hâlde altı ayı geçemez; veri sorumlusu politikada belirler','(2) Periyodik imhanın','altı ayı geçemez.',[],'politikası olan, yükümlülüğü takip eden ilk periyodik imhada siler'),
 ('11','sure','yükümlülüğü olmayan','üç ay içinde; politikası olan: ilk periyodik imhada','(3) Kişisel veri saklama ve imha politikası hazırlama yükümlülüğü olmayan','anonim hale getirir.',[],'saklama ve imha politikası hazırlama yükümlülüğü olmayan veri sorumlusu'),
 ('11','makam','kısaltabilir','Kurul; telafisi güç-imkânsız zarar ve açık hukuka aykırılık','(4) Kurul, telafisi güç','süreleri kısaltabilir.',[],'Kişisel Verileri Koruma Kurulu'),
]
yaz(18, 'Kişisel Verilerin Silinmesi, Yok Edilmesi veya Anonim Hale Getirilmesi Hakkında Yönetmelik', K)
