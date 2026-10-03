# Yalnız okuma: kart-madde-metinleri.ts içinden anahtar veya metin araması yapar.
#   python m22_madde_oku.py anahtar "6136 Ateşli Silahlar m.Ek 1"
#   python m22_madde_oku.py ara "Ek Madde 7" [pencere]
import json, re, sys
sys.stdout.reconfigure(encoding='utf-8')
YOL = 'D:/GorselHafizaTeknikleriyleJSPS/src/assets/kart-madde-metinleri.ts'
t = open(YOL, encoding='utf-8').read()
sozluk = {}
for m in re.finditer(r'^\s*("(?:[^"\\]|\\.)*")\s*:\s*("(?:[^"\\]|\\.)*")\s*,?\s*$', t, re.M):
    sozluk[json.loads(m.group(1))] = json.loads(m.group(2))
kip = sys.argv[1]
if kip == 'anahtar':
    for k in sys.argv[2:]:
        print('==', k, '==')
        print(sozluk.get(k, '(YOK)'))
        print()
elif kip == 'liste':
    on = sys.argv[2]
    for k in sozluk:
        if k.startswith(on): print(k)
elif kip == 'ara':
    pat = sys.argv[2]; pen = int(sys.argv[3]) if len(sys.argv) > 3 else 600
    for k, v in sozluk.items():
        for mm in re.finditer(re.escape(pat), v, re.I):
            print('==', k, '@', mm.start(), '==')
            print(v[max(0, mm.start() - 100): mm.start() + pen])
            print()
