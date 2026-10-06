# Tahmini denemelerin açıklamalarını temiz alıntıyla yeniden yazar:
# alıntı kanıtın başladığı yerden başlar, cümle sonunda biter; birden fazla kanıt varsa ikisi de gösterilir.
import json, re, sys
sys.stdout.reconfigure(encoding='utf-8')
D = 'scripts/premium-deneme/'


def norm_map(t):
    t2 = t.replace('İ', 'i').replace('I', 'ı').lower().replace('â', 'a').replace('î', 'i').replace('û', 'u')
    keep = [(c, i) for i, c in enumerate(t2) if re.match(r'[0-9a-zçğıöşü%]', c)]
    return ''.join(c for c, _ in keep), [i for _, i in keep]


def norm(t):
    return norm_map(t)[0]


def alinti(metin, kanit):
    n, idx = norm_map(metin)
    k = norm(kanit)
    j = n.find(k)
    if j < 0:
        return None
    a, z = idx[j], idx[j + len(k) - 1] + 1
    # Bitiş: cümle sonu (tek harfli kısaltma "T." hariç), noktalı virgül, sonraki bent ("…, h) ")
    # veya metne gömülü dipnot ("1 2/7/2018 tarihli …") — hangisi önce gelirse.
    adaylar = []
    for m in re.finditer(r'\.', metin[z:]):
        p = z + m.start()
        if re.search(r'(^|[\s(.])[A-ZÇĞİÖŞÜ]$', metin[max(0, p - 2):p]):
            continue
        adaylar.append(p + 1)
        break
    for desen in (r';', r',\s*[a-zçğıöşü]{1,2}\)\s', r'\s\d{1,2}\s\d{1,2}/\d{1,2}/\d{4}\s+tarihli'):
        m = re.search(desen, metin[z:])
        if m:
            adaylar.append(z + m.start())
    e = min(adaylar) if adaylar else len(metin)
    if e - z > 260:
        e = z
    parca = re.sub(r'\((Değişik|Ek|Mülga)[^)]*\)\s*', '', metin[a:e])
    parca = re.sub(r'\s+', ' ', parca).strip()
    once = metin[max(0, a - 3):a].strip()
    bas = '' if (a == 0 or once.endswith(('.', ':', ')')) or parca[:1].isupper()) else '… '
    return bas + parca


def isle(deneme, bloklar):
    d = json.load(open(D + f'tahmin/{deneme}.json', encoding='utf-8'))
    kaynak = []
    for dosya, klas in bloklar:
        for q in json.load(open(D + f'kaynak/{dosya}.json', encoding='utf-8')):
            kaynak.append((q, klas))
    assert len(kaynak) == len(d['sorular'])
    for s, (q, klas) in zip(d['sorular'], kaynak):
        assert s['soru'] == q['k']
        p = json.load(open(f"scripts/altin-ozet/paketler/{klas + '/' if klas else ''}pack_{q['law']}.json", encoding='utf-8'))
        parcalar, madde = [], None
        for kn in q['kanit'][:2]:
            for m in p['maddeler']:
                al = alinti(m['metin'], kn)
                if al:
                    if madde is None:
                        no = str(m['no'])
                        madde = ('m.' + no) if not no.startswith(('Ek', 'Geçici')) else no
                    if al not in parcalar:
                        parcalar.append(al)
                    break
        assert parcalar, q['k']
        s['aciklama'] = f"{p['ad']}, {madde}: “" + '” … “'.join(parcalar) + '”'
        s['kaynak'] = f"{p['ad']} {madde}"
    json.dump(d, open(D + f'tahmin/{deneme}.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(deneme, 'açıklamalar yenilendi')


MUS = [('tahmin-mus-a', ''), ('tahmin-mus-b', ''), ('tahmin-mus-c', '')]
isle('TAHMIN-SB-JAN-63', MUS + [('tahmin-jan-a', 'jandarma'), ('tahmin-jan-b', 'jandarma')])
isle('TAHMIN-SB-MEBS-7', MUS + [('tahmin-mebs-ek', ''), ('tahmin-mebs-brans', 'mebs')])
