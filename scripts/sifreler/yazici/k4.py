# 7201 Tebligat Kanunu — kelime → cevap
import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ortak import yaz
K = [
 ('2','makam','zabıta vasıtasıyla','tehirinde zarar umulan işlerde, mülki amir emriyle','Diğer kanunlarda özel hüküm','zabıta vasıtasıyla yaptırılır.',[],'kendi memurları ile de'),
 ('21','sure','kapıya yapıştırıldığı tarih','tebliğ tarihi sayılır','oldukça en yakın komşularından','tebliğ tarihi sayılır.',[],'evrak muhtar/ihtiyar heyeti/zabıtaya; komşu, yönetici, kapıcıya haber'),
 ('21','kosul','adres kayıt sistemindeki adresi','hiç oturmamış olsa da muhtara/zabıtaya teslim, kapıya ihbarname','Gösterilen adres muhatabın','tebliğ tarihi sayılır.',[],''),
 ('21','kosul','kabule mecburdurlar','muhtar, ihtiyar heyeti, zabıta: evrakı kabul zorunlu','Muhtar, ihtiyar heyeti azaları','kabule mecburdurlar.',[],''),
 ('22','kosul','onsekiz yaşından','muhatap yerine alacak kişi; görünüşe nazaran, ehliyetsiz olmamalı','Muhatap yerine','ehliyetsiz bulunmaması lazımdır.',[],''),
 ('24','sira_usul','sol elinin baş parmağı','imza bilmeyene, komşu huzurunda','Kendisine tebliğ yapılacak kimse imza','bastırılmak suretiyle tebliğ yapılır.',[],'sol baş parmak yoksa aynı elin diğer parmağı, sol el yoksa sağ baş parmak'),
 ('24','istisna','iki eli de yoksa','tebliğ evrakı kendisine verilir','Tebliğ yapılacak kimsenin iki eli','kendisine verilir.',[],''),
 ('24','sira_usul','Okur yazar bir komşu','muhtar, ihtiyar heyeti üyesi ya da zabıta huzurunda','Okur yazar bir komşu','bunların huzurunda yapılır.',[],'komşu yoksa ya da imzadan kaçınırsa'),
 ('24', 'sira_usul', 'aynı elinin diğer bir parmağı', 'sol baş parmağı yoksa; el yoksa sağ elinin baş parmağı', 'Sol elinin baş parmağı bulunmıyan', 'diğer parmaklarından biri bastırılır.', [], ''),
]
yaz(4, '7201 sayılı Tebligat Kanunu', K)
