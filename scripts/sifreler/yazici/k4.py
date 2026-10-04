# 7201 Tebligat Kanunu — kelime → cevap
# KURAL (başkan, 4 Eki 2026): SOL = soru KÖKÜNDE arayacağın kelime, SAĞ = doğru ŞIKTA arayacağın kelime.
# ("bucak görünce Cumhurbaşkanı'nı yapıştır") Aynı hüküm için birden çok kök ipucu olabilir; kanıt resmî metin.
import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ortak import yaz
K = [
 # m.2 — zabıta vasıtasıyla tebligat
 ('2','makam','tehirinde zarar umulan','kendi memurları veya mülkiye amirinin emriyle zabıta vasıtasıyla','Diğer kanunlarda özel hüküm','zabıta vasıtasıyla yaptırılır.',[],'aynı yerdeki daireler arasında da'),
 ('2','makam','diğer kanunlarda özel hüküm','kendi memurları veya mülkiye amirinin emriyle zabıta vasıtasıyla','Diğer kanunlarda özel hüküm','zabıta vasıtasıyla yaptırılır.',[],''),
 ('2','makam','mülkiye amirinin emriyle','zabıta vasıtasıyla tebligat','Diğer kanunlarda özel hüküm','zabıta vasıtasıyla yaptırılır.',[],'boşluk sorusu: "… emriyle ____ vasıtasıyla"'),
 ('2','kosul','zabıta','mahalli mülkiye amirinin emri (tehirinde zarar umulan işler)','Diğer kanunlarda özel hüküm','zabıta vasıtasıyla yaptırılır.',[('21','adreste bulunmayana evrak muhtar ya da zabıtaya imza karşılığı teslim'),('24','okuryazar komşu yoksa zabıta memuru tebliğe tanık çağrılır')],'zabıtanın tebligat yapma şartı'),
 ('2','istisna','hususi hükümler mahfuzdur','zor kullanılmasını gerektiren veya hazırlık tahkikatına ilişkin zabıta görevleri','Zor kullanılmasını gerektiren','hususi hükümler mahfuzdur.',[],'Kanunda saklı tutulan hükümler'),
 # m.3 — PTT ücreti
 ('3','makam','alacağı ücretler','ayrı bir tarife ile; PTT işletmesi kendisi belirler','Posta ve Telgraf Teşkilatı Genel Müdürlüğünin','tespit ve tayin edilir.',[],'kanun, kararname, cetvel DEĞİL'),
 ('3','makam','ücretler','PTT işletmesi ayrı bir tarife ile tespit ve tayin eder','Posta ve Telgraf Teşkilatı Genel Müdürlüğünin','tespit ve tayin edilir.',[],''),
 # m.21 — adreste bulunmama / imtina
 ('21','sira_usul','tebellüğden imtina','evrakı almayı reddetme; muhtar/ihtiyar heyeti/zabıtaya imza karşılığı','Kendisine tebligat yapılacak kimse veya yukarıdaki','imza mukabilinde teslim eder',[],'herhangi bir komşuya teslim YOK'),
 ('21','sira_usul','gösterilen adreste bulunmaz','muhtar/ihtiyar heyeti azası ya da zabıta amir/memuruna, imza mukabilinde','Kendisine tebligat yapılacak kimse veya yukarıdaki','imza mukabilinde teslim eder',[],'muhatap da tebligat yapılabilecek kimseler de yoksa'),
 ('21','sira_usul','teslim eder','imza mukabilinde (muhtar, ihtiyar heyeti azası, zabıta)','tebliğ memuru tebliğ olunacak evrakı, o yerin muhtar','imza mukabilinde teslim eder',[],'teslim usulü'),
 ('21','sira_usul','ihbarname','gösterilen adresteki binanın kapısına yapıştırılır; tesellüm edenin adresini içerir','Gösterilen adres muhatabın adres kayıt','tebliğ tarihi sayılır.',[],''),
 ('21','sure','tebliğ tarihi','ihbarnamenin kapıya yapıştırıldığı tarih','oldukça en yakın komşularından','tebliğ tarihi sayılır.',[],'komşuya haber günü DEĞİL'),
 ('21','sure','kapıya yapıştırıldığı tarih','tebliğ tarihi sayılır','oldukça en yakın komşularından','tebliğ tarihi sayılır.',[],''),
 ('21','sira_usul','adreste bulunmama halinde','en yakın komşularından birine, varsa yönetici veya kapıcıya bildirilir','adreste bulunmama halinde tebliğ olunacak şahsa','kapıcıya da bildirilir.',[],'mümkün oldukça'),
 ('21','kosul','adres kayıt sistemindeki adresi','hiç oturmamış olsa da muhtar/zabıtaya teslim, ihbarname kapıya','Gösterilen adres muhatabın','tebliğ tarihi sayılır.',[],'sürekli ayrılmış olsa da'),
 ('21','kosul','kabule mecburdurlar','muhtar, ihtiyar heyeti üyeleri, zabıta amir ve memurları','Muhtar, ihtiyar heyeti azaları','kabule mecburdurlar.',[],'kendilerine teslim edilen evrakı'),
 # m.22 — muhatap yerine alacak kişi
 ('22','kosul','Muhatap yerine','görünüşüne nazaran onsekiz yaşından aşağı olmamalı; bariz ehliyetsiz olmamalı','Muhatap yerine','ehliyetsiz bulunmaması lazımdır.',[],'kimlik belgesi şartı YOK; 4829 ile onbeşten onsekize'),
 # m.24 — imza bilmeyene tebliğ
 ('24','sira_usul','imza edecek kadar yazı bilmez','komşulardan biri huzurunda sol elinin baş parmağı bastırılır','Kendisine tebliğ yapılacak kimse imza','bastırılmak suretiyle tebliğ yapılır.',[],'imza edemeyecek durumda olan da'),
 ('24','sira_usul','komşularından bir kişi huzurunda','sol elinin baş parmağı bastırılır','Kendisine tebliğ yapılacak kimse imza','bastırılmak suretiyle tebliğ yapılır.',[],''),
 ('24','sira_usul','Sol elinin baş parmağı','yoksa aynı elinin diğer parmağı; el yoksa sağ baş parmak','Sol elinin baş parmağı bulunmıyan','diğer parmaklarından biri bastırılır.',[],'o da yoksa diğer parmaklardan biri; ayak parmağı YOK'),
 ('24','istisna','iki eli de','tebliğ evrakı kendisine verilir','Tebliğ yapılacak kimsenin iki eli','kendisine verilir.',[],'muhtara teslim DEĞİL'),
 ('24','sira_usul','bastırılmak suretiyle','keyfiyet tebliğ mazbatasında tasrih edilir; hazır bulunan şahsa imza ettirilir','Kendisine tebliğ yapılacak kimse imza','imza ettirilir.',[],''),
 ('24','sira_usul','Okur yazar bir komşu','muhtar/ihtiyar heyeti üyesi ya da bir zabıta memuru davet edilir','Okur yazar bir komşu','bunların huzurunda yapılır.',[],'komşu imzadan kaçınırsa da'),
 ('24','sira_usul','tebliğ sırasında hazır bulunmak','bir zabıta memuru ya da muhtar/ihtiyar heyeti üyesi davet edilir','Okur yazar bir komşu','bunların huzurunda yapılır.',[],'2026 sınavında soruldu'),
]
yaz(4, '7201 sayılı Tebligat Kanunu', K)
