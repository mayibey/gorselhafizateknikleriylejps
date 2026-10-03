# Yardimci (yalniz okuma): girdide resmi metni bos olan kartlarin "yanlis" cumlelerini
# src/assets/kart-madde-metinleri.ts icindeki madde metnine karsi "aynen geciyor mu" diye denetler.
#   python k1_bos_metin_kontrol.py <kanun_id> <anahtar_oneki>     ornek: 2 "Jandarma Kanunu m."
import json, re, sys
sys.stdout.reconfigure(encoding='utf-8')
K = 'D:/GorselHafizaTeknikleriyleJSPS'
sys.path.insert(0, K + '/scripts/harekat-masasi')
from kutu_denetle import norm
lid, onek = int(sys.argv[1]), sys.argv[2]
src = open(K + '/src/assets/kart-madde-metinleri.ts', encoding='utf-8').read()

def metin(anahtar):
    m = re.search(r'^\s*' + re.escape(json.dumps(anahtar, ensure_ascii=False)) + r'\s*:\s*("(?:[^"\\]|\\.)*")', src, re.M)
    return json.loads(m.group(1)) if m else ''

G = {k['id']: k for k in json.load(open(f'{K}/scratchpad/denetim/kutu/girdi/kanun_{lid}.json', encoding='utf-8'))['kartlar']}
D = json.load(open(f'{K}/scratchpad/denetim/kutu/sonuc/kanun_{lid}.json', encoding='utf-8'))
n = 0
for x in D:
    k = G[x['kart_id']]
    bos = [m for m in k['madde'] if not k['resmi_metin'].get(m, '').strip()]
    if not k['madde']:
        bos = sys.argv[3:]  # maddesi bos kartlar icin elle verilen madde(ler)
    if not bos:
        continue
    tam = ' '.join(metin(onek + m) for m in bos)
    if not tam.strip():
        print('METIN BULUNAMADI:', x['kart_id'], bos)
        continue
    rn = norm(tam)
    for y in x['duzeltme']['sinavda_boyle_yazarlar']:
        n += 1
        if norm(y) in rn:
            print('AYNEN GECIYOR:', x['kart_id'], y)
print('kontrol edilen yanlis cumle:', n)
