# Kelime → cevap dosyası yazıcı (ortak). Kanıt resmî metinden [baş ... son] arası aynen kesilir.
import json, sys, re
sys.stdout.reconfigure(encoding='utf-8')
KOK = 'D:/GorselHafizaTeknikleriyleJSPS/gemini_calisma'

def yaz(LID, AD, K):
    """K satırı: (madde, tip, kelime, cevap, kanıt_baş, kanıt_son, [(karıştırılan madde, fark), ...], not)
    kelime: soruda görülecek kilit kelime (kanıtta AYNEN geçer) · not: isteğe bağlı, kısa (page'de 'karıştırma' sütunu)"""
    R = json.load(open(f'{KOK}/girdi/resmi_metin/kanun_{LID}.json', encoding='utf-8'))
    MT = {m['no']: m['metin'] for m in R['maddeler']}
    out = {'id': LID, 'ad': AD, 'kodlar': []}
    for n, satir in enumerate(K, 1):
        m, tip, kel, cev, b, s, kar, nt = (list(satir) + [[], ''])[:8] if len(satir) < 8 else satir
        t = MT[m]
        try:
            i = t.index(b); j = t.index(s, i) + len(s)
        except ValueError:
            print(f'KANIT BULUNAMADI m.{m}: {b!r} … {s!r}'); continue
        out['kodlar'].append({'i': f'K-{LID}-{n:03d}', 'madde': m, 'tip': tip, 'tetikleyici': kel, 'cevap': cev,
                              'kanit': t[i:j], 'not': nt,
                              'karistirilan': [{'madde': x, 'fark': f} for x, f in kar]})
    json.dump(out, open(f'{KOK}/kodlama_secme/kanun_{LID}.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(LID, AD, '→', len(out['kodlar']), 'satır')
