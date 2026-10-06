# mevzujsps.com/sinavprovasi (ve eski /tahmin): kimler açtı, kimler bitirdi, kaç doğru yaptı — özet.
# Çalıştır: python -X utf8 scripts/premium-deneme/tahmin/rapor.py
import io, json, os, sys, urllib.request
from collections import Counter
from datetime import datetime, timedelta
sys.stdout.reconfigure(encoding='utf-8')
KOK = os.path.dirname(os.path.abspath(__file__))
env = dict(l.split('=', 1) for l in io.open(os.path.join(KOK, '../../../.env'), encoding='utf-8').read().splitlines() if '=' in l and not l.startswith('#'))
U, K = env['EXPO_PUBLIC_SUPABASE_URL'].strip(), env['SUPABASE_SERVICE_KEY'].strip()
req = urllib.request.Request(U + '/rest/v1/tahmin_deneme_kayit?select=*&order=olusturma.asc&limit=20000',
                             headers={'apikey': K, 'Authorization': 'Bearer ' + K})
rows = json.load(urllib.request.urlopen(req))
RUTBE = {'sb': 'Subay', 'asb': 'Astsubay', 'uzmj': 'Uzm.J', 'uzmerb': 'Uzm.Erb', None: '-'}

kisi = {}
hiz = {}
for r in rows:
    k = kisi.setdefault(r['ziyaretci'], {'ad': None, 'rutbe': None, 'brans': None, 'ilk': r['olusturma'], 'acilis': 0, 'bitir': {}})
    for a in ('ad', 'rutbe', 'brans'):
        if r.get(a):
            k[a] = r[a]
    if r['olay'] == 'acilis':
        k['acilis'] += 1
    elif r['olay'] == 'hizlandir':
        hiz[f"{RUTBE[r['rutbe']]} {r['brans']}"] = hiz.get(f"{RUTBE[r['rutbe']]} {r['brans']}", 0) + 1
    elif r['olay'] == 'bitir':
        k['bitir'][r['deneme']] = (r['dogru'], r['yanlis'], r['bos'])


def tr(ts):
    return (datetime.fromisoformat(ts.replace('Z', '+00:00')) + timedelta(hours=3)).strftime('%d.%m %H:%M')


bitiren = [k for k in kisi.values() if k['bitir']]
print(f"Açan kişi (tarayıcı): {len(kisi)} · bitiren: {len(bitiren)} · toplam açılış: {sum(k['acilis'] for k in kisi.values())}")
dagilim = Counter(f"{RUTBE[k['rutbe']]} {k['brans'] or ''}".strip() for k in kisi.values())
print('Rütbe/branş:', ', '.join(f'{a}: {n}' for a, n in dagilim.most_common()))
puan = {}
for k in kisi.values():
    for d, v in k['bitir'].items():
        puan.setdefault(d, []).append(v[0])
for d, p in sorted(puan.items(), key=lambda x: -len(x[1])):
    print(f"  {d}: {len(p)} kişi bitirdi · ortalama {sum(p) / len(p):.1f} doğru · en yüksek {max(p)}")
print('Hızlandırma talepleri:', ', '.join(f'{a}: {n}' for a, n in sorted(hiz.items(), key=lambda x: -x[1])) or 'yok')
print()
for k in sorted(kisi.values(), key=lambda x: x['ilk']):
    sonuc = ' · '.join(f"{d}: {v[0]} D / {v[1]} Y / {v[2]} B" for d, v in k['bitir'].items()) or 'bitirmedi'
    print(f"{tr(k['ilk'])}  {(k['ad'] or '(adsız)')[:24]:<24} {RUTBE[k['rutbe']]:<9} {(k['brans'] or '-'):<10} açılış {k['acilis']}  | {sonuc}")
