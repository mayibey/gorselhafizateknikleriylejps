# 13 Eki 2026 — Yeni ölçüyle (bilgi bazlı) DOĞRUDAN değerlendirilen bir sınavı siteye bağlar.
# Girdi: ekim10/<kod>/tam_*.json + bilgi_*.json (ajan: no, seviye ayni|bilgi|kismi|yok, sorular, altin, konu, kaynak, soruldu).
# Ortak bölüm (21..musterek son) ortak_kaynak sınavının kayit/konu/soruldu dosyalarından kopyalanır; seviyesi site
# tarafında ortak_kaynak#no anahtarından okunur. Çıktı: ekim10/<kod>/{kayit,konu,soruldu,seviye}.json
# Kullanım: python ekim10-bilgi-entegre.py <kod>
import json, glob, re, sys
sys.stdout.reconfigure(encoding='utf-8')
B = 'D:/GorselHafizaTeknikleriyleJSPS/'
S = B + 'scratchpad/'
sys.path.insert(0, S)
from ekim10_sinavlar import SINAVLAR
kod = sys.argv[1]
cfg = SINAVLAR[kod]
D = S + f'ekim10/{kod}/'
M1 = cfg['musterek'][1]
H = {}
for h in json.load(open(S + 'havuz-tum.json', encoding='utf-8')): H.setdefault(h['id'], h)  # aynı id iki kez (ör. 3269-S-010 düello+kart): ilki (düello)
_s = open(S + 'yakalanan-sayfa.py', encoding='utf-8').read()
exec(_s[_s.index('# --- Uygulamadaki yer ---'):_s.index('kayit = []')])  # yerler(id)
KITAP = {'ozet_A': 'Müşterek', 'ozet_B': 'Müşterek', 'ozet_C': 'Müşterek', 'ozet_M_maliye': 'Maliye', 'ozet_P_personel': 'Personel',
         'ozet_E_havacilik': 'Havacılık', 'ozet_D': 'MEBS', 'ozet_J_jandarma': 'Jandarma', 'ozet_B_bakim': 'Bakım'}


def kitap_adi(dosya):
    d = dosya.replace('.md', '').replace('_sade', '')
    for k in sorted(KITAP, key=len, reverse=True):
        if d.startswith(k): return KITAP[k]
    return 'Altın Özet'


def temiz(t):
    return re.sub(r'\*\*|(?<!\w)\*(?!\s)|(?<!\s)\*(?!\w)', '', t).replace(' | ', ' · ').strip(' |')


T = {}
for f in sorted(glob.glob(D + 'tam_*.json')):
    for q in json.load(open(f, encoding='utf-8')): T[q['no']] = q
BL = {}
for f in sorted(glob.glob(D + 'bilgi_*.json')):
    for r in json.load(open(f, encoding='utf-8')): BL[r['no']] = r

kay = cfg['ortak_kaynak']
KK = json.load(open(S + f'ekim10/{kay}/kayit.json', encoding='utf-8'))
kayit = [k for k in KK if k['no'] <= M1]
konu = {n: v for n, v in json.load(open(S + f'ekim10/{kay}/konu.json', encoding='utf-8')).items() if int(n) <= M1}
sor = {n: v for n, v in json.load(open(S + f'ekim10/{kay}/soruldu.json', encoding='utf-8')).items() if int(n) <= M1}
sev, eksik = {}, []
for no in range(M1 + 1, 101):
    r = BL.get(no)
    if not r or no not in T: eksik.append(no); continue
    konu[str(no)] = {'konu': r['konu'], 'kaynak': r.get('kaynak', '')}
    sor[str(no)] = r['soruldu']
    sev[f'{kod}#{no}'] = r['seviye']
    if r['seviye'] not in ('ayni', 'bilgi'): continue
    bizde = [dict(id=i, soru=H[i]['soru'], siklar=H[i]['siklar'], dogru=H[i]['dogru'], aciklama=H[i]['aciklama'], yer=yerler(i) or ['(yer bulunamadı)'])
             for i in r.get('sorular', []) if i in H]
    if r.get('altin'):
        adlar = sorted({kitap_adi(a['dosya']) for a in r['altin']})
        bizde.append({'tur': 'altin', 'id': 'ALTIN ÖZET', 'baslik': f'Altın Özet · {" + ".join(adlar)} kitabı',
                      'metin': ' … '.join(temiz(a['alinti']) for a in r['altin'][:3]), 'yer': [f'Altın Özet kitabı › {a}' for a in adlar]})
    bilinmeyen = [i for i in r.get('sorular', []) if i not in H]
    if bilinmeyen: print('UYARI havuzda yok:', no, bilinmeyen)
    kayit.append({'no': no, 'durum': 'b', 'kaynak': 'bilgi', 'konu': '', 'not': r.get('gerekce', ''), 'tam': T[no], 'bizde': bizde, 'bolum': 'brans'})
kayit.sort(key=lambda k: k['no'])
for ad, v in (('kayit.json', kayit), ('konu.json', konu), ('soruldu.json', sor), ('seviye.json', sev)):
    json.dump(v, open(D + ad, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
from collections import Counter
print(kod, 'branş seviyeleri', Counter(sev.values()), '| eksik:', eksik)
