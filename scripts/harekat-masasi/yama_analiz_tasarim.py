# Check-up analizi üst bölüm tasarımı (başkan, 3 Eki sabah: "çok yer kaplıyor, kusurları bul düzelt").
# Kusurlar: 4 dev düğme (ok ayrı satırda + alt yazı) ekranın tamamını yiyordu; skor kartındaki uzun cümle "Yeni / kalan" düğmesini
# tekrarlıyordu; "yanlışlar aşağıda" ayrı tam satır; başlık "… Check-up" diye kesiliyordu.
# Yeni düzen: kompakt skor kartı (+ "N yeni soru · çöz" çipi) → tek ana düğme (Yanlışlarımın özeti, yatay) → küçük kutular satırı
# (Altın Özet · N yanlış soru · Yeniden çöz).
import os
KOK = os.path.dirname(os.path.abspath(__file__))
p = os.path.join(KOK, 'masa4.js'); s = open(p, encoding='utf-8').read()

r1 = "<h2>${esc(kisa(k))} Check-up</h2>"
assert s.count(r1) == 1
s = s.replace(r1, "<h2>${esc(kisa(k))}</h2>")

bas = s.index('  <section class="hzKart"><div class="hzIk">${IK.belge}</div><div class="hzMetin"><b class="hzSayi kucukSayi">${oz.d}')
son_isaret = "<small>bu kanunun bütün sorularıyla baştan</small></button>"
son = s.index(son_isaret, bas) + len(son_isaret)
yeni = r'''  <section class="hzKart anSkor"><div class="hzIk">${IK.belge}</div><div class="hzMetin"><span class="hzLbl">Check-up sonucu</span><b class="hzSayi kucukSayi">${oz.d}<small> / ${oz.n} doğru</small></b><div class="tipAltSatir">${bar(oran,oranRenk(oran))}<span class="tipYuzde">%${Math.round(oran*100)}</span></div>${kalanSorular(k,cu).length?`<button class="hzYeni" id="kalan">${kalanSorular(k,cu).length} yeni soru · çöz ${IK.sag}</button>`:''}</div></section>
  <div class="anUst">
    ${yanlislar.length?`<button class="anAna" id="yOzetAc"><span class="anIk">${IK.belge}</span><span class="anMetin"><b>Yanlışlarımın özeti</b><small>${yanlislar.length} yanlışın doğrusu ve nedeni, madde madde</small></span><span class="anOk">${IK.sag}</span></button>`:''}
    <div class="anIzgara">
      <button class="anKutu ${yanlislar.length?'':'dolu'}" id="ozetAc">${IK.kitap}<b>Altın Özet</b></button>
      ${yanlislar.length?`<button class="anKutu" id="asagiLink">${IK.hedef}<b>${yanlislar.length} yanlış soru</b></button>`:''}
      <button class="anKutu" id="yenidenUst">${IK.grafik}<b>Yeniden çöz</b></button>
    </div>
  </div>'''
s = s[:bas] + yeni + s[son:]
open(p, 'w', encoding='utf-8').write(s)

p = os.path.join(KOK, 'stil4.css'); c = open(p, encoding='utf-8').read()
c += """
/* Check-up analizi üst bölüm (3 Eki sabah): kompakt */
.anSkor{padding:12px 14px}.anSkor .hzIk{width:54px;height:54px}.anSkor .hzIk svg{width:24px;height:24px}
.hzYeni{margin-top:8px;display:inline-flex;align-items:center;gap:6px;padding:5px 11px;border-radius:999px;background:rgba(243,194,74,.16);border:1px solid rgba(243,194,74,.6);color:#F8D57A;font-size:12.5px;font-weight:800}.hzYeni svg{width:14px;height:14px}
.anUst{display:grid;gap:8px;margin-top:10px}
.anAna{display:grid;grid-template-columns:42px minmax(0,1fr) 18px;align-items:center;gap:12px;width:100%;padding:11px 14px;border-radius:14px;background:linear-gradient(180deg,#F8D57A,#F3C24A);color:#1b1406;text-align:left;box-shadow:0 6px 18px rgba(243,194,74,.22)}
.anAna .anIk{width:42px;height:42px;border-radius:11px;background:rgba(27,20,6,.12);display:grid;place-items:center}.anAna svg{width:21px;height:21px}
.anAna b{display:block;font-size:16px;font-weight:900;line-height:1.2}.anAna small{display:block;font-size:12.5px;font-weight:600;opacity:.8;margin-top:2px}
.anIzgara{display:flex;gap:8px}
.anKutu{flex:1;min-width:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;padding:10px 6px;border-radius:12px;border:1.5px solid rgba(243,194,74,.5);background:rgba(3,40,60,.55);color:#F8D57A}
.anKutu svg{width:21px;height:21px}.anKutu b{font-size:13px;font-weight:800;line-height:1.2;text-align:center}
.anKutu.dolu{background:linear-gradient(180deg,#F8D57A,#F3C24A);color:#1b1406;border-color:transparent}
"""
open(p, 'w', encoding='utf-8').write(c)
print('ok')
