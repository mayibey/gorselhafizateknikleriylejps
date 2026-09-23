"""Altın Özet veri paketi: her mevzuat için emir maddeleri + arşiv madde metinleri + çıkmış sorular + banka kaynak sayıları."""
import json, io, re, os, collections, sys
sys.stdout.reconfigure(encoding='utf-8')
K = 'D:/GorselHafizaTeknikleriyleJSPS/'
S = 'C:/Users/GIGABYTE/AppData/Local/Temp/claude/D--GorselHafizaTeknikleriyleJSPS/7dde7236-e3e5-4bef-9ec6-05f83f966efa/scratchpad/'
OUT = S + 'altin/'; os.makedirs(OUT, exist_ok=True)
ars = json.load(io.open('D:/jsps-community-bot/data/maddeler.json', encoding='utf-8'))
kapsam = json.load(io.open(K + 'scripts/_emir-madde-kapsam.json', encoding='utf-8'))['kapsam']
cikmis = json.load(io.open(K + 'scripts/veri/cikmis-sinav-sorulari.json', encoding='utf-8'))
mebs2024 = []
sorular2024 = {s['soru']: s for s in json.load(io.open(K + 'scratchpad/_kitapcik_sorular.json', encoding='utf-8'))}
for i in range(1, 6):
    p = K + f'scratchpad/_ac_parca_{i}.json'
    if os.path.exists(p):
        for r in json.load(io.open(p, encoding='utf-8')):
            q = sorular2024.get(int(r['soru']))
            if q: mebs2024.append({**r, 'kok': q['kok'], 'siklar': q['siklar'], 'dogru': q['dogru']})

# (grup, seed id, görünen ad, arşiv önekleri, çıkmış-soru anahtarları (kanun no / ad ipucu), banka kaynak ipuçları)
MEVZUAT = [
 ('A', 1, '5237 sayılı Türk Ceza Kanunu (müşterek kapsam)', ['TCK 5237'], ['5237'], ['5237', 'TCK']),
 ('A', 2, '2803 sayılı Jandarma Teşkilat, Görev ve Yetkileri Kanunu', ['Jandarma Kanunu'], ['2803'], ['2803']),
 ('A', 3, '6698 sayılı Kişisel Verilerin Korunması Kanunu', ['KVKK 6698'], ['6698'], ['6698', 'KVKK']),
 ('A', 4, '7201 sayılı Tebligat Kanunu', ['Tebligat 7201'], ['7201'], ['7201', 'Tebligat']),
 ('A', 5, '5442 sayılı İl İdaresi Kanunu', ['İl İdaresi', 'ILIDARESI 5442'], ['5442'], ['5442', 'İl İdaresi']),
 ('A', 6, '5326 sayılı Kabahatler Kanunu', ['Kabahatler 5326'], ['5326'], ['5326', 'Kabahatler']),
 ('A', 7, '3713 sayılı Terörle Mücadele Kanunu', ['Terörle Mücadele 3713'], ['3713'], ['3713', 'Terörle']),
 ('B', 8, '2935 sayılı Olağanüstü Hal Kanunu', ['OHAL 2935'], ['2935'], ['2935', 'Olağanüstü']),
 ('B', 9, '5816 sayılı Atatürk Aleyhine İşlenen Suçlar Hakkında Kanun', ['ATATURK ALEYHINE 5816', 'Atatürk Al. Suçlar'], ['5816'], ['5816', 'Atatürk']),
 ('B', 10, '6284 sayılı Ailenin Korunması ve Kadına Karşı Şiddetin Önlenmesine Dair Kanun', ['6284 Ailenin Korunması'], ['6284'], ['6284 s', '6284 m', '6284 K']),
 ('B', 11, '2893 sayılı Türk Bayrağı Kanunu', ['Türk Bayrağı 2893'], ['2893'], ['2893', 'Bayrağı']),
 ('B', 12, "7068 sayılı Genel Kolluk Disiplin Hükümleri Hakkında KHK'nın Kabul Edilmesine Dair Kanun", ['Disiplin 7068'], ['7068'], ['7068', 'Disiplin']),
 ('B', 13, '4678 sayılı TSK Sözleşmeli Subay ve Astsubaylar Hakkında Kanun', ['Sözleşmeli Sb/Asb 4678'], ['4678'], ['4678']),
 ('B', 14, '5070 sayılı Elektronik İmza Kanunu', ['EIMZA 5070', 'E-İmza'], ['5070'], ['5070', 'İmza']),
 ('C', 15, 'Resmî Yazışmalarda Uygulanacak Usul ve Esaslar Hakkında Yönetmelik', ['Resmî Yazışma'], ['Resmî Yazışma Yön'], ['Resmî Yazışma', 'Resmi Yazışma']),
 ('C', 16, 'Sözleşmeli Subay ve Astsubay Yönetmeliği', ['Sözleşmeli Sb/Asb Yön'], ['Sözleşmeli Yön'], ['SOZLESMELI', 'Sözleşmeli Subay ve Astsubay Yön']),
 ('C', 17, 'Jandarma Teşkilat, Görev ve Yetkileri Yönetmeliği', ['Jandarma Teşkilat Yön'], ['JTGY Yön'], ['JANDYON', 'Jandarma Teşkilat, Görev ve Yetkileri Yön']),
 ('C', 18, 'Kişisel Verilerin Silinmesi, Yok Edilmesi veya Anonim Hale Getirilmesi Hakkında Yönetmelik', ['KV Silme Yön', 'KVK SILME ANONIM'], ['KV Silme Yön'], ['Silme', 'KVKSILME']),
 ('C', 19, 'Bilgi Edinme Hakkı Kanununun Uygulanmasına İlişkin Esas ve Usuller Hakkında Yönetmelik', ['Bilgi Edinme Yön'], ['Bilgi Edinme Yön'], ['Bilgi Edinme', 'BILGIEDINME']),
 ('C', 20, '2521 sayılı Kanunun Uygulanmasına İlişkin Yönetmelik (Av Tüfekleri)', ['2521 Tüfekler Yön', 'TUFEKLER Yön 2521'], ['2521'], ['2521']),
 ('C', 21, '6284 sayılı Kanuna İlişkin Uygulama Yönetmeliği', ['6284 Uyg. Yön'], ['Uyg. Yön'], ['6284UYG', 'Uygulama Yönetmeliği']),
 ('C', 22, 'JGK ve SGK Personel Yönetmeliği', ['PERSONEL Yön'], ['Personel Yön'], ['PERSONELYON', 'Personel Yön']),
 ('C', 23, 'Jandarma ve Sahil Güvenlik Personelinin Hizmet Esasları Yönetmeliği', ['Hizmet Esasları Yön'], ['Hizmet Esasları Yön'], ['HIZMET_ESAS', 'Hizmet Esas']),
 ('C', 24, 'Jandarma Genel Komutanlığı İzin Yönetmeliği', ['JGK IZIN Yön', 'İzin Yön'], ['İzin Yön'], ['JGKIZIN', 'İzin Yön']),
 ('C', 25, '6136 sayılı Ateşli Silahlar ve Bıçaklar ile Diğer Aletler Hakkında Kanun', ['6136 Ateşli Silahlar'], ['6136'], ['6136']),
 ('D', 68, '5809 sayılı Elektronik Haberleşme Kanunu', ['5809 Elektronik Haberleşme'], ['5809'], ['5809']),
 ('D', 97, 'Elektronik Haberleşme Sektörüne İlişkin Yetkilendirme Yönetmeliği', ['Elektronik Haberleşme Yetkilendirme Yön'], ['Yetkilendirme Yön'], ['13078', 'Yetkilendirme']),
 ('D', 98, 'TSK, MİT, EGM, JGK ve SGK Taşınır Mal Yönetmeliği', ['Taşınır Mal Yön'], ['Taşınır Mal Yön'], ['2010-616', 'Taşınır']),
 ('D', 99, 'Merkezî Yönetim Harcama Belgeleri Yönetmeliği', ['Harcama Belgeleri Yön'], ['Harcama Belgeleri Yön'], ['9815', 'Harcama']),
 ('D', 100, 'Kodlu veya Kriptolu Haberleşme Yapma Usul ve Esasları Hakkında Yönetmelik', ['Kriptolu Haberleşme Yön'], ['Kriptolu Yön'], ['14387', 'Kripto']),
 ('D', 101, 'Telsiz İşlemlerine İlişkin Usul ve Esaslar Hakkında Yönetmelik', ['Telsiz İşlemleri Yön'], ['Telsiz Yön'], ['Y13226', 'Telsiz']),
 ('D', 102, 'Cumhurbaşkanlığı 2019/12 Bilgi ve İletişim Güvenliği Tedbirleri Genelgesi', ['CB Genelge 2019-12'], ['Genelge 2019/12'], ['2019-12', '2019/12']),
 ('D', 104, 'Cumhurbaşkanlığı 2024/7 Tasarruf Tedbirleri Genelgesi (haberleşme giderleri)', ['Tasarruf Genelgesi 2024-7'], ['Tasarruf Genelgesi'], ['G20247', '2024/7', 'Tasarruf']),
 ('D', 103, 'CBDDO Bilgi ve İletişim Güvenliği Rehberi', ['Bilgi Güvenliği Rehberi'], ['BİG Rehberi'], ['R-BIG', 'Rehber']),
]
AD_IPUCU = {'Resmî Yazışma Yön': 'resmî yazışma|resmi yazışma', 'Sözleşmeli Yön': 'sözleşmeli subay ve astsubay yönetmeliği', 'JTGY Yön': 'jandarma teşkilat, görev ve yetkileri yönetmeliği',
            'KV Silme Yön': 'kişisel verilerin silinmesi', 'Bilgi Edinme Yön': 'bilgi edinme', 'Uyg. Yön': 'kanuna ilişkin uygulama yönetmeliği', 'Personel Yön': 'personel yönetmeliği',
            'Hizmet Esasları Yön': 'hizmet esasları', 'İzin Yön': 'izin yönetmeliği', 'Yetkilendirme Yön': 'yetkilendirme yönetmeliği', 'Taşınır Mal Yön': 'taşınır mal', 'Harcama Belgeleri Yön': 'harcama belgeleri',
            'Kriptolu Yön': 'kodlu|kriptolu', 'Telsiz Yön': 'telsiz işlemleri', 'Genelge 2019/12': '2019/12', 'Tasarruf Genelgesi': 'tasarruf tedbirleri', 'BİG Rehberi': 'rehber'}
def cikmis_bul(anah):
    out = []
    for x in cikmis:
        if x['bolum'] == 'genel': continue
        k = x['kok']; tut = False
        for a in anah:
            if a.isdigit():
                if re.search(r'\b' + a + r'\s*[Ss]ay[ıi]l[ıi]', k): tut = True
                if a == '6284' and re.search(r'uygulama yönetmeli', k, re.I): tut = False
                if a == '2521' and not re.search(r'yönetmeli', k, re.I): tut = False
            else:
                if re.search(AD_IPUCU.get(a, a.lower()), k, re.I): tut = True
                if a == 'Uyg. Yön' and '6284' not in k: tut = False
        if tut: out.append({'kok': k, 'siklar': x['siklar'], 'rutbe': x['rutbe'], 'kitapcik': x['dosya']})
    return out

# Banka
def oku(p):
    s = io.open(p, encoding='utf-8').read(); out = []
    for r in re.findall(r'\{"id":"[\w-]+".*?\}(?=,\n|\n)', s):
        try: out.append(json.loads(r))
        except Exception: pass
    return out
banka = {}
for q in oku(K + 'src/assets/duello-sorulari.ts') + oku(K + 'src/assets/kart-sorulari.ts'): banka.setdefault(q['id'], q)
banka = list(banka.values())
def banka_bul(ipuclari, onekler):
    out = []
    for q in banka:
        kay = (q.get('kaynak') or ''); idp = q['id']
        if any(ip.upper() in idp.upper() for ip in ipuclari if not ip.isdigit()) or any(ip in kay for ip in ipuclari):
            out.append(q)
    return out

ozet = []
for grup, lid, ad, onekler, cik_anah, banka_ip in MEVZUAT:
    izinli = None
    for b in ('müşterek', 'mebs'):
        if str(lid) in kapsam.get(b, {}): izinli = set(kapsam[b][str(lid)])
    maddeler = []
    for on in onekler:
        for k, v in ars.items():
            if not k.startswith(on + ' m.'): continue
            mno = re.search(r' m\.(\S+)', k).group(1)
            try: n = int(re.match(r'\d+', mno).group())
            except Exception: n = None
            if izinli is not None and n is not None and n not in izinli and 'ek' not in mno.lower(): continue
            maddeler.append({'anahtar': k, 'no': mno, 'metin': v[:6000]})
    cs = cikmis_bul(cik_anah)
    bs = banka_bul(banka_ip, onekler)
    m24 = [r for r in mebs2024 if r.get('madde') and any(on.split()[0].lower() in (r['madde'] or '').lower() or (cik_anah[0].lower() in (r['madde'] or '').lower()) for on in onekler)]
    kaynak_say = collections.Counter(re.sub(r'\s+', ' ', (q.get('kaynak') or '')[:40]) for q in bs)
    paket = {'grup': grup, 'law_id': lid, 'ad': ad, 'emir_maddeleri': sorted(izinli) if izinli else 'Tamamı', 'madde_sayisi': len(maddeler), 'maddeler': maddeler,
             'cikmis_sorular': cs, 'mebs2024': m24, 'banka_sorulari': [{'soru': q['soru'], 'siklar': q['siklar'], 'dogru': q['dogru'], 'aciklama': q.get('aciklama', ''), 'kaynak': q.get('kaynak', '')} for q in bs][:120],
             'banka_kaynak_sayim': kaynak_say.most_common(25)}
    json.dump(paket, io.open(OUT + f'pack_{lid}.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
    ozet.append((grup, lid, ad[:50], len(maddeler), len(cs), len(bs), len(m24)))
print('grup | id | ad | madde | çıkmış | banka | 2024')
for o in ozet: print(' | '.join(str(x) for x in o))
json.dump([{'grup': g, 'law_id': l, 'ad': a} for g, l, a, *_ in MEVZUAT], io.open(OUT + 'liste.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
