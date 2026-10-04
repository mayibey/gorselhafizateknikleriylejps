# resmi_metin eksiklerini uygulamanın madde metni kaydından (src/assets/kart-madde-metinleri.ts) tamamlar:
#   - resmi_metin'de olmayan maddeler (ör. 2803 Ek maddeler) EKLENİR
#   - 6000 karakterde kesilmiş maddeler, baş kısmı birebir tutuyorsa TAM metinle DEĞİŞTİRİLİR
#   python scripts/sifreler/metin_yama.py          (gemini_calisma/girdi/resmi_metin/kanun_N.json güncellenir, yedek .onceki)
import json, re, sys, os, shutil
sys.stdout.reconfigure(encoding='utf-8')
KOK = os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
RM = os.path.join(KOK, 'gemini_calisma', 'girdi', 'resmi_metin')
ETIKET = {1: 'TCK', 2: 'Jandarma Kanunu', 3: 'KVKK', 4: 'Tebligat', 5: 'İl İdaresi', 6: 'Kabahatler', 7: 'Terörle Mücadele', 8: 'OHAL',
          9: 'Atatürk Al. Suçlar', 10: '6284 Ailenin Korunması', 11: 'Türk Bayrağı', 12: 'Disiplin', 13: 'Sözleşmeli Sb/Asb', 14: 'E-İmza',
          15: 'Resmî Yazışma', 16: 'Sözleşmeli Sb/Asb Yön', 17: 'Jandarma Teşkilat Yön', 18: 'KV Silme Yön', 19: 'Bilgi Edinme Yön',
          20: '2521 Tüfekler Yön', 21: '6284 Uyg. Yön', 22: 'Personel Yön', 23: 'Hizmet Esasları Yön', 24: 'İzin Yön', 25: '6136 Ateşli Silahlar'}
s = open(os.path.join(KOK, 'src/assets/kart-madde-metinleri.ts'), encoding='utf-8').read()
a = s.index('KART_MADDE_METINLERI: Record<string, string> = ') + len('KART_MADDE_METINLERI: Record<string, string> = '); b = s.rindex('};') + 1
M = json.loads(re.sub(r',(\s*[\]}])', r'\1', s[a:b]))
def duz(t): return re.sub(r'\s+', ' ', t).strip()
for lid, et in ETIKET.items():
    yol = os.path.join(RM, f'kanun_{lid}.json'); R = json.load(open(yol, encoding='utf-8'))
    MT = {m['no']: m for m in R['maddeler']}; eklenen = []; degisen = []; uyusmayan = []
    for k, metin in M.items():
        if k.rsplit(' m.', 1)[0] != et: continue
        no = k.rsplit(' m.', 1)[1].strip()
        metin = metin.strip()
        if no not in MT:
            # kapsamda: kanunun tamamı kapsamsa (liste None) ya da madde listede ise True; aksi halde False (denetçi kapsam dışı sayar)
            liste = R.get('kapsam_maddeler_birlesik')
            R['maddeler'].append({'no': no, 'metin': metin, 'kapsamda': (liste is None) or (no in liste)}); MT[no] = R['maddeler'][-1]; eklenen.append(no)
        elif len(MT[no]['metin']) >= 6000 and len(metin) > len(MT[no]['metin']):
            eski = duz(MT[no]['metin'])[:3000]; yeni = duz(metin)
            if yeni.startswith(eski[:1500]): MT[no]['metin'] = metin; degisen.append(f'{no} ({len(metin)})')
            else: uyusmayan.append(no)
    if eklenen or degisen or uyusmayan:
        if not os.path.exists(yol + '.onceki'): shutil.copy(yol, yol + '.onceki')
        json.dump(R, open(yol, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
        print(f'k{lid:2d} {et}: eklendi {eklenen} · tamamlandı {degisen} · uyuşmadı {uyusmayan}')
