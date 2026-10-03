# Yardımcı: görevdeki sıkı kelime sınırlarını (başlık 6, öz 70, sorulur 40, akılda 30, neden 15) ve öz cümle sayısını denetler.
#   python b99_say.py <sonuc_json_yolu>
import json, sys, re
sys.stdout.reconfigure(encoding='utf-8')
S = {'baslik': 6, 'oz': 70, 'sorulur': 40, 'akilda': 30, 'neden': 15}
B = json.load(open(sys.argv[1], encoding='utf-8'))
def k(t): return len(str(t).split())
sorun = 0
for b in B:
    if 'atla' in b:
        continue
    m = b['madde']
    if k(b['baslik']) > S['baslik']: print(f'm.{m} baslik {k(b["baslik"])}'); sorun += 1
    if k(b['oz']) > S['oz']: print(f'm.{m} oz {k(b["oz"])}'); sorun += 1
    cumle = len([c for c in re.split(r'(?<=[.!?])\s+', b['oz'].strip()) if c])
    if not (2 <= cumle <= 4): print(f'm.{m} oz cümle sayısı {cumle}'); sorun += 1
    for alan in ('sorulur', 'akilda'):
        for i, x in enumerate(b[alan]):
            if k(x) > S[alan]: print(f'm.{m} {alan}[{i}] {k(x)}'); sorun += 1
    for x in b.get('karis', []):
        if k(x['neden']) > S['neden']: print(f'm.{m} karis m.{x["madde"]} neden {k(x["neden"])}'); sorun += 1
print('SIKI SINIR SORUNU', sorun, '· blok', len(B))
