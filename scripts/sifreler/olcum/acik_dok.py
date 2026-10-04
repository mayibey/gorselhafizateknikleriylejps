# Bir kanunun şifresiz (L0) sorularını madde madde döker; istenirse madde metnini de basar.
#   python acik_dok.py <lid> [madde ...]     (madde verilirse yalnız o maddelerin resmî metni basılır)
import json, sys, re, collections
sys.stdout.reconfigure(encoding='utf-8')
KOK = 'D:/GorselHafizaTeknikleriyleJSPS'
A = 'C:/Users/GIGABYTE/AppData/Local/Temp/claude/D--GorselHafizaTeknikleriyleJSPS/1cb33cb3-f233-47d5-9f06-b8d257742241/scratchpad/sifre_test/arsiv'
lid = int(sys.argv[1]); maddeler = sys.argv[2:]
R = json.load(open(f'{KOK}/gemini_calisma/girdi/resmi_metin/kanun_{lid}.json', encoding='utf-8'))
MT = {m['no']: m['metin'] for m in R['maddeler']}
if maddeler:
    for m in maddeler:
        print(f'\n===== m.{m} ({len(MT.get(m, ""))} karakter)\n{MT.get(m, "(metin yok)")}')
    sys.exit()
H = json.load(open(f'{A}/havuz_sonuc.json', encoding='utf-8'))
Q = [q for q in H if q['lid'] == lid and q['sev'] == 0]
gor = set(); U = []
for q in sorted(Q, key=lambda q: (q['grup'] == 'arşiv', q['id'])):
    k = re.sub(r'\s+', ' ', q['kok'].lower())[:120]
    if k in gor: continue
    gor.add(k); U.append(q)
print(f'k{lid} · şifresiz {len(Q)} soru (tekrarsız {len(U)}) · metni olan maddeler: {len(MT)}')
G = collections.defaultdict(list)
for q in U: G[q['madde']].append(q)
for m, qs in sorted(G.items(), key=lambda x: (x[0] == '?', -len(x[1]))):
    print(f'\n## m.{m} — {len(qs)} soru' + ('' if m == '?' or m.split('/')[0] in MT else '  ⚠ METİN YOK (kapsam dışı?)'))
    for q in qs:
        sik = ' | '.join(f"{h}) {v[:70]}" for h, v in q['sec'].items())
        print(f"- [{q['kaynak']} {q['id']}] {q['kok'][:300].replace(chr(10), ' ')}\n    {sik}\n    DOĞRU: {q['d']} {q['sec'].get(q['d'], '')[:120] if q['d'] else '(anahtar yok)'}")
