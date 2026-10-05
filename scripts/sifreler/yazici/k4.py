# 7201 Tebligat Kanunu — kelime → cevap
# KURAL (başkan, 4 Eki 2026): SOL = soru KÖKÜNDE arayacağın kelime, SAĞ = doğru ŞIKTA arayacağın kelime.
# ("bucak görünce Cumhurbaşkanı'nı yapıştır") Aynı hüküm için birden çok kök ipucu olabilir; kanıt resmî metin.
import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ortak import yaz
K = [
 # m.2 — zabıta vasıtasıyla tebligat
 ('2','makam','tehirinde zarar umulan','kendi memurları veya mülkiye amirinin emriyle zabıta vasıtasıyla','Diğer kanunlarda özel hüküm','zabıta vasıtasıyla yaptırılır.',[],'özel hüküm varsa ve aynı yerdeki daireler arasında da'),
 ('2','istisna','hususi hükümler mahfuzdur','zor kullanılmasını gerektiren veya hazırlık tahkikatına ilişkin zabıta görevleri','Zor kullanılmasını gerektiren','hususi hükümler mahfuzdur.',[],'Kanunda saklı tutulan hükümler'),
 # m.3 — PTT ücreti
 ('3','makam','ücretler','PTT işletmesi ayrı bir tarife ile tespit ve tayin eder','Posta ve Telgraf Teşkilatı Genel Müdürlüğünin','tespit ve tayin edilir.',[],'kanun, kararname, cetvel DEĞİL'),
 # m.21 — adreste bulunmama / imtina
 ('21','sira_usul','imtina','evrakı almayı reddetme; muhtar/ihtiyar heyeti/zabıtaya imza karşılığı','Kendisine tebligat yapılacak kimse veya yukarıdaki','imza mukabilinde teslim eder',[('24', 'm.24: komşu imzadan imtina ederse muhtar ya da zabıta çağrılır')],'herhangi bir komşuya teslim YOK'),
 ('21','sira_usul','gösterilen adreste bulunmaz','muhtar/ihtiyar heyeti azası ya da zabıta amir/memuruna, imza mukabilinde','Kendisine tebligat yapılacak kimse veya yukarıdaki','imza mukabilinde teslim eder',[],'muhatap da tebligat yapılabilecek kimseler de yoksa'),
 ('21','sira_usul','teslim','muhtar/ihtiyar heyeti/zabıtaya imza mukabilinde; komşuya teslim YOK; ihbarname kapıya','tebliğ memuru tebliğ olunacak evrakı, o yerin muhtar','binanın kapısına yapıştırmakla beraber',[],'ihbarnamede tesellüm edenin adresi yazılır'),
 ('21','sira_usul','ihbarname','gösterilen adresteki binanın kapısına yapıştırılır; tesellüm edenin adresini içerir','Gösterilen adres muhatabın adres kayıt','tebliğ tarihi sayılır.',[],''),
 ('21','sure','tebliğ tarihi','ihbarnamenin kapıya yapıştırıldığı tarih','oldukça en yakın komşularından','tebliğ tarihi sayılır.',[],'komşuya haber günü DEĞİL'),
 ('21','sira_usul','adreste bulunmama halinde','en yakın komşularından birine, varsa yönetici veya kapıcıya bildirilir','adreste bulunmama halinde tebliğ olunacak şahsa','kapıcıya da bildirilir.',[],'mümkün oldukça'),
 ('21','kosul','adres kayıt sistemindeki adresi','hiç oturmamış olsa da muhtar/zabıtaya teslim, ihbarname kapıya','Gösterilen adres muhatabın','tebliğ tarihi sayılır.',[],'sürekli ayrılmış olsa da'),
 ('21','kosul','kabule mecburdurlar','muhtar, ihtiyar heyeti üyeleri, zabıta amir ve memurları','Muhtar, ihtiyar heyeti azaları','kabule mecburdurlar.',[],'kendilerine teslim edilen evrakı'),
 # m.22 — muhatap yerine alacak kişi
 ('22','kosul','Muhatap yerine','görünüşüne göre onsekiz yaşından küçük, ehliyetsiz olmamalı; nüfus cüzdanı YOK','Muhatap yerine','ehliyetsiz bulunmaması lazımdır.',[],'görünüşüne nazaran; bariz şekilde ehliyetsiz; 4829 ile onbeşten onsekize'),
 # m.24 — imza bilmeyene tebliğ
 ('24','sira_usul','imza ede','komşu huzurunda sol baş parmak; iki eli yoksa evrak kendisine','Kendisine tebliğ yapılacak kimse imza','kendisine verilir.',[],'imza edemeyecek durumda olan da; muhtara teslim DEĞİL'),
 ('24','sira_usul','Sol elinin baş parmağı','yoksa aynı elinin diğer parmağı; el yoksa sağ baş parmak','Sol elinin baş parmağı bulunmıyan','diğer parmaklarından biri bastırılır.',[],'o da yoksa diğer parmaklardan biri; ayak parmağı YOK'),
 ('24','istisna','iki eli de','tebliğ evrakı kendisine verilir','Tebliğ yapılacak kimsenin iki eli','kendisine verilir.',[],'muhtara teslim DEĞİL'),
 ('24','sira_usul','bastırılmak suretiyle','keyfiyet tebliğ mazbatasında tasrih edilir; hazır bulunan şahsa imza ettirilir','Kendisine tebliğ yapılacak kimse imza','imza ettirilir.',[],''),
 ('24','sira_usul','komşu bulun','muhtar/ihtiyar heyeti üyesi ya da bir zabıta memuru davet edilir','Okur yazar bir komşu','bunların huzurunda yapılır.',[],'komşu imzadan kaçınırsa da'),
 ('24','sira_usul','tebliğ sırasında hazır bulunmak','bir zabıta memuru ya da muhtar/ihtiyar heyeti üyesi davet edilir','Okur yazar bir komşu','bunların huzurunda yapılır.',[],'2026 sınavında soruldu'),
]
yaz(4, '7201 sayılı Tebligat Kanunu', K)
