# Sınav Provası 2 — ajan kuralları (7 Eki 2026)

İlk prova sitede binlerce aday tarafından çözüldü ve "Atatürk Üniversitesi düzeyinde" diye övüldü. Adaylar AYNI AYARDA ikinci deneme istiyor.
Sınav 10 Ekim. **Tek bir yanlış cevap bile kabul edilmez.** Doğruluk birinci, hız ikinci.

## Temel kurallar
`scripts/premium-deneme/BRANS_AJAN_KURALLARI.md` dosyasını BAŞTAN SONA oku ve harfiyen uygula (soru biçimi, kaynak = yalnız paket metni,
mülga/TL/dipnot yasağı, 3A Ek-1 madde kapsamı, tip dağılımı, ATA-AÖF tarzı, çeldirici kuralları, doğrulama adımları).
Aşağıdakiler o dosyadaki ilgili maddelerin YERİNE geçer:

## 1. Çıktı ve kaydetme
- Sana verilen dosya adına yaz: `scripts/premium-deneme/kaynak/tahmin2-<ad>.json` (JSON dizi, UTF-8, `ensure_ascii=False`).
- **Her 10 soruda bir dosyayı diske yaz** (yarım kalırsan iş kaybolmasın). Devam ederken önce dosya var mı bak, varsa kaldığın yerden sürdür.
- Başka HİÇBİR dosyayı değiştirme, git çalıştırma, site üreticilerini (birlestir/aciklama/prova-uret/brans-ekle) ÇALIŞTIRMA.

## 2. YENİ deneme = YENİ bilgi (EN ÖNEMLİ)
- Bu deneme, aynı adayların az önce çözdüğü 1. provanın DEVAMI. **1. provada sorulmuş bir bilgiyi tekrar sorma** — aynı madde
  cümlesinden, aynı sayıdan/süreden/makamdan soru YASAK (farklı kalıpla sorsan bile).
- 1. prova dosyaları: sana verilen "1. prova kaynakları" listesi. Önce hepsini oku, her sorunun `kanit` cümlelerini bir listeye çıkar;
  yeni sorunun kanıtı bunlardan biriyle aynı cümle/aynı bilgi olmasın. Kontrol için şu betiği çalıştır (0 çıkmalı):
  ```
  python -X utf8 -c "import json,re,sys;n=lambda t:re.sub(r'[^0-9a-zçğıöşü]','',t.replace('İ','i').replace('I','ı').lower());E={n(k) for f in sys.argv[2:] for q in json.load(open(f,encoding='utf-8')) for k in q['kanit']};Y=json.load(open(sys.argv[1],encoding='utf-8'));c=[i for i,q in enumerate(Y,1) if any(n(k) in E or any(n(k) in e or e in n(k) for e in E if len(e)>40) for k in q['kanit'])];print('cakisan',c)" <yeni dosya> <1. prova dosyaları...>
  ```
- İptal edilen 2026 sınav kitapçığı (sana verilmişse): aynı bilgiyi sorma.
- Aynı mevzuatın 1. provada SORULMAMIŞ maddelerine yönel; dağılım aşağıda.

## 3. Dağılım
- Kanun (law) dağılımı, sana verilen "hedef dağılım"a ±1 uysun (1. provayla aynı ağırlık = gerçek sınav ağırlığı).
- Öncüllü sorularda doğru cevabı DENGELE: hep "I ve II" yazma (8 Eki: 1. provada 79/100 "I ve II" çıktı, ezberle işaretleniyordu). I ve III, II ve III, Yalnız …, hepsi dağılsın.
- Tip: 40 soruda ~28-30 duz, 6-8 olumsuz, 2-3 oncullu, 1-2 vaka (10/30 soruluk dosyada orantılı).
- Zorluk: 1. prova ayarında — ezber değil, dikkat isteyen sayı/süre/makam/istisna soruları ağırlıkta; bariz çeldirici yok.

## 4. Bitirmeden zorunlu doğrulama
1. `python -X utf8 scripts/premium-deneme/denetle.py <dosya> <paket klasörü>` → sorunlu 0.
2. Yukarıdaki çakışma betiği → `cakisan []`.
3. `python -X utf8 scripts/premium-deneme/tahmin/kapsam-denetle.py` → kendi dosyan için satır yok.
4. Sayı, tip dağılımı, her soruda 5 farklı şık (BRANS_AJAN_KURALLARI 6.4).
5. Her soruyu paketteki maddenin TAMAMIYLA tek tek yeniden oku (s[0] kesin doğru, diğer 4 kesin yanlış, kök mevzuatı = law).

## 5. Rapor (kısa)
Dosya, soru sayısı, tip ve law dağılımı, denetle/çakışma/kapsam sonuçları, emin olmadığın soru (olmamalı).
