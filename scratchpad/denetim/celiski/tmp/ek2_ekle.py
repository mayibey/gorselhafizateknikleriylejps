# -*- coding: utf-8 -*-
"""ek_liste2.json kalemlerini (doğrulanmış olanlar) celiski/sonuc.json'a ekler. 99-3 ve 99-4'te hükmün yalnız hatalı
parçası değiştirilir (uzun hüküm elle kopyalanmaz). Aynı kart zaten varsa yenisi yerine geçer."""
import json, sys
sys.stdout.reconfigure(encoding='utf-8')
KOK = 'D:/GorselHafizaTeknikleriyleJSPS'
CAL = 'C:/Users/GIGABYTE/AppData/Local/Temp/claude/D--GorselHafizaTeknikleriyleJSPS/1cb33cb3-f233-47d5-9f06-b8d257742241/scratchpad/calisma'
YOL = KOK + '/scratchpad/denetim/celiski/sonuc.json'
D = json.load(open(YOL, encoding='utf-8'))

K = {}
for br in ['jandarma', 'maliye', 'personel', 'tabip', 'istihkam']:
    for k in json.load(open(f'{CAL}/veri2-{br}.json', encoding='utf-8'))['kanun']:
        for n in k['n']:
            K.setdefault((k['id'], n['i']), n)

def degistir(lid, kid, eski, yeni):
    h = K[(lid, kid)]['h']
    assert h.count(eski) == 1, (kid, h.count(eski))
    return h.replace(eski, yeni)

h99_3 = degistir(99, '99-3', 'şehitlik ve sakatlık tazminatı onay + rapor',
                 'şehitlik tazminatında yalnız yetkili makam onayı; sakatlık tazminatında onay + sakatlık derecesini gösterir rapor')
m99_3 = [m for m in K[(99, '99-3')]['m'] if m != '86']
h99_4 = degistir(99, '99-4', 'denetim elemanlarında görevlendirme aranmaz, bildirim + fatura + kira sözleşmesi (ilk ödemede aslı) + banka makbuzu (m.22)',
                 'denetim elemanlarında görevlendirme yazısı aranmaz: bildirim + yatacak yer faturası; özel şahıstan ev veya pansiyon kiralanmışsa ilk ödemede kira sözleşmesinin aslı, sonrakilerde onaylı örneği; kira banka hesabına yatırılmışsa ayrıca banka makbuzu (m.22)')
h39_4 = next(x for x in D if x['kart_id'] == '39-4')['duzeltme']['hukum']

YENI = [
 {"kanun_id": 7, "kart_id": "7-5", "sorun": "madde_hatali",
  "aciklama": "Madde alanına 3713 m.4'ün atıf yaptığı başka mevzuatın madde numaraları (6831 m.110, Anayasa m.120, 2863 m.68) girilmişti; kart 3713 m.4 (terör suçu sayılan suçlar) hükmüdür. İçerik doğru.",
  "duzeltme": {"madde": ["4"]}},

 {"kanun_id": 6, "kart_id": "6-24", "sorun": "madde_hatali",
  "aciklama": "Madde alanına m.18'in fıkra numaraları (5, 6, 7) ayrı madde diye girilmişti; kart yalnız m.18 (mülkiyetin kamuya geçirilmesi) hükmüdür. İçerik doğru.",
  "duzeltme": {"madde": ["18"]}},

 {"kanun_id": 59, "kart_id": "59-3", "sorun": "hukum_hatali",
  "aciklama": "m.6: 'Bu örnekler Cumhuriyet savcısının huzurunda … derhâl yok edilerek tutanağa geçirilir' cümlesi, hâkimin onaylamadığı (hükümsüz kalan) kararla alınan örnekler içindir; hükümdeki '(işi bitince)' ibaresi metinde yok ve bütün örnekler işi bitince yok edilir gibi okunuyordu.",
  "duzeltme": {
   "hukum": "Şüpheli veya sanığın vücudundan kan veya benzeri biyolojik örnekler ile saç, tükürük, tırnak gibi örnekler alınmasına savcı ya da mağdurun istemiyle veya re'sen hâkim/mahkeme, gecikmesinde sakınca bulunan hâllerde savcı karar verir; savcı kararı 24 saat içinde hâkim veya mahkeme onayına sunulur, hâkim 24 saat içinde karar verir; onaylanmayan kararlar hükümsüz kalır, elde edilen deliller kullanılamaz ve bu örnekler savcı huzurunda uygun usulle derhâl yok edilip tutanağa geçirilir; müdahale tabip veya tabip gözetiminde sağlık mesleği mensubunca yapılır; kişinin sağlığına açık ve öngörülebilir zarar tehlikesi bulunmamalıdır; üst sınırı 2 yıldan az hapis gerektiren suçlarda örnek alınamaz; özel kanunlardaki alkol muayenesi ve kan örneği hükümleri saklıdır (m.6)",
   "sinavda_boyle_yazarlar": [
    "“Üst sınırı 3 yıldan az hapis cezası gerektiren suçlarda örnek alınamaz.”",
    "“Hâkimin onaylamadığı kararla alınan örneklerden elde edilen deliller, Cumhuriyet savcısının takdiriyle kullanılabilir.”"
   ],
   "dogrusu": [
    "Üst sınırı 2 yıldan az hapis cezası gerektiren suçlarda kan, saç, tükürük, tırnak gibi örnekler alınamaz (m.6)",
    "Onaylanmayan kararlar hükümsüz kalır, elde edilen deliller kullanılamaz ve örnekler savcı huzurunda derhâl yok edilir (m.6)"
   ]}},

 {"kanun_id": 60, "kart_id": "60-9", "sorun": "eksik_kayit",
  "aciklama": "m.14/2: ihmal veya istismara uğrayan, uyum sorunu yaşayan ve rehabilitasyona ihtiyacı tespit edilen çocuklar 'rehabilitasyonu sağlanıncaya kadar' diğer çocuklarla aynı ortamda bakılmaz; hükümde bu süre kaydı (ve uyum sorunu yaşayanlar) eksikti, yasak süresizmiş gibi okunuyordu.",
  "duzeltme": {
   "hukum": "Bakımından sorumlu kimse görevini yerine getiremiyorsa Aile Bakanlığı il/ilçe müdürlüklerince çocuk resmî veya özel bakım yurduna yerleştirilir ya da koruyucu aile hizmetinden yararlandırılır; ihmal veya istismara uğrayan, psiko-sosyal sorunları nedeniyle uyum sorunu yaşayan ve rehabilitasyona ihtiyacı tespit edilen çocuklar, rehabilitasyonları sağlanıncaya kadar korunma ihtiyacı olan diğer çocuklarla aynı ortamda bakılmaz; kolluk çocuğu ilk sağlık kontrolü yapıldıktan sonra teslim eder; bulaşıcı hastalık tedavisi ve sağlık giderleri Sağlık Bakanlığınca karşılanır; yabancı çocuk için konsoloslukla irtibat sağlanır (m.14)",
   "sinavda_boyle_yazarlar": [
    "“Kolluk, bakım tedbiri kararı verilen çocuğu sağlık kontrolü yapılmadan doğrudan il veya ilçe müdürlüğüne teslim eder.”",
    "“Rehabilitasyona ihtiyacı olan çocuklar, korunma ihtiyacı olan diğer çocuklarla hiçbir zaman aynı ortamda bakılamaz.”"
   ],
   "dogrusu": [
    "Kolluk, bakım tedbiri kararı verilen çocuğu ilk sağlık kontrolü yapıldıktan sonra il veya ilçe müdürlüğüne teslim eder (m.14/4)",
    "Rehabilitasyona ihtiyacı olan çocuklar, rehabilitasyonları sağlanıncaya kadar diğer çocuklarla aynı ortamda bakılmaz (m.14/2)"
   ]}},

 {"kanun_id": 54, "kart_id": "54-2", "sorun": "hukum_hatali",
  "aciklama": "m.8: personel listesi ve mali sorumluluk sigortası poliçeleri 'personelin göreve başladığı tarihten itibaren' 15 gün içinde (geçici veya acil izinlerde müracaat sırasında) valiliğe verilir; hükümdeki 'göreve başlamadan itibaren' ibaresi başlamadan önce gibi okunuyordu.",
  "duzeltme": {
   "hukum": "Başvuru valiliğe yapılır; hizmetin konusu, yöntemi, azami personel sayısı, silah ve teçhizatın miktarı ve niteliği belirtilir; valilik incelemesinden sonra komisyon karar verir, kararlar valinin onayına sunulur; başvurular en geç 10 iş günü içinde sonuçlandırılır; genel güvenlikle korunma mümkünse veya kamu hürriyetleri için sakıncalıysa izin verilmez (gerekçeli); talep hâlinde il genelinde verilen kadronun %10'unu aşmayacak geçici personel istihdam izni verilebilir; personel listesi ve mali sorumluluk sigortası poliçelerinin birer sureti personelin göreve başladığı tarihten itibaren 15 gün içinde (geçici veya acil izinlerde müracaat sırasında) valiliğe verilir; işe başlama ve ayrılma bildirimleri 15 gün içinde valiliğe yapılır (m.8)",
   "sinavda_boyle_yazarlar": [
    "“Özel güvenlik personelinin listesi ve sigorta poliçeleri, personel göreve başlamadan en az on beş gün önce valiliğe verilir.”",
    "“Komisyonun özel güvenlik izni verilmesi veya verilmemesi yönündeki kararları İçişleri Bakanının onayına sunulur.”",
    "“Özel güvenlik izni için yapılan başvurular en geç otuz iş günü içinde sonuçlandırılır.”"
   ],
   "dogrusu": [
    "Personel listesi ve mali sorumluluk sigortası poliçeleri, personelin göreve başladığı tarihten itibaren 15 gün içinde valiliğe verilir (m.8)",
    "Komisyonun özel güvenlik izni verilmesi ya da verilmemesi yönündeki kararları valinin onayına sunulur (m.8)",
    "Özel güvenlik izni için yapılan başvurular en geç 10 iş günü içinde sonuçlandırılır (m.8)"
   ]}},

 {"kanun_id": 54, "kart_id": "54-5", "sorun": "eksik_kayit",
  "aciklama": "m.21: kimlik kartları EGM'ce düzenlenebileceği gibi Bakanlıkça uygun görülecek kamu kurum ve kuruluşları ile kanunla kurulan tüzel kişilere de yaptırılabilir; hüküm yalnız EGM'yi sayıyordu.",
  "duzeltme": {
   "hukum": "Kartta ad-soyad ile yönetici ya da silahlı veya silahsız olduğu yazılır; görevli kartı görev alanı ve süresi içinde herkesin görebileceği şekilde yakasında taşır; kayıpta işveren derhal Bakanlığa/valiliğe bildirir; kart, 5 yılda bir yenilenen güvenlik soruşturması ve arşiv araştırması olumlu olur ve yenileme eğitimi sertifikası ibraz edilirse ruhsat harcı alınmaksızın yeniden düzenlenir; kartlar valiliklerin elektronik sistemle gönderdiği bilgilere göre EGM'ce düzenlenebileceği gibi Bakanlıkça uygun görülecek kamu kurum ve kuruluşları ile kanunla kurulan tüzel kişilere de yaptırılabilir; kart adrese posta ile gönderilir (m.21)",
   "sinavda_boyle_yazarlar": [
    "“Özel güvenlik kimlik kartı her beş yılda bir ruhsat harcı ödenerek yeniden düzenlenir.”",
    "“Özel güvenlik kimlik kartlarını yalnız Emniyet Genel Müdürlüğü düzenleyebilir.”"
   ],
   "dogrusu": [
    "Kimlik kartı 5 yılda bir ruhsat harcı alınmaksızın yeniden düzenlenir (m.21)",
    "Kartlar EGM'ce düzenlenebileceği gibi Bakanlıkça uygun görülen kamu kurumlarına ve kanunla kurulan tüzel kişilere de yaptırılabilir (m.21)"
   ]}},

 {"kanun_id": 55, "kart_id": "55-0", "sorun": "madde_hatali",
  "aciklama": "Kart m.3 (tanımlar: adli kolluk görevlisi, adli kolluk sorumlusu, en üst dereceli kolluk amiri) hükmüdür; m.7'ye bağlanmıştı (m.7 diğer kolluk birimlerinin adli kolluk yükümlülüğüdür). İçerik doğru.",
  "duzeltme": {"madde": ["3"]}},

 {"kanun_id": 54, "kart_id": "54-15", "sorun": "madde_hatali",
  "aciklama": "Kart m.44 (denetimin kapsamı) ve m.45 (denetim sonucunun izlenmesi) hükmüdür; madde alanındaki 19 ve 20, m.45'in atıf yaptığı 5188 sayılı Kanunun maddeleridir, yönetmeliğin değil. Kırmızı ve yeşil kutu m.45'teki asgari 7 gün süresini sorduğu için m.45 öne alındı. İçerik doğru.",
  "duzeltme": {"madde": ["45", "44"]}},

 {"kanun_id": 52, "kart_id": "52-6", "sorun": "hukum_hatali",
  "aciklama": "m.16 (belediyelerin görevleri) yalnız 'halkın trafik eğitimine katkıda bulunmak üzere çocuk trafik eğitim parkları yapmak ve yapılmasına izin vermek' der; 'parkların esaslarını MEB belirler' bilgisi m.16'da ve elimizdeki resmî metnin hiçbir maddesinde yok. Kart, doğrulanabilen m.16 içeriğine indirildi.",
  "duzeltme": {
   "baslik": "Çocuk trafik eğitim parkları — belediye görevi",
   "hukum": "Belediye trafik hizmet birimleri, halkın trafik eğitimine katkıda bulunmak üzere çocuk trafik eğitim parkları yapar ve yapılmasına izin verir; açık ve kapalı otopark ile alt ve üst geçit yapar, yaptırır, işletir ve işletilmesine izin verir. Belediyeler kendilerine verilen hizmetlerin denetimi dışında trafiği denetleyemez ve hiçbir hâlde trafik suç ve ceza tutanağı düzenleyemez (m.16)",
   "sinavda_boyle_yazarlar": [
    "“Belediyeler çocuk trafik eğitim parkı yapamaz, yalnız yapılmasına izin verebilir.”",
    "“Belediye trafik birimleri, trafik denetimi sırasında trafik suç ve ceza tutanağı düzenleyebilir.”"
   ],
   "dogrusu": [
    "Belediyeler halkın trafik eğitimine katkı için çocuk trafik eğitim parkları yapar ve yapılmasına izin verir (m.16)",
    "Belediyeler görevli oldukları hizmetlerin denetimi dışında trafiği denetleyemez ve hiçbir hâlde trafik suç ve ceza tutanağı düzenleyemez (m.16)"
   ]}},

 {"kanun_id": 99, "kart_id": "99-3", "sorun": "hukum_hatali",
  "aciklama": "m.10/b: 3160 sayılı Kanuna göre şehitlik tazminatında yalnız yetkili makam onayı, sakatlık tazminatında ise onay ile sakatlık derecesini gösteren rapor aranır; hüküm raporu şehitliğe de yazıyordu (yalnız bu parça değiştirildi). Madde alanındaki '86' yönetmeliğin değil 3201 sayılı Kanunun maddesidir; çıkarıldı.",
  "duzeltme": {"hukum": h99_3, "madde": m99_3}},

 {"kanun_id": 99, "kart_id": "99-4", "sorun": "eksik_kayit",
  "aciklama": "m.22/b: denetim elemanlarında kira sözleşmesi yalnız özel şahıslardan ev veya pansiyon kiralanmışsa (ilk ödemede aslı, sonra onaylı örneği), banka makbuzu ise yalnız kira banka hesabına yatırılmışsa aranır; hüküm ikisini koşulsuz yazıyordu (yalnız bu parça değiştirildi).",
  "duzeltme": {"hukum": h99_4}},

 {"kanun_id": 143, "kart_id": "143-4", "sorun": "hukum_hatali",
  "aciklama": "39-4 ile aynı hata (2872 m.20/e): faaliyet alanını eski hâle getirme yükümlülüğü ÇED süreci tamamlanmadan inşaata başlama ya da faaliyete geçme cezasının ardından gelir, ÇED taahhüdüne aykırılığa bağlanmıştı; ayrıca m.20/a-2 cezası katalitik konvertörsüz aracı kullanana değil taşıt sahibine verilir. Hüküm 39-4'ün düzeltilmiş hâliyle aynı yapıldı.",
  "duzeltme": {"hukum": h39_4}},

 {"kanun_id": 99, "kart_id": "99-7", "sorun": "madde_hatali",
  "aciklama": "Kart m.63-69 (ortak ve son hükümler) hükmüdür; madde alanındaki '22', m.63'ün atıf yaptığı 4734 sayılı Kanunun 22/d bendidir. İçerik doğru.",
  "duzeltme": {"madde": ["63", "64", "65", "66", "67", "68", "69"]}},

 {"kanun_id": 143, "kart_id": "143-5", "sorun": "madde_hatali",
  "aciklama": "Kart m.26 (adlî nitelikteki cezalar) hükmüdür; m.12'ye bağlanmıştı (39-5 ile aynı). İçerik doğru.",
  "duzeltme": {"madde": ["26"]}},

 {"kanun_id": 82, "kart_id": "82-16", "sorun": "madde_hatali",
  "aciklama": "Kart m.10 (yönetmelik, saymanlığın ödemeyi geciktirememesi, engellilik tazminatında 6 derece ve %10 indirim) hükmüdür; m.3'e bağlanmıştı. İçerik doğru.",
  "duzeltme": {"madde": ["10"]}},
]

anahtar = {(x['kanun_id'], x['kart_id']) for x in YENI}
D = [x for x in D if (x['kanun_id'], x['kart_id']) not in anahtar] + YENI
json.dump(D, open(YOL, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('toplam kayıt', len(D), '· eklenen', len(YENI))
print('99-3 madde:', m99_3)
