# mevzujsps.com/sinavprovasi — rütbe + branşa göre prova denemeleri.
# Kaynak denemeler: scripts/premium-deneme/tahmin/<KAYNAK>.json (birlestir.py + aciklama.py çıktısı).
# Çıktı: docs/sinavprovasi/index.html + docs/sinavprovasi/d/<id>.json ; docs/tahmin/ → yönlendirme.
# Yeni deneme eklemek: DENEMELER listesine bir satır ekle, çalıştır, commit + push.
# Çalıştır: python -X utf8 scripts/premium-deneme/tahmin/prova-uret.py
import io, json, os, time

KOK = os.path.dirname(os.path.abspath(__file__))
DEPO = os.path.normpath(os.path.join(KOK, '../../..'))
env = dict(l.split('=', 1) for l in io.open(os.path.join(DEPO, '.env'), encoding='utf-8').read().splitlines() if '=' in l and not l.startswith('#'))

BRANS_AD = {'jandarma': 'Jandarma', 'mebs': 'MEBS (Muhabere Elektronik Bilgi Sistemleri)', 'havacilik': 'Havacılık', 'personel': 'Personel',
            'maliye': 'Maliye', 'istihkam': 'İstihkam', 'ikmal': 'İkmal', 'bakim': 'Bakım', 'bando': 'Bando', 'saglik': 'Sağlık',
            'tabip': 'Tabip', 'dis_tabibi': 'Diş Tabibi', 'eczaci': 'Eczacı', 'kimyager': 'Kimyager', 'veteriner': 'Veteriner', 'muhendis': 'Mühendis'}
# Ek-1 rütbe-branş matrisi (hafıza: rutbe-brans-matrisi)
TEKNIK = ['mebs', 'havacilik', 'personel', 'maliye', 'istihkam', 'ikmal', 'bakim', 'bando']
BRANSLAR = {'sb': ['jandarma'] + TEKNIK + ['tabip', 'dis_tabibi', 'eczaci', 'kimyager', 'veteriner', 'muhendis'],
            'asb': ['jandarma'] + TEKNIK + ['saglik'],
            'uzmj': ['jandarma'], 'uzmerb': ['jandarma']}

MUS = 'Müşterek mevzuat'
# (id, kaynak dosya, rütbe, branş, başlık, bloklar)
DENEMELER = [
    ('SB-JAN', 'TAHMIN-SB-JAN-63', 'sb', 'jandarma', 'Subay · Jandarma', [[0, 40, MUS, '1–40'], [40, 80, 'Jandarma branş mevzuatı', '41–80']]),
    ('SB-MEBS', 'TAHMIN-SB-MEBS-7', 'sb', 'mebs', 'Subay · MEBS', [[0, 40, MUS, '1–40'], [40, 50, MUS + ' (MEBS ek)', '41–50'], [50, 80, 'MEBS branş mevzuatı', '51–80']]),
    # Uzman erbaş ve uzman jandarma aynı sınava girer (müşterek + Jandarma branşı)
    ('UZM-JAN', 'TAHMIN-UZM-JAN-311', 'uzmerb', 'jandarma', 'Uzman Erbaş / Uzman Jandarma · Jandarma', [[0, 40, MUS, '1–40'], [40, 80, 'Jandarma branş mevzuatı', '41–80']]),
    ('UZM-JAN', 'TAHMIN-UZM-JAN-311', 'uzmj', 'jandarma', 'Uzman Erbaş / Uzman Jandarma · Jandarma', [[0, 40, MUS, '1–40'], [40, 80, 'Jandarma branş mevzuatı', '41–80']]),
]
# Branşı hazır olmayanlar için rütbenin müşterek bölümü: (id, kaynak, ilk N soru, başlık)
MUSTEREK = {
    'sb': ('SB-MUS', 'TAHMIN-SB-JAN-63', 40, 'Subay · Müşterek'),
}


def sorular(kaynak, n=None):
    j = json.load(open(os.path.join(KOK, f'{kaynak}.json'), encoding='utf-8'))
    s = [{'k': q['soru'], 's': q['siklar'], 'd': q['dogru'], 'a': q['aciklama'], 't': q['tip']} for q in j['sorular']]
    return s[:n] if n else s


cikti = os.path.join(DEPO, 'docs/sinavprovasi')
os.makedirs(os.path.join(cikti, 'd'), exist_ok=True)
katalog = {'surum': str(int(time.time())), 'bransAd': BRANS_AD, 'branslar': BRANSLAR, 'denemeler': {}, 'musterek': {}}
for did, kaynak, rutbe, brans, baslik, bloklar in DENEMELER:
    s = sorular(kaynak)
    assert bloklar[-1][1] == len(s), (did, len(s))
    json.dump({'id': did, 'baslik': baslik, 'bloklar': bloklar, 'sorular': s}, open(os.path.join(cikti, 'd', did + '.json'), 'w', encoding='utf-8'), ensure_ascii=False)
    katalog['denemeler'][f'{rutbe}/{brans}'] = did
for rutbe, (did, kaynak, n, baslik) in MUSTEREK.items():
    json.dump({'id': did, 'baslik': baslik, 'bloklar': [[0, n, MUS, f'1–{n}']], 'sorular': sorular(kaynak, n)},
              open(os.path.join(cikti, 'd', did + '.json'), 'w', encoding='utf-8'), ensure_ascii=False)
    katalog['musterek'][rutbe] = did

t = io.open(os.path.join(KOK, 'prova-sablon.html'), encoding='utf-8').read()
for a, b in (('__SB_URL__', json.dumps(env['EXPO_PUBLIC_SUPABASE_URL'].strip())),
             ('__SB_ANON__', json.dumps(env['EXPO_PUBLIC_SUPABASE_ANON_KEY'].strip())),
             ('__KATALOG__', json.dumps(katalog, ensure_ascii=False))):
    assert t.count(a) == 1, a
    t = t.replace(a, b)
io.open(os.path.join(cikti, 'index.html'), 'w', encoding='utf-8').write(t)

# Eski adres → yeni adres
yon = ('<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="robots" content="noindex">'
       '<meta http-equiv="refresh" content="0; url=/sinavprovasi/"><title>Sınav Provası</title>'
       '<script>location.replace("/sinavprovasi/")</script></head>'
       '<body><p><a href="/sinavprovasi/">Sınav Provası</a> sayfasına yönlendiriliyorsun…</p></body></html>')
io.open(os.path.join(DEPO, 'docs/tahmin/index.html'), 'w', encoding='utf-8').write(yon)

hazir = {r: sum(1 for d in DENEMELER if d[2] == r) for r in BRANSLAR}
print('yazıldı: index.html +', len(DENEMELER) + len(MUSTEREK), 'deneme · tam deneme sayısı rütbe başına:', hazir)
