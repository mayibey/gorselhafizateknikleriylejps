# 7201 Tebligat Kanunu — kelime → cevap
# YÖN KURALI (4 Eki 2026, başkan): SOL = soruda göreceğin ipucu (konu/koşul), SAĞ = hatırlanacak somut cevap (kim, nasıl, süre).
import sys, os; sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from ortak import yaz
K = [
 ('2','makam','tehirinde zarar umulan işlerde','mahalli mülkiye amirinin emriyle zabıta vasıtasıyla; kendi memurlarıyla da','Diğer kanunlarda özel hüküm','zabıta vasıtasıyla yaptırılır.',[],'diğer kanunlarda özel hüküm varsa ve aynı yerdeki daireler arasında da'),
 ('2','istisna','hususi hükümler mahfuzdur','zor kullanma ve hazırlık tahkikatı görevlerinin zabıtaca yapılacağına dair hükümler','Zor kullanılmasını gerektiren','hususi hükümler mahfuzdur.',[],'Kanunun ikinci babındaki hususi hükümler de'),
 ('3','makam','yapacağı işlerden dolayı alacağı ücretler','PTT işletmesi ayrı bir tarife ile tespit ve tayin eder','Posta ve Telgraf Teşkilatı Genel Müdürlüğünin','tespit ve tayin edilir.',[],'kanun, kararname, cetvel DEĞİL; tarife'),
 ('21','sira_usul','tebellüğden imtina ederse','evrak muhtar/ihtiyar heyeti üyesi ya da zabıtaya imza mukabilinde','Kendisine tebligat yapılacak kimse veya yukarıdaki','imza mukabilinde teslim eder',[],'imtina = evrakı almayı reddetme; herhangi bir komşuya teslim YOK'),
 ('21','sira_usul','gösterilen adreste bulunmaz','muhtar/ihtiyar heyeti/zabıtaya imza karşılığı; ihbarname kapıya; komşuya haber','Kendisine tebligat yapılacak kimse veya yukarıdaki','keyfiyetin haber verilmesini de mümkün',[],'muhatap da tebligat yapılabilecek kimseler de yoksa'),
 ('21','sira_usul','adresini ihtiva eden ihbarnameyi','gösterilen adresteki binanın kapısına yapıştırılır; yapıştırıldığı tarih tebliğ tarihi','Gösterilen adres muhatabın adres kayıt','tebliğ tarihi sayılır.',[],''),
 ('21','sira_usul','adreste bulunmama halinde','keyfiyet en yakın komşuya, varsa yönetici veya kapıcıya bildirilir','adreste bulunmama halinde tebliğ olunacak şahsa','kapıcıya da bildirilir.',[],'mümkün oldukça'),
 ('21','kosul','adres kayıt sistemindeki adresi','hiç oturmamış olsa da muhtar/zabıtaya teslim, ihbarname kapıya','Gösterilen adres muhatabın','tebliğ tarihi sayılır.',[],'sürekli ayrılmış olsa da'),
 ('21','sure','kapıya yapıştırıldığı tarih','tebliğ tarihi sayılır','oldukça en yakın komşularından','tebliğ tarihi sayılır.',[],''),
 ('21','kosul','kabule mecburdurlar','muhtar, ihtiyar heyeti üyeleri, zabıta amir ve memurları','Muhtar, ihtiyar heyeti azaları','kabule mecburdurlar.',[],'kendilerine teslim edilen evrakı'),
 ('22','kosul','Muhatap yerine kendisine tebliğ','görünüşe nazaran onsekiz yaşından aşağı olmamalı, bariz ehliyetsiz olmamalı','Muhatap yerine','ehliyetsiz bulunmaması lazımdır.',[],'kimlik değil GÖRÜNÜŞ; 4829 ile onbeşten onsekize çıktı'),
 ('24','sira_usul','imza edecek kadar yazı bilmez','komşulardan biri huzurunda sol elinin baş parmağı bastırılır','Kendisine tebliğ yapılacak kimse imza','bastırılmak suretiyle tebliğ yapılır.',[],'imza edemeyecek durumda olan da'),
 ('24','sira_usul','Sol elinin baş parmağı bulunmıyan','aynı elin diğer parmağı; sol el yoksa sağ baş parmak','Sol elinin baş parmağı bulunmıyan','diğer parmaklarından biri bastırılır.',[],'o da yoksa diğer parmaklardan biri'),
 ('24','istisna','iki eli de yoksa','tebliğ evrakı kendisine verilir','Tebliğ yapılacak kimsenin iki eli','kendisine verilir.',[],''),
 ('24','sira_usul','Yukardaki fıkralarda yazılı hallerde','tebliğ mazbatasında tasrih edilir; hazır bulunan şahsa da imza ettirilir','Yukardaki fıkralarda yazılı hallerde keyfiyet','imza ettirilir.',[],'parmak basma halleri'),
 ('24','sira_usul','Okur yazar bir komşu bulunmaz','muhtar/ihtiyar heyeti üyesi ya da bir zabıta memuru davet edilir','Okur yazar bir komşu','bunların huzurunda yapılır.',[],'komşu imzadan kaçınırsa da; 2026 sınavında soruldu'),
]
yaz(4, '7201 sayılı Tebligat Kanunu', K)
