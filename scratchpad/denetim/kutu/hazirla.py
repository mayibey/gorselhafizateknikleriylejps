# KIRMIZI KUTU TEMİZLİĞİ: "Sınavda böyle yazarlar" kutusunda yanlış cümle yerine açıklama ("… denir", "… eklenir") gösteren kartlar.
# yz (sinavda_boyle_yazarlar) düzeltmesi almamış her kart → ajan girdisi (kanun başına) + partiler.
#   python scratchpad/denetim/kutu/hazirla.py
import json, os, re, sys, glob, collections
sys.stdout.reconfigure(encoding='utf-8')
KOK = 'D:/GorselHafizaTeknikleriyleJSPS'
B = KOK + '/scratchpad/denetim/kutu'
C = 'C:/Users/GIGABYTE/AppData/Local/Temp/claude/D--GorselHafizaTeknikleriyleJSPS/1cb33cb3-f233-47d5-9f06-b8d257742241/scratchpad/calisma/'
os.makedirs(B + '/girdi', exist_ok=True); os.makedirs(B + '/sonuc', exist_ok=True)
KAP = json.load(open(KOK + '/gemini_calisma/girdi/kapsam.json', encoding='utf-8'))

kayit = {}
for f in sorted(glob.glob(C + 'veri2-*.json')):
    for k in json.load(open(f, encoding='utf-8'))['kanun']:
        if k['id'] not in kayit or len(k['n']) > len(kayit[k['id']]['n']): kayit[k['id']] = k

def tzm(z):
    if z.get('m'): return z['m'][0]
    m = re.search(r'\((\d+)(?:/[^)]*)?\)\s*$', str(z.get('d', '')))
    return m.group(1) if m else ''

PARTI = []
for lid, k in kayit.items():
    r = json.load(open(f'{KOK}/gemini_calisma/girdi/resmi_metin/kanun_{lid}.json', encoding='utf-8'))
    metin = {x['no']: x['metin'] for x in r['maddeler']}
    kartlar = []
    for n in k['n']:
        if n.get('yz'): continue
        mm = n['m'] or []
        kartlar.append({'id': n['i'], 'madde': mm, 'baslik': n['b'], 'hukum': n['h'],
                        'tuzak_satiri': n.get('t', ''), 'mevcut_dogrusu': n.get('dg') or [],
                        'ayni_maddenin_tuzaklari': [{'yanlis': z['y'], 'dogru': z['d']} for z in k['tz'] if mm and tzm(z) == mm[0]][:6],
                        'resmi_metin': {m: metin.get(m, '') for m in mm[:3]}})
    if not kartlar: continue
    giris = {'kanun_id': lid, 'ad': k['ad'], 'kart_sayisi': len(kartlar), 'kartlar': kartlar}
    yol = f'{B}/girdi/kanun_{lid}.json'
    json.dump(giris, open(yol, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    mv = KAP['mevzuatlar'][str(lid)]
    oncelik = (0 if mv['grup'] == 'müşterek' else 1, 0 if 'jandarma' in mv['branslar'] else 1, -len(mv['branslar']))
    PARTI.append((oncelik, lid, os.path.getsize(yol), len(kartlar)))

PARTI.sort()
partiler, cur, cur_n, cur_g = [], [], 0, None
for onc, lid, boy, n in PARTI:
    if cur and (cur_n + n > 140 or onc[0] != cur_g):
        partiler.append(cur); cur, cur_n = [], 0
    cur.append(lid); cur_n += n; cur_g = onc[0]
if cur: partiler.append(cur)
bilgi = {lid: (n, boy) for _, lid, boy, n in PARTI}
json.dump(partiler, open(B + '/partiler.json', 'w', encoding='utf-8'))
for i, p in enumerate(partiler, 1):
    print(f'parti {i:2d}: {len(p):2d} mevzuat · {sum(bilgi[l][0] for l in p):4d} kart · {sum(bilgi[l][1] for l in p)//1000:4d} KB · {p}')
print('toplam', len(partiler), 'parti ·', sum(b[0] for b in bilgi.values()), 'kart')
