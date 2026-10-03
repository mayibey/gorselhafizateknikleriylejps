# Kesik madde metinlerinin tamamlanmışlarını işler (scratchpad/denetim/kesik/tam_metinler.json):
#  1) gemini_calisma/girdi/resmi_metin/kanun_<id>.json içindeki madde metni değiştirilir (Antigravity + blok girdisi kaynağı)
#  2) arşiv öneki varsa scratchpad/denetim/tam_metin.json'a da yazılır (diğer hazırlayıcılar oradan okur)
#  3) bloğu henüz yazılmamış (ve şu an çalışan bir partide olmayan) mevzuatların blok girdisi yeniden üretilir
#   python scratchpad/denetim/kesik_uygula.py [--calisan 52,122,143]
import json, sys, os, re, glob, subprocess
sys.stdout.reconfigure(encoding='utf-8')
KOK = 'D:/GorselHafizaTeknikleriyleJSPS'
T = json.load(open(KOK + '/scratchpad/denetim/kesik/tam_metinler.json', encoding='utf-8'))
L = {x['kanun_id']: x for x in json.load(open(KOK + '/scratchpad/denetim/kesik_liste.json', encoding='utf-8'))}
tam_yol = KOK + '/scratchpad/denetim/tam_metin.json'
tam = json.load(open(tam_yol, encoding='utf-8'))
calisan = set()
if '--calisan' in sys.argv:
    calisan = {int(x) for x in sys.argv[sys.argv.index('--calisan') + 1].split(',') if x}
degisen = {}
for t in T:
    lid, no, metin = int(t['kanun_id']), str(t['no']), t['metin']
    yol = f'{KOK}/gemini_calisma/girdi/resmi_metin/kanun_{lid}.json'
    if not os.path.exists(yol): continue
    d = json.load(open(yol, encoding='utf-8'))
    for m in d['maddeler']:
        if m['no'] == no:
            eski = m['metin']
            bas_eski = re.sub(r'\W+', '', eski[:120]).lower()[:60]
            bas_yeni = re.sub(r'\W+', '', metin[:400]).lower()
            if len(metin) <= len(eski) or bas_eski[:40] not in bas_yeni:
                print('  ATLA (kısa ya da başı uyuşmuyor):', lid, no, len(eski), '→', len(metin)); break
            m['metin'] = metin
            degisen.setdefault(lid, []).append(no)
            onek = (L.get(lid) or {}).get('arsiv_oneki')
            if onek: tam[f'{onek} m.{no}'] = metin
            break
    json.dump(d, open(yol, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
json.dump(tam, open(tam_yol, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
biten = {int(re.search(r'kanun_(\d+)', f).group(1)) for f in glob.glob(KOK + '/scratchpad/denetim/blok/sonuc/kanun_*.json')}
yenile = [l for l in degisen if l not in biten and l not in calisan]
print('tamamlanan madde:', sum(len(v) for v in degisen.values()), '| mevzuat:', len(degisen))
print('blok girdisi yenilenecek (bloğu yazılmamış, çalışan partide değil):', yenile)
if yenile:
    subprocess.run([sys.executable, KOK + '/scratchpad/denetim/blok/hazirla.py'] + [str(x) for x in yenile], check=True, capture_output=True)
    print('yenilendi')
print('bloğu ZATEN yazılmış olanlar (tam metinle yeniden yazılabilir):', sorted(l for l in degisen if l in biten))
