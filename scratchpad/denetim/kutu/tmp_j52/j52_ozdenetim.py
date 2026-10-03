# Öz-denetim: tırnak biçimi + "kazara doğru" riski taşıyan sınır kalıpları (en çok/en az/geçemez/içinde/fazla)
import json, re, sys
sys.stdout.reconfigure(encoding='utf-8')
B = 'D:/GorselHafizaTeknikleriyleJSPS/scratchpad/denetim/kutu/sonuc/'
RISK = re.compile(r'(en çok|en az|en geç|geçemez|geçmeyen|fazla|içinde|kadar|asgari|azami)', re.I)
toplam = 0
for lid in [52, 53, 54, 55, 56, 57, 58]:
    D = json.load(open(f'{B}kanun_{lid}.json', encoding='utf-8'))
    for x in D:
        dz = x.get('duzeltme', {})
        for y in dz.get('sinavda_boyle_yazarlar', []):
            toplam += 1
            if not (y.startswith('“') and y.endswith('”')): print('TIRNAK', x['kart_id'], y[:60])
            if RISK.search(y): print('RISK  ', x['kart_id'], '|', y)
        for d in dz.get('dogrusu', []):
            if 'kaçırdığın' in d: print('YASAK', x['kart_id'])
print('toplam yanlış cümle:', toplam)
