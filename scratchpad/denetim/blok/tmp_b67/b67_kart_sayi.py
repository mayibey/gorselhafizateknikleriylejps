# b67 yardımcı: kartlardaki (hüküm + doğrusu) sayıları, kartın andığı maddelerin resmî metniyle karşılaştırır.
# Metinde karşılığı bulunmayan sayıları elle bakmak için listeler (KART_CELISKI adayı taraması).
import json, os, re, sys
sys.stdout.reconfigure(encoding='utf-8')
BURASI = os.path.dirname(os.path.abspath(__file__))
KOK = os.path.abspath(os.path.join(BURASI, '..', '..', '..', '..'))
sys.path.insert(0, os.path.join(KOK, 'scripts', 'harekat-masasi'))
import blok_denetle as D
G = json.load(open(os.path.join(KOK, 'scratchpad', 'denetim', 'blok', 'girdi', 'kanun_67.json'), encoding='utf-8'))
M = {m['no']: m['resmi_metin'] for m in G['maddeler']}
for m in G['maddeler']:
    for k in m['kartlar']:
        metin = k['hukum'] + ' ' + ' '.join(k.get('dogrusu') or [])
        atif = set(re.findall(r'm\.\s*(\d+)', metin)) | {m['no']}
        kaynak = ' '.join(M.get(a, '') for a in atif)
        izin = D.rakamlar(kaynak) | D.kelime_sayilari(kaynak)
        sayilar = D.rakamlar(D.madde_atiflarini_sil(metin))
        yok = sorted(s for s in sayilar if s not in izin)
        if yok:
            print(k['id'], 'maddeler', sorted(atif, key=int), '-> metinde karşılığı yok:', yok)
print('bitti')
