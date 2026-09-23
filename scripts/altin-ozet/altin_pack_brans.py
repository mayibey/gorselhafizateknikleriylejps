# -*- coding: utf-8 -*-
"""ALTIN ÖZET — BRANŞ veri paketi.

Kullanım:  python scripts/altin-ozet/altin_pack_brans.py <brans_slug>

Her branş mevzuatı için bir paket üretir (paketler/<brans>/pack_<lawId>.json):
  · sınav kapsamı = branş kitabının KENDİ madde listesi (PDF'ten okunur; emir zaten
    o kitabı üretirken uygulanmıştı, dolayısıyla en güvenilir kaynak odur)
  · o maddelerin RESMÎ METNİ (bot arşivi, maddeler.json)
  · o mevzuattan çıkmış sınav soruları (çıkmış kitapçık arşivi)
  · bizim soru bankamızdaki soruları + hangi maddeden kaç soru var sayımı

Çıktı ajana verilir; ajan paketteki metne sadık kalarak altın noktaları yazar.
"""
import json, io, re, os, sys, collections
sys.stdout.reconfigure(encoding='utf-8')
import fitz

BURA = os.path.dirname(os.path.abspath(__file__))
KOK = os.path.abspath(os.path.join(BURA, '..', '..')).replace(chr(92), '/') + '/'
sys.path.insert(0, BURA)
from _ao_alias import ALIAS

PDF_KOK = 'C:/Users/GIGABYTE/OneDrive/Desktop/JSPS BRANS KITAPLARI/'

brans = (sys.argv[1] if len(sys.argv) > 1 else '').strip().lower()
if not brans:
    print('kullanım: altin_pack_brans.py <brans_slug>'); raise SystemExit(1)

ars = json.load(io.open('D:/jsps-community-bot/data/maddeler.json', encoding='utf-8'))
kitaplar = [r for r in json.load(io.open(BURA + '/brans_kitaplari.json', encoding='utf-8'))
            if r['brans_slug'] == brans]
if not kitaplar:
    print(f'"{brans}" branşının kitabı yok'); raise SystemExit(1)
cikmis = json.load(io.open(KOK + 'scripts/veri/cikmis-sinav-sorulari.json', encoding='utf-8'))

TR = str.maketrans('ÇĞİÖŞÜçğıöşü', 'CGIOSUcgiosu')
def norm(s): return re.sub(r'[^a-z0-9 ]', ' ', (s or '').translate(TR).lower())

def kapsam_maddeleri(dosya_yolu):
    """Branş kitabı PDF'inden madde numaralarını çıkar. Dosya yoksa None (= tamamı)."""
    yerel = PDF_KOK + brans.upper() + '/' + os.path.basename(dosya_yolu)
    if not os.path.exists(yerel): return None, yerel
    d = fitz.open(yerel); t = ''.join(p.get_text() for p in d); d.close()
    mad = set()
    for m in re.finditer(r'(?:^|\n)\s*(?:MADDE|Madde)\s+(\d{1,3})', t): mad.add(int(m.group(1)))
    for m in re.finditer(r'(?:^|\n)\s*(?:EK\s*MADDE|Ek\s*Madde)\s+(\d{1,3})', t): mad.add(('ek', int(m.group(1))))
    return (mad or None), yerel

# Mevzuat adlarında ortak geçen, ayırt ediciliği olmayan kelimeler. Bunlara bakılırsa
# "jandarma + güvenlik" geçen her soru yanlışlıkla o mevzuata yazılır (17 Eyl'de pack_103'ü
# kirleten hata buydu: ad ipucu "Rehber" çok genişti).
GENEL_KELIME = {'jandarma', 'guvenlik', 'sahil', 'kanunu', 'kanun', 'yonetmeligi', 'yonetmelik',
                'hakkinda', 'iliskin', 'uygulama', 'uygulanmasina', 'esaslar', 'usul', 'sayili',
                'genel', 'komutanligi', 'kuvvetleri', 'merkezi', 'turkiye', 'turk', 'dair',
                'hizmetleri', 'hizmet', 'islemleri', 'islemlerine', 'personel', 'personeli',
                'kurulus', 'kurumlari', 'tesisleri', 'hukumleri', 'maddeler', 'bolumu'}

def ayirt_edici(baslik):
    """Başlıktaki ayırt edici kelimeler, uzundan kısaya. Genel kelimeler atılır."""
    return [w for w in sorted(set(norm(baslik).split()), key=len, reverse=True)
            if len(w) > 5 and w not in GENEL_KELIME]

def cikmis_bul(baslik, onek):
    """Bu mevzuattan çıkmış sınavda sorulmuş sorular.
    Kanun numarası varsa YALNIZ ona bakılır (kesin eşleşme). Numara yoksa en ayırt edici iki
    kelime birlikte aranır. Kural bilerek DAR: geniş kural sağlam paketi kirletiyor."""
    # Numara başlıkta yoksa arşiv önekinde olabilir ("Türk Sivil Havacılık Kanunu" → "2920 Sivil
    # Havacılık"). Numara varken ada bakmak tek kelimeyle yanlış soru topluyor.
    no = re.search(r'\b(\d{3,4})\b', baslik) or re.search(r'\b(\d{3,4})\b', onek or '')
    ipucu = ayirt_edici(baslik)[:2]
    out = []
    for x in cikmis:
        if x.get('bolum') == 'genel': continue
        k = x['kok']; nk = norm(k); tut = False
        if no: tut = bool(re.search(r'\b' + no.group(1) + r'\s*[Ss]ay', k))
        elif len(ipucu) >= 2: tut = all(a in nk for a in ipucu)
        elif ipucu: tut = ipucu[0] in nk
        if tut: out.append({'kok': k, 'siklar': x['siklar'], 'rutbe': x.get('rutbe'), 'kitapcik': x.get('dosya')})
    return out

def banka_oku(p):
    s = io.open(p, encoding='utf-8').read(); out = []
    for r in re.findall(r'\{"id":"[\w/-]+".*?\}(?=,\n|\n)', s):
        try: out.append(json.loads(r))
        except Exception: pass
    return out
banka = {}
for q in banka_oku(KOK + 'src/assets/duello-sorulari.ts') + banka_oku(KOK + 'src/assets/kart-sorulari.ts'):
    banka.setdefault(q['id'], q)
banka = list(banka.values())

def banka_bul(baslik, onek=None):
    no = re.search(r'\b(\d{3,4})\b', baslik) or re.search(r'\b(\d{3,4})\b', onek or '')
    ad = ayirt_edici(baslik)[:2]
    out = []
    for q in banka:
        kay = norm(q.get('kaynak') or ''); idp = norm(q['id'])
        if no and (no.group(1) in idp or no.group(1) in kay): out.append(q)
        elif not no and ad and all(a in kay for a in ad): out.append(q)
    return out

OUT = BURA + '/paketler/' + brans + '/'
os.makedirs(OUT, exist_ok=True)
ozet = []
for r in kitaplar:
    baslik = r['baslik'].strip(); lid = r['law_id']
    onek = ALIAS.get(baslik)
    izin, yerel = kapsam_maddeleri(r['dosya_yolu'])
    izin_no = {x for x in (izin or set()) if isinstance(x, int)}
    maddeler = []
    if onek:
        for k, v in ars.items():
            if not k.startswith(onek + ' m.'): continue
            mno = k.split(' m.', 1)[1]
            try: n = int(re.match(r'\d+', mno).group())
            except Exception: n = None
            if izin_no and n is not None and n not in izin_no and 'ek' not in mno.lower(): continue
            maddeler.append({'anahtar': k, 'no': mno, 'metin': v[:9000]})
    cs = cikmis_bul(baslik, onek); bs = banka_bul(baslik, onek)
    paket = {
        'brans': brans, 'law_id': lid, 'ad': baslik, 'sira': r['sira'],
        'arsiv_oneki': onek, 'kitap_pdf': yerel,
        'kapsam_maddeleri': sorted(izin_no) if izin_no else 'Tamamı',
        'madde_sayisi': len(maddeler), 'maddeler': maddeler,
        'cikmis_sorular': cs,
        'banka_sorulari': [{'soru': q['soru'], 'siklar': q['siklar'], 'dogru': q['dogru'],
                            'aciklama': q.get('aciklama', ''), 'kaynak': q.get('kaynak', '')} for q in bs][:120],
        'banka_kaynak_sayim': collections.Counter(
            re.sub(r'\s+', ' ', (q.get('kaynak') or '')[:40]) for q in bs).most_common(25),
    }
    json.dump(paket, io.open(OUT + f'pack_{lid}.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=0)
    ozet.append((lid, baslik[:46], len(izin_no) if izin_no else '-', len(maddeler), len(cs), len(bs)))

print(f'{"id":>4} | {"mevzuat":<46} | {"kapsam":>6} | {"metin":>5} | {"çıkmış":>6} | {"banka":>5}')
for o in ozet: print(f'{o[0]:>4} | {o[1]:<46} | {str(o[2]):>6} | {o[3]:>5} | {o[4]:>6} | {o[5]:>5}')
print(f'\ntoplam {len(ozet)} mevzuat · {sum(o[3] for o in ozet)} madde metni · '
      f'{sum(o[4] for o in ozet)} çıkmış soru · {sum(o[5] for o in ozet)} banka sorusu')
json.dump([{'law_id': o[0], 'ad': r['baslik'], 'sira': r['sira']} for o, r in zip(ozet, kitaplar)],
          io.open(OUT + 'liste.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
