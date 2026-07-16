# -*- coding: utf-8 -*-
"""
BRANŞ görsellerini kaynak fabrikadan alıp uygulamaya yerleştirir.
icerik-yerlestir.py'nin BİREBİR AYNI parse/san/goz mantığı (müşterek ile parite) —
tek fark: kaynak = BRANS klasörü ve MAP = branş kanunları (law 26-66).
- Kaynak: D:\\JSPS Fabrika\\...\\BRANS\\{folder}\\uretilen_gorseller\\*.png (sadece bu seviye)
- Hedef:  assets/kartlar/{slug}/{key}.png
- ses_metinleri/{aynı ad}.txt -> ses metni (key -> metin)
Çıktı: scripts/_icerik_rapor.json (müşterek kayıtları KORUNUR; sadece branş slug'ları eklenir)
KOPYALAR; kaynağı silmez. gorselKartlari() mantığıyla uyumlu anahtar üretir.
Kullanım: python scripts/icerik-yerlestir-brans.py [SLUG1 SLUG2 ...]  (boşsa hepsi)
"""
import os, re, sys, json, shutil

SRC_BASE = r"D:\JSPS Fabrika\kaynaklar\astsubay\KANUN_MASTER_DOSYALARI\BRANS"
REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEST_BASE = os.path.join(REPO, "assets", "kartlar")

# folder -> (lawId, slug[no underscore], etiket).  law 26-66 (soru-registry BRANS_KLASOR_LAW ile birebir).
MAP = {
    "02_5271_CMK":                 (26, "cmk",                "CMK"),
    "03_1774_KIMLIK_BILDIRME":     (27, "kimlikbildirme",     "Kimlik Bildirme"),
    "04_2911_TOPLANTI_GOSTERI":    (28, "toplantigosteri",    "Toplantı/Gösteri"),
    "05_4915_KARA_AVCILIGI":       (29, "karaavciligi",       "Kara Avcılığı"),
    "06_1380_SU_URUNLERI":         (30, "suurunleri",         "Su Ürünleri"),
    "07_6458_YABANCILAR":          (31, "yabancilar",         "Yabancılar"),
    "08_6831_ORMAN":               (32, "orman",              "Orman"),
    "09_4342_MERA":                (33, "mera",               "Mera"),
    "10_2918_TRAFIK":              (34, "trafik",             "Trafik"),
    "11_5188_OZEL_GUVENLIK":       (35, "ozelguvenlik",       "Özel Güvenlik"),
    "12_5395_COCUK_KORUMA":        (36, "cocukkoruma",        "Çocuk Koruma"),
    "13_2860_YARDIM_TOPLAMA":      (37, "yardimtoplama",      "Yardım Toplama"),
    "14_5199_HAYVANLARI_KORUMA":   (38, "hayvankoruma",       "Hayvanları Koruma"),
    "15_2872_CEVRE":               (39, "cevre",              "Çevre"),
    "16_2559_PVSK":                (40, "pvsk",               "PVSK"),
    "17_5607_KACAKCILIK":          (41, "kacakcilik",         "Kaçakçılık"),
    "18_3298_UYUSTURUCU":          (42, "uyusturucu3298",     "Uyuşturucu (3298)"),
    "19_6222_SPORDA_SIDDET":       (43, "spordasiddet",       "Sporda Şiddet"),
    "20_2313_UYUSTURUCU_MURAKABE": (44, "uyusturucumurakabe", "Uyuşturucu Murakabe"),
    "21_6415_TERORIZM_FINANSMANI": (45, "terorizmfin",        "Terörizm Finansmanı"),
    "22_2863_KULTUR_TABIAT":       (46, "kulturtabiat",       "Kültür/Tabiat"),
    "23_3091_ZILYETLIK":           (47, "zilyetlik",          "Zilyetlik"),
    "24_4207_TUTUN_ZARARLARI":     (48, "tutunzarar",         "Tütün Zararları"),
    "25_4733_TUTUN_ALKOL_PIYASASI":(49, "tutunalkol",         "Tütün/Alkol Piyasası"),
    "26_YON_KIMLIK_BILDIRME":      (50, "yonkimlik",          "Kimlik Bild. Yön"),
    "27_YON_SES_GAZ_FISEGI":       (51, "yonsesgaz",          "Ses/Gaz Fişeği Yön"),
    "28_YON_TRAFIK":               (52, "yontrafik",          "Trafik Yön"),
    "29_YON_IKRAMIYE":             (53, "yonikramiye",        "İkramiye Yön"),
    "30_YON_OZEL_GUVENLIK":        (54, "yonozelguv",         "Özel Güvenlik Yön"),
    "31_YON_ADLI_KOLLUK":          (55, "yonadlikolluk",      "Adli Kolluk Yön"),
    "32_YON_ARAMALAR":             (56, "yonaramalar",        "Aramalar Yön"),
    "33_YON_SUC_ESYASI":           (57, "yonsucesyasi",       "Suç Eşyası Yön"),
    "34_YON_YAKALAMA":             (58, "yonyakalama",        "Yakalama Yön"),
    "35_YON_BEDEN_MUAYENESI":      (59, "yonbeden",           "Beden Muayenesi Yön"),
    "36_YON_COCUK_TEDBIR":         (60, "yoncocuktedbir",     "Çocuk Tedbir Yön"),
    "37_YON_COCUK_USUL":           (61, "yoncocukusul",       "Çocuk Usul Yön"),
    "38_YON_ISYERI_ACMA":          (62, "yonisyeri",          "İşyeri Açma Yön"),
    "39_YON_KUM_CAKIL":            (63, "yonkumcakil",        "Kum/Çakıl Yön"),
    "40_YON_TUTUN_SATIS":          (64, "yontutunsatis",      "Tütün Satış Yön"),
    "41_YON_VATANDASLIK":          (65, "yonvatandaslik",     "Vatandaşlık Yön"),
    "42_YON_ATESLI_SILAHLAR":      (66, "yonatesli",          "Ateşli Silahlar Yön"),
}

TR = str.maketrans({"ç":"c","Ç":"c","ğ":"g","Ğ":"g","ı":"i","İ":"i","ş":"s","Ş":"s","ö":"o","Ö":"o","ü":"u","Ü":"u","â":"a"})
def san(s):
    s = s.translate(TR)
    s = re.sub(r"[^A-Za-z0-9]+", "x", s)
    return s.strip("x").lower() or "x"

def goz(slug, raw):
    t = san(raw)
    if t.startswith("m"):
        t = "oz" + t
    return f"{slug}_ozet_{t}", "genelozet", None

def parse(name, slug):
    """name = uzantısız dosya adı. (key, tip, kapsam_label|None) döndürür.
    Müşterek parse'ın ÜSTÜNE branş özel: EK MADDE (iki format) + harfli madde (38A → 38/A)
    TEMİZ patika düğümü olur (kanun sonuna 'özet' atılmaz, normal madde ile karışmaz)."""
    m = re.match(r"^(.*?)\s+MADDE\s+(.+)$", name)
    if not m:
        # MADDE yok: genel özet (5271 OZET, isimli SURELER-AYIRT/MAKAM-AYIRT vb.) → kanun sonu.
        tail = name.split(" ", 1)[1] if " " in name else "ozet"
        return goz(slug, tail)
    pre = m.group(1)               # "2918 EK" | "5271"
    rest = m.group(2)              # "004-1" | "EK-01-1" | "038A-1" | "119-AYIRT"
    toks = rest.split("-")
    # EK tespiti: "2918 EK MADDE 004" (EK önek) VEYA "1774 MADDE EK-01" (EK rest başında).
    ek = pre.strip().upper().endswith(" EK") or pre.strip().upper() == "EK"
    if toks and toks[0].upper() == "EK":
        ek = True
        toks = toks[1:]
    t0 = toks[0] if toks else ""
    body = toks[1:]
    if ek and re.match(r"^\d+$", t0):
        no = int(t0)              # Ek Madde → kendi düğümü "Ek Madde N" (kapsam sonunda sıralanır)
        panel = san("_".join(body)) if body else "1"
        return f"{slug}_mek{no}_{panel}", "normal", f"Ek {no}"
    if re.match(r"^\d+$", t0):
        madde = int(t0)
        if body and body[-1].upper() == "AYIRT":
            nums = [madde] + [int(x) for x in body[:-1] if x.isdigit()]
            return f"{slug}_ayirt_m" + "_".join(map(str, nums)), "ayirt", str(madde)
        if body and body[-1].upper() == "OZET":
            nums = [madde] + [int(x) for x in body[:-1] if x.isdigit()]
            return f"{slug}_ozet_m" + "_".join(map(str, nums)), "ozet", str(madde)
        panel = san("_".join(body)) if body else "1"
        return f"{slug}_m{madde}_{panel}", "normal", str(madde)
    # Harfli madde: "038A" → Madde 38/A (base madde ile aynı düğüm DEĞİL, kendi düğümü, 38'den sonra).
    mlet = re.match(r"^0*(\d+)([A-Za-z])$", t0)
    if mlet:
        no = int(mlet.group(1)); harf = mlet.group(2).upper()
        if body and body[-1].upper() == "AYIRT":
            return f"{slug}_ayirt_m{no}{harf.lower()}", "ayirt", f"{no}/{harf}"
        panel = san("_".join(body)) if body else "1"
        return f"{slug}_m{no}{harf.lower()}_{panel}", "normal", f"{no}/{harf}"
    return goz(slug, rest)

def gercek_folder(prefix):
    for d in os.listdir(SRC_BASE):
        if d.startswith(prefix) and os.path.isdir(os.path.join(SRC_BASE, d)):
            return d
    return None

def main():
    only = set(sys.argv[1:])
    rapor = {}
    for folder, (lawId, slug, etiket) in MAP.items():
        if only and slug not in only:
            continue
        real = gercek_folder(folder)
        if not real:
            print(f"!! kaynak klasor yok: {folder}"); continue
        src_dir = os.path.join(SRC_BASE, real, "uretilen_gorseller")
        ses_dir = os.path.join(SRC_BASE, real, "ses_metinleri")
        if not os.path.isdir(src_dir):
            print(f"!! kaynak yok: {real}"); continue
        dest_dir = os.path.join(DEST_BASE, slug)
        if os.path.isdir(dest_dir): shutil.rmtree(dest_dir)
        os.makedirs(dest_dir)
        pngs = sorted(f for f in os.listdir(src_dir) if f.lower().endswith(".png"))
        used = {}; kapsam = []; eslesme = []; ses = {}; anomali = []
        for f in pngs:
            base = os.path.splitext(f)[0]
            key, tip, label = parse(base, slug)
            if key in used:
                i = 2
                while f"{key}x{i}" in used: i += 1
                key = f"{key}x{i}"
            used[key] = True
            shutil.copy2(os.path.join(src_dir, f), os.path.join(dest_dir, key + ".png"))
            if label and label not in kapsam: kapsam.append(label)
            if tip == "genelozet": anomali.append(base)
            eslesme.append({"src": base, "key": key, "tip": tip})
            tf = os.path.join(ses_dir, base + ".txt")
            if os.path.isfile(tf):
                try:
                    ses[key] = open(tf, encoding="utf-8").read().strip()
                except Exception:
                    ses[key] = open(tf, encoding="utf-8", errors="replace").read().strip()
        # Temiz sıra: sayısal maddeler artan (harfli hemen ardında: 38, 38/A), Ek maddeler EN SONDA.
        def kapsam_key(et):
            if et.startswith("Ek "):
                return (2, int(et[3:]), "")
            mm = re.match(r"^(\d+)(?:/([A-Za-z]))?$", et)
            if mm:
                return (0, int(mm.group(1)), mm.group(2) or "")
            return (3, 0, et)
        kapsam_sorted = sorted(set(kapsam), key=kapsam_key)
        rapor[slug] = {"lawId": lawId, "etiket": etiket, "kapsam": kapsam_sorted,
                       "toplam_png": len(pngs), "bagli_madde": len(kapsam_sorted),
                       "genelozet": len(anomali), "genelozet_ad": anomali, "eslesme": eslesme, "ses": ses}
        print(f"[{slug}] law {lawId}: {len(pngs)} png -> {len(kapsam_sorted)} madde dugumu, {len(anomali)} genel-ozet/baglanmayan")
    out = os.path.join(REPO, "scripts", "_icerik_rapor.json")
    existing = {}
    if os.path.isfile(out):
        try:
            existing = json.load(open(out, encoding="utf-8"))
        except Exception:
            existing = {}
    existing.update(rapor)
    json.dump(existing, open(out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print("RAPOR ->", out)

if __name__ == "__main__":
    main()
