# mevzujsps.com/tahmin kimler açtı, kimler bitirdi, kaç doğru yaptı — özet.
# Çalıştır: python -X utf8 scripts/premium-deneme/tahmin/rapor.py
import io, json, os, sys, urllib.request
from datetime import datetime, timedelta
sys.stdout.reconfigure(encoding='utf-8')
KOK = os.path.dirname(os.path.abspath(__file__))
env = dict(l.split('=', 1) for l in io.open(os.path.join(KOK, '../../../.env'), encoding='utf-8').read().splitlines() if '=' in l and not l.startswith('#'))
U, K = env['EXPO_PUBLIC_SUPABASE_URL'].strip(), env['SUPABASE_SERVICE_KEY'].strip()
req = urllib.request.Request(U + '/rest/v1/tahmin_deneme_kayit?select=*&order=olusturma.asc&limit=10000',
                             headers={'apikey': K, 'Authorization': 'Bearer ' + K})
rows = json.load(urllib.request.urlopen(req))

kisi = {}
for r in rows:
    k = kisi.setdefault(r['ziyaretci'], {'ad': None, 'ilk': r['olusturma'], 'acilis': 0, 'bitir': {}})
    if r.get('ad'):
        k['ad'] = r['ad']
    if r['olay'] == 'acilis':
        k['acilis'] += 1
    else:
        k['bitir'][r['deneme']] = (r['dogru'], r['yanlis'], r['bos'])


def tr(ts):
    return (datetime.fromisoformat(ts.replace('Z', '+00:00')) + timedelta(hours=3)).strftime('%d.%m %H:%M')


bitiren = [k for k in kisi.values() if k['bitir']]
print(f"Açan kişi (tarayıcı): {len(kisi)} · bitiren: {len(bitiren)} · toplam açılış: {sum(k['acilis'] for k in kisi.values())}")
for ad, d in (('Jandarma', 'jan'), ('MEBS', 'mebs')):
    p = [k['bitir'][d][0] for k in kisi.values() if d in k['bitir']]
    if p:
        print(f"  {ad}: {len(p)} kişi bitirdi · ortalama {sum(p) / len(p):.1f} / 80 · en yüksek {max(p)}")
print()
for k in sorted(kisi.values(), key=lambda x: x['ilk']):
    sonuc = ' · '.join(f"{'Jandarma' if d == 'jan' else 'MEBS'} {v[0]} doğru / {v[1]} yanlış / {v[2]} boş" for d, v in k['bitir'].items()) or 'bitirmedi'
    print(f"{tr(k['ilk'])}  {k['ad'] or '(adsız)':<20} açılış {k['acilis']}  | {sonuc}")
