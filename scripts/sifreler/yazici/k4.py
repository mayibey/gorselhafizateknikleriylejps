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
 ('21', 'sira_usul', 'tebellüğden imtina ederse', 'evrak muhtar/ihtiyar heyeti üyesi ya da zabıtaya imza karşılığı', 'Kendisine tebligat yapılacak kimse veya yukarıdaki', 'imza mukabilinde teslim eder', [], 'imtina = evrakı almayı reddetme; adreste bulunmama da aynı usul'),
 ('21', 'sira_usul', 'imza mukabilinde teslim eder', 'muhtar, ihtiyar heyeti üyesi ya da zabıta amir/memuruna', 'tebliğ memuru tebliğ olunacak evrakı, o yerin muhtar', 'imza mukabilinde teslim eder', [], 'herhangi bir komşuya teslim YOK'),
 ('21', 'sira_usul', 'binanın kapısına yapıştırmakla', 'ihbarname kapıya; bulunmama halinde en yakın komşuya/yöneticiye/kapıcıya haber', 'ihbarnameyi gösterilen adresteki binanın kapısına yapıştırmakla', 'keyfiyetin haber verilmesini de mümkün', [], ''),
 ('21', 'sira_usul', 'en yakın komşularından birine', 'adreste bulunmama haberi; varsa yönetici veya kapıcıya da', 'oldukça en yakın komşularından', 'kapıcıya da bildirilir.', [], ''),
 ('3', 'makam', 'ayrı bir tarife ile', 'PTT Genel Müdürlüğü ücretleri kendisi tespit eder', 'Posta ve Telgraf Teşkilatı Genel Müdürlüğünin', 'tespit ve tayin edilir.', [], ''),
 ('3', 'makam', 'yapacağı işlerden dolayı alacağı ücretler', 'PTT işletmesi ayrı bir tarife ile belirler', 'Posta ve Telgraf Teşkilatı Genel Müdürlüğünin', 'tespit ve tayin edilir.', [], ''),
 ('24', 'sira_usul', 'tebliğ mazbatasında tasrih edilir', 'parmak basma hallerinde; hazır bulunan şahsa da imza ettirilir', 'Yukardaki fıkralarda yazılı hallerde keyfiyet', 'imza ettirilir.', [], ''),
 ('24', 'sira_usul', 'bir zabıta memurunu', 'okuryazar komşu yoksa; muhtar/ihtiyar heyeti üyesi de davet edilebilir', 'Okur yazar bir komşu', 'bunların huzurunda yapılır.', [], '2026 sınavında soruldu'),
 ('24', 'sira_usul', 'komşularından bir kişi huzurunda', 'imza bilmeyene sol elinin baş parmağı bastırılarak tebliğ', 'Kendisine tebliğ yapılacak kimse imza', 'bastırılmak suretiyle tebliğ yapılır.', [], ''),
 ('22', 'kosul', 'görünüşüne nazaran', 'muhatap yerine alacak kişi onsekiz yaşından küçük görünmemeli', 'Muhatap yerine', 'ehliyetsiz bulunmaması lazımdır.', [], 'kimlik değil görünüş; bariz ehliyetsiz olmamalı'),
 ('2', 'makam', 'mahalli mülkiye amirinin emriyle', 'zabıta tebligat yapar; tehirinde zarar umulan işlerde', 'Diğer kanunlarda özel hüküm', 'zabıta vasıtasıyla yaptırılır.', [], ''),
 ('2', 'istisna', 'hazırlık tahkikatına taallük eden', 'zor kullanma ve hazırlık tahkikatı görevleri zabıtada; hükümler mahfuz', 'Zor kullanılmasını gerektiren', 'hususi hükümler mahfuzdur.', [], ''),
]
yaz(4, '7201 sayılı Tebligat Kanunu', K)
