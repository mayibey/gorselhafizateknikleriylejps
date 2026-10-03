# Ek bicim kontrolu (parti 2): yanlis cumle “ ” icinde mi, dogrusu nokta/atif bicimi, kelime sayilari.
#   python k2_kontrol.py <kanun_id>
import json, sys, re
sys.stdout.reconfigure(encoding='utf-8')
lid = int(sys.argv[1])
D = json.load(open(f'D:/GorselHafizaTeknikleriyleJSPS/scratchpad/denetim/kutu/sonuc/kanun_{lid}.json', encoding='utf-8'))
G = json.load(open(f'D:/GorselHafizaTeknikleriyleJSPS/scratchpad/denetim/kutu/girdi/kanun_{lid}.json', encoding='utf-8'))
sira = [k['id'] for k in G['kartlar']]
print('sira ayni:', [x['kart_id'] for x in D] == sira, '| kayit', len(D), '| girdi', len(sira))
sorun = 0
for x in D:
    if 'atla' in x:
        print('ATLA', x['kart_id'], x['atla']); continue
    yz = x['duzeltme']['sinavda_boyle_yazarlar']; dg = x['duzeltme']['dogrusu']
    for y in yz:
        if not (y.startswith('“') and y.endswith('”')):
            print('TIRNAK', x['kart_id'], y[:60]); sorun += 1
        if '"' in y: print('DUZ TIRNAK', x['kart_id']); sorun += 1
    for d in dg:
        if d.startswith('“') or d.endswith('”'): print('DOGRUSU TIRNAKLI', x['kart_id']); sorun += 1
        if 'kaçırdığın' in d.lower(): print('YASAK', x['kart_id']); sorun += 1
        govde = re.sub(r'\s*\([^()]*m\.[^()]*\)\s*\.?\s*$', '', d)
        if len(govde.split()) > 23: print(f'UZUN({len(govde.split())})', x['kart_id'], d[:70])
print('sorun', sorun)
