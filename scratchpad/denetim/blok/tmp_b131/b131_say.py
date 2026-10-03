# Yardımcı: GOREV_BLOK.md'deki (denetçiden sıkı) kelime sınırlarını raporlar.
import json, sys
sys.stdout.reconfigure(encoding='utf-8')
SINIR = {'baslik': 6, 'oz': 70, 'sorulur': 40, 'akilda': 30, 'neden': 15}
def k(t): return len(str(t).split())
B = json.load(open(sys.argv[1], encoding='utf-8'))
sorun = 0
for b in B:
    if 'atla' in b: continue
    m = b['madde']
    for alan in ('baslik', 'oz'):
        n = k(b[alan])
        if n > SINIR[alan]: print(f'm.{m} {alan}: {n} > {SINIR[alan]}'); sorun += 1
    for alan in ('sorulur', 'akilda'):
        for i, x in enumerate(b[alan]):
            n = k(x)
            if n > SINIR[alan]: print(f'm.{m} {alan}[{i}]: {n} > {SINIR[alan]}'); sorun += 1
    for x in b.get('karis', []):
        n = k(x['neden'])
        if n > SINIR['neden']: print(f'm.{m} karis m.{x["madde"]}: {n} > {SINIR["neden"]}'); sorun += 1
print('SORUN', sorun)
