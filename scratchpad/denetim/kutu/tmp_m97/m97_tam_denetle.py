# Yardımcı: yanlış cümleleri TAM resmî metne (gemini tamamlanmış + mevzuat önbelleği + girdi) karşı denetler.
# Kullanım: python m97_tam_denetle.py <kanun_id>
import json, os, re, sys
sys.stdout.reconfigure(encoding='utf-8')
KOK = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..', '..'))
sys.path.insert(0, os.path.join(KOK, 'scripts', 'harekat-masasi'))
from blok_denetle import kelime_sayilari, rakamlar, madde_atiflarini_sil, kucuk

def norm(t): return re.sub(r'\s+', ' ', re.sub(r'[“”"\'’‘.,;:()]', ' ', kucuk(t))).strip()

lid = int(sys.argv[1])
G = json.load(open(os.path.join(KOK, 'scratchpad', 'denetim', 'kutu', 'girdi', f'kanun_{lid}.json'), encoding='utf-8'))
parca = []
for k in G['kartlar']:
    parca += list(k['resmi_metin'].values())
gy = os.path.join(KOK, 'gemini_calisma', 'girdi', 'resmi_metin', f'kanun_{lid}.json')
if os.path.exists(gy):
    R = json.load(open(gy, encoding='utf-8'))
    parca += [m.get('metin', '') for m in R.get('maddeler', [])]
oy = os.path.join(KOK, 'scratchpad', 'denetim', 'kesik', 'onbellek', f'{lid}.json')
if os.path.exists(oy):
    O = json.load(open(oy, encoding='utf-8'))
    parca += [b.get('text', '') for b in O.get('bloklar', [])]
tam = ' '.join(parca)
rn = norm(tam)
izin = rakamlar(tam) | kelime_sayilari(tam) | rakamlar(G['ad'])
D = json.load(open(os.path.join(KOK, 'scratchpad', 'denetim', 'kutu', 'sonuc', f'kanun_{lid}.json'), encoding='utf-8'))
sorun = 0
for x in D:
    if 'atla' in x: continue
    dz = x['duzeltme']
    for y, d in zip(dz['sinavda_boyle_yazarlar'], dz['dogrusu']):
        yn = norm(y)
        if len(yn) > 25 and yn in rn:
            print('AYNEN', x['kart_id'], y); sorun += 1
        for s in sorted(rakamlar(madde_atiflarini_sil(d))):
            if s not in izin:
                print('SAYI', x['kart_id'], s, d); sorun += 1
        govde = re.sub(r'\s*\([^()]*m\.[^()]*\)\s*\.?\s*$', '', d)
        print(f'{x["kart_id"]:>7} D{len(govde.split()):>3}  Y{len(y.split()):>3}')
print('TAM METIN SORUN', sorun, '| tam metin uzunluk', len(tam))
