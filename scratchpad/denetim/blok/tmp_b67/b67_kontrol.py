# b67 yardımcı: parça dosyalarını GOREV_BLOK.md'deki sıkı sınırlara göre denetler
# (başlık<=6, öz<=70 ve 2-4 cümle, sorulur<=40, akılda<=30, neden<=15 kelime; soru_sayisi 0 ise "Beklenen kalıp:")
#   python b67_kontrol.py b67_parca1.json [b67_parca2.json ...]
import json, os, re, sys
sys.stdout.reconfigure(encoding='utf-8')
BURASI = os.path.dirname(os.path.abspath(__file__))
KOK = os.path.abspath(os.path.join(BURASI, '..', '..', '..', '..'))
G = json.load(open(os.path.join(KOK, 'scratchpad', 'denetim', 'blok', 'girdi', 'kanun_67.json'), encoding='utf-8'))
SORU = {m['no']: m['soru_sayisi'] for m in G['maddeler']}
SINIR = {'baslik': 6, 'oz': 70, 'sorulur': 40, 'akilda': 30, 'neden': 15}

def k(t): return len(str(t).split())
def cumle(t): return len(re.findall(r'(?<!\bm)[.!?](?=\s|$)', str(t)))

toplam = 0
for ad in sys.argv[1:]:
    yol = ad if os.path.isabs(ad) else os.path.join(BURASI, ad)
    B = json.load(open(yol, encoding='utf-8'))
    for b in B:
        m = b['madde']; sorun = []
        if 'atla' in b: continue
        if k(b['baslik']) > SINIR['baslik']: sorun.append(f"başlık {k(b['baslik'])}")
        if k(b['oz']) > SINIR['oz']: sorun.append(f"öz {k(b['oz'])}")
        c = cumle(b['oz'])
        if not 2 <= c <= 4: sorun.append(f"öz cümle {c}")
        for alan in ('sorulur', 'akilda'):
            for i, x in enumerate(b[alan]):
                if k(x) > SINIR[alan]: sorun.append(f"{alan}[{i}] {k(x)}")
        for x in b.get('karis', []):
            if k(x['neden']) > SINIR['neden']: sorun.append(f"neden m.{x['madde']} {k(x['neden'])}")
        if SORU.get(m) == 0 and not b['sorulur'][0].startswith('Beklenen kalıp:'):
            sorun.append('soru_sayisi 0 ama "Beklenen kalıp:" yok')
        if SORU.get(m, 0) > 0 and any(x.startswith('Beklenen kalıp:') for x in b['sorulur']):
            sorun.append('soru var ama "Beklenen kalıp:" yazılmış')
        if 'kaçırd' in json.dumps(b, ensure_ascii=False).lower(): sorun.append('YASAK KELİME')
        toplam += len(sorun)
        durum = ' | '.join(sorun) if sorun else 'tamam'
        print(f"m.{m:>4}: öz {k(b['oz']):>2} kelime/{c} cümle · {durum}")
print('SIKI SORUN', toplam)
