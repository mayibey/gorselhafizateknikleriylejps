# p72_dump.py — girdi JSON'unu okunur metne döker (yalnız okuma; tmp_p72 içine yazar)
import json, os, sys
sys.stdout.reconfigure(encoding='utf-8')
KOK = r'D:\GorselHafizaTeknikleriyleJSPS'
GIRDI = os.path.join(KOK, 'scratchpad', 'denetim', 'blok', 'girdi')
CIKTI = os.path.join(KOK, 'scratchpad', 'denetim', 'blok', 'tmp_p72')

def dok(lid, sadece=None):
    G = json.load(open(os.path.join(GIRDI, f'kanun_{lid}.json'), encoding='utf-8'))
    satir = []
    satir.append(f"### {G['ad']} (id {lid}) kapsam={G['kapsam']} branslar={G.get('branslar')}")
    satir.append(f"tum_madde_nolari: {G['tum_madde_nolari']}")
    satir.append(f"NASIL SORULUYOR: {G['nasil_soruluyor_notu']}")
    satir.append('')
    for m in G['maddeler']:
        if sadece and m['no'] not in sadece:
            continue
        satir.append('=' * 100)
        satir.append(f"MADDE {m['no']}  (soru_sayisi={m['soru_sayisi']})")
        satir.append('RESMI: ' + m['resmi_metin'])
        satir.append('')
        for k in m['kartlar']:
            satir.append(f"  KART {k['id']} [{k.get('baslik')}]")
            satir.append(f"    HUKUM: {k['hukum']}")
            for s in k.get('sinavda_boyle_yazarlar') or []:
                satir.append(f"    YANLIS: {s}")
            for s in k.get('dogrusu') or []:
                satir.append(f"    DOGRU: {s}")
            ek = {a: b for a, b in k.items() if a not in ('id', 'baslik', 'hukum', 'sinavda_boyle_yazarlar', 'dogrusu')}
            if ek:
                satir.append(f"    EK: {json.dumps(ek, ensure_ascii=False)}")
        if m.get('tablo_satirlari'):
            satir.append('  TABLO:')
            for t in m['tablo_satirlari']:
                satir.append('    ' + json.dumps(t, ensure_ascii=False))
        if m.get('karistirilan_adaylari'):
            satir.append('  KARIS_ADAY: ' + json.dumps(m['karistirilan_adaylari'], ensure_ascii=False))
        for i, q in enumerate(m.get('ornek_sorular') or []):
            satir.append(f"  SORU {i+1}: {q['kok']}")
            for s in q['siklar']:
                isaret = '*' if s == q['dogru'] else ' '
                satir.append(f"     {isaret} {s}")
            if q['dogru'] not in q['siklar']:
                satir.append(f"     DOGRU(ayri): {q['dogru']}")
        satir.append('')
    return '\n'.join(satir), G

if __name__ == '__main__':
    lid = int(sys.argv[1])
    metin, G = dok(lid)
    yol = os.path.join(CIKTI, f'p72_dump_{lid}.txt')
    open(yol, 'w', encoding='utf-8').write(metin)
    # diğer maddeler kısa
    dk = G.get('diger_maddeler_kisa') or {}
    yol2 = os.path.join(CIKTI, f'p72_diger_{lid}.txt')
    open(yol2, 'w', encoding='utf-8').write('\n'.join(f'{a}: {b}' for a, b in dk.items()))
    print(yol, len(metin), 'karakter;', yol2, len(dk), 'madde')
