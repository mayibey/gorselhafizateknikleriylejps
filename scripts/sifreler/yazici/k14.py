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
 ('5', 'yasak', 'teminat sözleşmeleri', 'güvenli e-imzayla yapılamaz; istisna: banka teminat mektubu, yerleşik sigortacı kefaleti', 'Kanunların resmî şekle', 'güvenli elektronik imza ile gerçekleştirilemez', [], 'İKİ İSTİSNA BAŞLIĞI: resmî şekil/merasim + teminat sözleşmeleri'),
 ('5', 'yasak', 'resmî şekle veya özel', 'resmî şekle tabi işlemler e-imzayla yapılamaz (iki istisna başlığı)', 'Kanunların resmî şekle', 'güvenli elektronik imza ile gerçekleştirilemez', [], ''),
 ('5', 'istisna', 'yerleşik sigorta şirketleri', 'Türkiye’de yerleşik sigortacının kefalet senedi e-imzayla olabilir; yabancı sigortacı olamaz', 'Kanunların resmî şekle', 'güvenli elektronik imza ile gerçekleştirilemez', [], ''),
 ('3', 'tanim', 'optik veya benzeri yollarla', 'elektronik veri tanımı: üretilen, taşınan veya saklanan kayıtlar', 'a) Elektronik veri', 'taşınan veya saklanan kayıtları,', [], ''),
 ('3', 'tanim', 'Telekomünikasyon Kurumunu', 'Kanundaki Kurum; Elektronik Haberleşme Kanunu gereği BTK anlaşılır', '1 5/11/2008 tarihli ve 5809 sayılı', 'Telekomünikasyon Kurumunu, ifade eder.', [], ''),
 ('3', 'tanim', 'kimlik bilgilerini birbirine bağlayan', 'elektronik sertifika tanımı (imza doğrulama verisi + kimlik)', 'ı) Elektronik sertifika', 'birbirine bağlayan elektronik kaydı,', [], 'kitapçıklarda soruldu'),
 ('3', 'tanim', 'imza oluşturma verisini kullanan', 'imza oluşturma aracı (yazılım veya donanım)', 'e) İmza oluşturma aracı', 'yazılım veya donanım aracını,', [], 'doğrulama aracı: doğrulama verisini kullanan'),
 ('4', 'tanim', 'Sadece imza sahibinin tasarrufunda', 'güvenli e-imza unsuru (b): imza oluşturma aracı yalnız sahibinde', 'Güvenli elektronik imza; a) Münhasıran', 'elektronik imzadır.', [], ''),
 ('4', 'tanim', 'kimliğinin tespitini sağlayan', 'nitelikli elektronik sertifikaya dayanarak; (c) unsuru', 'Güvenli elektronik imza; a) Münhasıran', 'elektronik imzadır.', [], '(d) sonradan değişiklik tespiti'),
 ('2', 'tanim', 'hukukî yapısını', 'kapsam: e-imzanın hukukî yapısı, ESHS faaliyetleri, her alanda kullanım işlemleri', 'Bu Kanun, elektronik imzanın hukukî', 'işlemleri kapsar.', [], ''),
]
yaz(14, '5070 sayılı Elektronik İmza Kanunu', K)
