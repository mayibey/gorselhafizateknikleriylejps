# Geri gezinme (tarayıcı geçmişi ile), çift dokunma yakınlaşma kapalı, giriş manşeti.
import os
KOK = os.path.dirname(os.path.abspath(__file__))
p = os.path.join(KOK, 'masa4.js'); s = open(p, encoding='utf-8').read()


def r(a, b, hepsi=False):
    global s
    assert a in s, a[:70]
    s = s.replace(a, b) if hepsi else s.replace(a, b, 1)


# 1) ekran yığını: her ekran fonksiyonu başında iz bırakır; geri (kaydırma/ok/donanım) bir önceki ekranı açar
r("/* ---------- ölçüm ---------- */", r"""/* ---------- GERİ GEZİNME (başkan: "kaydırarak geri çok geriye atıyor") ----------
   Her ekran açılışında tarayıcı geçmişine bir kayıt düşer; geri hareketi bir önceki EKRANA döner (uygulamadan çıkmaz). */
const YIGIN=[];let POP=false;
function iz(f){ if(POP){POP=false;return;} YIGIN.push(f); try{history.pushState({n:YIGIN.length},'');}catch(e){} derinlikBildir(); }
window.addEventListener('popstate',()=>{ YIGIN.pop(); const f=YIGIN[YIGIN.length-1]; POP=true; if(f)f(); else {POP=false;YIGIN.length=0;giris();} });
function derinlikBildir(){ try{ if(window.ReactNativeWebView) window.ReactNativeWebView.postMessage(JSON.stringify({tip:'derinlik',n:YIGIN.length})); }catch(e){} }
window.merkezGeri=function(){ if(YIGIN.length>1){history.back();return true;} return false; };

/* ---------- ölçüm ---------- */""")
# iz() çağrıları
r("function giris(){\n  document.body.classList.remove('sinavda');document.body.classList.add('giriste');window.scrollTo({top:0});S=null;",
  "function giris(){\n  YIGIN.length=0;POP=false;try{history.replaceState({n:0},'');}catch(e){}derinlikBildir();\n  document.body.classList.remove('sinavda');document.body.classList.add('giriste');window.scrollTo({top:0});S=null;")
for ad, imza in [
  ("rontgenSayfa", "function rontgenSayfa(){\n"),
  ("checkupListe", "function checkupListe(){\n"),
]:
    r(imza, imza + f"  iz({ad});\n")
r("function rontgenSonuc(Rsec,geriHedef){\n", "function rontgenSonuc(Rsec,geriHedef){\n  iz(()=>rontgenSonuc(Rsec,geriHedef));\n")
r("function checkupAnaliz(id,geriHedef){\n", "function checkupAnaliz(id,geriHedef){\n  iz(()=>checkupAnaliz(id,geriHedef));\n")
r("function ozet(id,geriHedef,sekme){\n", "function ozet(id,geriHedef,sekme){\n  iz(()=>ozet(id,geriHedef,sekme));\n")
r("function kanunListesi(mod){\n", "function kanunListesi(mod){\n  iz(()=>kanunListesi(mod));\n")
r("function konuNotu(id){\n", "function konuNotu(id){\n  iz(()=>konuNotu(id));\n")
# soru ekranı: yalnız test başlarken iz (her soruda değil); geri → duraklat + önceki ekran
r("function basla(sorular,ad,meta){if(!sorular.length){toast('Soru bulunamadı.');return;}S={sorular,ad,i:0,cevap:{},meta:meta||{}};soruCiz();}",
  "function basla(sorular,ad,meta){if(!sorular.length){toast('Soru bulunamadı.');return;}S={sorular,ad,i:0,cevap:{},meta:meta||{}};iz(()=>{if(!aktifDevam())giris();});soruCiz();}")
r("function aktifDevam(){const a=K.aktif;if(!a||!a.ids)return false;const sorular=a.ids.map(id=>TUM[id]).filter(Boolean);if(!sorular.length){K.aktif=null;return false;}\n  S={sorular,ad:a.ad,i:Math.min(a.i||0,sorular.length-1),cevap:a.cevap||{},meta:a.meta||{}};soruCiz();return true;}",
  "function aktifDevam(){const a=K.aktif;if(!a||!a.ids)return false;const sorular=a.ids.map(id=>TUM[id]).filter(Boolean);if(!sorular.length){K.aktif=null;return false;}\n  S={sorular,ad:a.ad,i:Math.min(a.i||0,sorular.length-1),cevap:a.cevap||{},meta:a.meta||{}};iz(()=>{if(!aktifDevam())giris();});soruCiz();return true;}")
# ekran içi geri düğmeleri de tarayıcı geçmişiyle çalışsın (tutarlı olsun)
r("  $('#geri').onclick=()=>{const t=S.meta.tur;aktifKaydet();S=null;t==='rontgen'?rontgenSayfa():t==='checkup'?checkupListe():giris();};",
  "  $('#geri').onclick=()=>{aktifKaydet();S=null;if(!window.merkezGeri())giris();};")
# sonuç ekranlarında S=null bırakılıyor; içeride S kullanılan geri yolları merkezGeri'ye
r("  $('#geri').onclick=()=>geriHedef?geriHedef():rontgenSayfa();$('#yenile').onclick=rontgenBaslat;",
  "  $('#geri').onclick=()=>{if(!window.merkezGeri())rontgenSayfa();};$('#yenile').onclick=rontgenBaslat;")
r("  $('#geri').onclick=()=>geriHedef?geriHedef():checkupListe();$('#ozetAc').onclick=",
  "  $('#geri').onclick=()=>{if(!window.merkezGeri())checkupListe();};$('#ozetAc').onclick=")
r("  $('#geri').onclick=()=>geriHedef?geriHedef():giris();\n  document.querySelectorAll('#ozSekme button')",
  "  $('#geri').onclick=()=>{if(!window.merkezGeri())giris();};\n  document.querySelectorAll('#ozSekme button')")
r("  $('#geri').onclick=giris;$('#cek').onclick=", "  $('#geri').onclick=()=>{if(!window.merkezGeri())giris();};$('#cek').onclick=")
r("  $('#geri').onclick=giris;if($('#ozetlerim'))", "  $('#geri').onclick=()=>{if(!window.merkezGeri())giris();};if($('#ozetlerim'))")
# sekme değişimi yeni ekran sayılmasın: özet sekmesi / kapsam değişimi POP bayrağıyla
r("  document.querySelectorAll('#ozSekme button').forEach(b=>b.onclick=()=>ozet(id,geriHedef,b.dataset.s));",
  "  document.querySelectorAll('#ozSekme button').forEach(b=>b.onclick=()=>{YIGIN.pop();history.back;POP=true;ozet(id,geriHedef,b.dataset.s);});")
r("  document.querySelectorAll('#kpSec button').forEach(b=>b.onclick=()=>{K.g=b.dataset.g;kaydet();checkupListe();});",
  "  document.querySelectorAll('#kpSec button').forEach(b=>b.onclick=()=>{K.g=b.dataset.g;kaydet();YIGIN.pop();POP=true;checkupListe();});")
# 2) giriş manşeti
r('    <div class="gSinava">SINAVA</div>',
  '    <h2 class="gManset">EKSİKLERİNİ<br><em>HIZLICA</em> NOKTA ATIŞI<br>TESPİT ET</h2>\n    <div class="gSinava">SINAVA</div>')
r('    <p class="gSlogan">Eksiğini bul.<br>Nokta atışıyla kapat.</p>\n', '')
open(p, 'w', encoding='utf-8').write(s)

p = os.path.join(KOK, 'stil4.css'); s = open(p, encoding='utf-8').read()
s += """
/* çift dokunma yakınlaşması kapalı */
html,body,button,.kap{touch-action:manipulation}
/* giriş manşeti */
.gManset{margin:22px 0 0;font-family:var(--baslik);font-weight:800;font-size:clamp(26px,7.6vw,36px);line-height:1.08;color:#fff;letter-spacing:.3px;text-shadow:0 2px 12px rgba(0,20,30,.85),0 0 24px rgba(243,194,74,.25)}
.gManset em{font-style:normal;color:var(--altin2)}
.gSinava{margin-top:22px}
.gGun b{font-size:46px}
"""
open(p, 'w', encoding='utf-8').write(s)

p = os.path.join(KOK, 'kur2.py'); s = open(p, encoding='utf-8').read()
s = s.replace('content="width=device-width,initial-scale=1,viewport-fit=cover"', 'content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover"')
open(p, 'w', encoding='utf-8').write(s)
print('ok')
