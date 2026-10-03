# Parti 12 yardimci: GOREV_BLOK.md'deki SIKI kelime/cumle sinirlarini denetler (denetciden daha sert).
# python scratchpad/denetim/blok/tmp_b12/b12_kelime.py scratchpad/denetim/blok/sonuc/kanun_56.json
import json, re, sys
sys.stdout.reconfigure(encoding='utf-8')
S = {'baslik': 6, 'oz': 70, 'sorulur': 40, 'akilda': 30, 'neden': 15}
def k(t): return len(str(t).split())
def cumle(t): return len([x for x in re.split(r'(?<=[.!?])\s+', str(t).strip()) if x])
for yol in sys.argv[1:]:
    B = json.load(open(yol, encoding='utf-8'))
    sorun = 0
    for b in B:
        if 'atla' in b: continue
        m = b['madde']
        if k(b['baslik']) > S['baslik']: print(f'm.{m} baslik {k(b["baslik"])}'); sorun += 1
        if k(b['oz']) > S['oz']: print(f'm.{m} oz {k(b["oz"])}'); sorun += 1
        c = cumle(b['oz'])
        if not 2 <= c <= 4: print(f'm.{m} oz cumle {c}'); sorun += 1
        for a in ('sorulur', 'akilda'):
            for i, x in enumerate(b[a]):
                if k(x) > S[a]: print(f'm.{m} {a}[{i}] {k(x)}'); sorun += 1
        for x in b.get('karis', []):
            if k(x['neden']) > S['neden']: print(f'm.{m} karis {x["madde"]} {k(x["neden"])}'); sorun += 1
        print(f'  m.{m}: baslik {k(b["baslik"])} | oz {k(b["oz"])}/{c}c | sorulur {[k(x) for x in b["sorulur"]]} | akilda {[k(x) for x in b["akilda"]]} | karis {[k(x["neden"]) for x in b.get("karis", [])]}')
    print(f'{yol}: siki sinir sorunu {sorun}')
