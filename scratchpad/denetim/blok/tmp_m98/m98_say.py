# Talimattaki sıkı sınırlar: başlık 6, öz 70 (2-4 cümle), sorulur 40, akılda 30, karis nedeni 15 kelime
import json, sys, re
sys.stdout.reconfigure(encoding='utf-8')
SINIR = {'baslik': 6, 'oz': 70, 'sorulur': 40, 'akilda': 30, 'neden': 15}
def k(t): return len(str(t).split())
for yol in sys.argv[1:]:
    B = json.load(open(yol, encoding='utf-8'))
    sorun = 0
    for b in B:
        if 'atla' in b: continue
        m = b['madde']
        if k(b['baslik']) > SINIR['baslik']: print(f'm.{m} başlık {k(b["baslik"])}'); sorun += 1
        if k(b['oz']) > SINIR['oz']: print(f'm.{m} öz {k(b["oz"])}'); sorun += 1
        cumle = len([c for c in re.split(r'(?<=[^\d\s][.!?])\s+', b['oz'].strip()) if c])
        if not 2 <= cumle <= 4: print(f'm.{m} öz cümle sayısı {cumle}'); sorun += 1
        for a in ('sorulur', 'akilda'):
            for i, x in enumerate(b[a]):
                if k(x) > SINIR[a]: print(f'm.{m} {a}[{i}] {k(x)}'); sorun += 1
        for x in b.get('karis', []):
            if k(x['neden']) > SINIR['neden']: print(f'm.{m} karis {x["madde"]} neden {k(x["neden"])}'); sorun += 1
        if 'kaçırd' in json.dumps(b, ensure_ascii=False).lower(): print(f'm.{m} yasak kelime'); sorun += 1
    print(f'{yol}: sıkı sınır sorunu {sorun}')
