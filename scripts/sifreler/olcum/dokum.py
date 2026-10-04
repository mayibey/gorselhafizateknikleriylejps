# rapor.json + şifreler → elle inceleme dökümü (soru, şıklar, kesin vuruşlar, en yakın 4 aday şifre)
import json, re, glob, os, sys
sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from olc import SIF, tok, esit, norm, RAPOR  # olc.py çalışınca RAPOR hesaplanır
BURA = os.path.dirname(os.path.abspath(__file__))

def puan(row, q):
    qt = tok(q['kok']) + tok(q['sec'].get(q['d'], ''))
    rt = tok(row['kel']) + tok(row['cev'])
    kt = tok(row['kanit'])
    p = 0.0
    for a in set(rt):
        if any(esit(a, b) for b in qt): p += 1
    for a in set(kt):
        if any(esit(a, b) for b in qt): p += 0.25
    return p

for sinav in sorted(set(r['sinav'] for r in RAPOR), key=lambda s: ['Subay', 'Astsubay', 'Uzman'].index(s.split()[0])):
    L = [f'# {sinav} — şifre uygulaması\n']
    for r in [x for x in RAPOR if x['sinav'] == sinav]:
        L.append(f"## #{r['no']} · kanun {r['lid'] or '?'} · doğru {r['d']} · {'OLUMSUZ SORU · ' if r['neg'] else ''}otomatik: {r['durum']}")
        L.append(r['kok'].replace('\n', ' / '))
        for h, v in r['sec'].items():
            L.append(f"  {'*' if h == r['d'] else ' '}{h}) {v}")
        vur = r['kok_vurus'] + r['sik_vurus'] + r['diger_kanun_vurus']
        if vur:
            L.append('  KESİN VURUŞ:')
            for v in vur:
                L.append(f"   - [{v['i']} m.{v['m']} {v['yer']}] {v['kel']} → {v['cev']}  | tahmin {v['tahmin']} puan {v['puan']}")
        adaylar = sorted(SIF, key=lambda s: -puan(s, r))[:4]
        L.append('  EN YAKIN ŞİFRELER:')
        for s in adaylar:
            L.append(f"   - ({puan(s, r):.2f}) [{s['i']} k{s['lid']} m.{s['m']}] {s['kel']} → {s['cev']}")
        L.append('')
    ad = sinav.split()[0].lower().replace('ş', 's').replace('ı', 'i')
    open(f'{BURA}/dokum_{ad}.md', 'w', encoding='utf-8').write('\n'.join(L))
    print('yazıldı', f'dokum_{ad}.md', len(L), 'satır')
