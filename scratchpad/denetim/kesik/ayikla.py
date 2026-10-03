# Önbellekteki blok listesinden madde metnini çıkarır ve kesik metinle karşılaştırır.
# Kullanım: python ayikla.py <kanun_id> [madde_no ...]   (madde verilmezse kesik_liste'dekiler)
import sys, io, json, re, os, difflib
BURA = os.path.dirname(os.path.abspath(__file__))
KOK = os.path.abspath(os.path.join(BURA, '..', '..', '..'))


def tr_lower(s):
    return s.replace('I', 'ı').replace('İ', 'i').lower()


DASH = r'[-–—−‑]'
MADDE_GENEL = re.compile(r'^\s*((ek|geçici|ek geçici)\s+)?madde\s*\d+\s*(/\s*[a-zçğıöşü])?\s*' + DASH)
LISTE_IMI = re.compile(r'^\s*(\(?[a-zçğıöşü0-9]{1,3}[\)\.]|\(|[a-zçğıöşü]\s*-\s)', re.I)


def bos(t):
    return not t.replace('\xa0', ' ').strip()


def hedef_desen(no):
    no = no.strip()
    m = re.match(r'^ek\s*(\d+)$', no, re.I)
    if m:
        return re.compile(r'^\s*ek\s+madde\s*' + m.group(1) + r'\s*' + DASH)
    m = re.match(r'^geçici\s*(\d+)$', tr_lower(no))
    if m:
        return re.compile(r'^\s*geçici\s+madde\s*' + m.group(1) + r'\s*' + DASH)
    m = re.match(r'^(\d+)\s*/\s*([a-zA-ZçğıöşüÇĞİÖŞÜ])$', no)
    if m:
        return re.compile(r'^\s*madde\s*' + m.group(1) + r'\s*/\s*' + tr_lower(m.group(2)) + r'\s*' + DASH)
    return re.compile(r'^\s*madde\s*' + no + r'\s*' + DASH)


def sup_temizle(t, kayit):
    def r(m):
        x = m.group(1).strip()
        on = t[max(0, m.start() - 3):m.start()]
        if re.fullmatch(r'[23]', x) and re.search(r'(m|cm|km|mm)$', on):
            return x
        if re.fullmatch(r'[\[\(]?\d{1,3}[\]\)]?', x):
            kayit.append(on + '^' + x)
            return ''
        return x
    return re.sub('⟦SUP:([^⟧]*)⟧', r, t)


def blok_metin(b, kayit):
    t = b['text'].replace('⟦FN⟧', '')
    t = sup_temizle(t, kayit)
    t = t.replace('\xa0', ' ').replace('​', '')
    satirlar = [re.sub(r'[ \t]+', ' ', s).strip() for s in t.split('\n')]
    return '\n'.join(s for s in satirlar if s)


def baslik_mi(b):
    t = b['text'].replace('\xa0', ' ').strip()
    if not t or not b.get('bold'):
        return False
    if t.startswith('('):
        return False
    return True


def bolum_mu(b):
    t = b['text'].replace('\xa0', ' ').strip()
    if b.get('align') == 'center' and b.get('bold'):
        return True
    if re.match(r'^(BİRİNCİ|İKİNCİ|ÜÇÜNCÜ|DÖRDÜNCÜ|BEŞİNCİ|ALTINCI|YEDİNCİ|SEKİZİNCİ|DOKUZUNCU|ONUNCU|ON\s?\w+)\s+(BÖLÜM|KISIM|KİTAP)', t):
        return True
    return False


def madde_cikar(kid, no, son_isaret=None, aday_sira=0):
    d = json.load(open(os.path.join(BURA, 'onbellek', f'{kid}.json'), encoding='utf-8'))
    B = d['bloklar']
    des = hedef_desen(no)
    adaylar = [i for i, b in enumerate(B) if des.match(tr_lower(b['text'].replace('\xa0', ' ')))]
    if not adaylar:
        return {'hata': 'madde başlangıcı bulunamadı'}
    s = adaylar[aday_sira]
    # bitiş: bir sonraki madde başlangıcı (ya da verilen son işaret)
    e = None
    for j in range(s + 1, len(B)):
        if MADDE_GENEL.match(tr_lower(B[j]['text'].replace('\xa0', ' '))):
            e = j
            break
        if son_isaret and re.search(son_isaret, B[j]['text']):
            e = j
            break
    sonda = e is None
    if e is None:
        e = len(B)
    # geriye doğru: sonraki maddenin başlığını ve bölüm başlıklarını çıkar
    atilan = []
    k = e - 1
    while k > s:
        b = B[k]
        if bos(b['text']):
            k -= 1
            continue
        if (baslik_mi(b) and not LISTE_IMI.match(b['text'].replace('\xa0', ' ').strip())) or bolum_mu(b):
            atilan.append(b['text'].strip()[:120])
            k -= 1
            continue
        break
    govde = B[s:k + 1]
    # başlık: geriye doğru ilk kalın, ortalanmamış blok
    baslik = None
    j = s - 1
    while j >= 0 and bos(B[j]['text']):
        j -= 1
    if j >= 0 and baslik_mi(B[j]) and not bolum_mu(B[j]) and not MADDE_GENEL.match(tr_lower(B[j]['text'])):
        baslik = B[j]
    kayit = []
    parcalar = []
    if baslik is not None:
        parcalar.append(blok_metin(baslik, kayit))
    for b in govde:
        t = blok_metin(b, kayit)
        if t:
            parcalar.append(t)
    metin = '\n'.join(parcalar)
    return {
        'metin': metin, 'baslik': baslik['text'].strip() if baslik is not None else None,
        'aday_sayisi': len(adaylar), 'atilan_son': atilan[::-1], 'sup_silinen': kayit,
        'sonda': sonda, 'kaynak': d['kaynak'], 'blok_bas': s, 'blok_son': k,
        'cizgi': [t[:80] for t in parcalar if re.search(r'_{5,}', t)],
    }


def norm(s):
    s = tr_lower(s)
    s = re.sub(r'[^0-9a-zçğıöşüâîû]+', ' ', s)
    return re.sub(r'\s+', ' ', s).strip()


def karsilastir(kesik, yeni):
    a, b = norm(kesik), norm(yeni)
    sm = difflib.SequenceMatcher(None, a, b, autojunk=False)
    bloklar = sm.get_matching_blocks()
    kapsama = sum(x.size for x in bloklar) / max(1, len(a))
    bas = None
    for ofs in (0, 20, 40, 60, 80, 100):
        parca = a[ofs:ofs + 60]
        i = b.find(parca)
        if i >= 0:
            bas = (ofs, i)
            break
    son = None
    for ofs in (0, 10, 20, 40, 60, 80):
        parca = a[max(0, len(a) - 50 - ofs):len(a) - ofs]
        i = b.rfind(parca)
        if i >= 0:
            son = (ofs, i + len(parca))
            break
    return {'kapsama': round(kapsama, 4), 'bas': bas, 'son': son, 'kesik_n': len(a), 'yeni_n': len(b),
            'fazla': (len(b) - son[1]) if son else None}


def kesik_metin(kid, no):
    d = json.load(open(os.path.join(KOK, 'gemini_calisma', 'girdi', 'resmi_metin', f'kanun_{kid}.json'), encoding='utf-8'))
    for x in d['maddeler']:
        if str(x['no']) == str(no):
            return x['metin']
    return None


def rapor(kid, no, **kw):
    r = madde_cikar(kid, no, **kw)
    print('=' * 100)
    print(f'kanun {kid} m.{no}')
    if 'hata' in r:
        print('  HATA:', r['hata'])
        return r, None
    k = kesik_metin(kid, no)
    c = karsilastir(k, r['metin'])
    print(f"  aday={r['aday_sayisi']} sonda={r['sonda']} blok={r['blok_bas']}-{r['blok_son']} uzunluk: kesik={len(k)} yeni={len(r['metin'])}")
    print(f"  karşılaştırma: {c}")
    print(f"  başlık: {r['baslik']!r}")
    print(f"  atılan son: {r['atilan_son']}")
    print(f"  sup silinen: {r['sup_silinen'][:12]}")
    if r['cizgi']:
        print('  ÇİZGİ:', r['cizgi'])
    print('  YENİ BAŞ:', repr(r['metin'][:300]))
    print('  YENİ SON:', repr(r['metin'][-400:]))
    print('  KESİK SON:', repr(k[-160:]))
    return r, c


if __name__ == '__main__':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    kid = sys.argv[1]
    nolar = sys.argv[2:]
    if not nolar:
        L = json.load(open(os.path.join(KOK, 'scratchpad', 'denetim', 'kesik_liste.json'), encoding='utf-8'))
        nolar = [m for e in L if str(e['kanun_id']) == kid for m in e['maddeler']]
    for no in nolar:
        rapor(kid, no)
