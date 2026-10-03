# Biten ajan çıktılarını denetleyip yayına hazırlar (sonra: hepsini_kur → test → yukle_sayfalar.sh)
#   python scratchpad/denetim/yayina_al.py
# 1) madde blokları: scratchpad/denetim/blok/sonuc/kanun_<id>.json  (blok_denetle HATA 0) → scripts/harekat-masasi/madde_bloklari/
# 2) kırmızı kutu  : scratchpad/denetim/kutu/sonuc/kanun_<id>.json  (kutu_denetle HATA 0) → duzeltmeler.json (aynı kartın eski
#    kirmizi_kutu kaydı varsa yenisi yerine geçer; dosya sonuna eklenir → önceki düzeltmeleri ezer)
import json, os, sys, glob, shutil, re
sys.stdout.reconfigure(encoding='utf-8')
KOK = 'D:/GorselHafizaTeknikleriyleJSPS'
sys.path.insert(0, KOK + '/scripts/harekat-masasi')
import blok_denetle, kutu_denetle

hedef = KOK + '/scripts/harekat-masasi/madde_bloklari'; os.makedirs(hedef, exist_ok=True)
gecen_b, kalan_b, celiski = [], [], []
for y in sorted(glob.glob(KOK + '/scratchpad/denetim/blok/sonuc/kanun_*.json')):
    h, u, n = blok_denetle.denetle(y)
    lid = int(re.search(r'kanun_(\d+)', y).group(1))
    if h: kalan_b.append((lid, len(h), h[0][:90])); continue
    shutil.copy(y, f'{hedef}/kanun_{lid}.json'); gecen_b.append(lid)
    for b in json.load(open(y, encoding='utf-8')):
        for c in re.findall(r'KART_CELISKI:[^|]*', str(b.get('kontrol', ''))): celiski.append((lid, b.get('madde'), c.strip()[:200]))

duz_yol = KOK + '/scripts/harekat-masasi/duzeltmeler.json'
D = json.load(open(duz_yol, encoding='utf-8'))
gecen_k, kalan_k, yeni = [], [], []
for y in sorted(glob.glob(KOK + '/scratchpad/denetim/kutu/sonuc/kanun_*.json')):
    h, u, n = kutu_denetle.denetle(y)
    lid = int(re.search(r'kanun_(\d+)', y).group(1))
    if h: kalan_k.append((lid, len(h), h[0][:90])); continue
    for x in json.load(open(y, encoding='utf-8')):
        if 'atla' in x: continue
        yeni.append(x)
        if 'KART_CELISKI' in str(x.get('aciklama', '')): celiski.append((lid, x['kart_id'], str(x['aciklama'])[:200]))
    gecen_k.append(lid)
# 3) KART ÇELİŞKİ düzeltmeleri (scratchpad/denetim/celiski/sonuc.json): resmî metne göre hüküm/madde düzeltmesi → HER ZAMAN EN SON.
#    Hükmü düzeltilen kartta kırmızı kutu ajanının (eski, yanlış hükme göre yazdığı) kutuları devreden çıkar.
#    (3 Eki: 14-16'da kırmızı kutu ajanı yanlış hükme güvenip "banka teminat mektubu e-imzayla yapılamaz" yazmıştı.)
celiski = []
cy = KOK + '/scratchpad/denetim/celiski/sonuc.json'
if os.path.exists(cy):
    for x in json.load(open(cy, encoding='utf-8')):
        dz = x.get('duzeltme') or {}
        if not x.get('kart_id') or not dz: continue
        if ('sinavda_boyle_yazarlar' in dz) != ('dogrusu' in dz) or len(dz.get('sinavda_boyle_yazarlar') or []) != len(dz.get('dogrusu') or []):
            print('   çelişki kaydı atlandı (kutu sayıları uyuşmuyor):', x.get('kart_id')); continue
        celiski.append(dict(x, _kaynak='celiski'))
hukum_degisen = {(x['kanun_id'], x['kart_id']) for x in celiski if 'hukum' in x['duzeltme']}
yeni = [x for x in yeni if (x['kanun_id'], x['kart_id']) not in hukum_degisen]
if yeni or celiski:
    anahtar = {(x['kanun_id'], x['kart_id']) for x in yeni}
    D = [x for x in D if x.get('_kaynak') != 'celiski'
         and not (x.get('sorun') == 'kirmizi_kutu' and ((x.get('kanun_id'), x.get('kart_id')) in anahtar or (x.get('kanun_id'), x.get('kart_id')) in hukum_degisen))]
    D = D + yeni + celiski
    json.dump(D, open(duz_yol, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(f'kart çelişki : {len(celiski)} düzeltme (en son uygulanır; hükmü değişen {len(hukum_degisen)} kartta kırmızı kutu sonucu devre dışı)')

print(f'madde blokları: {len(gecen_b)} kanun yayına hazır {gecen_b}')
for x in kalan_b: print('   bekliyor (hata):', x)
print(f'kırmızı kutu : {len(gecen_k)} kanun, {len(yeni)} kart düzeltmesi duzeltmeler.json\'da {gecen_k}')
for x in kalan_k: print('   bekliyor (hata):', x)
json.dump(celiski, open(KOK + '/scratchpad/denetim/kart_celiski.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(f'KART_CELISKI: {len(celiski)} (scratchpad/denetim/kart_celiski.json)')
