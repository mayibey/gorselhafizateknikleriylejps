# Kesik maddelerin özetini çıkarır (yalnız okur).
import json, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
L = json.load(open('scratchpad/denetim/kesik_liste.json', encoding='utf-8'))
toplam = 0
for e in L:
    kid = e['kanun_id']
    d = json.load(open(f'gemini_calisma/girdi/resmi_metin/kanun_{kid}.json', encoding='utf-8'))
    mm = {str(x['no']): x['metin'] for x in d['maddeler']}
    print(f"=== {kid} | {e['ad']} | bitti={e['blok_bitti']} | not={d.get('not','')[:80]!r}")
    for no in e['maddeler']:
        t = mm.get(no)
        toplam += 1
        if t is None:
            print(f"   m.{no}: YOK!"); continue
        print(f"   m.{no}: len={len(t)} BAS={t[:110]!r}")
        print(f"          SON={t[-90:]!r}")
print('toplam', toplam)
