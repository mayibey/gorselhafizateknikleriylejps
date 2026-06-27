# -*- coding: utf-8 -*-
"""
Müşterek SES (mp3) dosyalarını kaynak fabrikadan alıp uygulamaya yerleştirir.
icerik-yerlestir.py'nin AYNI anahtar üretimi (parse/san/goz + çakışma sayacı) kullanılır
→ ses anahtarı = görsel anahtarı (gorsel_yolu) BİREBİR. Böylece KART_SESLERI[gorsel_yolu]
kart akışında çözülür ve gerçek ses çalar.

- Kaynak: SRC_BASE/{folder TAMAM}/ses dosyaları/*.mp3 (sadece bu seviye)
- Hedef:  assets/sesler/{slug}/{key}.mp3
KOPYALAR; kaynağı silmez. Yalnız SESİ ÜRETİLMİŞ 16 kanun işlenir.
Kullanım: python scripts/ses-yerlestir.py
"""
import os, re, shutil

SRC_BASE = r"D:\JSPS Fabrika\kaynaklar\astsubay\KANUN_MASTER_DOSYALARI\MUSTEREK"
REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEST_BASE = os.path.join(REPO, "assets", "sesler")

# folder öneki (TAMAM eki dahil değil) -> slug. icerik-yerlestir.py MAP ile aynı slug'lar.
# Sadece SESİ ÜRETİLMİŞ 16 kanun.
TARGET = {
    "01_5237_TCK":              "tck",
    "03_5442_ILIDARESI":        "ililaresi",
    "04_3713_TERORLE_MUCADELE": "terorle",
    "06_2803_JANDARMA":         "jandarmakanun",
    "07_7201_TEBLIGAT":         "tebligat",
    "08_6698_KVKK":             "kvkk",
    "10_5816_ATATURK_ALEYHINE": "ataturk",
    "11_2893_TURK_BAYRAGI":     "bayrak",
    "12_6284_AILENIN_KORUNMASI":"ailekoruma",
    "14_4678_SOZLESMELI_SB_ASB":"sozlesmeliasb",
    "16_KVK_SILME_ANONIM":      "kvksilme",
    "17_BILGI_EDINME_YON":      "bilgiedinme",
    "18_6136_ATESLI_SILAHLAR":  "atesli",
    "19_2521_TUFEKLER_YON":     "tufekler",
    "20_SOZLESMELI_SBASB_YON":  "sozlesmeliyon",
    "22_JGK_IZIN_YON":          "izinyon",
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
    m = re.match(r"^(.*?)\s+MADDE\s+(.+)$", name)
    if not m:
        tail = name.split(" ", 1)[1] if " " in name else "ozet"
        return goz(slug, tail)
    rest = m.group(2)
    toks = rest.split("-")
    t0 = toks[0]
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
        panel = san("_".join(body)) if body else "1"
        return f"{slug}_m{madde}_{panel}", "normal", str(madde)
    return goz(slug, rest)

def gercek_folder(prefix):
    """SRC_BASE altında prefix ile BAŞLAYAN gerçek klasör adını bulur (' TAMAM' eki vb.)."""
    for d in os.listdir(SRC_BASE):
        if d.startswith(prefix) and os.path.isdir(os.path.join(SRC_BASE, d)):
            return d
    return None

def main():
    toplam = 0
    for prefix, slug in TARGET.items():
        folder = gercek_folder(prefix)
        if not folder:
            print(f"!! kaynak klasor yok: {prefix}"); continue
        ses_dir = os.path.join(SRC_BASE, folder, "ses dosyaları")
        if not os.path.isdir(ses_dir):
            print(f"!! ses dosyalari yok: {folder}"); continue
        dest_dir = os.path.join(DEST_BASE, slug)
        if os.path.isdir(dest_dir): shutil.rmtree(dest_dir)
        os.makedirs(dest_dir)
        mp3ler = sorted(f for f in os.listdir(ses_dir) if f.lower().endswith(".mp3"))
        used = {}
        for f in mp3ler:
            base = os.path.splitext(f)[0]
            key, tip, label = parse(base, slug)
            if key in used:
                i = 2
                while f"{key}x{i}" in used: i += 1
                key = f"{key}x{i}"
            used[key] = True
            shutil.copy2(os.path.join(ses_dir, f), os.path.join(dest_dir, key + ".mp3"))
        toplam += len(mp3ler)
        print(f"[{slug}] {len(mp3ler)} mp3 -> assets/sesler/{slug}/")
    print(f"TOPLAM {toplam} mp3 yerlestirildi.")

if __name__ == "__main__":
    main()
