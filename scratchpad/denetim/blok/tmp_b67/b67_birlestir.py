# b67 yardımcı: tmp_b67/b67_parca*.json dosyalarını girdi sırasına göre birleştirip sonuc/kanun_67.json'a yazar
import json, os, glob, sys
sys.stdout.reconfigure(encoding='utf-8')
BURASI = os.path.dirname(os.path.abspath(__file__))
KOK = os.path.abspath(os.path.join(BURASI, '..', '..', '..', '..'))
G = json.load(open(os.path.join(KOK, 'scratchpad', 'denetim', 'blok', 'girdi', 'kanun_67.json'), encoding='utf-8'))
sira = [m['no'] for m in G['maddeler']]
bloklar = {}
for yol in sorted(glob.glob(os.path.join(BURASI, 'b67_parca*.json'))):
    for b in json.load(open(yol, encoding='utf-8')):
        if b['madde'] in bloklar: sys.exit(f"çift madde: {b['madde']} ({os.path.basename(yol)})")
        bloklar[b['madde']] = b
eksik = [n for n in sira if n not in bloklar]
fazla = [n for n in bloklar if n not in sira]
if eksik or fazla: sys.exit(f'eksik: {eksik} · fazla: {fazla}')
cikti = [bloklar[n] for n in sira]
hedef = os.path.join(KOK, 'scratchpad', 'denetim', 'blok', 'sonuc', 'kanun_67.json')
with open(hedef, 'w', encoding='utf-8') as f:
    json.dump(cikti, f, ensure_ascii=False, indent=1)
    f.write('\n')
print(f'{len(cikti)} blok yazıldı -> {hedef}')
