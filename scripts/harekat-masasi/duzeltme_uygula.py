# Denetim düzeltmelerini Merkez verisine uygular (veri2-<slug>.json, yerinde).
#   python duzeltme_uygula.py <veri2-slug.json | calisma_dir> <duzeltmeler.json>   (her dosyaya YALNIZ BİR KEZ — nokta_ayristir'dan hemen sonra)
# Kart düzeltmesi → nokta alanları: h (hüküm), yz (kırmızı kutu listesi, tam), dg (yeşil kutu listesi, tam).
#   yz/dg verilen kartta sayfa otomatik tuzak eşleştirmesini KULLANMAZ (n.tzKapat=true).
# Eşleşmeyen tuzak: {"sil": true} → tz silinir; {"karta_bagla": "<kart id>"} → z.bag = kart id (sayfa zorla bağlar).
import json, re, os, sys, glob
sys.stdout.reconfigure(encoding='utf-8')
C, DUZ = sys.argv[1], sys.argv[2]
D = json.load(open(DUZ, encoding='utf-8'))
def tzm(z): return z['m'][0] if z['m'] else ((re.search(r'\((\d+)(?:/[^)]*)?\)\s*$', str(z['d'])) or [None, ''])[1] or '')
def kel(t):
    t = str(t or '').replace('I', 'ı').replace('İ', 'i').lower(); t = re.sub(r'[^a-zçğıöşü0-9\-/ ]', ' ', t)
    return {w for w in t.split() if len(w) >= 4 or re.search(r'\d', w)}
def eslesmeyenler(k):
    """denetim_dokum.py ile AYNI algoritma → eslesmeyen_tuzaklar sırası = buradaki sıra (k.tz indeksleri)."""
    out = []
    for zi, z in enumerate(k['tz']):
        m = tzm(z); en = None; enp = 0
        if m:
            zk = kel(z['d'] + ' ' + z['y'])
            for n in k['n']:
                if m not in n['m']: continue
                nk = kel(n['b'] + ' ' + n['h'] + ' ' + (n.get('t') or ''))
                p = sum(2 if re.search(r'\d', w) else 1 for w in zk if w in nk)
                if p > enp: enp, en = p, n
        if not (en and enp >= 2): out.append(zi)
    return out
kartD, tzD = {}, {}
for d in D:
    if 'kart_id' in d: kartD.setdefault((d['kanun_id'], d['kart_id']), {}).update(d.get('duzeltme') or {})
    elif 'tuzak_index' in d: tzD[(d['kanun_id'], d['tuzak_index'])] = d.get('duzeltme') or {}
uygulanan = set()
for f in ([C] if C.endswith('.json') else sorted(glob.glob(os.path.join(C, 'veri2-*.json')))):
    V = json.load(open(f, encoding='utf-8')); degisti = False
    for k in V['kanun']:
        es = eslesmeyenler(k)  # sil'den ÖNCE hesapla (denetim bu sırayla yapıldı)
        sil = set()
        for (lid, ti), dz in tzD.items():
            if lid != k['id'] or ti >= len(es): continue
            zi = es[ti]
            if dz.get('sil'): sil.add(zi)
            elif dz.get('karta_bagla'): k['tz'][zi]['bag'] = dz['karta_bagla']
            if 'dogru' in dz: k['tz'][zi]['d'] = dz['dogru']
            uygulanan.add(('tz', lid, ti)); degisti = True
        if sil: k['tz'] = [z for i, z in enumerate(k['tz']) if i not in sil]
        for n in k['n']:
            dz = kartD.get((k['id'], n['i']))
            if not dz: continue
            if 'hukum' in dz: n['h'] = dz['hukum']
            if 'baslik' in dz: n['b'] = dz['baslik']
            if 'madde' in dz and isinstance(dz['madde'], list) and dz['madde']:
                n['m'] = [str(x).replace('m.', '').strip() for x in dz['madde']]
            if 'sinavda_boyle_yazarlar' in dz: n['yz'] = dz['sinavda_boyle_yazarlar']; n['tzKapat'] = True
            if 'dogrusu' in dz: n['dg'] = dz['dogrusu']; n['tzKapat'] = True
            uygulanan.add(('kart', k['id'], n['i'])); degisti = True
    if degisti: json.dump(V, open(f, 'w', encoding='utf-8'), ensure_ascii=False)
print('düzeltme kaydı', len(D), '· uygulanan (tekil)', len(uygulanan), '· bulunamayan', len({('kart', a, b) for a, b in kartD} | {('tz', a, b) for a, b in tzD} - uygulanan))
