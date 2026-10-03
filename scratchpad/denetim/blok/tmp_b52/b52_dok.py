# b52_dok.py — girdi JSON'unu madde madde okunur metne döker (yalnız okuma amaçlı)
import json, sys, os
sys.stdout.reconfigure(encoding='utf-8')
KOK = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..', '..'))
lid = sys.argv[1]
G = json.load(open(os.path.join(KOK, 'scratchpad', 'denetim', 'blok', 'girdi', f'kanun_{lid}.json'), encoding='utf-8'))
out = os.path.join(os.path.dirname(os.path.abspath(__file__)), f'b52_dok_{lid}.txt')
with open(out, 'w', encoding='utf-8') as f:
    f.write(f"AD: {G['ad']}\nGRUP: {G.get('grup')}\nBRANSLAR: {G.get('branslar')}\nKAPSAM: {G['kapsam']}\n")
    f.write(f"TUM: {G['tum_madde_nolari']}\n")
    f.write(f"NOT: {G['nasil_soruluyor_notu']}\n")
    f.write("DIGER KISA:\n")
    for k, v in G['diger_maddeler_kisa'].items():
        f.write(f"  [{k}] {v}\n")
    for m in G['maddeler']:
        f.write("\n" + "=" * 100 + "\n")
        f.write(f"MADDE {m['no']}  (soru_sayisi={m['soru_sayisi']})  karis_aday={m.get('karistirilan_adaylari')}\n")
        f.write("-" * 40 + " RESMI METIN (" + str(len(m['resmi_metin'])) + " kr)\n")
        f.write(m['resmi_metin'] + "\n")
        f.write("-" * 40 + " KARTLAR\n")
        for k in m['kartlar']:
            f.write(json.dumps(k, ensure_ascii=False, indent=1) + "\n")
        f.write("-" * 40 + " TABLO\n")
        for t in m.get('tablo_satirlari') or []:
            f.write(json.dumps(t, ensure_ascii=False) + "\n")
        f.write("-" * 40 + " ORNEK SORULAR\n")
        for s in m['ornek_sorular']:
            f.write(json.dumps(s, ensure_ascii=False, indent=1) + "\n")
print(out)
