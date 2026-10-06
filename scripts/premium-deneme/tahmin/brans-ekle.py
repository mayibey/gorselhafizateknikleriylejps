# Branş sınav provalarını kurar: kaynak/tahmin-brans-<b>.json (ajanların yazdığı branş bölümü) + rütbenin müşterek 40'ı → 80 soruluk deneme.
# Çıktı: tahmin/TAHMIN-<SB|ASB>-<B>-<tohum>.json ve tahmin/branslar.json (prova-uret.py ile aciklama.py bunu okur).
# Çalıştır: python -X utf8 scripts/premium-deneme/tahmin/brans-ekle.py  (sonra aciklama.py, prova-uret.py)
import json, os, random, shutil, subprocess, sys

D = 'scripts/premium-deneme/'
K = D + 'kaynak/'
MUS = {'sb': [('tahmin-mus-a', ''), ('tahmin-mus-b', ''), ('tahmin-mus-c', '')], 'asb': [('tahmin-asb-mus', '')]}
TEKNIK = ['havacilik', 'personel', 'ikmal', 'bakim', 'istihkam', 'maliye', 'bando']
RUTBE = {b: ['sb', 'asb'] for b in TEKNIK}
RUTBE.update({'saglik': ['asb'], 'tabip': ['sb'], 'eczaci': ['sb'], 'veteriner': ['sb'], 'muhendis': ['sb'], 'kimyager': ['sb']})
AD = {'havacilik': 'Havacılık', 'personel': 'Personel', 'ikmal': 'İkmal', 'bakim': 'Bakım', 'istihkam': 'İstihkam', 'maliye': 'Maliye',
      'bando': 'Bando', 'saglik': 'Sağlık', 'tabip': 'Tabip', 'eczaci': 'Eczacı', 'veteriner': 'Veteriner', 'muhendis': 'Mühendis', 'kimyager': 'Kimyager'}
RAD = {'sb': 'Subay', 'asb': 'Astsubay'}
MUSB = 'Müşterek mevzuat'


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
    for n in range(1, 5000):
        r = random.Random(f'{on}{n}')
        h = [i % 5 for i in range(80)]
        r.shuffle(h)
        if ok(h):
            return f'{on}{n}'
    sys.exit('tohum yok ' + on)


kayit = []
for b, rutbeler in RUTBE.items():
    ana = K + f'tahmin-brans-{b}.json'
    if not os.path.exists(ana):
        print('YOK (atlandı):', b)
        continue
    blok = [(f'tahmin-brans-{b}', b)]
    if b == 'havacilik':
        blok = [('tahmin-brans-havacilik-ek', ''), ('tahmin-brans-havacilik', 'havacilik')]
    sayi = sum(len(json.load(open(K + f + '.json', encoding='utf-8'))) for f, _ in blok)
    if sayi != 40:
        sys.exit(f'{b}: branş bölümü {sayi} soru (40 olmalı)')
    for r in rutbeler:
        did = tohum(f'TAHMIN-{r.upper()}-{b.upper()}-')
        kaynaklar = MUS[r] + blok
        arg = [f'{K}{f}.json:{k}' for f, k in kaynaklar]
        subprocess.run([sys.executable, '-X', 'utf8', D + 'birlestir.py', did, f'{RAD[r]} · {AD[b]} Sınav Provası', r, b] + arg, check=True)
        shutil.move(D + f'cikti/{did}.json', D + f'tahmin/{did}.json')
        if b == 'havacilik':
            bl = [[0, 40, MUSB, '1–40'], [40, 50, MUSB + ' (havacılık ek)', '41–50'], [50, 80, 'Havacılık branş mevzuatı', '51–80']]
        else:
            bl = [[0, 40, MUSB, '1–40'], [40, 80, f'{AD[b]} branş mevzuatı', '41–80']]
        kayit.append({'id': f'{r.upper()}-{b.upper()}', 'kaynak': did, 'rutbe': r, 'brans': b, 'baslik': f'{RAD[r]} · {AD[b]}',
                      'bloklar': bl, 'aciklama_bloklar': kaynaklar})
json.dump(kayit, open(D + 'tahmin/branslar.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('branslar.json:', len(kayit), 'deneme')
