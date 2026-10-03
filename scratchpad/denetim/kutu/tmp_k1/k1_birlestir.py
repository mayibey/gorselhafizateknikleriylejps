# Yardimci: tmp_k1/k1_l<id>_*.json parcalarini girdideki kart sirasina gore birlestirip sonuc/kanun_<id>.json yazar.
#   python k1_birlestir.py <kanun_id>
import json, sys, glob, os
sys.stdout.reconfigure(encoding='utf-8')
B = 'D:/GorselHafizaTeknikleriyleJSPS/scratchpad/denetim/kutu'
lid = int(sys.argv[1])
G = json.load(open(f'{B}/girdi/kanun_{lid}.json', encoding='utf-8'))
sira = [k['id'] for k in G['kartlar']]
kayit = {}
for f in sorted(glob.glob(f'{B}/tmp_k1/k1_l{lid}_*.json')):
    for x in json.load(open(f, encoding='utf-8')):
        if x['kart_id'] in kayit:
            print('IKI KEZ:', x['kart_id'], os.path.basename(f))
        kayit[x['kart_id']] = x
eksik = [i for i in sira if i not in kayit]
fazla = [i for i in kayit if i not in sira]
print('kart:', len(sira), '| kayit:', len(kayit), '| eksik:', eksik, '| fazla:', fazla)
if eksik or fazla:
    sys.exit(1)
cikti = [kayit[i] for i in sira]
json.dump(cikti, open(f'{B}/sonuc/kanun_{lid}.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('yazildi:', f'sonuc/kanun_{lid}.json')
