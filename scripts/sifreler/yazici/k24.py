# Jandarma Genel Komutanlığı İzin Yönetmeliği — kelime → cevap
import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ortak import yaz
K = [
 ('5','tanim','Sıhhi izinler','izin türlerinden; yıllık, mazeret, sıhhi, yurt dışı','a) Personele verilecek izinler','4) Yurt dışı izinleri.',[],'dört tür'),
 ('5','istisna','kanuni izinlerinden mahsup edilmez','adli makama şüpheli, sanık, tanık, mağdur, bilirkişi çağrısı','d) Adli makamlara','mahsup edilmez.',[],'amir, çağrı ve yol süresine göre gönderir'),
 ('5','makam','vekâlet edenler','vekâlet ettikleri kadronun izin yetkisine sahip','e) İzin vermeye yetkili','yetkisine sahiptir.',[],''),
 ('5','istisna','izinli sayılır','milletlerarası spor müsabakası ve hazırlığına katılan','f) 21/5/1986','izinli sayılır.',[],''),
 ('5','makam','izinden geriye çağrılabilir','asgari yıllık izin planını onaylayan makam; yazılı ya da sözlü','ğ) Görev ve hizmet ihtiyacının','yazılı veya sözlü olarak yapılabilir.',[],'sonradan görevlendirme yazısı; dönüş ve gidiş masrafı Harcırah Kanununa göre ödenir; savaş ve OHAL\'de de çağrılabilir'),
 ('5','sure','günün başlangıç saatidir','izinlerin başlangıç ve bitiş saati','h) İzinlerin başlangıç','günün başlangıç saatidir.',[],'istisnai durumda yetkili amir farklı saat belirleyebilir'),
 ('5','sure','48 saat içerisinde','yurda dönme kararı tebliğ edilen izinli personel döner','i) Yurt dışında izinde','dönüşe geçer.',[],'en kısa yol, en seri vasıta; mücbir sebeple uzatılabilir'),
 ('5','yasak','ilin dışına izinsiz çıkamaz','personel; hafta sonu il dışı izni kanuni izinden düşmez','j) Personel görev yaptığı','mahsup edilmez.',[],''),
 ('5','yasak','Kursiyerlere','planlı tatiller dışında izin verilmez','m) Kursiyerlere','izin verilmez.',[],'geçerli özrü olana kursu veren birim mazeret izni verebilir'),
 ('20','yasak','silahını götüremez','seyahatle yurt dışına giden; şahsi, zati, miri','d) Zorunlu olmadıkça','silahını götüremez.',[],''),
 ('20','yasak','Zorunlu olmadıkça üniforma giyemez','yurt dışında izinli personel','d) Zorunlu olmadıkça','silahını götüremez.',[],''),
]
yaz(24, 'Jandarma Genel Komutanlığı İzin Yönetmeliği', K)
