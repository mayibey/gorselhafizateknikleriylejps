# Yalnız okuma: sonuç dosyalarındaki yanlış/doğru çiftlerini ve kelime sayılarını listeler.
import json, sys, re
sys.stdout.reconfigure(encoding='utf-8')
for lid in sys.argv[1:]:
    D = json.load(open(f'D:/GorselHafizaTeknikleriyleJSPS/scratchpad/denetim/kutu/sonuc/kanun_{lid}.json', encoding='utf-8'))
    for x in D:
        dz = x['duzeltme']
        print(f"[{x['kart_id']}]" + ('  *HUKUM*' if 'hukum' in dz else ''))
        for y, d in zip(dz['sinavda_boyle_yazarlar'], dz['dogrusu']):
            g = re.sub(r'\s*\([^()]*m\.[^()]*\)\s*\.?\s*$', '', d)
            print('   Y:', y)
            print(f'   D({len(g.split())}):', d)
