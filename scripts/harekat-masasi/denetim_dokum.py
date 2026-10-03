# Altın Özet kartlarının denetim dökümü: sayfanın çizdiği haliyle (hüküm / sınavda böyle yazarlar / doğrusu) her kanun için JSON.
#   python denetim_dokum.py <calisma_dir> <cikti_dir>
import json, re, os, sys, glob
sys.stdout.reconfigure(encoding='utf-8')
C, OUT = sys.argv[1], sys.argv[2]
os.makedirs(OUT, exist_ok=True)
KOK = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
def tzm(z): return z['m'][0] if z['m'] else ((re.search(r'\((\d+)(?:/[^)]*)?\)\s*$', str(z['d'])) or [None, ''])[1] or '')
def kel(t):
    t = str(t or '').replace('I', 'ı').replace('İ', 'i').lower(); t = re.sub(r'[^a-zçğıöşü0-9\-/ ]', ' ', t)
    return {w for w in t.split() if len(w) >= 4 or re.search(r'\d', w)}
def tirnak(t): return re.sub(r'^[\s"“”\']+|[\s"“”\']+$', '', str(t))
def parcala(y): return [tirnak(x) for x in re.split(r'"\s*(?:/|,|veya|ya da)\s*"', str(y or '')) if tirnak(x)]
def kisa(n):
    if n.get('k'): return n['k']
    h = str(n.get('h') or '')
    if len(h) > 170:
        p = re.split(r';|,\s(?=[a-zçğıöşü])', h)[0]
        return p.strip() + ' …' if len(p) < len(h) else h[:150].strip() + ' …'
    return n['b']
paket = {}
for f in glob.glob(os.path.join(KOK, 'scripts/altin-ozet/paketler/**/pack_*.json'), recursive=True):
    lid = int(re.search(r'pack_(\d+)\.json', f).group(1)); paket.setdefault(lid, f)
gor = {}
for f in sorted(glob.glob(os.path.join(C, 'veri2-*.json'))):
    for k in json.load(open(f, encoding='utf-8'))['kanun']:
        if k['id'] in gor or not k['n']: continue
        es = {}; bagsiz = []
        for zi, z in enumerate(k['tz']):
            m = tzm(z); en = None; enp = 0
            if m:
                zk = kel(z['d'] + ' ' + z['y'])
                for n in k['n']:
                    if m not in n['m']: continue
                    nk = kel(n['b'] + ' ' + n['h'] + ' ' + (n.get('t') or ''))
                    p = sum(2 if re.search(r'\d', w) else 1 for w in zk if w in nk)
                    if p > enp: enp, en = p, n
            if en and enp >= 2: es.setdefault(en['i'], []).append(z)
            else: bagsiz.append({'madde': m, 'yanlis': parcala(z['y']), 'dogru': tirnak(z['d'])})
        kartlar = []
        for n in k['n']:
            tz = es.get(n['i'], [])
            kartlar.append({'id': n['i'], 'madde': n['m'][:3], 'baslik': n['b'], 'hukum': n['h'],
                            'sinavda_boyle_yazarlar': [x for x in [n.get('t')] + [p for z in tz for p in parcala(z['y'])] if x],
                            'dogrusu': [tirnak(z['d']) for z in tz] or [kisa(n)]})
        gor[k['id']] = {'kanun_id': k['id'], 'ad': k['ad'], 'resmi_metin_paketi': paket.get(k['id']), 'kartlar': kartlar, 'eslesmeyen_tuzaklar': bagsiz}
for lid, v in gor.items():
    json.dump(v, open(os.path.join(OUT, f'kanun_{lid}.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('kanun', len(gor), '· kart', sum(len(v['kartlar']) for v in gor.values()), '· eşleşmeyen tuzak', sum(len(v['eslesmeyen_tuzaklar']) for v in gor.values()),
      '· paketsiz', [l for l, v in gor.items() if not v['resmi_metin_paketi']])
