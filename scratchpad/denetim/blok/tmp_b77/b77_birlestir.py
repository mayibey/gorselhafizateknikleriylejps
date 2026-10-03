import json, sys, glob, os, re
sys.stdout.reconfigure(encoding='utf-8')
KOK = r'D:\GorselHafizaTeknikleriyleJSPS\scratchpad\denetim\blok'
TMP = os.path.join(KOK, 'tmp_b77')
G = json.load(open(os.path.join(KOK, 'girdi', 'kanun_77.json'), encoding='utf-8'))
sira = [m['no'] for m in G['maddeler']]
SINIR = {'baslik': 6, 'oz': 70, 'sorulur': 40, 'akilda': 30, 'neden': 15}
bloklar = []
for f in sorted(glob.glob(os.path.join(TMP, 'b77_p*.json')), key=lambda x: int(re.search(r'b77_p(\d+)', x).group(1))):
    bloklar += json.load(open(f, encoding='utf-8'))
bloklar.sort(key=lambda b: sira.index(b['madde']))
def k(t): return len(str(t).split())
sorun = 0
for b in bloklar:
    if 'atla' in b: continue
    m = b['madde']
    if k(b['baslik']) > SINIR['baslik']: print('m.%s baslik %d kelime' % (m, k(b['baslik']))); sorun += 1
    if k(b['oz']) > SINIR['oz']: print('m.%s oz %d kelime' % (m, k(b['oz']))); sorun += 1
    cumle = len([x for x in re.split(r'(?<=[.!?])\s+', b['oz'].strip()) if x])
    if not 2 <= cumle <= 4: print('m.%s oz %d cümle' % (m, cumle)); sorun += 1
    for alan in ('sorulur', 'akilda'):
        for x in b[alan]:
            if k(x) > SINIR[alan]: print('m.%s %s %d kelime: %s' % (m, alan, k(x), x[:60])); sorun += 1
    for x in b.get('karis', []):
        if k(x['neden']) > SINIR['neden']: print('m.%s karis m.%s neden %d kelime' % (m, x['madde'], k(x['neden']))); sorun += 1
    if 'kaçırd' in json.dumps(b, ensure_ascii=False).lower(): print('m.%s YASAK KELIME' % m); sorun += 1
print('blok', len(bloklar), 'uzunluk sorunu', sorun)
hedef = os.path.join(KOK, 'sonuc', 'kanun_77.json') if '--yaz' in sys.argv else os.path.join(TMP, 'kanun_77.json')
with open(hedef, 'w', encoding='utf-8') as fh:
    fh.write('[\n' + ',\n'.join(' ' + json.dumps(b, ensure_ascii=False) for b in bloklar) + '\n]\n')
print('yazıldı:', hedef)
