# Ekim analiz sayfasi ziyaret raporu. Kullanim: set -a; . ./.env; set +a; python scripts/analiz-sayac-rapor.py
import os, json, urllib.request, collections, datetime
U = os.environ['EXPO_PUBLIC_SUPABASE_URL'].rstrip('/') + '/rest/v1/analiz_ziyaret?select=olay,brans,ziyaretci,kaynak,mobil,created_at&order=id&limit=100000'
K = os.environ['SUPABASE_SERVICE_KEY']
R = json.load(urllib.request.urlopen(urllib.request.Request(U, headers={'apikey': K, 'Authorization': 'Bearer ' + K})))
if not R: print('Henüz kayıt yok.'); raise SystemExit
tr = lambda t: (datetime.datetime.fromisoformat(t.replace('Z', '+00:00')) + datetime.timedelta(hours=3)).date().isoformat()
ac = [r for r in R if r['olay'] == 'acilis']; so = [r for r in R if r['olay'] == 'sorular']
print(f"Toplam açılış: {len(ac)} · tekil kişi: {len({r['ziyaretci'] for r in ac})} · soruları inceleyen kişi: {len({r['ziyaretci'] for r in so})}")
print(f"Mobil oranı: %{round(100 * sum(1 for r in ac if r['mobil']) / len(ac))}")
print('\nGün gün (açılış / tekil kişi):')
g = collections.defaultdict(list)
for r in ac: g[tr(r['created_at'])].append(r['ziyaretci'])
for d in sorted(g): print(f"  {d}: {len(g[d])} / {len(set(g[d]))}")
print('\nBranş bazında soruları inceleyen kişi:')
b = collections.defaultdict(set)
for r in so: b[r['brans']].add(r['ziyaretci'])
for k, v in sorted(b.items(), key=lambda x: -len(x[1])): print(f"  {k}: {len(v)}")
print('\nNereden geldi (açılış):')
for k, v in collections.Counter(r['kaynak'] or 'doğrudan / bilinmiyor' for r in ac).most_common(): print(f"  {k}: {v}")
