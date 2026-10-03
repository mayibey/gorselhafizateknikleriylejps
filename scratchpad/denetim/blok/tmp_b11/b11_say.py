# Parti 11 yardımcı: talimattaki sıkı kelime sınırlarını denetler (başlık 6, öz 70, sorulur 40, akılda 30, neden 15)
import json, sys
sys.stdout.reconfigure(encoding='utf-8')
S = {'baslik': 6, 'oz': 70, 'sorulur': 40, 'akilda': 30, 'neden': 15}
def k(t): return len(str(t).split())
for yol in sys.argv[1:]:
    B = json.load(open(yol, encoding='utf-8'))
    sorun = 0
    for b in B:
        if 'atla' in b: continue
        m = b['madde']
        for alan in ('baslik', 'oz'):
            if k(b[alan]) > S[alan]: print(f'm.{m} {alan} {k(b[alan])} > {S[alan]}'); sorun += 1
        for alan in ('sorulur', 'akilda'):
            for i, x in enumerate(b[alan]):
                if k(x) > S[alan]: print(f'm.{m} {alan}[{i}] {k(x)} > {S[alan]}'); sorun += 1
        for x in b.get('karis', []):
            if k(x['neden']) > S['neden']: print(f'm.{m} karis m.{x["madde"]} neden {k(x["neden"])} > {S["neden"]}'); sorun += 1
        if 'kaçırd' in json.dumps(b, ensure_ascii=False).lower(): print(f'm.{m} YASAK kelime'); sorun += 1
    print(f'{yol}: {len(B)} blok, sıkı sınır sorunu {sorun}')
