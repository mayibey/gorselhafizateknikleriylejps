# -*- coding: utf-8 -*-
"""Yardımcı (YALNIZ OKUR): kart id'leri verilince kartın şu anki hâlini ve ilgili maddelerin resmî metnini gösterir.
Kullanım: python goster.py 25-2 25-3 --m 25:4,15  (ek madde metinleri için --m kanun:madde1,madde2)
"""
import json, sys, os, glob, re

sys.stdout.reconfigure(encoding='utf-8')
ROOT = 'D:/GorselHafizaTeknikleriyleJSPS'
CAL = 'C:/Users/GIGABYTE/AppData/Local/Temp/claude/D--GorselHafizaTeknikleriyleJSPS/1cb33cb3-f233-47d5-9f06-b8d257742241/scratchpad/calisma'
VERI = ['jandarma', 'maliye', 'personel', 'tabip', 'istihkam', 'bakim', 'bando', 'dis_tabibi', 'eczaci', 'havacilik',
        'ikmal', 'kimyager', 'mebs', 'muhendis', 'saglik', 'veteriner']

_cache = {}


def veri(br):
    if br not in _cache:
        _cache[br] = json.load(open(f'{CAL}/veri2-{br}.json', encoding='utf-8'))
    return _cache[br]


def kart_bul(kid):
    for br in VERI:
        d = veri(br)
        for k in d['kanun']:
            for n in k.get('n', []):
                if n.get('i') == kid:
                    return br, k, n
    return None, None, None


def tam_metin(lid):
    p = f'{ROOT}/gemini_calisma/girdi/resmi_metin/kanun_{lid}.json'
    if not os.path.exists(p):
        return {}
    d = json.load(open(p, encoding='utf-8'))
    out = {}
    for m in d.get('maddeler', []):
        out[str(m.get('no'))] = m.get('metin', '')
    return out


def blok_metin(lid):
    p = f'{ROOT}/scratchpad/denetim/blok/girdi/kanun_{lid}.json'
    if not os.path.exists(p):
        return {}, {}
    d = json.load(open(p, encoding='utf-8'))
    out = {str(m['no']): m.get('resmi_metin', '') for m in d.get('maddeler', [])}
    kisa = d.get('diger_maddeler_kisa') or {}
    return out, kisa


def madde_yaz(lid, no):
    bm, kisa = blok_metin(lid)
    tm = tam_metin(lid)
    print(f'  --- kanun {lid} m.{no} ---')
    if no in bm:
        print('  [blok resmi_metin]', bm[no])
    if no in tm:
        if no not in bm or len(tm[no]) > len(bm.get(no, '')) + 20:
            print('  [tam metin]', tm[no])
        else:
            print('  [tam metin aynı/kısa: ', len(tm[no]), 'kr]')
    if no not in bm and no not in tm:
        print('  [kisa]', kisa.get(no) if isinstance(kisa, dict) else None)


if __name__ == '__main__':
    args = sys.argv[1:]
    ek = []
    if '--m' in args:
        i = args.index('--m')
        for parca in args[i + 1].split(';'):
            lid, ms = parca.split(':')
            for m in ms.split(','):
                ek.append((int(lid), m))
        args = args[:i] + args[i + 2:]
    for kid in args:
        br, k, n = kart_bul(kid)
        if not n:
            print('BULUNAMADI', kid)
            continue
        print('=' * 100)
        print(f'KART {kid}  [veri2-{br}]  kanun.id={k["id"]}  {k["ad"]}')
        print(json.dumps(n, ensure_ascii=False, indent=1))
    for lid, m in ek:
        madde_yaz(lid, m)
