# Antigravity (Gemini) SIFIRDAN içerik denemesi için yalıtılmış girdi: gemini_calisma/girdi/
# 3 Eki (başkan): "check up ve röntgen modunu sıfırdan yaptırıyor gibi düşün, iskelet aynı, içerik ne çıkaracak görelim"
#                 "tüm branşlarda ayrı ayrı görünebilen tüm mevzuat kapsamında yapsın"
# → Girdide BİZİM kart/soru/özet YOK. Yalnız resmî metin + resmî kapsam (16 branş, 143 mevzuat) + biçim örneği.
import json, os, re, shutil, sys, glob
sys.stdout.reconfigure(encoding='utf-8')
KOK = 'D:/GorselHafizaTeknikleriyleJSPS'
G = KOK + '/gemini_calisma/girdi'
C = 'C:/Users/GIGABYTE/AppData/Local/Temp/claude/D--GorselHafizaTeknikleriyleJSPS/1cb33cb3-f233-47d5-9f06-b8d257742241/scratchpad/calisma/'

for alt in ('kartlar', 'sorular', 'altin_ozet_md', 'resmi_metin'):
    shutil.rmtree(f'{G}/{alt}', ignore_errors=True)
for f in ('emir_madde_kapsam.json', 'kapsam.json'):
    if os.path.exists(f'{G}/{f}'): os.remove(f'{G}/{f}')
os.makedirs(G + '/resmi_metin', exist_ok=True)
os.makedirs(KOK + '/gemini_calisma/cikti', exist_ok=True)

EMIR = json.load(open(KOK + '/scripts/_emir-madde-kapsam.json', encoding='utf-8'))['kapsam']
tam = json.load(open(KOK + '/scratchpad/denetim/tam_metin.json', encoding='utf-8'))
bot = json.load(open('D:/jsps-community-bot/data/maddeler.json', encoding='utf-8'))
bot_onek = {}
for key in bot:
    if ' m.' in key: bot_onek.setdefault(key.rsplit(' m.', 1)[0], []).append(key)
EL_ONEK = {5: ['İl İdaresi', 'ILIDARESI 5442'], 99: ['Harcama Belgeleri Yön'], 46: ['Kültür/Tabiat 2863'], 13: ['Sözleşmeli Sb/Asb 4678']}

# branş → mevzuat listesi (uygulamanın Merkez verisinden: hangi branşta hangi mevzuat, müşterek mi branş mı, kapsam yazısı)
BRANS, MEVZ = {}, {}
for f in sorted(glob.glob(C + 'veri2-*.json')):
    d = json.load(open(f, encoding='utf-8'))
    s = d['brans']['slug']
    BRANS[s] = {'ad': d['brans']['ad'], 'kanunlar': []}
    for k in d['kanun']:
        BRANS[s]['kanunlar'].append({'id': k['id'], 'g': k['g'], 'kap': k['kap'], 'ad': k['ad']})
        MEVZ.setdefault(k['id'], {'ad': k['ad'], 'kullanim': []})['kullanim'].append((s, k['g'], k['kap']))

def kap_coz(kap):
    """Kapsam yazısını madde listesine çevirir; yalnız 'Tamamı' ise None."""
    if re.search(r'tamam', kap, re.I) and not re.search(r'm\.\s*\d', kap): return None
    ek = ['Ek ' + x for x in re.findall(r'Ek\s*(\d+)', kap)]
    kap = re.sub(r'Ek\s*\d+', ' ', kap)
    out = []
    for m in re.finditer(r'(\d+)(?:/[A-Za-zÇĞİÖŞÜçğıöşü]+(?:\s*-\s*[A-Za-zÇĞİÖŞÜçğıöşü]+)?)?(?:\s*-\s*(\d+))?', kap):
        a = int(m.group(1)); b = int(m.group(2)) if m.group(2) else a
        if b < a or b - a > 600: b = a
        out += [str(x) for x in range(a, b + 1)]
    out = [x for x in out if x != '0'] + ek
    return list(dict.fromkeys(out)) or None

def kapsam(lid, g, kap):
    v = EMIR.get('müşterek' if g == 'mus' else g, {}).get(str(lid))
    if v: return [str(x) for x in v if str(x) != '0']
    return kap_coz(kap)   # None = Tamamı

def no_anahtar(no):
    m = re.match(r'(\d+)', str(no)); return (0, int(m.group(1)), str(no)) if m else (1, 0, str(no))

# 135: yalnız güncel 2022 metni (2009 tebliği m.16 ile kalktı; paket karışık)
ham135 = open(KOK + '/scratchpad/denetim/resmi/acil_servis_tebligi_2022.txt', encoding='utf-8').read()
shutil.copy(KOK + '/scratchpad/denetim/resmi/acil_servis_tebligi_2022.txt', G + '/resmi_metin/kanun_135_tam_metin_2022.txt')
def m135():
    parca = re.split(r'(?m)^((?:GEÇİCİ )?MADDE \d+)\s*[-–]\s*', ham135); out = []
    for i in range(1, len(parca), 2):
        out.append({'no': parca[i].replace('MADDE ', '').replace('GEÇİCİ ', 'Geçici ').strip(),
                    'metin': re.sub(r'\n\s*\n', '\n', parca[i + 1]).strip()})
    return out

kapsam_json = {'not': 'Resmî sınav kapsamı (Ek-1). Soru YALNIZ kapsam maddelerinden sorulur. kapsam_maddeler=null → mevzuatın tamamı.',
               'branslar': {}, 'mevzuatlar': {}}
eksik_toplam = {}
for lid in sorted(MEVZ):
    m = MEVZ[lid]
    d = json.load(open(f'{KOK}/scratchpad/denetim/kanun_{lid}.json', encoding='utf-8'))
    pk = d['resmi_metin_paketi'].replace(chr(92), '/')
    p = json.load(open(pk, encoding='utf-8')); onek = p.get('arsiv_oneki')
    if lid == 135:
        maddeler = {x['no']: dict(x, kaynak='2022 güncel tebliğ') for x in m135()}
    else:
        maddeler = {str(x['no']): {'no': str(x['no']), 'metin': tam.get(f"{onek} m.{x['no']}", x['metin'])} for x in p['maddeler']}
    # birleşik kapsam (bu mevzuatın göründüğü bütün branşlar)
    birlesik, tamami = [], False
    for s, g, kap in m['kullanim']:
        k = kapsam(lid, g, kap)
        if k is None: tamami = True
        else: birlesik += k
    birlesik = list(dict.fromkeys(birlesik))
    # paket dışında kalan kapsam maddelerini bot arşivinden tamamla (önek: kanun numarası içeren ya da elle verilen)
    no_ = re.match(r'(\d{3,5})\s*sayılı', m['ad'], re.I)
    onekler = EL_ONEK.get(lid, []) + ([o for o in bot_onek if no_ and re.search(r'(^|\D)' + no_.group(1) + r'(\D|$)', o)] if no_ else [])
    for o in onekler:
        for key in bot_onek.get(o, []):
            no = key.rsplit(' m.', 1)[1].strip()
            if no in birlesik and no not in maddeler and len(bot[key]) > 20:
                maddeler[no] = {'no': no, 'metin': bot[key]}
    liste = sorted(maddeler.values(), key=lambda x: no_anahtar(x['no']))
    for x in liste: x['kapsamda'] = True if tamami else (x['no'] in birlesik)
    eksik = [] if tamami else [x for x in birlesik if x not in maddeler]
    if eksik: eksik_toplam[lid] = eksik
    branslar = sorted(set(s for s, _, _ in m['kullanim']))
    kapsam_json['mevzuatlar'][str(lid)] = {'ad': m['ad'], 'branslar': branslar,
        'grup': 'müşterek' if any(g == 'mus' for _, g, _ in m['kullanim']) else 'branş',
        'kapsam_maddeler_birlesik': None if tamami else birlesik, 'metni_bulunamayan_kapsam_maddeleri': eksik}
    json.dump({'kanun_id': lid, 'ad': m['ad'], 'kapsam_maddeler_birlesik': None if tamami else birlesik,
               'not': ('Güncel 2022 tebliği; 2009 tarihli eski tebliğ YÜRÜRLÜKTE DEĞİL. ' if lid == 135 else '') +
                      'kapsamda=true maddelerden soru sorulur; diğerleri yalnız bağlam/karıştırılan için.',
               'maddeler': liste}, open(f'{G}/resmi_metin/kanun_{lid}.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)

for s, b in BRANS.items():
    kapsam_json['branslar'][s] = {'ad': b['ad'], 'kanunlar': [
        {'id': k['id'], 'ad': k['ad'], 'grup': 'müşterek' if k['g'] == 'mus' else 'branş', 'g': k['g'],
         'kapsam_yazisi': k['kap'], 'kapsam_maddeler': kapsam(k['id'], k['g'], k['kap'])} for k in b['kanunlar']]}
json.dump(kapsam_json, open(G + '/kapsam.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)

# Biçim örneği: TCK (id 1) kısaltılmış — yalnız alan yapısı
t = next(k for k in json.load(open(C + 'veri2-jandarma.json', encoding='utf-8'))['kanun'] if k['id'] == 1)
orn = {'id': t['id'], 'ad': t['ad'], 'kap': t['kap'], 'g': t['g'],
       'nasil_soruluyor': ['"Aşağıdaki ifadelerden hangisi yanlıştır?" en sık kalıp; dört şık madde metninden birebir alınır, bir şıkta tek kelime tersine çevrilir.'],
       'q': t['q'][:2], 'n': [{k: v for k, v in n.items() if k in ('i', 's', 'b', 'h', 'k', 'nd', 'o', 't', 'm', 'yz', 'dg')} for n in t['n'][:2]],
       'sayi': t['sayi'][:3], 'makam': t['makam'][:3], 'tz': [{k: v for k, v in z.items() if k in ('y', 'd', 'm', 'bag')} for z in t['tz'][:2]]}
json.dump(orn, open(G + '/ornek_kanun_bicimi_TCK.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)

mus = sorted({k['id'] for b in BRANS.values() for k in b['kanunlar'] if k['g'] == 'mus'})
print('branş:', len(BRANS), '| mevzuat:', len(MEVZ), '| müşterek:', len(mus))
print('metni bulunamayan kapsam maddesi olan mevzuat:', len(eksik_toplam), '| madde:', sum(len(v) for v in eksik_toplam.values()))
for l, v in sorted(eksik_toplam.items(), key=lambda x: -len(x[1]))[:25]: print(' ', l, MEVZ[l]['ad'][:60], '→', len(v), v[:12])
