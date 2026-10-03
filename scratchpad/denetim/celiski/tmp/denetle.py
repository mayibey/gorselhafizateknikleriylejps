# -*- coding: utf-8 -*-
"""celiski/sonuc.json denetçisi (YALNIZ OKUR). kutu_denetle.py kurallarının bu çıktıya uyarlanmış hâli:
biçim, alanlar, kart/kanun eşleşmesi, madde numarası geçerliliği, yz/dg eşleşmesi, açıklama kalıbı, uzunluk,
madde atfı, resmî metinde olmayan sayı, 'yanlış' cümlenin resmî metinde aynen geçmesi, yasak kelime."""
import json, os, re, sys
sys.stdout.reconfigure(encoding='utf-8')
KOK = 'D:/GorselHafizaTeknikleriyleJSPS'
sys.path.insert(0, KOK + '/scripts/harekat-masasi')
from blok_denetle import kelime_sayilari, rakamlar, madde_atiflarini_sil, kucuk
CAL = 'C:/Users/GIGABYTE/AppData/Local/Temp/claude/D--GorselHafizaTeknikleriyleJSPS/1cb33cb3-f233-47d5-9f06-b8d257742241/scratchpad/calisma'
META = re.compile(r'\b(denir|deniyor|yazılır|yanlıştır|yanlış|doğrusu|doğru olan|oysa|aslında|gerçekte|karıştırılır|sanılır|tuzak|çarpıtılır|kaydırılır)\b', re.I)
SORUN = {'hukum_hatali', 'dogrusu_hatali', 'madde_hatali', 'eksik_kayit'}
ALAN = {'hukum', 'sinavda_boyle_yazarlar', 'dogrusu', 'madde', 'baslik'}

def norm(t): return re.sub(r'\s+', ' ', re.sub(r'[“”"\'’‘.,;:()]', ' ', kucuk(t))).strip()
def kelime(t): return len(str(t).split())

V = json.load(open(f'{CAL}/veri2-jandarma.json', encoding='utf-8'))
KART = {}
for br in ['jandarma', 'maliye', 'personel', 'tabip', 'istihkam']:
    for k in json.load(open(f'{CAL}/veri2-{br}.json', encoding='utf-8'))['kanun']:
        for n in k['n']:
            KART.setdefault((k['id'], n['i']), (k, n))

def resmi(lid):
    d = json.load(open(f'{KOK}/gemini_calisma/girdi/resmi_metin/kanun_{lid}.json', encoding='utf-8'))
    return {str(m['no']): m['metin'] for m in d['maddeler']}, d.get('ad', '')

D = json.load(open(sys.argv[1] if len(sys.argv) > 1 else KOK + '/scratchpad/denetim/celiski/sonuc.json', encoding='utf-8'))
hata, uyari = [], []
gor = set()
for x in D:
    lid, kid = x.get('kanun_id'), x.get('kart_id'); yer = kid
    if (lid, kid) in gor: hata.append(f'{yer}: iki kez yazılmış')
    gor.add((lid, kid))
    if (lid, kid) not in KART: hata.append(f'{yer}: veri2 içinde (kanun {lid}) bulunamadı'); continue
    if x.get('sorun') not in SORUN: hata.append(f'{yer}: sorun geçersiz {x.get("sorun")}')
    if not str(x.get('aciklama', '')).strip(): hata.append(f'{yer}: aciklama boş')
    dz = x.get('duzeltme') or {}
    if not dz: hata.append(f'{yer}: duzeltme boş')
    fazla = set(dz) - ALAN
    if fazla: hata.append(f'{yer}: izinsiz alan {fazla}')
    k, n = KART[(lid, kid)]
    metin, ad = resmi(lid)
    if 'madde' in dz:
        if not isinstance(dz['madde'], list) or not dz['madde']: hata.append(f'{yer}: madde boş/liste değil')
        for m in dz['madde']:
            if str(m) not in metin: hata.append(f'{yer}: madde {m} resmî metin listesinde yok')
        if [str(m) for m in dz['madde']] == n['m']: uyari.append(f'{yer}: madde zaten aynı {n["m"]}')
    for alan, eski in (('hukum', n.get('h')), ('baslik', n.get('b'))):
        if alan in dz and dz[alan] == eski: uyari.append(f'{yer}: {alan} değişmemiş')
    mm = [str(m) for m in (dz.get('madde') or n['m'])]
    ilgili = ' '.join(metin.get(m, '') for m in mm)
    hk = dz.get('hukum', n.get('h', ''))
    izin = rakamlar(ilgili) | kelime_sayilari(ilgili) | rakamlar(ad) | rakamlar(hk) | kelime_sayilari(hk)
    if 'hukum' in dz:
        tum = ' '.join(metin.values())
        tizin = rakamlar(tum) | kelime_sayilari(tum) | rakamlar(ad)
        for s in sorted(rakamlar(madde_atiflarini_sil(dz['hukum']))):
            if s not in tizin: uyari.append(f'{yer}: hükümdeki {s} kanun metninde yok (elle bak)')
    yz, dg = dz.get('sinavda_boyle_yazarlar'), dz.get('dogrusu')
    if (yz is None) != (dg is None): hata.append(f'{yer}: yz ve dg birlikte verilmeli'); continue
    if yz is None: continue
    if not isinstance(yz, list) or not (1 <= len(yz) <= 3): hata.append(f'{yer}: yz 1-3 öğe olmalı'); continue
    if not isinstance(dg, list) or len(dg) != len(yz): hata.append(f'{yer}: dg sayısı yz ile aynı olmalı'); continue
    rn = norm(ilgili + ' ' + ' '.join(metin.values()))
    for y, d in zip(yz, dg):
        if not (y.startswith('“') and y.endswith('”')): hata.append(f'{yer}: yz “ ” içinde değil: {y[:50]}')
        if META.search(y): hata.append(f'{yer}: yz açıklama kalıbı "{META.search(y).group(0)}"')
        if not (3 <= kelime(y) <= 40): hata.append(f'{yer}: yz {kelime(y)} kelime')
        yn = norm(y)
        if len(yn) > 25 and yn in rn: hata.append(f'{yer}: yz resmî metinde aynen geçiyor: {y[:60]}')
        if norm(y) == norm(d): hata.append(f'{yer}: yz = dg')
        govde = re.sub(r'\s*\([^()]*m\.[^()]*\)\s*\.?\s*$', '', d)
        if kelime(govde) > 25: hata.append(f'{yer}: dg {kelime(govde)} kelime: {d[:60]}')
        if not re.search(r'\([^()]*m\.\s*[^()]*\)\s*\.?\s*$', d): hata.append(f'{yer}: dg madde atfıyla bitmiyor')
        for s in sorted(rakamlar(madde_atiflarini_sil(d))):
            if s not in izin: hata.append(f'{yer}: dg\'deki {s} ilgili resmî metinde yok')
        if 'kaçırdığın' in kucuk(y + d): hata.append(f'{yer}: yasak kelime')
for x in D:
    for alan in ('aciklama',):
        if 'kaçırdığın' in kucuk(x.get(alan, '')): hata.append(f'{x["kart_id"]}: aciklama yasak kelime')
    if 'kaçırdığın' in kucuk(json.dumps(x.get('duzeltme'), ensure_ascii=False)): hata.append(f'{x["kart_id"]}: yasak kelime')
print(f'{len(D)} kayıt · HATA {len(hata)} · uyarı {len(uyari)}')
for h in hata: print('  HATA ', h)
for u in uyari: print('  uyarı', u)
from collections import Counter
print(Counter(x['sorun'] for x in D))
