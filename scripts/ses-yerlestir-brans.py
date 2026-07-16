# -*- coding: utf-8 -*-
"""
BRANŞ SES (mp3) dosyalarını kaynak fabrikadan alıp uygulamaya yerleştirir.
icerik-yerlestir-brans.py ile BİREBİR AYNI parse/san/goz → ses anahtarı = görsel anahtarı
(gorsel_yolu). Böylece KART_SESLERI[gorsel_yolu] kart akışında çözülür ve gerçek ses çalar.

- Kaynak: BRANS/{folder}/ses dosyaları/*.mp3 (sadece bu seviye)
- Hedef:  assets/sesler/{slug}/{key}.mp3
KOPYALAR; kaynağı silmez. Yalnız SESİ ÜRETİLMİŞ dosyalar işlenir → sesler geldikçe TEKRAR çalıştır.
Kullanım: python scripts/ses-yerlestir-brans.py [SLUG1 ...]  (boşsa hepsi)
"""
import os, re, sys, shutil

SRC_BASE = r"D:\JSPS Fabrika\kaynaklar\astsubay\KANUN_MASTER_DOSYALARI\BRANS"
REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEST_BASE = os.path.join(REPO, "assets", "sesler")

# icerik-yerlestir-brans.py MAP ile birebir (folder -> slug). Ses klasörü olmayan kanun atlanır.
MAP = {
    "02_5271_CMK": "cmk", "03_1774_KIMLIK_BILDIRME": "kimlikbildirme",
    "04_2911_TOPLANTI_GOSTERI": "toplantigosteri", "05_4915_KARA_AVCILIGI": "karaavciligi",
    "06_1380_SU_URUNLERI": "suurunleri", "07_6458_YABANCILAR": "yabancilar",
    "08_6831_ORMAN": "orman", "09_4342_MERA": "mera", "10_2918_TRAFIK": "trafik",
    "11_5188_OZEL_GUVENLIK": "ozelguvenlik", "12_5395_COCUK_KORUMA": "cocukkoruma",
    "13_2860_YARDIM_TOPLAMA": "yardimtoplama", "14_5199_HAYVANLARI_KORUMA": "hayvankoruma",
    "15_2872_CEVRE": "cevre", "16_2559_PVSK": "pvsk", "17_5607_KACAKCILIK": "kacakcilik",
    "18_3298_UYUSTURUCU": "uyusturucu3298", "19_6222_SPORDA_SIDDET": "spordasiddet",
    "20_2313_UYUSTURUCU_MURAKABE": "uyusturucumurakabe", "21_6415_TERORIZM_FINANSMANI": "terorizmfin",
    "22_2863_KULTUR_TABIAT": "kulturtabiat", "23_3091_ZILYETLIK": "zilyetlik",
    "24_4207_TUTUN_ZARARLARI": "tutunzarar", "25_4733_TUTUN_ALKOL_PIYASASI": "tutunalkol",
    "26_YON_KIMLIK_BILDIRME": "yonkimlik", "27_YON_SES_GAZ_FISEGI": "yonsesgaz",
    "28_YON_TRAFIK": "yontrafik", "29_YON_IKRAMIYE": "yonikramiye", "30_YON_OZEL_GUVENLIK": "yonozelguv",
    "31_YON_ADLI_KOLLUK": "yonadlikolluk", "32_YON_ARAMALAR": "yonaramalar",
    "33_YON_SUC_ESYASI": "yonsucesyasi", "34_YON_YAKALAMA": "yonyakalama",
    "35_YON_BEDEN_MUAYENESI": "yonbeden", "36_YON_COCUK_TEDBIR": "yoncocuktedbir",
    "37_YON_COCUK_USUL": "yoncocukusul", "38_YON_ISYERI_ACMA": "yonisyeri",
    "39_YON_KUM_CAKIL": "yonkumcakil", "40_YON_TUTUN_SATIS": "yontutunsatis",
    "41_YON_VATANDASLIK": "yonvatandaslik", "42_YON_ATESLI_SILAHLAR": "yonatesli",
}

TR = str.maketrans({"ç":"c","Ç":"c","ğ":"g","Ğ":"g","ı":"i","İ":"i","ş":"s","Ş":"s","ö":"o","Ö":"o","ü":"u","Ü":"u","â":"a"})
def san(s):
    s = s.translate(TR); s = re.sub(r"[^A-Za-z0-9]+", "x", s); return s.strip("x").lower() or "x"
def goz(slug, raw):
    t = san(raw); t = ("oz"+t) if t.startswith("m") else t; return f"{slug}_ozet_{t}", "genelozet", None

def parse(name, slug):
    """icerik-yerlestir-brans.py parse() ile BİREBİR AYNI (anahtar pariteesi ŞART)."""
    m = re.match(r"^(.*?)\s+MADDE\s+(.+)$", name)
    if not m:
        tail = name.split(" ", 1)[1] if " " in name else "ozet"
        return goz(slug, tail)
    pre = m.group(1); rest = m.group(2); toks = rest.split("-")
    ek = pre.strip().upper().endswith(" EK") or pre.strip().upper() == "EK"
    if toks and toks[0].upper() == "EK":
        ek = True; toks = toks[1:]
    t0 = toks[0] if toks else ""; body = toks[1:]
    if ek and re.match(r"^\d+$", t0):
        no = int(t0); panel = san("_".join(body)) if body else "1"
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
    only = set(sys.argv[1:]); toplam = 0
    for folder, slug in MAP.items():
        if only and slug not in only: continue
        real = gercek_folder(folder)
        if not real: continue
        src_dir = os.path.join(SRC_BASE, real, "ses dosyaları")
        if not os.path.isdir(src_dir):
            continue  # sesi henüz üretilmemiş → atla (sonra tekrar çalıştır)
        mp3s = sorted(f for f in os.listdir(src_dir) if f.lower().endswith(".mp3"))
        if not mp3s: continue
        dest_dir = os.path.join(DEST_BASE, slug)
        os.makedirs(dest_dir, exist_ok=True)
        used = {}; n = 0
        for f in mp3s:
            base = os.path.splitext(f)[0]
            key, tip, _ = parse(base, slug)
            if key in used:
                i = 2
                while f"{key}x{i}" in used: i += 1
                key = f"{key}x{i}"
            used[key] = True
            shutil.copy2(os.path.join(src_dir, f), os.path.join(dest_dir, key + ".mp3")); n += 1
        toplam += n
        print(f"[{slug}] {n} ses -> assets/sesler/{slug}")
    print(f"TOPLAM {toplam} ses yerleştirildi.")

if __name__ == "__main__":
    main()
