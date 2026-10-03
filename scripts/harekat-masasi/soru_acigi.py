# Altın Özet noktalarından hiçbir check-up sorusuyla karşılanmayanları bulur (kelime örtüşmesi) → soru yazımı için iş dosyaları.
#   python soru_acigi.py <calisma_dir> <cikti_dir> [parti=6] [esik=0.4]
import json, glob, re, os, sys
sys.stdout.reconfigure(encoding='utf-8')
C, OUT = sys.argv[1], sys.argv[2]
P = int(sys.argv[3]) if len(sys.argv) > 3 else 6
ESIK = float(sys.argv[4]) if len(sys.argv) > 4 else 0.4
KOK = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
STOP = {'aşağıdakilerden', 'hangisi', 'hangisidir', 'göre', 'sayılı', 'kanunu', 'kanun', 'madde', 'maddesi', 'yönetmelik', 'yönetmeliği',
        'olarak', 'ilgili', 'tarafından', 'veya', 'ancak', 'olan', 'için', 'gibi', 'değildir', 'yanlıştır', 'doğrudur'}
def kel(t):
    t = str(t or '').replace('I', 'ı').replace('İ', 'i').lower(); t = re.sub(r'[^a-zçğıöşü0-9 ]', ' ', t)
    return {w for w in t.split() if (len(w) >= 5 or re.search(r'\d', w)) and w not in STOP}
gor = {}
for f in glob.glob(os.path.join(C, 'veri2-*.json')):
    for k in json.load(open(f, encoding='utf-8'))['kanun']: gor.setdefault(k['id'], k)
paket = {}
for f in glob.glob(os.path.join(KOK, 'scripts', 'altin-ozet', 'paketler', '**', 'pack_*.json'), recursive=True):
    paket.setdefault(int(re.search(r'pack_(\d+)', f).group(1)), os.path.relpath(f, KOK).replace(os.sep, '/'))
isler = []
for lid, k in sorted(gor.items()):
    qk = []
    for q in k['q']:
        m = re.search(r'm\.\s*(\d+)', q['y'] or '')
        qk.append((m.group(1) if m else None, kel(q['k'] + ' ' + ' '.join(q['s']) + ' ' + q['a'])))
    for n in k['n']:
        nk = kel(n['b'] + ' ' + n['h'])
        if not nk: continue
        en = 0
        for mm, s in qk:
            if n['m'] and mm and mm not in n['m']: continue
            en = max(en, len(nk & s) / max(1, min(len(nk), 12)))
        if en < ESIK:
            isler.append({'kanun_id': lid, 'kanun': k['ad'], 'kart_id': n['i'], 'madde': n['m'][:2], 'baslik': n['b'], 'hukum': n['h'],
                          'tuzak': n.get('t') or '', 'resmi_metin_paketi': paket.get(lid)})
os.makedirs(OUT, exist_ok=True)
n = len(isler)
for i in range(P):
    json.dump(isler[i * n // P:(i + 1) * n // P], open(os.path.join(OUT, f'girdi_{i + 1}.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('soru yazılacak nokta:', n, [len(isler[i * n // P:(i + 1) * n // P]) for i in range(P)])
