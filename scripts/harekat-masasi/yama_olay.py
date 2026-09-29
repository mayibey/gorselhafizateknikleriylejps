# Kullanım olayları (30 Eyl): sayfa uygulamaya {tip:'olay', olay, ayrinti} yollar; uygulama merkez_olay tablosuna yazar.
import os
KOK = os.path.dirname(os.path.abspath(__file__))
p = os.path.join(KOK, 'masa4.js'); s = open(p, encoding='utf-8').read()


def r(a, b):
    global s
    assert s.count(a) == 1, (a[:70], s.count(a))
    s = s.replace(a, b)


r("""function kilit(){ if(PREMIUM)return false; if(RN())RN().postMessage(JSON.stringify({tip:'paywall'})); else toast('Bu bölüm Tam Erişim üyelerine özel.'); return true; }""",
  """function olay(ad,ayrinti){ try{ if(RN())RN().postMessage(JSON.stringify({tip:'olay',olay:ad,ayrinti:ayrinti||{}})); }catch(e){} }
function kilit(nerede){ if(PREMIUM){olay(nerede);return false;} olay('kilit',{nerede}); if(RN())RN().postMessage(JSON.stringify({tip:'paywall'})); else toast('Bu bölüm Tam Erişim üyelerine özel.'); return true; }""")
r("function rontgenBaslat(){ if(kilit())return;", "function rontgenBaslat(){ if(kilit('rontgen'))return;")
r("function checkupBolum(id,sadeceKalan){ if(kilit())return;", "function checkupBolum(id,sadeceKalan){ if(kilit('checkup'))return;")
r("function ozet(id,geriHedef,sekme,hedefM){ if(kilit())return;", "function ozet(id,geriHedef,sekme,hedefM){ if(kilit('ozet'))return;")
r("function aktifDevam(){if(kilit())return false;", "function aktifDevam(){if(kilit('devam'))return false;")
open(p, 'w', encoding='utf-8').write(s)
print('ok')
