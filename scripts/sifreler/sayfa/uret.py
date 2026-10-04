# Kilit kelime → cevap listesini tek HTML sayfaya gömer (gemini_calisma/kodlama_secme/*.json → sifreler.html)
import json, glob, os, re, sys
sys.stdout.reconfigure(encoding='utf-8')
K = 'D:/GorselHafizaTeknikleriyleJSPS/gemini_calisma'
BURA = os.path.dirname(os.path.abspath(__file__))
kap = json.load(open(f'{K}/girdi/kapsam.json', encoding='utf-8'))['mevzuatlar']
ONCELIK = {'müşterek': 0, 'jandarma': 1, 'mebs': 2, 'havacilik': 3, 'personel': 4}
kanunlar = []
for f in glob.glob(f'{K}/kodlama_secme/kanun_*.json'):
    d = json.load(open(f, encoding='utf-8'))
    lid = int(re.search(r'kanun_(\d+)', f).group(1))
    meta = kap[str(lid)]
    ad = re.sub(r'\s*\((müşterek|jandarma branş) kapsam[ıi]\)', '', meta['ad'])
    grup = 'müşterek' if meta.get('grup') == 'müşterek' else (meta.get('branslar') or ['?'])[0]
    satirlar = [{'m': k['madde'], 'g': k['tetikleyici'], 'c': k['cevap'], 'n': k.get('not', ''), 'k': k['kanit'],
                 'x': [[str(x.get('madde')), x.get('fark', '')] for x in k.get('karistirilan', [])]} for k in d['kodlar']]
    kanunlar.append({'id': lid, 'ad': ad, 'grup': grup, 'satirlar': satirlar})
kanunlar.sort(key=lambda x: (ONCELIK.get(x['grup'], 9), x['id']))
veri = json.dumps(kanunlar, ensure_ascii=False, separators=(',', ':')).replace('</', '<\\/')
sablon = open(f'{BURA}/sablon.html', encoding='utf-8').read()
open(f'{BURA}/sifreler.html', 'w', encoding='utf-8').write(sablon.replace('/*VERI*/[]', veri))
print(len(kanunlar), 'mevzuat ·', sum(len(k['satirlar']) for k in kanunlar), 'satır')
