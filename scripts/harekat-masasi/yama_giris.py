# Giriş sayfası: başkanın beğendiği taslak (hero + iki seçim kartı + alt nav). Arka plan bizim gece zemini.
import os
KOK = os.path.dirname(os.path.abspath(__file__))
p = os.path.join(KOK, 'masa2.js'); s = open(p, encoding='utf-8').read()
bas = s.index('/* ---------- GİRİŞ ---------- */'); son = s.index('/* ---------- soru seçimi ---------- */')
yeni = r"""/* ---------- GİRİŞ ---------- */
const IK={
 saat:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
 belge:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4M10 12h5M10 16h5"/></svg>',
 soru:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 015 0c0 1.8-2.5 2-2.5 3.5M12 17h.01"/></svg>',
 radar:'<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="24" cy="24" r="17"/><circle cx="24" cy="24" r="9" opacity=".7"/><circle cx="24" cy="24" r="3" fill="currentColor" stroke="none"/><path d="M24 7v6M24 35v6M7 24h6M35 24h6" stroke-linecap="round"/><path d="M24 24l12-9" stroke-linecap="round"/></svg>',
 tara:'<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 8h16l8 8v10"/><path d="M28 8v8h8M12 8v32h14"/><path d="M17 20h11M17 26h8"/><circle cx="33" cy="33" r="6"/><path d="M37.5 37.5L42 42"/></svg>',
 simsek:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L4 14h7l-1 8 9-12h-7z"/></svg>',
 cubuk:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M5 19v-4M10 19v-8M15 19v-12M20 19V4"/></svg>',
 tik:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M6 12.5l4 4 8-9"/></svg>',
 kitap:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 5h7a2 2 0 012 2v13a2 2 0 00-2-2H3zM21 5h-7a2 2 0 00-2 2v13a2 2 0 012-2h7z"/></svg>',
 ok:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
};
function giris(){
  document.body.classList.remove('sinavda');window.scrollTo({top:0});
  const g=kalanGun(), ks=kapsamKanun();
  const rSoru=ks.reduce((a,k)=>a+(w(k.id)>=4?2:1),0), rDk=Math.max(4,Math.round(rSoru*0.3));
  $('#ekran').innerHTML=`
  <section class="hero">
    <span class="gunRozet">${IK.saat}<span>SINAVA ${g} GÜN</span></span>
    <h2 class="heroBas">EKSİĞİNİ BUL.<em>İSTER KANUNDA, İSTER MADDEDE.</em></h2>
    <p class="heroAlt">Hızlıca tarat ya da madde madde in.<br>Nerede açık verdiğini bulalım.</p>
  </section>
  <div class="kpSatir"><span>Kapsam:</span>${kpSecici()}</div>
  <section class="secKart">
    <div class="secUst"><div class="secIkon">${IK.radar}</div><div class="secBaslik"><h3>Hızlı Röntgen</h3><div class="secMeta"><span>${IK.saat}~${rDk} dk</span><i></i><span>${IK.belge}~${rSoru} soru</span></div></div><span class="secRozet">${IK.simsek}HIZLI</span></div>
    <p class="secAc">Kanun bazında analiz çıkarır. Hangi kanunlarda açık verdiğini kısa sürede bulur.</p>
    <ul class="secListe"><li>${IK.tik}Kanun eksiği</li><li>${IK.tik}Soru tipi zaafı</li><li>${IK.tik}İlk eksik listesi</li></ul>
    <button class="secBtn" id="bRontgen">RÖNTGENİ BAŞLAT ${IK.ok}</button>
  </section>
  <section class="secKart">
    <div class="secUst"><div class="secIkon">${IK.tara}</div><div class="secBaslik"><h3>Detaylı Check-up</h3><div class="secMeta"><span>${IK.belge}${ks.length} bölüm</span><i></i><span>${IK.soru}8–12 soru / bölüm</span></div></div><span class="secRozet">${IK.cubuk}DERİN TARAMA</span></div>
    <p class="secAc">Kanun maddesi seviyesinde tarar. Hangi maddelerde açık verdiğini bölüm bölüm gösterir.</p>
    <ul class="secListe"><li>${IK.tik}Madde madde eksik</li><li>${IK.tik}Bölüm bölüm ilerleme</li><li>${IK.tik}Daha net teşhis</li></ul>
    <button class="secBtn" id="bCheckup">CHECK-UP'A BAŞLA ${IK.ok}</button>
  </section>
  <nav class="altNav"><button id="lNot">${IK.kitap}Konu notları</button><i></i><button id="lBanka">${IK.belge}Soru bankası</button><i></i><button id="lProva">${IK.cubuk}Prova</button></nav>`;
  kpBagla(ana);
  $('#bRontgen').onclick=()=>rontgenBaslat(false);$('#bCheckup').onclick=checkupListe;
  $('#lNot').onclick=dahaFazla;$('#lBanka').onclick=dahaFazla;
  $('#lProva').onclick=()=>basla([...karistir(KANUN.filter(k=>k.g==='mus').flatMap(k=>k.q)).slice(0,50),...karistir(KANUN.filter(k=>k.g==='mebs').flatMap(k=>k.q)).slice(0,30)],'Sınav provası',{tani:false,tur:'prova'});
}

"""
s = s[:bas] + yeni + s[son:]
s = s.replace('const kpSecici=()=>`<div class="ara kpSec" id="kpSec">', 'const kpSecici=()=>`<div class="kpSec" id="kpSec">')
open(p, 'w', encoding='utf-8').write(s)

p = os.path.join(KOK, 'kur2.py'); s = open(p, encoding='utf-8').read()
eski = ".kpSec{justify-content:center;margin:6px 0 14px;gap:8px}.kpSec .anahtar{font-size:14px;padding:8px 18px}"
assert eski in s
s = s.replace(eski, """
/* giriş: hero + seçim kartları (başkanın beğendiği taslak); arka plan bizim gece zemini */
.hero{text-align:center;padding:8px 0 6px}
.gunRozet{display:inline-flex;align-items:center;gap:8px;padding:8px 18px;border-radius:999px;border:1.5px solid var(--altin);color:var(--altin2);font-family:var(--mono);font-weight:700;font-size:13px;letter-spacing:1.5px;background:rgba(3,40,60,.55)}
.gunRozet svg{width:16px;height:16px}
.heroBas{font-family:var(--baslik);font-weight:800;font-size:clamp(30px,8.5vw,44px);line-height:1.05;margin:14px 0 8px;color:#fff;letter-spacing:.5px;text-shadow:0 2px 10px rgba(0,20,30,.7)}
.heroBas em{display:block;font-style:normal;color:var(--altin2);font-size:.72em;margin-top:6px}
.heroAlt{margin:0 auto;max-width:34ch;color:#E6EEF1;font-size:16px;line-height:1.45;text-shadow:0 1px 6px rgba(0,20,30,.9)}
.kpSatir{display:flex;align-items:center;justify-content:center;gap:10px;margin:16px 0 14px;flex-wrap:wrap}.kpSatir>span{color:#E6EEF1;font-size:15px;text-shadow:0 1px 4px rgba(0,20,30,.9)}
.kpSec{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;margin:0}
.kpSec .anahtar{font-size:15px;padding:10px 22px;border-radius:999px;border:1.5px solid rgba(67,203,218,.45);background:rgba(3,47,69,.7);color:#E6EEF1;font-weight:600}
.kpSec .anahtar[aria-pressed="true"]{border-color:var(--altin);background:rgba(243,194,74,.14);color:var(--altin2);font-weight:800}
#ekran>.kpSec{margin-bottom:14px}
.secKart{border:1.5px solid var(--altin);border-radius:22px;padding:18px 16px 16px;background:linear-gradient(180deg,rgba(3,40,60,.92),rgba(2,30,46,.94));margin-bottom:16px;display:flex;flex-direction:column;gap:12px}
.secUst{display:flex;align-items:center;gap:12px}
.secIkon{width:60px;height:60px;border-radius:14px;border:1.5px solid rgba(243,194,74,.55);background:rgba(3,47,69,.6);display:grid;place-items:center;color:var(--altin2);flex:none}
.secIkon svg{width:38px;height:38px}
.secBaslik{flex:1;min-width:0}.secBaslik h3{font-family:var(--baslik);font-size:clamp(24px,6.5vw,32px);margin:0 0 4px;color:#fff;line-height:1.05}
.secMeta{display:flex;align-items:center;gap:10px;color:#DCEBEF;font-size:14px;flex-wrap:wrap}.secMeta span{display:inline-flex;align-items:center;gap:6px}.secMeta svg{width:16px;height:16px;color:var(--altin2)}.secMeta i{width:1px;height:16px;background:rgba(220,235,239,.35)}
.secRozet{display:inline-flex;align-items:center;gap:5px;padding:6px 12px;border-radius:999px;background:var(--altin);color:#1b1406;font-weight:800;font-size:11.5px;letter-spacing:.6px;white-space:nowrap;align-self:flex-start}.secRozet svg{width:13px;height:13px}
.secAc{margin:0;font-size:15.5px;line-height:1.5;color:#F2EEE4;padding-bottom:12px;border-bottom:1px solid rgba(67,203,218,.25)}
.secListe{list-style:none;margin:0;padding:0;display:grid;gap:8px}.secListe li{display:flex;align-items:center;gap:12px;font-size:15.5px;color:#F2EEE4}
.secListe svg{width:22px;height:22px;padding:4px;border-radius:50%;background:var(--altin);color:#1b1406;flex:none}
.secBtn{width:100%;padding:15px 18px;border-radius:14px;background:linear-gradient(180deg,#F8D57A,#F3C24A);color:#1b1406;font-weight:900;font-size:18px;letter-spacing:.6px;display:flex;align-items:center;justify-content:center;gap:10px;box-shadow:0 6px 20px rgba(243,194,74,.25)}
.secBtn svg{width:22px;height:22px}.secBtn:hover{filter:brightness(1.06)}
.altNav{display:flex;align-items:center;justify-content:center;gap:14px;margin-top:6px;flex-wrap:wrap}
.altNav button{display:inline-flex;align-items:center;gap:8px;color:#E6EEF1;font-weight:600;font-size:15px;padding:6px 4px;text-shadow:0 1px 4px rgba(0,20,30,.9)}.altNav svg{width:20px;height:20px;color:#E6EEF1}.altNav i{width:1px;height:18px;background:rgba(220,235,239,.35)}
@media (max-width:400px){.secRozet{font-size:10.5px;padding:5px 9px}.secUst{flex-wrap:wrap}}""")
open(p, 'w', encoding='utf-8').write(s)
print('ok')
