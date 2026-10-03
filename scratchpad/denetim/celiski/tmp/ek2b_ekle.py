# -*- coding: utf-8 -*-
"""ek_liste2.json'a 17:59'da eklenen 122-1 ve 122-5 kayıtlarını celiski/sonuc.json'a ekler (uzun hükümde yalnız hatalı parça değişir)."""
import json, sys
sys.stdout.reconfigure(encoding='utf-8')
KOK = 'D:/GorselHafizaTeknikleriyleJSPS'
CAL = 'C:/Users/GIGABYTE/AppData/Local/Temp/claude/D--GorselHafizaTeknikleriyleJSPS/1cb33cb3-f233-47d5-9f06-b8d257742241/scratchpad/calisma'
YOL = KOK + '/scratchpad/denetim/celiski/sonuc.json'
D = json.load(open(YOL, encoding='utf-8'))
K = {}
for br in ['tabip', 'jandarma', 'maliye', 'personel', 'istihkam', 'bakim', 'ikmal']:
    for k in json.load(open(f'{CAL}/veri2-{br}.json', encoding='utf-8'))['kanun']:
        for n in k['n']:
            K.setdefault((k['id'], n['i']), n)

def degistir(lid, kid, eski, yeni):
    h = K[(lid, kid)]['h']
    assert h.count(eski) == 1, (kid, h.count(eski))
    return h.replace(eski, yeni)

h122_1 = degistir(122, '122-1', '21/b-c-f alımlarında mal sözleşme süresi içinde teslim edilirse sözleşme zorunlu değil (m.15)',
                  '21/b-c-f alımlarında mal sözleşme yapma süresi içinde teslim edilir ve idarece uygun bulunursa sözleşme yapılması zorunlu değil (m.15)')
h122_5 = degistir(122, '122-5', "(21/b-c-f'de mal süresinde teslim edilirse sözleşme ve kesin teminat zorunlu değil)",
                  "(21/b-c-f'de mal sözleşme yapma süresi içinde teslim edilir ve idarece uygun bulunursa sözleşme ve kesin teminat zorunlu değil)")
KANUN_NO = {'10', '11', '17', '34', '41'}   # 4734 sayılı Kanunun madde numaraları (yönetmeliğin değil)
m122_5 = [m for m in K[(122, '122-5')]['m'] if m not in KANUN_NO]
assert m122_5[0] == '50', m122_5

YENI = [
 {"kanun_id": 122, "kart_id": "122-1", "sorun": "eksik_kayit",
  "aciklama": "m.15/5: 21/b-c-f kapsamındaki mal alımlarında sözleşme yapılmaması için malın 'sözleşme YAPMA süresi içinde' teslim edilmesi VE bunun idarece uygun bulunması gerekir; hükümde 'sözleşme süresi içinde teslim' yazıyordu ve idarenin uygun bulma şartı yoktu (yalnız bu parça değiştirildi).",
  "duzeltme": {"hukum": h122_1}},
 {"kanun_id": 122, "kart_id": "122-5", "sorun": "madde_hatali",
  "aciklama": "Kart yönetmeliğin m.50-68 hükümleridir (ihale dışı bırakılma, katılamayacaklar, teklif, teminat, değerlendirme, sonuçlandırma); madde alanındaki 10, 11, 17, 34 ve 41, metnin atıf yaptığı 4734 sayılı Kanunun maddeleridir; kart bu yüzden yönetmeliğin m.10'una (ihale dokümanı) bağlanmıştı, m.50 öne alındı. Ayrıca m.54/2'deki aynı şart düzeltildi: sözleşme ve kesin teminat, mal 'sözleşme yapma süresi içinde' teslim edilip idarece uygun bulunursa zorunlu değildir (122-1 ile aynı hata; hükümde yalnız bu parça değiştirildi).",
  "duzeltme": {"madde": m122_5, "hukum": h122_5}},
]
anahtar = {(x['kanun_id'], x['kart_id']) for x in YENI}
D = [x for x in D if (x['kanun_id'], x['kart_id']) not in anahtar] + YENI
json.dump(D, open(YOL, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('toplam kayıt', len(D), '· 122-5 madde:', m122_5)
