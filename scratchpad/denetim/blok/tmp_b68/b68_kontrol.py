# GOREV_BLOK.md sıkı sınırları (başlık 6, öz 70, sorulur 40, akılda 30, neden 15) + kapsam sırası kontrolü
import json, sys
sys.stdout.reconfigure(encoding='utf-8')
yol = sys.argv[1]; lid = int(sys.argv[2])
B = json.load(open(yol, encoding='utf-8'))
G = json.load(open(f'D:/GorselHafizaTeknikleriyleJSPS/scratchpad/denetim/blok/girdi/kanun_{lid}.json', encoding='utf-8'))
kap = [m['no'] for m in G['maddeler']]
sira = [b['madde'] for b in B]
if [k for k in kap if k in sira] != sira: print('SIRA farklı!')
def k(t): return len(str(t).split())
for b in B:
    if 'atla' in b: continue
    y = f"m.{b['madde']}"
    if k(b['baslik']) > 6: print(y, 'baslik', k(b['baslik']))
    if k(b['oz']) > 70: print(y, 'oz', k(b['oz']))
    for x in b['sorulur']:
        if k(x) > 40: print(y, 'sorulur', k(x), x[:50])
    for x in b['akilda']:
        if k(x) > 30: print(y, 'akilda', k(x), x[:50])
    for x in b.get('karis', []):
        if k(x['neden']) > 15: print(y, 'neden', k(x['neden']), x['neden'][:50])
    if 'kaçırdı' in json.dumps(b, ensure_ascii=False).lower(): print(y, 'YASAK kelime')
print('bitti', len(B), 'blok; kapsam', len(kap), '; eksik:', [x for x in kap if x not in sira])
