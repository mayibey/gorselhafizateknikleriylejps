# kullanım: python _dn_denet.py <soru.json> <paket_klasoru ('' = müşterek kök)>
import json,sys,re,os
qf,klas=sys.argv[1],sys.argv[2]
base='scripts/altin-ozet/paketler/'+(klas+'/' if klas else '')
def norm(t):
    t=t.replace('İ','i').replace('I','ı').lower()
    t=t.replace('â','a').replace('î','i').replace('û','u')
    t=re.sub(r'[^0-9a-zçğıöşü%]+',' ',t)
    return re.sub(r'\s+',' ',t).strip().replace(' ','')
Q=json.load(open(qf,encoding='utf-8'))
cache={}; bad=0
for i,q in enumerate(Q,1):
    L=q['law']
    if L not in cache:
        p=json.load(open(base+f'pack_{L}.json',encoding='utf-8'))
        cache[L]=(p['ad'],norm(' '.join(m['metin'] for m in p['maddeler'])))
    ad,txt=cache[L]
    miss=[k for k in q['kanit'] if norm(k) not in txt]
    if miss: bad+=1; print(f'X {i:2d} law{L} {ad[:40]} eksik: {miss}')
print('toplam',len(Q),'sorunlu',bad)
