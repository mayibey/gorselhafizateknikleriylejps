# 10 Eki 2026 — Altın Özet kitabı eşleşmelerini (ekim10/altin_sonuc_*.json) her sınavın kayit.json'ına işler. İdempotent:
# önceki altın kalemleri/etiketleri silinir, yeniden uygulanır. Kayıt üreteçlerinden (yakalanan-sayfa.py, asb-sayfa.py,
# ekim10-kayit.py) SONRA çalıştır. Kurallar: y → altın b/k ise yeni kayıt (kaynak='altin'); k → altın b ise birebire (yukselt='altin').
# Ortak bölüm soruları sınavlar arasında aynı olduğu için eşleme soru kökünün başıyla yapılır.
import json, glob, re, sys
sys.stdout.reconfigure(encoding='utf-8')
S = 'D:/Mevzu/JSPS/uygulama/scratchpad/'
sys.path.insert(0, S)
from ekim10_sinavlar import SINAVLAR

KITAP = {'ozet_A': 'Müşterek', 'ozet_B': 'Müşterek', 'ozet_C': 'Müşterek', 'ozet_D': 'MEBS', 'ozet_B_bakim': 'Bakım',
         'ozet_I_ikmal': 'Bakım', 'ozet_J_jandarma': 'Jandarma'}


def kitap_adi(dosya):
    d = dosya.replace('.md', '').replace('_sade', '').replace('_m', '')
    for k in sorted(KITAP, key=len, reverse=True):
        if d.startswith(k): return KITAP[k]
    return 'Altın Özet'


def tam(kod):
    fs = {'subay-mebs': glob.glob(S + 'sinav10_tam_*.json'), 'astsubay-mebs': glob.glob(S + 'asb10_tam_*.json')}.get(kod) or glob.glob(S + f'ekim10/{kod}/tam_*.json')
    T = {}
    kay = SINAVLAR[kod].get('ortak_kaynak')  # ortak bölüm (21–60) referans dökümden
    if kay:
        for q in json.load(open(S + f"ekim10/ref_{SINAVLAR[kod]['rutbe']}_21_60.json", encoding='utf-8')): T[q['no']] = q
    for f in fs:
        for q in json.load(open(f, encoding='utf-8')): T[q['no']] = q
    return T


# Görüntüde doğru şıkkı okunamayan sorularda kitap eşleşmesi en fazla kısmi sayılır (katı kural).
TAVAN = {('subay-bakim', 65): 'k', ('subay-bakim', 72): 'k'}
ADAY = {(a['kod'], a['no']): a['kok'][:120] for a in json.load(open(S + 'ekim10/altin_aday.json', encoding='utf-8'))}
SON = {}
for f in glob.glob(S + 'ekim10/altin_sonuc_*.json'):
    for r in json.load(open(f, encoding='utf-8')):
        SON[ADAY[(r['kod'], r['no'])]] = r

for kod, cfg in SINAVLAR.items():
    p = S + f'ekim10/{kod}/kayit.json'
    K = json.load(open(p, encoding='utf-8'))
    # temizle (idempotent)
    K = [k for k in K if k.get('kaynak') != 'altin']
    for k in K:
        k['bizde'] = [x for x in k['bizde'] if x.get('tur') != 'altin']
        if k.get('yukselt') == 'altin': k.pop('yukselt'); k['durum'] = k.pop('eski_durum', 'k')
    T = tam(kod); KK = {k['no']: k for k in K}; eks = set(cfg.get('eksik', []))
    yeni, yuk = [], []
    for no, q in T.items():
        if no < 21 or no in eks: continue
        r = SON.get(q['kok'][:120])
        if not r or r['altin'] not in ('b', 'k'): continue
        if (kod, no) in TAVAN: r = dict(r, altin=TAVAN[(kod, no)])
        ad = kitap_adi(r['dosya'])
        bb = re.split(r'\s+—\s+Sınav kapsamı', r.get('bolum_basligi', '').lstrip('# ').strip())[0].strip()
        mt = re.sub(r'\*\*|(?<!\w)\*(?!\s)|(?<!\s)\*(?!\w)', '', r['alinti']).replace(' | ', ' · ').strip(' |')
        kalem = {'tur': 'altin', 'id': 'ALTIN ÖZET', 'baslik': f'Altın Özet · {ad} kitabı — {bb}', 'metin': mt, 'yer': [f'Altın Özet kitabı › {ad}']}
        if no not in KK:
            K.append({'no': no, 'durum': r['altin'], 'kaynak': 'altin', 'konu': '', 'not': r.get('not', ''), 'tam': q, 'bizde': [kalem],
                      'bolum': 'brans' if no > cfg['musterek'][1] else 'musterek'})
            yeni.append(no)
        elif KK[no]['durum'] == 'k' and r['altin'] == 'b' and not KK[no].get('yukselt'):
            k = KK[no]; k['eski_durum'] = 'k'; k['durum'] = 'b'; k['yukselt'] = 'altin'; k['bizde'] = [kalem] + k['bizde']
            k['not'] = r.get('not', '') or k.get('not', '')
            yuk.append(no)
    K.sort(key=lambda k: k['no'])
    json.dump(K, open(p, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    t = 80 - len(eks)
    print(f'{kod:18} yeni {len(yeni):2} {yeni}  kısmi→birebir {len(yuk):2}  toplam {len(K)}/{t} = %{len(K) / t * 100:.1f}  birebir {sum(k["durum"] == "b" for k in K)}')
