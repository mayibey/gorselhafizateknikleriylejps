# k4 son kontrol: kart sayisi, tirnak bicimi, yasak kelime, ayni sayida dogrusu, KART_CELISKI var mi
import json, sys
sys.stdout.reconfigure(encoding='utf-8')
B = 'D:/GorselHafizaTeknikleriyleJSPS/scratchpad/denetim/kutu'
for lid in (14, 15, 16):
    G = json.load(open(f'{B}/girdi/kanun_{lid}.json', encoding='utf-8'))
    D = json.load(open(f'{B}/sonuc/kanun_{lid}.json', encoding='utf-8'))
    gid = [k['id'] for k in G['kartlar']]
    did = [x['kart_id'] for x in D]
    sorun = []
    if gid != did: sorun.append('kart sirasi/sayisi farkli')
    n_yz = 0
    for x in D:
        dz = x.get('duzeltme', {})
        yz, dg = dz.get('sinavda_boyle_yazarlar', []), dz.get('dogrusu', [])
        n_yz += len(yz)
        if len(yz) != len(dg): sorun.append(f"{x['kart_id']}: sayi farki")
        for y in yz:
            if not (y.startswith('“') and y.endswith('”')): sorun.append(f"{x['kart_id']}: tirnak yok: {y[:40]}")
        for d in dg:
            if d.startswith('“'): sorun.append(f"{x['kart_id']}: dogrusu tirnakli")
        if 'kaçırdığın' in json.dumps(x, ensure_ascii=False).lower(): sorun.append(f"{x['kart_id']}: yasak kelime")
        if 'KART_CELISKI' in x.get('aciklama', '') or 'hukum' in dz: sorun.append(f"{x['kart_id']}: KART_CELISKI")
    print(f'kanun_{lid}: girdi {len(gid)} kart, sonuc {len(did)} kayit, {n_yz} yanlis cumle; sorun: {sorun or "yok"}')
