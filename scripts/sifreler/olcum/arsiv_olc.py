# Şifreleri ELİMİZDEKİ TÜM müşterek sorulara uygular, kapsanmayan soruları (eksikleri) kanun/madde bazında döker.
#   python scripts/sifreler/olcum/arsiv_olc.py <cikti_dir>
# Kaynaklar: gerçek sınav 2026 (scratchpad md, cevaplı) · çıkmış 9 kitapçık (scripts/veri/cikmis-sinav-sorulari.json, cevapsız)
#            · arşiv: kart-sorulari.ts + premium-denemeler.ts + duello-sorulari.ts + harekat-masasi/ek_sorular (cevaplı)
# Seviye: L2 = kilit kelime soruda/şıkta AYNEN · L1 = aynı kanundan ilgili şifre var (kelime köklerinin ≥%60'ı ya da
#         kelime+cevap kökleri soruda) · L0 = şifre yok (EKSİK). Cevap biliniyorsa ayrıca şifre cevabı doğru şıkkı gösteriyor mu.
import json, re, sys, os, glob, collections
sys.stdout.reconfigure(encoding='utf-8')
KOK = 'D:/GorselHafizaTeknikleriyleJSPS'
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(KOK, 'scratchpad', '_sifre_arsiv')
os.makedirs(OUT, exist_ok=True)

def norm(s):
    s = (s or '').replace('İ', 'i').replace('I', 'ı').replace('\u0307', '').lower()
    s = s.replace('â', 'a').replace('î', 'i').replace('û', 'u').replace('’', "'").replace('‘', "'").replace('“', '"').replace('”', '"')
    return re.sub(r'\s+', ' ', re.sub(r'[\u200b\xa0]', ' ', s)).strip()
STOP = set('''veya için olan olarak gibi daha sonra önce kadar değil ile ise olup olduğu olması halinde hakkında ilişkin dair üzere göre
aşağıdakilerden hangisi hangisinde hangisidir yanlıştır doğrudur değildir sayılı kanun kanunu kanuna kanunun yönetmelik yönetmeliği yönetmeliğine yönetmeliğe
madde maddesi maddesine tarafından yapılır verilir edilir olur olanlar bunlar şunlardır ancak yalnız yalnızca hiçbir tüm bütün diğer başka ayrıca
yoksa varsa veyahut yahut kişi kişiye kişinin bir iki üç dört beş altı yedi sekiz dokuz on arasında hangileri yukarıdakilerden aşağıdaki
nedir nasıl kime kimdir hangi kaç zaman tanım tanımı ifade eder eden edilen ilgili genel özel türk jandarma'''.split())
def tok(s):
    return [t for t in re.findall(r"[0-9]+(?:[.,][0-9]+)?|[a-zçğıöşü]+", norm(s)) if t not in STOP and (t.isdigit() or len(t) >= 4)]
def esit(a, b):
    if a.isdigit() or b.isdigit(): return a == b
    k = min(len(a), len(b))
    return a == b or (k >= 5 and a[:k] == b[:k] and abs(len(a) - len(b)) <= 5)
def kapsar(toks, qt):
    """toks'tan kaçı qt içinde (kök eşleşmesiyle)"""
    return sum(1 for a in set(toks) if any(esit(a, b) for b in qt))

# ---------- şifreler
SIF = collections.defaultdict(list); ADLAR = {}
for f in glob.glob(f'{KOK}/gemini_calisma/kodlama_secme/kanun_*.json'):
    d = json.load(open(f, encoding='utf-8')); ADLAR[d['id']] = d['ad']
    for k in d['kodlar']:
        SIF[d['id']].append({'i': k['i'], 'm': k['madde'], 'kel': k['tetikleyici'], 'nkel': norm(k['tetikleyici']), 'cev': k['cevap'],
                             'kt': tok(k['tetikleyici']), 'ct': tok(k['cevap']), 'kanit_t': tok(k['kanit'])})
print(sum(len(v) for v in SIF.values()), 'şifre ·', len(SIF), 'kanun')

# ---------- kanun etiketi (gerçek sınav soruları için)
NO2LID = {'5237': 1, '2803': 2, '6698': 3, '7201': 4, '5442': 5, '5326': 6, '3713': 7, '2935': 8, '5816': 9, '6284': 10, '2893': 11,
          '7068': 12, '4678': 13, '5070': 14, '6136': 25, '2521': 20}
AD2LID = [('hizmet esasları', 23), ('personel yönetmeli', 22), ('izin yönetmeli', 24), ('resmi yazışma', 15), ('sözleşmeli subay ve astsubay yönetmeli', 16),
          ('sözleşmeli subay', 13), ('silinmesi yok edilmesi', 18), ('anonim hale getirilmesi hakkında yönetmelik', 18), ('bilgi edinme', 19),
          ('jandarma teşkilat görev ve yetkileri yönetmeli', 17), ('jandarma teşkilat görev ve yetkileri kanun', 2), ('jandarma teşkilat', 2),
          ('tebligat', 4), ('il idaresi', 5), ('kabahatler', 6), ('terörle mücadele', 7), ('olağanüstü hal', 8), ('atatürk aleyhine', 9),
          ('ailenin korunması', 10), ('türk bayrağı', 11), ('genel kolluk disiplin', 12), ('disiplin hükümleri', 12), ('elektronik imza', 14),
          ('ateşli silahlar', 25), ('türk ceza', 1), ('kişisel verilerin korunması', 3), ('avda ve sporda', 20), ('yivsiz tüfek', 20)]
def etiket(metin):
    n = re.sub(r"[,'’]", '', norm(metin))
    m = re.search(r'(\d{4}) sayılı', n); lid = None
    if m and m.group(1) in NO2LID:
        lid = NO2LID[m.group(1)]
        if lid == 10 and 'yönetmeli' in n: lid = 21
    if lid is None:
        for ad, l in AD2LID:
            if ad in n: lid = l; break
    return lid
def madde_al(kaynak):
    m = re.search(r'\bm\.?\s*(\d+(?:/[A-Za-z])?)', kaynak or '')
    return m.group(1) if m else '?'

# ---------- soru havuzları
HAVUZ = []  # {kaynak, grup, id, lid, madde, kok, sec:{A:..}, d:'A'|None}
def ekle(kaynak, grup, qid, lid, madde, kok, siklar, dogru):
    if not lid or lid > 25: return
    sec = {chr(65 + i): s for i, s in enumerate(siklar or [])}
    d = chr(65 + dogru) if isinstance(dogru, int) and 0 <= dogru < len(sec) else (dogru if dogru in sec else None)
    HAVUZ.append({'kaynak': kaynak, 'grup': grup, 'id': str(qid), 'lid': lid, 'madde': madde, 'kok': kok or '', 'sec': sec, 'd': d})

# A) 2026 gerçek sınav (cevaplı)
for sinav, yol, bas, son in [('Subay', 'Subay_Jandarma_100_Soru.md', 21, 60), ('Astsubay', 'Astsubay_MEBS_100_Soru.md', 21, 70), ('Uzman', 'Uzman_Erbas_100_Soru.md', 21, 60)]:
    t = open(f'{KOK}/scratchpad/{yol}', encoding='utf-8').read()
    par = re.split(r'(?m)^## Soru (\d+)\s*$', t)
    for no, gov in zip(par[1::2], par[2::2]):
        no = int(no)
        if not (bas <= no <= son): continue
        sec = []; kok = []
        for s in gov.strip().split('\n'):
            m = re.match(r'^-\s*([A-E])\)\s*(.*)', s)
            if m: sec.append(m.group(2).strip()); continue
            if '**Doğru cevap' in s: continue
            if not sec: kok.append(s)
        d = re.search(r'Doğru cevap:\s*([A-E])', gov)
        kok = '\n'.join(kok).strip()
        ekle('sinav2026', 'gerçek sınav 2026', f'{sinav}#{no}', etiket(kok), '?', kok, sec, d.group(1) if d else None)
# B) çıkmış 9 kitapçık (cevapsız)
for q in json.load(open(f'{KOK}/scripts/veri/cikmis-sinav-sorulari.json', encoding='utf-8')):
    if q.get('bolum') != 'meslek': continue
    ekle('kitapcik', 'çıkmış kitapçıklar (9)', f"{q.get('dosya')}#{q.get('no')}", etiket(q['kok']), '?', q['kok'], q.get('siklar'), None)
# C) arşiv (cevaplı)
def ts_json(yol, bas_isareti, bitis='];'):
    s = open(yol, encoding='utf-8').read(); a = s.index(bas_isareti) + len(bas_isareti); b = s.index(bitis, a) + 1
    return json.loads(re.sub(r',(\s*[\]}])', r'\1', s[a:b]))
ks = open(f'{KOK}/src/assets/kart-sorulari.ts', encoding='utf-8').read()
a = ks.index('KART_SORULARI: Record<number, KartSoru[]> = ') + len('KART_SORULARI: Record<number, KartSoru[]> = '); b = ks.rindex('};') + 1
txt = re.sub(r'^  (\d+): \[', r'  "\1": [', ks[a:b], flags=re.M); txt = re.sub(r',(\s*[\]}])', r'\1', txt)
for lid, qs in json.loads(txt).items():
    for q in qs: ekle('kart', 'arşiv', q['id'], int(lid), madde_al(q.get('kaynak')), q['soru'], q['siklar'], q['dogru'])
for i, q in enumerate(ts_json(f'{KOK}/src/assets/premium-denemeler.ts', 'PREMIUM_SORULAR: PremiumSoruHam[] = ')):
    ekle('premium', 'arşiv', f'P{i}', q['l'], madde_al(q.get('y')), q['k'], q['s'], q['d'])
du = open(f'{KOK}/src/assets/duello-sorulari.ts', encoding='utf-8').read(); i = du.index('= [', du.index('DUELLO_SORULARI')); j = du.rindex('];') + 1
for q in json.loads(re.sub(r',(\s*[\]}])', r'\1', du[i + 2:j])):
    ekle('duello', 'arşiv', q.get('id'), q.get('kanun'), madde_al(q.get('kaynak') or q.get('madde') or ''), q.get('soru'), q.get('siklar'), q.get('dogru'))
for f in sorted(glob.glob(f'{KOK}/scripts/harekat-masasi/ek_sorular/*.json')):
    for q in json.load(open(f, encoding='utf-8')):
        ekle('ek', 'arşiv', q['i'], int(q['kanun_id']), madde_al(q.get('y')), q['k'], q['s'], q['d'])
# tekrar süzgeci (aynı kök)
gor = set(); H = []
for q in HAVUZ:
    anahtar = (q['grup'] != 'arşiv', norm(q['kok'])[:140])
    if q['grup'] == 'arşiv' and anahtar in gor: continue
    gor.add(anahtar); H.append(q)
print('havuz:', len(HAVUZ), '→ tekrarsız', len(H), '|', collections.Counter(q['kaynak'] for q in H))

# ---------- uygulama
for q in H:
    nk = norm(q['kok']); ns = norm(' '.join(q['sec'].values())); qt = tok(q['kok']) + tok(' '.join(q['sec'].values()))
    dt = tok(q['sec'].get(q['d'], '')) if q['d'] else []
    en = None
    for s in SIF.get(q['lid'], []):
        strict = s['nkel'] in nk or s['nkel'] in ns
        kf = kapsar(s['kt'], qt) / max(1, len(set(s['kt'])))
        cf = kapsar(s['ct'], qt)
        puan = (3 if strict else 0) + 2 * kf + 0.5 * min(cf, 4) + (0.5 * kapsar(s['ct'], dt) if dt else 0)
        if en is None or puan > en['puan']:
            en = {'puan': puan, 'strict': strict, 'kf': kf, 'cf': cf, 'i': s['i'], 'm': s['m'], 'kel': s['kel'], 'cev': s['cev'], 'row': s}
    if en is None: q['sev'] = 0; q['en'] = None
    else:
        q['sev'] = 2 if en['strict'] else (1 if (en['kf'] >= 0.6 and len(set(en['row']['kt'])) >= 1 and kapsar(en['row']['kt'], qt) >= min(2, len(set(en['row']['kt'])))) or (en['kf'] >= 0.5 and en['cf'] >= 2) else 0)
        q['en'] = {k: v for k, v in en.items() if k != 'row'}
    # cevap denetimi (cevap biliniyorsa ve şifre varsa)
    q['dogru_isaret'] = None
    if q['d'] and q['sev'] >= 1 and en:
        pu = {h: kapsar(en['row']['ct'], tok(v)) + kapsar(en['row']['kt'], tok(v)) * 0.5 for h, v in q['sec'].items()}
        mx = max(pu.values()); aday = [h for h, p in pu.items() if p == mx and mx > 0]
        q['dogru_isaret'] = ('DOĞRU' if aday == [q['d']] else ('belirsiz' if (len(aday) != 1 or mx == 0) else 'YANLIŞ'))

# ---------- kalibrasyon (2026 seti elle değerlendirilmişti: yok/kısmi dışındakiler çözülüyor)
M_YOK = {'Subay#26', 'Subay#42', 'Subay#44', 'Subay#49', 'Subay#52', 'Astsubay#39', 'Uzman#40', 'Uzman#55'}
M_KISMI = {'Subay#51', 'Subay#58', 'Astsubay#32', 'Astsubay#40'}
kal = collections.Counter()
for q in H:
    if q['kaynak'] != 'sinav2026': continue
    el = 'yok' if q['id'] in M_YOK else ('kısmi' if q['id'] in M_KISMI else 'çözer')
    kal[(el, 'L%d' % q['sev'])] += 1

# ---------- özet
L = ['# Şifre → tüm müşterek sorular (otomatik ölçüm)\n', f'Şifre: {sum(len(v) for v in SIF.values())} · soru havuzu (tekrarsız): {len(H)}\n',
     '## Kalibrasyon (2026 gerçek sınav, elle değerlendirme × otomatik seviye)\n', '| elle \\ oto | L2 | L1 | L0 |', '|---|---|---|---|']
for el in ('çözer', 'kısmi', 'yok'):
    L.append(f'| {el} | ' + ' | '.join(str(kal[(el, s)]) for s in ('L2', 'L1', 'L0')) + ' |')
L.append('\n## Kaynak bazında\n| kaynak | soru | L2 kelime aynen | L1 ilgili şifre | L0 EKSİK | cevaplı: doğru/yanlış/belirsiz |\n|---|---|---|---|---|---|')
for g in ['gerçek sınav 2026', 'çıkmış kitapçıklar (9)', 'arşiv']:
    Q = [q for q in H if q['grup'] == g]; c = collections.Counter(q['sev'] for q in Q); ci = collections.Counter(q['dogru_isaret'] for q in Q if q['dogru_isaret'])
    L.append(f"| {g} | {len(Q)} | {c[2]} | {c[1]} | {c[0]} ({100*c[0]/max(1,len(Q)):.0f}%) | {ci['DOĞRU']}/{ci['YANLIŞ']}/{ci['belirsiz']} |")
L.append('\n## Kanun bazında (tüm kaynaklar)\n| kanun | şifre | soru | L2 | L1 | L0 EKSİK | eksik % | en çok eksik maddeler |\n|---|---|---|---|---|---|---|---|')
GAP = {}
for lid in sorted(ADLAR):
    Q = [q for q in H if q['lid'] == lid]; c = collections.Counter(q['sev'] for q in Q)
    md = collections.Counter(q['madde'] for q in Q if q['sev'] == 0 and q['madde'] != '?')
    GAP[lid] = [q for q in Q if q['sev'] == 0]
    L.append(f"| {lid} {ADLAR[lid][:48]} | {len(SIF[lid])} | {len(Q)} | {c[2]} | {c[1]} | {c[0]} | {100*c[0]/max(1,len(Q)):.0f}% | " + ', '.join(f'm.{m}({n})' for m, n in md.most_common(6)) + ' |')
open(f'{OUT}/ozet.md', 'w', encoding='utf-8').write('\n'.join(L)); print('\n'.join(L))

# ---------- eksik dökümü (kanun → madde → sorular)
E = ['# EKSİKLER — şifresi olmayan sorular (L0), kanun → madde\n']
for lid in sorted(GAP):
    if not GAP[lid]: continue
    E.append(f'\n## k{lid} · {ADLAR[lid]} — eksik {len(GAP[lid])} soru\n')
    grup = collections.defaultdict(list)
    for q in GAP[lid]: grup[q['madde']].append(q)
    for m, qs in sorted(grup.items(), key=lambda x: -len(x[1])):
        E.append(f'### m.{m} — {len(qs)} soru')
        for q in qs[:6]:
            cev = f" → **{q['sec'].get(q['d'], '')[:90]}**" if q['d'] else ''
            E.append(f"- [{q['kaynak']} {q['id']}] {q['kok'][:220].replace(chr(10), ' ')}{cev}")
        if len(qs) > 6: E.append(f'- … +{len(qs)-6} soru daha')
open(f'{OUT}/eksikler.md', 'w', encoding='utf-8').write('\n'.join(E))
json.dump([{k: v for k, v in q.items()} for q in H], open(f'{OUT}/havuz_sonuc.json', 'w', encoding='utf-8'), ensure_ascii=False)
print('\nyazıldı:', OUT)
