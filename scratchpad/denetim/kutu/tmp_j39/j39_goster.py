# Yalnız okuma: girdi kartlarını okunur biçimde basar (her maddenin resmî metni yalnız ilk görüldüğünde basılır).
#   python j39_goster.py <kanun_id> [kart_index_bas] [kart_index_son] [--metinsiz]
import json, sys
sys.stdout.reconfigure(encoding='utf-8')
args = [a for a in sys.argv[1:] if not a.startswith('--')]
metinsiz = '--metinsiz' in sys.argv
lid = args[0]
d = json.load(open(f'D:/GorselHafizaTeknikleriyleJSPS/scratchpad/denetim/kutu/girdi/kanun_{lid}.json', encoding='utf-8'))
kartlar = d['kartlar']
bas = int(args[1]) if len(args) > 1 else 0
son = int(args[2]) if len(args) > 2 else len(kartlar) - 1
print('KANUN', d['kanun_id'], d['ad'], 'kart', len(kartlar))
goruldu = {}
for i, k in enumerate(kartlar):
    for m, t in k['resmi_metin'].items():
        if i < bas and m not in goruldu: goruldu[m] = t
for i, k in enumerate(kartlar):
    if i < bas or i > son: continue
    print('=' * 100)
    print(f"[{i}] ID {k['id']}  MADDE {k['madde']}  BASLIK: {k['baslik']}")
    print('HUKUM:', k['hukum'])
    print('TUZAK_SATIRI:', k['tuzak_satiri'])
    print('MEVCUT_DOGRUSU:', json.dumps(k['mevcut_dogrusu'], ensure_ascii=False))
    for z in k['ayni_maddenin_tuzaklari']:
        print('  TZ-Y:', z['yanlis'], ' || TZ-D:', z['dogru'])
    for m, t in k['resmi_metin'].items():
        if metinsiz: continue
        if m in goruldu and goruldu[m] == t:
            print(f'--- RESMI m.{m}: (yukarıda basıldı, {len(t)} kr) ---')
            continue
        goruldu[m] = t
        print(f'--- RESMI m.{m} ({len(t)} kr) ---')
        print(t)
