# Kilit kelime şifrelerini gerçek sınav sorularına uygula: kelime soruda geçiyor mu, cevap doğru şıkkı gösteriyor mu?
import json, re, glob, os, sys, unicodedata
sys.stdout.reconfigure(encoding='utf-8')
KOK = 'D:/GorselHafizaTeknikleriyleJSPS'
BURA = os.path.dirname(os.path.abspath(__file__))
SINAVLAR = [('Subay (ortak 21-60)', f'{KOK}/scratchpad/Subay_Jandarma_100_Soru.md', 21, 60),
            ('Astsubay (ortak 21-70)', f'{KOK}/scratchpad/Astsubay_MEBS_100_Soru.md', 21, 70),
            ('Uzman Erbaş (ortak 21-60)', f'{KOK}/scratchpad/Uzman_Erbas_100_Soru.md', 21, 60)]

def norm(s):
    s = s.replace('İ', 'i').replace('I', 'ı').replace('\u0307', '')
    s = s.lower()
    s = s.replace('â', 'a').replace('î', 'i').replace('û', 'u')
    s = s.replace('’', "'").replace('‘', "'").replace('“', '"').replace('”', '"')
    s = re.sub(r'[\u200b\xa0]', ' ', s)
    return re.sub(r'\s+', ' ', s).strip()

STOP = set('''veya için olan olarak gibi daha sonra önce kadar değil ile ise olup olduğu olması halinde hakkında ilişkin dair üzere göre
aşağıdakilerden hangisi hangisinde hangisidir yanlıştır doğrudur değildir sayılı kanun kanunu kanuna kanunun yönetmelik yönetmeliği yönetmeliğine yönetmeliğe
madde maddesi maddesine tarafından yapılır verilir edilir olur olan olanlar bunlar şunlardır ancak yalnız yalnızca hiçbir tüm bütün diğer başka ayrıca
yoksa varsa veyahut yahut kişi kişiye kişinin bir iki üç dört beş altı yedi sekiz dokuz on'''.split())

def tok(s):
    return [t for t in re.findall(r"[0-9]+(?:[.,][0-9]+)?|[a-zçğıöşü]+", norm(s)) if t not in STOP and (t.isdigit() or len(t) >= 4)]

def esit(a, b):
    if a.isdigit() or b.isdigit():
        return a == b
    k = min(len(a), len(b))
    return k >= 5 and a[:k] == b[:k] and abs(len(a) - len(b)) <= 5 or a == b

def ortusme(cevap, secenek):
    ct, st = tok(cevap), tok(secenek)
    puan = 0; eslesen = []
    for c in ct:
        for s in st:
            if esit(c, s):
                puan += 2 if c.isdigit() else 1; eslesen.append(c); break
    return puan, eslesen

# --- şifreler
SIF = []
for f in glob.glob(f'{KOK}/gemini_calisma/kodlama_secme/kanun_*.json'):
    d = json.load(open(f, encoding='utf-8'))
    for k in d['kodlar']:
        SIF.append({'lid': d['id'], 'ad': d['ad'], 'm': k['madde'], 'kel': k['tetikleyici'], 'cev': k['cevap'], 'kanit': k['kanit'], 'i': k['i']})
print(len(SIF), 'şifre yüklendi')

# --- kanun etiketi
NO2LID = {'5237': 1, '2803': 2, '6698': 3, '7201': 4, '5442': 5, '5326': 6, '3713': 7, '2935': 8, '5816': 9, '6284': 10, '2893': 11,
          '7068': 12, '4678': 13, '5070': 14, '6136': 25, '2521': 20}
AD2LID = [('hizmet esasları', 23), ('personel yönetmeliği', 22), ('izin yönetmeliği', 24), ('resmî yazışma', 15), ('resmi yazışma', 15),
          ('sözleşmeli subay ve astsubay yönetmeliği', 16), ('sözleşmeli subay', 13), ('silinmesi, yok edilmesi', 18), ('bilgi edinme', 19),
          ('jandarma teşkilat, görev ve yetkileri yönetmeliği', 17), ('jandarma teşkilat', 2), ('tebligat', 4), ('il idaresi', 5),
          ('kabahatler', 6), ('terörle mücadele', 7), ('olağanüstü hal', 8), ('atatürk aleyhine', 9), ('ailenin korunması', 10),
          ('türk bayrağı', 11), ('genel kolluk disiplin', 12), ('disiplin hükümleri', 12), ('elektronik imza', 14), ('ateşli silahlar', 25),
          ('türk ceza', 1), ('kişisel verilerin korunması', 3), ('2521', 20)]
def etiket(metin):
    n = norm(metin)
    m = re.search(r'(\d{4}) sayılı', n)
    lid = None
    if m and m.group(1) in NO2LID:
        lid = NO2LID[m.group(1)]
        if lid == 10 and 'yönetmeli' in n: lid = 21
    if lid is None:
        for ad, l in AD2LID:
            if ad in n: lid = l; break
    return lid

NEG = re.compile(r'(değildir|yanlıştır|yer almaz|sayılmaz|bulunmaz|olamaz|verilemez|yapılamaz|gerekmez|değil\b|yanlış)')

# --- soruları oku
def sorular(yol, bas, son):
    t = open(yol, encoding='utf-8').read()
    out = []
    for blok in re.split(r'(?m)^## Soru (\d+)\s*$', t)[1:]:
        pass
    parcalar = re.split(r'(?m)^## Soru (\d+)\s*$', t)
    for no, govde in zip(parcalar[1::2], parcalar[2::2]):
        no = int(no)
        if not (bas <= no <= son): continue
        sat = govde.strip().split('\n')
        secenek = {}; kok = []
        for s in sat:
            m = re.match(r'^-\s*([A-E])\)\s*(.*)', s)
            if m: secenek[m.group(1)] = m.group(2).strip(); continue
            if '**Doğru cevap' in s: continue
            if not secenek: kok.append(s)
        d = re.search(r'Doğru cevap:\s*([A-E])', govde)
        out.append({'no': no, 'kok': '\n'.join(kok).strip(), 'sec': secenek, 'd': d.group(1) if d else None})
    return out

RAPOR = []; ozet = {}
for sinav, yol, bas, son in SINAVLAR:
    S = sorular(yol, bas, son)
    for q in S:
        nk = norm(q['kok']); nsec = norm(' '.join(q['sec'].values()))
        lid = etiket(q['kok'])
        neg = bool(NEG.search(nk))
        vurus = []
        for s in SIF:
            kel = norm(s['kel'])
            if kel in nk: yer = 'kök'
            elif kel in nsec: yer = 'şık'
            else: continue
            puanlar = {h: ortusme(s['cev'], v) for h, v in q['sec'].items()}
            en = max(p for p, _ in puanlar.values())
            adaylar = [h for h, (p, _) in puanlar.items() if p == en and en > 0]
            tahmin = adaylar[0] if len(adaylar) == 1 else None
            # kanıt ile de dene (ikincil sinyal)
            kp = {h: ortusme(s['kanit'], v)[0] for h, v in q['sec'].items()}
            ken = max(kp.values()); kad = [h for h, p in kp.items() if p == ken and ken > 0]
            ktahmin = kad[0] if len(kad) == 1 else None
            vurus.append({'i': s['i'], 'lid': s['lid'], 'm': s['m'], 'kel': s['kel'], 'cev': s['cev'], 'yer': yer, 'tahmin': tahmin,
                          'puan': {h: p for h, (p, _) in puanlar.items()}, 'ktahmin': ktahmin, 'ayni_kanun': (lid is None or s['lid'] == lid)})
        # karar: önce kök vuruşları, aynı kanundan; cevabı doğru şıkkı gösteren var mı?
        kokv = [v for v in vurus if v['yer'] == 'kök' and v['ayni_kanun']]
        sikv = [v for v in vurus if v['yer'] == 'şık' and v['ayni_kanun']]
        def karar(vs):
            if not vs: return 'yok'
            t = [v['tahmin'] for v in vs if v['tahmin']]
            if not t: return 'kelime var, cevap şık seçmiyor'
            if q['d'] in t and all(x == q['d'] for x in t): return 'DOĞRU'
            if q['d'] in t: return 'karışık (doğru + yanlış işaret)'
            return 'YANLIŞ işaret'
        k1 = karar(kokv); k2 = karar(sikv)
        durum = k1 if k1 != 'yok' else ('şıkta: ' + k2 if k2 != 'yok' else 'şifre yok')
        RAPOR.append({'sinav': sinav, 'no': q['no'], 'lid': lid, 'neg': neg, 'd': q['d'], 'kok': q['kok'], 'sec': q['sec'],
                      'durum': durum, 'kok_vurus': kokv, 'sik_vurus': sikv, 'diger_kanun_vurus': [v for v in vurus if not v['ayni_kanun']]})

json.dump(RAPOR, open(f'{BURA}/rapor.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)

# --- özet
from collections import Counter
print()
for sinav, *_ in SINAVLAR:
    R = [r for r in RAPOR if r['sinav'] == sinav]
    kap = [r for r in R if r['lid'] is not None]
    c = Counter(r['durum'] for r in kap)
    print(f'== {sinav}: {len(R)} soru · 25 müşterek mevzuattan {len(kap)} · kapsam dışı/etiketsiz {len(R)-len(kap)}')
    for k, v in c.most_common(): print(f'   {v:3d}  {k}')
R = [r for r in RAPOR if r['lid'] is not None]
print(f'\n== TOPLAM (etiketli) {len(R)}:', dict(Counter(r["durum"] for r in R).most_common()))
print('kapsam dışı/etiketsiz sorular:')
for r in RAPOR:
    if r['lid'] is None: print(f"   {r['sinav']} #{r['no']}: {r['kok'][:110]!r}")
