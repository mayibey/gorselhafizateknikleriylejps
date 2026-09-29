# Harekât Merkezi veri üretici — TÜM BRANŞLAR (başkan, 30 Eyl: "tüm branşları o şekilde yapman lazım")
#   python veri_uret.py <brans_slug> <cikti_veri.json>
# Kaynaklar (uygulamanın kendi verisi; ayrı içerik ÜRETİLMEZ):
#   kanun listesi  : src/db/seed.ts (1-25 müşterek, 26-67 jandarma) + seed-brans-diger.ts (diğer branş bağları)
#   sorular        : src/assets/kart-sorulari.ts (law_id → sorular, id korunur) + premium-denemeler.ts (P<index>)
#   Altın Özet     : scripts/altin-ozet/icerik/ozet_*.md (## kanun bölümü; önce branşın kendi dosyası, sonra hepsi)
# Çıktı: {brans:{slug,ad}, kanun:[{id,ad,kap,g,md,q,yildiz}], ek:{}} — nokta_ayristir.py bunun üstüne n/sayi/makam/tz ekler.
# Kimlikler kaynaklardan deterministik → müşterek+MEBS için eski veri.json ile BİREBİR aynı (ilerleme bozulmaz).
import json, re, sys, os, glob
sys.stdout.reconfigure(encoding='utf-8')
KOK = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))

seed = open(os.path.join(KOK, 'src/db/seed.ts'), encoding='utf-8').read()
diger = open(os.path.join(KOK, 'src/db/seed-brans-diger.ts'), encoding='utf-8').read()
LAWS = {}
for m in re.finditer(r"\{ id: (\d+), blok: '([^']+)', ad: (['\"])((?:\\.|(?!\3).)*)\3", seed + diger):
    LAWS[int(m.group(1))] = m.group(4).replace("\\'", "'").replace('\\"', '"')
BRANS_AD = {m.group(1): m.group(2) for m in re.finditer(r"slug: '([^']+)', ad: '([^']+)'", seed)}
BR_ID = {m.group(2): int(m.group(1)) for m in re.finditer(r"\{ id: (\d+), slug: '([^']+)'", seed)}  # slug → branch_id
def brans_kanunlari(slug):
    if slug not in BRANS_AD: sys.exit(f'branş yok: {slug} (olanlar: {", ".join(BRANS_AD)})')
    bid = BR_ID[slug]
    if slug == 'jandarma': return list(range(26, 68))
    return [int(a) for a, b in re.findall(r"\{ law_id: (\d+), branch_id: (\d+) \}", diger) if int(b) == bid]
mus_laws = [i for i in sorted(LAWS) if i <= 25]

# sorular
ks = open(os.path.join(KOK, 'src/assets/kart-sorulari.ts'), encoding='utf-8').read()
a = ks.index('KART_SORULARI: Record<number, KartSoru[]> = ') + len('KART_SORULARI: Record<number, KartSoru[]> = ')
b = ks.rindex('};') + 1
txt = re.sub(r'^  (\d+): \[', r'  "\1": [', ks[a:b], flags=re.M); txt = re.sub(r',(\s*[\]}])', r'\1', txt)
KS = json.loads(txt)
pd = open(os.path.join(KOK, 'src/assets/premium-denemeler.ts'), encoding='utf-8').read()
a = pd.index('PREMIUM_SORULAR: PremiumSoruHam[] = ') + len('PREMIUM_SORULAR: PremiumSoruHam[] = '); b = pd.index('];', a) + 1
P = json.loads(pd[a:b])
def sorular(lid):
    out = [{'i': q['id'], 'k': q['soru'], 's': q['siklar'], 'd': q['dogru'], 'a': q['aciklama'], 'y': q['kaynak'], 'z': q.get('zorluk', 'orta')} for q in KS.get(str(lid), [])]
    out += [{'i': f'P{i}', 'k': p['k'], 's': p['s'], 'd': p['d'], 'a': p['a'], 'y': p['y'], 'z': 'orta'} for i, p in enumerate(P) if p['l'] == lid]
    return out

# Altın Özet bölümleri
IC = os.path.join(KOK, 'scripts/altin-ozet/icerik')
OWN = {'jandarma': 'ozet_J_jandarma.md', 'maliye': 'ozet_M_maliye.md', 'bakim': 'ozet_B_bakim.md', 'ikmal': 'ozet_I_ikmal.md',
       'istihkam': 'ozet_IS_istihkam.md', 'personel': 'ozet_P_personel.md', 'havacilik': 'ozet_E_havacilik.md', 'mebs': 'ozet_D.md'}
MUS = ['ozet_A.md', 'ozet_B.md', 'ozet_C.md', 'ozet_D.md']
def bolumler(dosya):
    yol = os.path.join(IC, dosya)
    if not os.path.exists(yol): return []
    t = open(yol, encoding='utf-8').read()
    parcalar = re.split(r'(?m)^## ', t)[1:]
    out = []
    for p in parcalar:
        bas, _, govde = p.partition('\n')
        out.append((bas.strip(), govde.strip()))
    return out
TUM_DOSYA = sorted(f for f in os.listdir(IC) if f.startswith('ozet_') and f.endswith('.md') and '_sade' not in f)
BOL = {f: bolumler(f) for f in TUM_DOSYA}
def norm(s): return re.sub(r'[^a-z0-9]', '', s.lower().replace('ı', 'i').replace('ş', 's').replace('ğ', 'g').replace('ü', 'u').replace('ö', 'o').replace('ç', 'c').replace('î', 'i').replace('â', 'a').replace('û', 'u'))
from difflib import SequenceMatcher
def sayilar(s): return set(re.findall(r'\d{2,5}(?:/\d+)?', s))
KISALTMA = {'TSK': 'Türk Silahlı Kuvvetleri', 'MİT': 'Millî İstihbarat Teşkilatı', 'EGM': 'Emniyet Genel Müdürlüğü',
            'JGK': 'Jandarma Genel Komutanlığı', 'SGK': 'Sahil Güvenlik Komutanlığı', 'CBDDO': 'Cumhurbaşkanlığı Dijital Dönüşüm Ofisi',
            'KHK': 'Kanun Hükmünde Kararname'}
def acik(s):
    for k, v in KISALTMA.items(): s = re.sub(r'(?<![A-Za-zÇĞİÖŞÜçğıöşü])' + k + r'(?![A-Za-zÇĞİÖŞÜçğıöşü])', v, s)
    return s
def bul(lid, sira):
    """Kanunun Altın Özet bölümü: tüm dosyalarda en iyi ad benzerliği (branşın kendi dosyasına küçük bonus).
    Kanun numarası ikisinde de varsa tutmalı; numara yoksa ad benzerliği yüksek olmalı; mevzuat türü uyuşmalı."""
    ad = re.sub(r'\(.*?\)', '', LAWS[lid]).strip(); nad = norm(ad); nums = sayilar(ad)
    # mevzuat türü grubu: yönetmelik/usul-esas/tebliğ aynı aile; kanun / genelge / rehber ayrı
    GRUP = {'yonetmeli': 'y', 'esaslar': 'y', 'teblig': 'y', 'genelge': 'g', 'rehber': 'r', 'kanun': 'k'}
    tur = lambda s: next((GRUP[t] for t in ('yonetmeli', 'esaslar', 'teblig', 'genelge', 'rehber', 'kanun') if t in norm(s)), '')
    aday = []
    for fi, f in enumerate(dict.fromkeys(sira)):
        for bas, govde in BOL.get(f, []):
            baslik = bas.split('—')[0]; hb = baslik.lower().replace('ı', 'i')
            if 'jandarma branş' in hb and lid != 67: continue
            if lid == 67 and 'jandarma branş' not in hb: continue
            if 'müşterek kapsam' in hb and lid > 25: continue        # müşterek TCK notu branş dilimine verilmez
            hn = sayilar(baslik)
            if nums and hn and not (nums & hn): continue          # ikisinde de numara var ama farklı
            oran = SequenceMatcher(None, nad, norm(acik(baslik))).ratio()
            if tur(ad) != tur(baslik): oran -= 0.4
            if nums & hn: oran += 0.3
            elif oran < 0.72: continue                            # numara desteği yoksa ad çok benzemeli
            if fi == 0 and len(sira) > 1: oran += 0.15            # branşın kendi dosyası
            aday.append((oran, bas, govde))
    aday.sort(key=lambda x: -x[0])
    if aday and aday[0][0] >= 0.6: return aday[0][1], aday[0][2]
    return None
def tr_baslik(s):
    if not s.isupper(): return s
    k = s.replace('I', 'ı').replace('İ', 'i').lower()
    return ' '.join((w[0].replace('i', 'İ').upper() + w[1:]) if w else w for w in k.split(' '))
def kanun(lid, g, sira):
    b = bul(lid, sira)
    bas, md = b if b else ('', '')
    md = re.sub(r'\n+-{3,}\s*$', '', md).strip()
    kap = ''; ad = tr_baslik(LAWS[lid])
    if bas:
        m = re.search(r'Sınav kapsamı:\s*(.+)$', bas)
        kap = m.group(1).strip() if m else ''
        ad = bas.split('—')[0].strip() or ad      # görünen ad: özet başlığındaki (eski veriyle aynı)
    return {'id': lid, 'ad': ad, 'kap': kap, 'g': g, 'md': md, 'q': sorular(lid), 'yildiz': md.count('★')}

def main(slug, hedef):
    brans_laws = brans_kanunlari(slug)
    K = [kanun(l, 'mus', MUS + TUM_DOSYA) for l in mus_laws]
    own = [OWN[slug]] if slug in OWN else []
    K += [kanun(l, slug, own + TUM_DOSYA) for l in brans_laws]
    V = {'brans': {'slug': slug, 'ad': BRANS_AD[slug]}, 'kanun': K, 'ek': {}}
    json.dump(V, open(hedef, 'w', encoding='utf-8'), ensure_ascii=False)
    ozetsiz = [f"{k['id']} {k['ad'][:40]}" for k in K if not k['md']]
    sorusuz = [k['id'] for k in K if not k['q']]
    print(f"{slug}: kanun {len(K)} (müşterek {len(mus_laws)} + branş {len(brans_laws)}) · soru {sum(len(k['q']) for k in K)} · özetsiz {len(ozetsiz)} · sorusuz {sorusuz or '-'}")
    for o in ozetsiz: print('   özetsiz:', o)

if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
