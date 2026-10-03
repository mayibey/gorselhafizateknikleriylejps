# Yalnız okuma: kart-madde-metinleri.ts içinde anahtar önekine göre kayıtları bulur, kelime çevresini basar.
#   python j39_ara.py "<anahtar_oneki>" kelime1 [kelime2 ...]   (kelime yoksa tüm metni basar)
import json, re, sys
sys.stdout.reconfigure(encoding='utf-8')
on = sys.argv[1]
kelimeler = sys.argv[2:]
t = open('D:/GorselHafizaTeknikleriyleJSPS/src/assets/kart-madde-metinleri.ts', encoding='utf-8').read()
desen = re.compile(r'^\s*("(?:[^"\\]|\\.)*")\s*:\s*("(?:[^"\\]|\\.)*"),?\s*$', re.M)
for m in desen.finditer(t):
    k = json.loads(m.group(1))
    if not k.startswith(on): continue
    v = json.loads(m.group(2))
    if not kelimeler:
        print('###', k); print(v); print(); continue
    for w in kelimeler:
        for mm in re.finditer(re.escape(w), v, re.I):
            print('###', k, '::', w)
            print(v[max(0, mm.start() - 400):mm.start() + 400])
            print('---')
