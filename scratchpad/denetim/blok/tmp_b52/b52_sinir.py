# b52_sinir.py — GOREV_BLOK.md'deki SIKI sınırlar (denetçiden daha sıkı) + cümle sayısı + yasak kelime
import json, sys, re, os
sys.stdout.reconfigure(encoding='utf-8')
yol = sys.argv[1]
B = json.load(open(yol, encoding='utf-8'))
S = {'baslik': 6, 'oz': 70, 'sorulur': 40, 'akilda': 30, 'neden': 15}
def k(t): return len(str(t).split())
def cumle(t): return len([c for c in re.split(r'(?<=[.!?])\s+', str(t).strip()) if c])
sorun = 0
for b in B:
    m = b.get('madde')
    if 'atla' in b:
        print(f'm.{m}: ATLA — {b["atla"][:90]}'); continue
    satir = []
    if k(b['baslik']) > S['baslik']: satir.append(f'baslik {k(b["baslik"])}')
    if k(b['oz']) > S['oz']: satir.append(f'oz {k(b["oz"])}')
    c = cumle(b['oz'])
    if not (2 <= c <= 4): satir.append(f'oz cümle {c}')
    for a in ('sorulur', 'akilda'):
        for i, x in enumerate(b[a]):
            if k(x) > S[a]: satir.append(f'{a}[{i}] {k(x)}')
    for x in b.get('karis', []):
        if k(x['neden']) > S['neden']: satir.append(f'neden m.{x["madde"]} {k(x["neden"])}')
    t = json.dumps(b, ensure_ascii=False).lower()
    if 'kaçırd' in t: satir.append('YASAK kelime')
    durum = 'OK' if not satir else 'SORUN: ' + '; '.join(satir)
    if satir: sorun += 1
    print(f'm.{m}: baslik {k(b["baslik"])} · oz {k(b["oz"])}k/{c}c · sorulur {[k(x) for x in b["sorulur"]]} · akilda {[k(x) for x in b["akilda"]]} · {durum}')
print('SIKI SINIR SORUNU:', sorun)
