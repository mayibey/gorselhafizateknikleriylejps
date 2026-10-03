import json, sys, os
B = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
lid = sys.argv[1]
parcalar = sys.argv[2:]
G = json.load(open(os.path.join(B, 'girdi', f'kanun_{lid}.json'), encoding='utf-8'))
sira = [m['no'] for m in G['maddeler']]
hepsi = []
for p in parcalar:
    hepsi += json.load(open(os.path.join(B, 'tmp_p108', p), encoding='utf-8'))
d = {b['madde']: b for b in hepsi}
cikti = [d[n] for n in sira if n in d]
eksik = [n for n in sira if n not in d]
fazla = [k for k in d if k not in sira]
json.dump(cikti, open(os.path.join(B, 'sonuc', f'kanun_{lid}.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('yazildi', len(cikti), 'eksik', eksik, 'fazla', fazla)
