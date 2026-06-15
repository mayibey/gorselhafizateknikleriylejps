# -*- coding: utf-8 -*-
"""
Müşterek görselleri kaynak fabrikadan alıp uygulamaya yerleştirir.
- Kaynak: D:\\JSPS Fabrika\\...\\MUSTEREK\\{folder}\\uretilen_gorseller\\*.png (sadece bu seviye)
- Hedef: assets/kartlar/{slug}/{registry_key}.png
- ses_metinleri/{aynı ad}.txt -> ses metni (registry_key -> metin) JSON raporu
Çıktı: scripts/_icerik_rapor.json (kapsam etiketleri + dosya eşleşmeleri + ses metinleri)
KOPYALAR; kaynağı silmez. gorselKartlari() mevcut mantığıyla uyumlu anahtar üretir.
Kullanım: python scripts/icerik-yerlestir.py [SLUG1 SLUG2 ...]  (boşsa hepsi)
"""
import os, re, sys, json, shutil

SRC_BASE = r"D:\JSPS Fabrika\kaynaklar\astsubay\KANUN_MASTER_DOSYALARI\MUSTEREK"
REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEST_BASE = os.path.join(REPO, "assets", "kartlar")

# folder -> (lawId, slug[no underscore], etiket)
MAP = {
    "03_5442_ILIDARESI":        (5,  "ililaresi",     "İl İdaresi"),
    "04_3713_TERORLE_MUCADELE": (7,  "terorle",       "Terörle Mücadele"),
    "05_7068_DISIPLIN":         (12, "disiplin",      "Disiplin"),
    "06_2803_JANDARMA":         (2,  "jandarmakanun", "Jandarma Kanunu"),
    "07_7201_TEBLIGAT":         (4,  "tebligat",      "Tebligat"),
    "08_6698_KVKK":             (3,  "kvkk",          "KVKK"),
    "09_2935_OHAL":             (8,  "ohal",          "OHAL"),
    "10_5816_ATATURK_ALEYHINE": (9,  "ataturk",       "Atatürk Al. Suçlar"),
    "11_2893_TURK_BAYRAGI":     (11, "bayrak",        "Türk Bayrağı"),
    "12_6284_AILENIN_KORUNMASI":(10, "ailekoruma",    "6284 Ailenin Korunması"),
    "13_5070_EIMZA":            (14, "eimza",         "E-İmza"),
    "14_4678_SOZLESMELI_SB_ASB":(13, "sozlesmeliasb", "Sözleşmeli Sb/Asb"),
    "15_RESMI_YAZISMA":         (15, "resmiyazisma",  "Resmî Yazışma"),
    "16_KVK_SILME_ANONIM":      (18, "kvksilme",      "KV Silme Yön"),
    "17_BILGI_EDINME_YON":      (19, "bilgiedinme",   "Bilgi Edinme Yön"),
    "18_6136_ATESLI_SILAHLAR":  (25, "atesli",        "6136 Ateşli Silahlar"),
    "19_2521_TUFEKLER_YON":     (20, "tufekler",      "2521 Tüfekler Yön"),
    "20_SOZLESMELI_SBASB_YON":  (16, "sozlesmeliyon", "Sözleşmeli Sb/Asb Yön"),
    "21_6284_UYGULAMA_YON":     (21, "aileuyg",       "6284 Uyg. Yön"),
    "22_JGK_IZIN_YON":          (24, "izinyon",       "İzin Yön"),
    "23_HIZMET_ESASLARI_YON":   (23, "hizmetesas",    "Hizmet Esasları Yön"),
    "24_PERSONEL_YON":          (22, "personelyon",   "Personel Yön"),
    "25_JANDARMA_TESKILAT_YON": (17, "jandteskyon",   "Jandarma Teşkilat Yön"),
}

TR = str.maketrans({"ç":"c","Ç":"c","ğ":"g","Ğ":"g","ı":"i","İ":"i","ş":"s","Ş":"s","ö":"o","Ö":"o","ü":"u","Ü":"u","â":"a"})
def san(s):
    s = s.translate(TR)
    s = re.sub(r"[^A-Za-z0-9]+", "x", s)   # ascii dışı (mojibake dahil) -> x
    return s.strip("x").lower() or "x"

def goz(slug, raw):
    """Genel özet anahtarı. gorselKartlari 'ozet_m...' anahtarını madde-özeti sanır →
    etiket 'm' ile başlamasın diye 'oz' önekle (örn. merci -> ozmerci)."""
    t = san(raw)
    if t.startswith("m"):
        t = "oz" + t
    return f"{slug}_ozet_{t}", "genelozet", None

def parse(name, slug):
    """name = uzantısız dosya adı. (key, tip, kapsam_label|None) döndürür."""
    m = re.match(r"^(.*?)\s+MADDE\s+(.+)$", name)
    if not m:
        # genel özet (madde yok): "6698 OZET", "5326 OZET-TUTAR"
        tail = name.split(" ", 1)[1] if " " in name else "ozet"
        return goz(slug, tail)
    rest = m.group(2)
    toks = rest.split("-")
    t0 = toks[0]
    # EK / Geçici / harfli madde -> güvenli: genel özet (rakam-madde düğümü yok)
    if t0.upper() == "EK" or t0.upper().startswith("GE") or re.match(r"^\d+[A-Za-zçğşöüİ]$", t0):
        return goz(slug, rest)
    if re.match(r"^\d+$", t0):
        madde = int(t0)
        body = toks[1:]
        if body and body[-1].upper() == "AYIRT":
            nums = [madde] + [int(x) for x in body[:-1] if x.isdigit()]
            return f"{slug}_ayirt_m" + "_".join(map(str, nums)), "ayirt", str(madde)
        if body and body[-1].upper() == "OZET":
            nums = [madde] + [int(x) for x in body[:-1] if x.isdigit()]
            return f"{slug}_ozet_m" + "_".join(map(str, nums)), "ozet", str(madde)
        # isimli küme (KUME/CERCEVE vb.) içeren ama rakamla başlayan -> normal panel (ilk maddeye bağlanır)
        panel = san("_".join(body)) if body else "1"
        return f"{slug}_m{madde}_{panel}", "normal", str(madde)
    # tanınmayan -> genel özet
    return goz(slug, rest)

def main():
    only = set(sys.argv[1:])
    rapor = {}
    for folder, (lawId, slug, etiket) in MAP.items():
        if only and slug not in only:
            continue
        src_dir = os.path.join(SRC_BASE, folder, "uretilen_gorseller")
        ses_dir = os.path.join(SRC_BASE, folder, "ses_metinleri")
        if not os.path.isdir(src_dir):
            print(f"!! kaynak yok: {folder}"); continue
        dest_dir = os.path.join(DEST_BASE, slug)
        # temizle + yeniden oluştur (idempotent)
        if os.path.isdir(dest_dir): shutil.rmtree(dest_dir)
        os.makedirs(dest_dir)
        pngs = sorted(f for f in os.listdir(src_dir) if f.lower().endswith(".png"))
        used = {}; kapsam = []; eslesme = []; ses = {}; anomali = []
        for f in pngs:
            base = os.path.splitext(f)[0]
            key, tip, label = parse(base, slug)
            # çakışma -> sayaç ekle
            if key in used:
                i = 2
                while f"{key}x{i}" in used: i += 1
                key = f"{key}x{i}"
            used[key] = True
            shutil.copy2(os.path.join(src_dir, f), os.path.join(dest_dir, key + ".png"))
            if label and label not in kapsam: kapsam.append(label)
            if tip == "genelozet": anomali.append(base)
            eslesme.append({"src": base, "key": key, "tip": tip})
            # ses metni (aynı ad .txt)
            tf = os.path.join(ses_dir, base + ".txt")
            if os.path.isfile(tf):
                try:
                    ses[key] = open(tf, encoding="utf-8").read().strip()
                except Exception:
                    ses[key] = open(tf, encoding="utf-8", errors="replace").read().strip()
        # kapsam: sayısal sırala
        kapsam_sorted = sorted(set(kapsam), key=lambda x: int(x))
        rapor[slug] = {"lawId": lawId, "etiket": etiket, "kapsam": kapsam_sorted,
                       "toplam_png": len(pngs), "bagli_madde": len(kapsam_sorted),
                       "genelozet": len(anomali), "eslesme": eslesme, "ses": ses}
        print(f"[{slug}] law {lawId}: {len(pngs)} png -> {len(kapsam_sorted)} madde dugumu, {len(anomali)} genel-ozet/baglanmayan")
    out = os.path.join(REPO, "scripts", "_icerik_rapor.json")
    json.dump(rapor, open(out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print("RAPOR ->", out)

if __name__ == "__main__":
    main()
