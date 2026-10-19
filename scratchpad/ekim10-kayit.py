# 10 Eki 2026 — bir sınavın ajan çıktılarından (ekim10/<kod>/tam_*.json + deger_*.json) ortak kayit.json üretir.
# Ortak bölüm aynıysa (ekim10/<kod>/ortak.json "ayni") o sorular kaynak sınavın kayit.json'ından kopyalanır
# (ORTAK_KAYNAK: subay → subay-mebs, astsubay → astsubay-mebs). konu/soruldu da oradan taşınır.
# Kullanım: python ekim10-kayit.py <kod>
import json, re, sys, glob, os
sys.stdout.reconfigure(encoding='utf-8')
B = 'D:/Mevzu/JSPS/uygulama/'
S = B + 'scratchpad/'
sys.path.insert(0, S)
from ekim10_sinavlar import SINAVLAR
kod = sys.argv[1]
cfg = SINAVLAR[kod]
D = S + f'ekim10/{kod}/'
H = {h['id']: h for h in json.load(open(S + 'havuz-tum.json', encoding='utf-8'))}
_s = open(S + 'yakalanan-sayfa.py', encoding='utf-8').read()
exec(_s[_s.index('# --- Uygulamadaki yer ---'):_s.index('kayit = []')])  # yerler(id)
PADI = {}
for f in glob.glob(B + 'docs/sinavprovasi/d/*.json'):
    d = json.load(open(f, encoding='utf-8')); PADI[d['id']] = (d['baslik'], d['sorular'])


def prova_kalem(dosya, sira):
    q = PADI[dosya][1][sira - 1]
    yer = [f'Site · Sınav Provası · {PADI[d][0]} · {i + 1}. soru' for d in sorted(PADI) for i, x in enumerate(PADI[d][1]) if x['k'] == q['k']]
    return {'tur': 'prova', 'id': f'{dosya} #{sira}', 'soru': q['k'], 'siklar': q['s'], 'dogru': q['d'], 'aciklama': q['a'],
            'yer': yer + ['Uygulamada değil — mevzujsps.com/sinavprovasi (herkese açık)']}


def kart_kalem(k):
    an = k['anahtar']
    return {'tur': 'kart', 'id': 'MADDE KARTI', 'baslik': f'{an} kartı — madde metni', 'metin': k['alinti'],
            'yer': [f'Mevzuat › {an} kartı (madde metni)']}


T, DG = {}, {}
for f in sorted(glob.glob(D + 'tam_*.json')):
    for q in json.load(open(f, encoding='utf-8')): T[q['no']] = q
for f in sorted(glob.glob(D + 'deger_*.json')):
    for d in json.load(open(f, encoding='utf-8')): DG[d['no']] = d

kayit, eksik = [], []
# 1) Ortak bölüm: kaynak sınavdan kopya
ortak = json.load(open(D + 'ortak.json', encoding='utf-8')) if os.path.exists(D + 'ortak.json') else {'ayni': []}
kay = cfg.get('ortak_kaynak')
if kay and ortak.get('ayni'):
    KK = {k['no']: k for k in json.load(open(S + f'ekim10/{kay}/kayit.json', encoding='utf-8'))}
    for no in ortak['ayni']:
        if no in KK and no not in DG: kayit.append(KK[no])
# 2) Ajan değerlendirmeleri
for no, d in sorted(DG.items()):
    if no not in T: eksik.append(no); continue
    if d['durum'] == 'y': continue
    havuz = [dict(id=i, soru=H[i]['soru'], siklar=H[i]['siklar'], dogru=H[i]['dogru'], aciklama=H[i]['aciklama'], yer=yerler(i) or ['(yer bulunamadı)'])
             for i in d.get('ids', []) if i in H]
    prova = [prova_kalem(a, s) for a, s in (d.get('prova') or []) if a in PADI and s <= len(PADI[a][1])]
    kk = d.get('kart') or {}
    hd = d.get('havuz_durum', 'b' if d['kaynak'] == 'havuz' else 'y')
    kartk = [kart_kalem(kk)] if kk.get('alinti') and d['kaynak'] == 'kart' else []
    if d['kaynak'] == 'kart': bizde = kartk + havuz + prova
    elif d['kaynak'] == 'prova': bizde = prova + havuz
    else: bizde = havuz + prova
    if not bizde: eksik.append(no); continue
    k = {'no': no, 'durum': d['durum'], 'konu': '', 'not': d.get('not', ''), 'tam': T[no], 'bizde': bizde,
         'bolum': 'brans' if no > cfg['musterek'][1] else 'musterek'}
    if d['kaynak'] in ('kart', 'prova'):
        if hd == 'y': k['kaynak'] = d['kaynak']
        elif hd == 'k' and d['durum'] == 'b': k['yukselt'] = d['kaynak']
    kayit.append(k)
kayit.sort(key=lambda k: k['no'])
json.dump(kayit, open(D + 'kayit.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
from collections import Counter
print(kod, len(kayit), Counter(k['durum'] for k in kayit), 'kaynak', Counter(k.get('kaynak') for k in kayit), 'yukselt', Counter(k.get('yukselt') for k in kayit))
print('görüntüsü/kaydı eksik:', eksik)
# konu/soruldu: ortak sorular kaynaktan taşınır; yeni sorular için ajan yazacak
if kay:
    for ad in ('konu.json', 'soruldu.json'):
        src = S + f'ekim10/{kay}/{ad}'
        if not os.path.exists(src): continue
        Q = json.load(open(src, encoding='utf-8'))
        hed = json.load(open(D + ad, encoding='utf-8')) if os.path.exists(D + ad) else {}
        for k in kayit:
            if str(k['no']) in Q and k['no'] in ortak.get('ayni', []) and str(k['no']) not in hed: hed[str(k['no'])] = Q[str(k['no'])]
        json.dump(hed, open(D + ad, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
eks = [k['no'] for k in kayit if not os.path.exists(D + 'konu.json') or str(k['no']) not in json.load(open(D + 'konu.json', encoding='utf-8'))]
print('konu yazılacak:', eks)
