# 5070 sayılı Elektronik İmza Kanunu — kelime → cevap
# KURAL (başkan, 4 Eki 2026): SOL = soru KÖKÜNDE göreceğin ifade, SAĞ = doğru ŞIKTA arayacağın kelime.
# Sorulardan geriye doğru yazıldı (59 cevaplı soru); kanıt resmî metin. Kapsam: m.2-5.
# Tuzak çiftleri: GİZLİ anahtar = imza OLUŞTURMA verisi · AÇIK anahtar = imza DOĞRULAMA verisi · imza sahibi yalnız GERÇEK kişi ·
#                 YALNIZ güvenli e-imza elle atılan imzaya eşit · resmî şekil-merasim ve teminat sözleşmesi e-imzayla OLMAZ,
#                 ama banka teminat mektubu ve Türkiye'de YERLEŞİK sigorta kefaleti OLUR.
# Not: "elektronik imza" her kökte kanun adı olarak geçtiği için tanım satırlarında başka kelime seçildi.
import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ortak import yaz
K = [
 # m.2 — kapsam
 ('2','tanim','kapsar','hukuki yapı, sertifika hizmet sağlayıcıları, her alanda kullanım','Bu Kanun, elektronik imzanın','işlemleri kapsar.',[],''),

 # m.3 — tanımlar
 ('3','tanim','veriye eklenen','mantıksal bağlantılı; kimlik doğrulama amaçlı: elektronik imza','b) Elektronik imza:','kullanılan elektronik veriyi,',[],'başka bir elektronik veriye eklenen veya mantıksal bağlantılı veri'),
 ('3','tanim','yollarla','elektronik, optik, benzeri: elektronik veri','a) Elektronik veri:','saklanan kayıtları,',[],'üretilen, taşınan veya saklanan kayıtlar'),
 ('3','tanim','İmza sahibi:','gerçek kişi; tüzel kişi olamaz','c) İmza sahibi:','kullanan gerçek kişiyi,',[],'imza oluşturma aracını kullanan'),
 ('3','tanim','kriptografik','şifre; gizli anahtar: oluşturma verisi; açık anahtar: doğrulama verisi','d) İmza oluşturma verisi:','açık anahtarlar gibi verileri,',[],'oluşturma verisi imza sahibine ait, bir eşi daha olmayan veridir; paylaşılmaz'),
 ('3','tanim','doğrulama verisi','imzayı doğrulayan şifre, açık anahtar','f) İmza doğrulama verisi:','açık anahtarlar gibi verileri,',[],'sertifika bunu kimlik bilgisine bağlar (ayrı satır)'),
 ('3','tanim','kaydedildiği zamanın','zaman damgası','h) Zaman damgası:','elektronik imzayla doğrulanan kaydı,',[],'üretildiği, değiştirildiği, gönderildiği, alındığı zaman da'),
 ('3','tanim','zaman damgası','üretim, değişiklik, gönderim, alım, kayıt zamanı; doğum tarihi YOK','h) Zaman damgası:','elektronik imzayla doğrulanan kaydı,',[],'elektronik sertifika hizmet sağlayıcısı elektronik imzayla doğrular'),
 ('3','tanim','birbirine bağlayan','elektronik sertifika: doğrulama verisi + kimlik bilgisi','ı) Elektronik sertifika:','birbirine bağlayan elektronik kaydı,',[],''),
 ('3','tanim','Kurum:','Telekomünikasyon Kurumu; bugün Bilgi Teknolojileri ve İletişim','j) Kurum:','Telekomünikasyon Kurumunu, ifade eder.',[],'5809 sayılı Kanunla adı Bilgi Teknolojileri ve İletişim Kurumu (BTK) oldu'),

 # m.4 — güvenli elektronik imza
 ('4','tanim','güvenli elektronik imza','sahibe özgü/tasarrufundaki araçla/nitelikli sertifikalı/değişiklik tespitli; noter-elle imza YOK','Güvenli elektronik imza; a)','tespitini sağlayan, elektronik imzadır.',[('3', 'm.3 metninin sonunda kısım ve bölüm başlıkları yer alır'), ('5', 'm.5: güvenli e-imzanın hukuki sonucu ve yapılamayan işlemler')],'dört unsur birlikte; valilik onayı da YOK'),
 ('4','tanim','Nitelikli elektronik sertifikaya','imza sahibinin kimlik tespiti','c) Nitelikli elektronik sertifikaya','kimliğinin tespitini sağlayan,',[],''),

 # m.5 — hukuki sonuç ve uygulama alanı
 ('5','kosul','hukukî sonucu','elle atılan imza ile aynı; yalnız güvenli e-imza','Güvenli elektronik imza, elle atılan','aynı hukukî sonucu doğurur.',[('4', 'm.4 metninin sonunda m.5 başlığı yer alır')],'her elektronik imza değil'),
 ('5','istisna','gerçekleştiril','yapılamaz: resmî şekil-merasim, teminat; banka mektubu, yerleşik sigorta kefaleti olur','Kanunların resmî şekle','güvenli elektronik imza ile gerçekleştirilemez.',[],'iki istisna grubu: resmî şekil-merasim ve teminat sözleşmesi'),
 ('5','istisna','teminat','yapılamaz; banka mektubu ve yerleşik sigorta kefaleti hariç','Kanunların resmî şekle','güvenli elektronik imza ile gerçekleştirilemez.',[],''),
 ('5','istisna','kefalet','yalnız Türkiye’de yerleşik sigortanınki e-imzayla olur; yabancınınki gerçekleştirilemez','Kanunların resmî şekle','güvenli elektronik imza ile gerçekleştirilemez.',[],'banka teminat mektubu da e-imzayla olur; diğer teminat sözleşmeleri olmaz'),
]
yaz(14, '5070 sayılı Elektronik İmza Kanunu', K)
