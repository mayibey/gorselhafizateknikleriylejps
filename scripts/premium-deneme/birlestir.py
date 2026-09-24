# Premium deneme birleştirici: müşterek + branş bloklarını tek denemeye çevirir.
# - Her sorunun "kanit" ifadesi resmî madde metninde aranır (bulunamazsa DURUR).
# - Açıklama, kanıtın geçtiği maddeden alıntıyla otomatik yazılır (uydurma açıklama yok).
# - Doğru cevap harfleri A-E arasında eşit dağıtılır, çeldiriciler karıştırılır (tohumlu, tekrarlanabilir).
# python scripts/premium-deneme/birlestir.py <id> <baslik> <rutbe> <brans> <blok1.json:paketKlasoru> [<blok2.json:paketKlasoru> ...]
import json,sys,re,random,os
did,baslik,rutbe,brans=sys.argv[1:5]; bloklar=sys.argv[5:]
def norm_map(t):
    t2=t.replace('İ','i').replace('I','ı').lower().replace('â','a').replace('î','i').replace('û','u')
    keep=[(c,i) for i,c in enumerate(t2) if re.match(r'[0-9a-zçğıöşü%]',c)]
    return ''.join(c for c,_ in keep),[i for _,i in keep]
def norm(t): return norm_map(t)[0]
sorular=[]
for b in bloklar:
    qf,klas=b.split(':')
    base='scripts/altin-ozet/paketler/'+(klas+'/' if klas else '')
    for q in json.load(open(qf,encoding='utf-8')):
        p=json.load(open(base+f"pack_{q['law']}.json",encoding='utf-8'))
        bul=None
        for m in p['maddeler']:
            n,idx=norm_map(m['metin']); k=norm(q['kanit'][0]); j=n.find(k)
            if j>=0:
                a,z=idx[j],idx[j+len(k)-1]+1; t=m['metin']
                s=max(0,t.rfind('.',0,a)+1 if t.rfind('.',0,a)>a-220 else a-160); e=t.find('.',z); e=len(t) if e<0 or e-z>220 else e+1
                alinti=re.sub(r'\((Değişik|Ek|Mülga)[^)]*\)\s*','',t[s:e]); alinti=re.sub(r'^.*?Madde \S+\s*[–-]\s*','',alinti) if 'Madde' in alinti[:60] else alinti
                bul=(m['no'],re.sub(r'\s+',' ',alinti).strip()); break
        if not bul: sys.exit(f"KANIT YOK: {q['k'][:70]}")
        no=str(bul[0]); mad=('m.'+no) if not no.startswith(('Ek','Geçici')) else no
        sorular.append(dict(lawId=q['law'],soru=q['k'],siklar=q['s'],dogru=0,tip=q.get('tip','duz'),
            kaynak=f"{p['ad']} {mad}",aciklama=f"{p['ad']}, {mad}: “{bul[1]}”"))
rng=random.Random(did)
hedef=[i%5 for i in range(len(sorular))]; rng.shuffle(hedef)
for i,(s,h) in enumerate(zip(sorular,hedef)):
    dogru=s['siklar'][0]; cel=s['siklar'][1:]; rng.shuffle(cel)
    s['siklar']=cel[:h]+[dogru]+cel[h:]; s['dogru']=h; s['id']=f"{did}-{i+1:02d}"
out=dict(id=did,baslik=baslik,rutbe=rutbe,brans=brans,soruSayisi=len(sorular),sorular=sorular)
os.makedirs('scripts/premium-deneme/cikti',exist_ok=True)
json.dump(out,open(f'scripts/premium-deneme/cikti/{did}.json','w',encoding='utf-8'),ensure_ascii=False,indent=1)
from collections import Counter
print(did,len(sorular),'soru · harf dağılımı',dict(sorted(Counter('ABCDE'[s['dogru']] for s in sorular).items())),'· tip',dict(Counter(s['tip'] for s in sorular)))
