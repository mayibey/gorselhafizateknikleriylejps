# Sınav Provası 2 (7 Eki 2026): kaynak/tahmin2-*.json bölümlerinden 80 soruluk denemeleri kurar.
# Çıktı: tahmin/TAHMIN2-<..>-<tohum>.json + tahmin/ikinci.json (prova-uret.py ve aciklama.py okur).
# Çalıştır: python -X utf8 scripts/premium-deneme/tahmin/prova2-kur.py  (sonra aciklama.py, prova-uret.py)
import json, os, shutil, subprocess, sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
D = 'scripts/premium-deneme/'
K = D + 'kaynak/'
MUSB = 'Müşterek mevzuat'
JAN = [[0, 40, MUSB, '1–40'], [40, 80, 'Jandarma branş mevzuatı', '41–80']]
MEBS = [[0, 40, MUSB, '1–40'], [40, 50, MUSB + ' (MEBS ek)', '41–50'], [50, 80, 'MEBS branş mevzuatı', '51–80']]
# (id, rütbeler, branş, başlık, bölümler, bloklar)
KUR = [
    ('SB-JAN-2', ['sb'], 'jandarma', 'Subay · Jandarma — 2. Prova', [('tahmin2-sb-mus', ''), ('tahmin2-sb-jan', 'jandarma')], JAN),
    ('SB-MEBS-2', ['sb'], 'mebs', 'Subay · MEBS — 2. Prova', [('tahmin2-sb-mus', ''), ('tahmin2-sb-mebs-ek', ''), ('tahmin2-sb-mebs-brans', 'mebs')], MEBS),
    ('ASB-JAN-2', ['asb'], 'jandarma', 'Astsubay · Jandarma — 2. Prova', [('tahmin2-asb-mus', ''), ('tahmin2-asb-jan', 'jandarma')], JAN),
    ('ASB-MEBS-2', ['asb'], 'mebs', 'Astsubay · MEBS — 2. Prova', [('tahmin2-asb-mus', ''), ('tahmin2-asb-mebs-ek', ''), ('tahmin2-asb-mebs-brans', 'mebs')], MEBS),
    ('UZM-JAN-2', ['uzmerb', 'uzmj'], 'jandarma', 'Uzman Erbaş / Uzman Jandarma · Jandarma — 2. Prova', [('tahmin2-uzm-mus', ''), ('tahmin2-uzm-jan', 'jandarma')], JAN),
]


def ok(h):
    s = ''.join('ABCDE'[x] for x in h)
    for i in range(len(s) - 2):
        if s[i] == s[i + 1] == s[i + 2]:
            return False
    for i in range(len(s) - 3):
        if s[i] == s[i + 2] and s[i + 1] == s[i + 3]:
            return False
        a = [ord(c) for c in s[i:i + 4]]
        if all(a[j + 1] - a[j] == 1 for j in range(3)) or all(a[j + 1] - a[j] == -1 for j in range(3)):
            return False
    return True


def tohum(on):
    import random
    for n in range(1, 5000):
        r = random.Random(f'{on}{n}')
        h = [i % 5 for i in range(80)]
        r.shuffle(h)
        if ok(h):
            return f'{on}{n}'
    sys.exit('tohum yok ' + on)


kayit = []
for did, rutbeler, brans, baslik, bolumler, bloklar in KUR:
    sayi = sum(len(json.load(open(K + f + '.json', encoding='utf-8'))) for f, _ in bolumler)
    if sayi != 80:
        sys.exit(f'{did}: {sayi} soru (80 olmalı)')
    kaynak = tohum(f'TAHMIN2-{did[:-2]}-')
    arg = [f'{K}{f}.json:{k}' for f, k in bolumler]
    subprocess.run([sys.executable, '-X', 'utf8', D + 'birlestir.py', kaynak, baslik, rutbeler[0], brans] + arg, check=True)
    shutil.move(D + f'cikti/{kaynak}.json', D + f'tahmin/{kaynak}.json')
    for r in rutbeler:
        kayit.append({'id': did, 'kaynak': kaynak, 'rutbe': r, 'brans': brans, 'baslik': baslik, 'bloklar': bloklar, 'aciklama_bloklar': bolumler})
json.dump(kayit, open(D + 'tahmin/ikinci.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('ikinci.json:', len(kayit), 'satır')
