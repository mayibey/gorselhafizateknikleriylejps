# Yardimci: src/assets/kart-madde-metinleri.ts icinden verilen anahtarlarin metnini basar (yalniz okuma).
#   python k1_madde_metni.py "Jandarma Kanunu m.Ek 5" "Jandarma Kanunu m.Ek 3" ...
import json, re, sys
sys.stdout.reconfigure(encoding='utf-8')
src = open('D:/GorselHafizaTeknikleriyleJSPS/src/assets/kart-madde-metinleri.ts', encoding='utf-8').read()
for anahtar in sys.argv[1:]:
    m = re.search(r'^\s*' + re.escape(json.dumps(anahtar, ensure_ascii=False)) + r'\s*:\s*("(?:[^"\\]|\\.)*")', src, re.M)
    print('=' * 30, anahtar)
    print(json.loads(m.group(1)) if m else '(YOK)')
