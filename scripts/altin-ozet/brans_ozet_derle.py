# Branş Altın Özet dosyasını DERLER: var olan bölümleri (diğer branş/müşterek dosyalarından) kopyalar,
# olmayanları icerik/_yeni/<law_id>.md'den alır → icerik/ozet_<STEM>.md
#   python brans_ozet_derle.py <slug> <STEM>      örn: brans_ozet_derle.py saglik S_saglik
# Kanun sırası: brans_kitaplari.json (sira); orada olmayan bağlı kanunlar sona.
import os, re, sys, json
sys.stdout.reconfigure(encoding='utf-8')
BURA = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(BURA, '..', 'harekat-masasi'))
import veri_uret as V  # kanun listesi + bölüm eşleştirici (aynı mantık: Merkez ile kitap aynı bölümü kullansın)
slug, stem = sys.argv[1], sys.argv[2]
kit = [k for k in json.load(open(os.path.join(BURA, 'brans_kitaplari.json'), encoding='utf-8')) if k['brans_slug'] == slug]
sira = [k['law_id'] for k in sorted(kit, key=lambda x: x['sira'])]
for l in V.brans_kanunlari(slug):
    if l not in sira: sira.append(l)
YENI = os.path.join(BURA, 'icerik', '_yeni')
parcalar = []; eksik = []; kaynak = []
for lid in sira:
    yeni = os.path.join(YENI, f'{lid}.md')
    if os.path.exists(yeni):
        t = open(yeni, encoding='utf-8').read().strip()
        if not t.startswith('## '): print('UYARI: _yeni dosyası "## " ile başlamıyor:', lid)
        parcalar.append(t); kaynak.append((lid, '_yeni')); continue
    b = V.bul(lid, V.TUM_DOSYA)
    if not b: eksik.append((lid, V.LAWS[lid][:50])); continue
    bas, govde = b
    govde = re.sub(r'\n+-{3,}\s*$', '', govde).strip()
    parcalar.append(f'## {bas}\n\n{govde}'); kaynak.append((lid, bas[:40]))
cikti = os.path.join(BURA, 'icerik', f'ozet_{stem}.md')
open(cikti, 'w', encoding='utf-8').write('\n\n---\n\n'.join(parcalar) + '\n')
print(f'{slug}: {len(parcalar)} bölüm → {os.path.basename(cikti)}')
for k in kaynak: print('  ', k[0], '←', k[1])
if eksik: print('  EKSİK (bölümü yok):', eksik)
