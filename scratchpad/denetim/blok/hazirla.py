# 2. AŞAMA — madde blokları: ajan girdileri (kanun başına) + partiler
#   python scratchpad/denetim/blok/hazirla.py
# Kaynak: gemini_calisma/girdi/resmi_metin (resmî metin, 143 mevzuat) + calisma/veri2-*.json (düzeltilmiş kartlar, sorular)
import json, os, re, sys, glob, collections
sys.stdout.reconfigure(encoding='utf-8')
KOK = 'D:/GorselHafizaTeknikleriyleJSPS'
B = KOK + '/scratchpad/denetim/blok'
C = 'C:/Users/GIGABYTE/AppData/Local/Temp/claude/D--GorselHafizaTeknikleriyleJSPS/1cb33cb3-f233-47d5-9f06-b8d257742241/scratchpad/calisma/'
os.makedirs(B + '/girdi', exist_ok=True); os.makedirs(B + '/sonuc', exist_ok=True)
KAP = json.load(open(KOK + '/gemini_calisma/girdi/kapsam.json', encoding='utf-8'))

# kanun → en çok sorulu branş kaydı (kartlar düzeltilmiş hâliyle)
kayit, brans_say = {}, collections.Counter()
for f in sorted(glob.glob(C + 'veri2-*.json')):
    d = json.load(open(f, encoding='utf-8'))
    for k in d['kanun']:
        brans_say[k['id']] += 1
        if k['id'] not in kayit or len(k['q']) > len(kayit[k['id']]['q']): kayit[k['id']] = k

def madde_no(y):
    m = re.search(r'm\.\s*((?:Ek|Geçici)\s*\d+|\d+)', y or '', re.I)
    return m.group(1).replace('  ', ' ') if m else None
def kel(t): return set(w for w in re.sub(r'[^a-zçğıöşü0-9 ]', ' ', str(t).replace('İ', 'i').replace('I', 'ı').lower()).split() if len(w) >= 5 or re.search(r'\d', w))

PARTI = []
SADECE = set(int(x) for x in sys.argv[1:]) if len(sys.argv) > 1 else None
for lid_s, mv in KAP['mevzuatlar'].items():
    lid = int(lid_s); k = kayit[lid]
    r = json.load(open(f'{KOK}/gemini_calisma/girdi/resmi_metin/kanun_{lid}.json', encoding='utf-8'))
    kap_nolar = [x['no'] for x in r['maddeler'] if x['kapsamda']]
    tum_nolar = [x['no'] for x in r['maddeler']]
    metin = {x['no']: x['metin'] for x in r['maddeler']}
    # "nasıl soruluyor" satırları
    md = k.get('md') or ''
    mm = re.search(r'###[^\n]*nasıl soruluyor[^\n]*\n([\s\S]*?)(?=\n###|$)', md, re.I)
    nasil = mm.group(1).strip() if mm else ''
    # kart anahtar kelimeleri (karıştırılan adayı için)
    kk = [(n['m'][0] if n['m'] else '', kel(n['b'] + ' ' + n['h'])) for n in k['n']]
    sorular = collections.defaultdict(list); karis = collections.defaultdict(collections.Counter)
    for q in k['q']:
        m = madde_no(q.get('y'))
        if not m: continue
        sorular[m].append(q)
        for si, s in enumerate(q['s']):
            if si == q['d']: continue
            sk = kel(s); en, ep = None, 0
            for km, ks in kk:
                if not km or km == m: continue
                p = len(sk & ks)
                if p > ep: ep, en = p, km
            if en and ep >= 2: karis[m][en] += 1
    maddeler = []
    for no in kap_nolar:
        kartlar = [{'id': n['i'], 'baslik': n['b'], 'hukum': n['h'],
                    'sinavda_boyle_yazarlar': n.get('yz') or ([n['t']] if n.get('t') else []), 'dogrusu': n.get('dg') or []}
                   for n in k['n'] if (n['m'][0] if n['m'] else '') == no]
        qs = sorular.get(no, [])
        # çeşitli 8 soru: önce farklı kökler
        sec, gor = [], set()
        for q in qs:
            # 3 Eki: kök kanunun uzun adıyla başlıyor → ilk 60 karakter hep aynıydı, madde başına tek soru kalıyordu. Ad kısmı atılır.
            anahtar = re.sub(r'^.*?(?:göre|gereğince|uyarınca|hükümlerine göre)\s*,?\s*', '', q['k'], count=1)[:80]
            if anahtar in gor: continue
            gor.add(anahtar); sec.append({'kok': q['k'], 'siklar': q['s'], 'dogru': q['s'][q['d']]})
            if len(sec) >= 8: break
        tablo = [r_ for r_ in (k.get('sayi') or []) + (k.get('makam') or []) if str((re.match(r'\d+', str(r_[2] or '')) or [''])[0]) == no]
        maddeler.append({'no': no, 'resmi_metin': metin.get(no, ''), 'kartlar': kartlar, 'soru_sayisi': len(qs), 'ornek_sorular': sec,
                         'tablo_satirlari': tablo,
                         'karistirilan_adaylari': [{'madde': m2, 'kac_celdiricide': c} for m2, c in karis[no].most_common(4)]})
    giris = {'kanun_id': lid, 'ad': mv['ad'], 'grup': mv['grup'], 'branslar': mv['branslar'],
             'kapsam': 'Tamamı' if mv['kapsam_maddeler_birlesik'] is None else 'liste',
             'tum_madde_nolari': tum_nolar, 'nasil_soruluyor_notu': nasil,
             'diger_maddeler_kisa': {no: re.sub(r'\s+', ' ', metin[no])[:160] for no in tum_nolar if no not in kap_nolar},
             'maddeler': maddeler}
    yol = f'{B}/girdi/kanun_{lid}.json'
    if SADECE is None or lid in SADECE: json.dump(giris, open(yol, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    boy = os.path.getsize(yol)
    jan = 'jandarma' in mv['branslar']
    oncelik = (0 if mv['grup'] == 'müşterek' else 1, 0 if jan else 1, -len(mv['branslar']))
    PARTI.append((oncelik, lid, boy, len(kap_nolar), mv['ad']))

# partiler: müşterek ayrı, branş ayrı; her parti ~380 KB girdi
PARTI.sort()
partiler, cur, cur_b, cur_g = [], [], 0, None
SINIR = 380_000
for onc, lid, boy, n, ad in PARTI:
    g = onc[0]
    if cur and (cur_b + boy > SINIR or g != cur_g):
        partiler.append(cur); cur, cur_b = [], 0
    cur.append(lid); cur_b += boy; cur_g = g
if cur: partiler.append(cur)
bilgi = {lid: (n, boy, ad) for _, lid, boy, n, ad in PARTI}
if SADECE is None: json.dump(partiler, open(B + '/partiler.json', 'w', encoding='utf-8'))
for i, p in enumerate(partiler, 1):
    print(f'parti {i:2d}: {len(p):2d} mevzuat · {sum(bilgi[l][0] for l in p):4d} madde · {sum(bilgi[l][1] for l in p)//1000:4d} KB · {p}')
print('toplam parti', len(partiler), '· madde', sum(b[0] for b in bilgi.values()))
