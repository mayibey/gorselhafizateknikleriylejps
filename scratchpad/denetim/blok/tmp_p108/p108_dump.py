import json, sys, os
sys.stdout.reconfigure(encoding='utf-8')
B = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
lid = sys.argv[1]
d = json.load(open(os.path.join(B, 'girdi', f'kanun_{lid}.json'), encoding='utf-8'))
out = []
out.append(f"### {d['ad']} | tum: {','.join(d['tum_madde_nolari'])}")
out.append('NOT: ' + d['nasil_soruluyor_notu'])
out.append('DIGER: ' + ' || '.join(f"{k}: {v}" for k, v in d['diger_maddeler_kisa'].items()))
for m in d['maddeler']:
    out.append(f"\n===== m.{m['no']}  (soru {m['soru_sayisi']})")
    out.append('METIN: ' + m['resmi_metin'])
    for k in m['kartlar']:
        out.append(f"  KART {k['id']} [{k.get('baslik','')}]: {k['hukum']} | YANLIS: {' / '.join(k.get('sinavda_boyle_yazarlar') or [])} | DOGRU: {' / '.join(k.get('dogrusu') or [])}")
    for q in m['ornek_sorular'][:4]:
        out.append(f"  SORU: {q['kok']} || {' | '.join(q['siklar'])} => {q['dogru']}")
    if m['tablo_satirlari']:
        out.append('  TABLO: ' + json.dumps(m['tablo_satirlari'], ensure_ascii=False))
    if m['karistirilan_adaylari']:
        out.append('  KARIS: ' + ', '.join(f"{x['madde']}({x['kac_celdiricide']})" for x in m['karistirilan_adaylari']))
open(os.path.join(B, 'tmp_p108', f'p108_k{lid}.txt'), 'w', encoding='utf-8').write('\n'.join(out))
print(len('\n'.join(out)))
