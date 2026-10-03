# Verilen kanunların kesik maddelerini önbellekten ayıklar, kesik metinle sınıflandırarak karşılaştırır.
# Sonuçları aday/<kanun_id>.json'a yazar (tam_metinler.json'a YAZMAZ; o iş yaz.py'nin).
# Kullanım: python toplu.py <kanun_id> [...]
import sys, io, json, os, re, difflib
from ayikla import madde_cikar, kesik_metin, karsilastir, tr_lower

BURA = os.path.dirname(os.path.abspath(__file__))
KOK = os.path.abspath(os.path.join(BURA, '..', '..', '..'))
ADAY = os.path.join(BURA, 'aday')
os.makedirs(ADAY, exist_ok=True)
AYAR = {}
if os.path.exists(os.path.join(BURA, 'ozel_ayar.json')):
    AYAR = json.load(open(os.path.join(BURA, 'ozel_ayar.json'), encoding='utf-8'))

DIPNOT_IZ = ('değiştiril', 'eklenmiş', 'ibare', 'kaldırıl', 'iptal', 'bakınız', 'tarihli', 'sayılı',
             'gazete', 'işlenmiş', 'yürürlü', 'mülga', 'şeklinde', 'hükmü', 'kararı')


def kelimeler(s):
    return re.findall(r'[0-9a-zçğıöşüâîû]+', tr_lower(s))


def dipnot_mu(ka):
    """Kesikte olup yenide olmayan kelime dizisi dipnot gövdesi/göstergesi mi?"""
    if all(w.isdigit() for w in ka):
        return True
    s = ' '.join(ka)
    iz = {z for z in DIPNOT_IZ if z in s}
    return len(ka) >= 4 and len(iz) >= 2


def ic_farklar(kesik, yeni):
    a, b = kelimeler(kesik), kelimeler(yeni)
    sm = difflib.SequenceMatcher(None, a, b, autojunk=False)
    ops = [o for o in sm.get_opcodes() if o[0] != 'equal']
    farklar, dipnot = [], 0
    for op, i1, i2, j1, j2 in ops:
        son_op = (i2 >= len(a) - 1) or (i1 >= len(a) - 2)  # kesik metnin sonuna değen fark: beklenen devam
        ka, yb = a[i1:i2], b[j1:j2]
        if son_op or i1 == 0:  # sondaki devam ya da baştaki başlık/madde no farkı
            continue
        if op == 'delete':
            if dipnot_mu(ka):
                dipnot += 1
                continue
            if len(ka) <= 2:
                continue
            farklar.append({'tur': 'kesikte_fazla', 'kesik': ' '.join(ka)[:400]})
        else:
            if op == 'replace' and dipnot_mu(ka) and len(yb) <= 2:
                dipnot += 1
                continue
            if len(yb) <= 2 and len(ka) <= 2:
                if not (len(yb) == len(ka) == 1 and not ka[0].isdigit() and not yb[0].isdigit()):
                    continue
            farklar.append({'tur': 'yenide_farkli' if op == 'replace' else 'yenide_fazla',
                            'kesik': ' '.join(ka)[:300], 'yeni': ' '.join(yb)[:400]})
    return farklar, dipnot


def devam(kesik, yeni):
    """Kelime düzeyinde: kesik metnin son anlamlı eşleşmesinden sonra yenide kaç kelime var,
    kesikte eşleşmeyen kuyruk ne."""
    a, b = kelimeler(kesik), kelimeler(yeni)
    sm = difflib.SequenceMatcher(None, a, b, autojunk=False)
    bl = [x for x in sm.get_matching_blocks() if x.size >= 3]
    if not bl:
        return -1, ' '.join(a[-30:])
    son = bl[-1]
    return len(b) - (son.b + son.size), ' '.join(a[son.a + son.size:])[:300]


def isle(kid):
    L = json.load(open(os.path.join(KOK, 'scratchpad', 'denetim', 'kesik_liste.json'), encoding='utf-8'))
    nolar = [m for e in L if str(e['kanun_id']) == str(kid) for m in e['maddeler']]
    sonuc = []
    for no in nolar:
        kw = AYAR.get(f'{kid}:{no}', {})
        r = madde_cikar(str(kid), no, **{k: v for k, v in kw.items() if k in ('son_isaret', 'aday_sira')})
        k = kesik_metin(kid, no)
        if 'hata' in r:
            sonuc.append({'kanun_id': int(kid), 'no': no, 'durum': 'BULUNAMADI', 'neden': r['hata']})
            print(f'{kid} m.{no}: BULUNAMADI ({r["hata"]})')
            continue
        c = karsilastir(k, r['metin'])
        farklar, dipnot = ic_farklar(k, r['metin'])
        bas_ok = c['bas'] is not None and c['bas'][1] <= 400
        fazla, kesik_kuyruk = devam(k, r['metin'])
        if not bas_ok:
            durum = 'BAS_FARKLI'
        elif fazla < 3:
            durum = 'DEVAM_YOK'
        else:
            durum = 'TAMAM' if not farklar else 'TAMAM_FARKLI'
        sonuc.append({'kanun_id': int(kid), 'no': no, 'durum': durum, 'metin': r['metin'], 'kaynak': r['kaynak'],
                      'kesik_uzunluk': len(k), 'yeni_uzunluk': len(r['metin']), 'kapsama': c['kapsama'],
                      'bas': c['bas'], 'fazla_kelime': fazla, 'kesik_kuyruk': kesik_kuyruk, 'ic_fark': farklar, 'dipnot_gurultu': dipnot,
                      'baslik': r['baslik'], 'atilan_son': r['atilan_son'], 'aday_sayisi': r['aday_sayisi'],
                      'sonda': r['sonda'], 'sup_silinen': r['sup_silinen'], 'cizgi': r['cizgi']})
        print(f"{kid} m.{no}: {durum} | kesik={len(k)} yeni={len(r['metin'])} fazla_kelime={fazla} kapsama={c['kapsama']} bas={c['bas']} "
              f"dipnot={dipnot} farklar={len(farklar)} aday={r['aday_sayisi']} sonda={r['sonda']}")
        print(f"     başlık={r['baslik']!r} | atılan={r['atilan_son']}")
        if r['cizgi']:
            print('     ÇİZGİ:', r['cizgi'])
        if r['sup_silinen']:
            print('     sup:', r['sup_silinen'][:8])
        for f in farklar:
            print('     FARK', f)
        if kesik_kuyruk:
            print('     KESİK KUYRUK (eşleşmeyen):', kesik_kuyruk[:200])
        print('     SON:', repr(r['metin'][-160:]))
    json.dump(sonuc, open(os.path.join(ADAY, f'{kid}.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)


if __name__ == '__main__':
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    for kid in sys.argv[1:]:
        isle(kid)
