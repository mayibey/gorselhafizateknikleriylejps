# 5070 Elektronik İmza Kanunu — kelime → cevap
import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ortak import yaz
K = [
 ('3','tanim','kriptografik gizli anahtarlar','imza oluşturma verisi','d) İmza oluşturma verisi','gibi verileri,',[('3','doğrulama verisi: açık anahtar')],'bir eşi daha olmayan şifreler'),
 ('3','tanim','kriptografik açık anahtarlar','imza doğrulama verisi','f) İmza doğrulama verisi','gibi verileri,',[],''),
 ('3','tanim','Zaman damgası','zamanın, ESHS tarafından imzayla doğrulanan kaydı','h) Zaman damgası','doğrulanan kaydı,',[],'üretildiği, değiştirildiği, gönderildiği, alındığı zaman'),
 ('3','tanim','aracını kullanan gerçek kişiyi','imza sahibi: yalnız gerçek kişi','c) İmza sahibi','gerçek kişiyi,',[],''),
 ('4','tanim','Münhasıran imza sahibine bağlı','güvenli e-imza unsuru (dört unsurdan biri)','Güvenli elektronik imza; a)','elektronik imzadır.',[],'sadece sahibinin tasarrufundaki araç; nitelikli sertifika; sonradan değişikliğin tespiti'),
 ('5','kosul','elle atılan imza ile aynı','güvenli e-imza; aynı hukukî sonuç','Güvenli elektronik imza, elle','aynı hukukî sonucu doğurur.',[],''),
 ('5','yasak','özel bir merasime','güvenli e-imza ile yapılamaz','Kanunların resmî şekle','gerçekleştirilemez.',[],'resmî şekle tabi işlemler ve teminat sözleşmeleri de yapılamaz'),
 ('5','istisna','banka teminat mektupları','e-imza ile YAPILABİLİR; teminat yasağının istisnası','Kanunların resmî şekle','gerçekleştirilemez.',[],'sigorta şirketi kefalet senetleri de yapılabilir'),
 ('3', 'tanim', 'mantıksal bağlantısı bulunan', 'elektronik imza (tanım); kimlik doğrulama amaçlı elektronik veri', 'b) Elektronik imza: Başka bir elektronik', 'kullanılan elektronik veriyi,', [], ''),
]
yaz(14, '5070 sayılı Elektronik İmza Kanunu', K)
