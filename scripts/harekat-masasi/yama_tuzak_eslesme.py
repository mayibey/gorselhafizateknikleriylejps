# Altın Özet (başkan, 3 Eki): "Sözleşmeli subay rütbelerinin Doğrusu'nda 'Sözleşme 3-9 yıl' yazıyor, saçma; başka varsa bul düzelt."
# Sebep: kanunun "Yanlıştır" tuzakları yalnız MADDE NUMARASIYLA eşleniyordu → m.3'teki her noktaya (tanım, subay rütbeleri,
# astsubay rütbeleri…) aynı tuzak + aynı "Doğrusu" basılıyordu. Düzeltme: her tuzak, aynı maddedeki noktalar içinden İÇERİĞİ en çok
# örtüşen TEK noktaya bağlanır (kelime/sayı örtüşmesi, eşik altıysa hiçbirine bağlanmaz → ayrı "Sınavın tuzağı" kartı).
# Ayrıca yanlış ifadeler '"1-3 yıl", "2-9 yıl"' biçiminde bozuk tırnakla görünüyordu → her parça ayrı ve “…” içinde.
import os
KOK = os.path.dirname(os.path.abspath(__file__))
p = os.path.join(KOK, 'masa4.js'); s = open(p, encoding='utf-8').read()


def r(a, b):
    global s
    assert s.count(a) == 1, (a[:70], s.count(a))
    s = s.replace(a, b)


r("""  const kart=(n,kk)=>{kk=kk||k;const mm=n.m[0];const ekTz=mm?kk.tz.filter(z=>tzMadde0(z)===mm):[];ekTz.forEach(z=>kullanilanTz.add(kk.id+'-tz'+kk.tz.indexOf(z)));
    const yanlislar=[...new Set([n.t,...ekTz.flatMap(z=>tirnakSil0(z.y).split(/"\\s*\\/\\s*"/).map(tirnakSil0))].filter(Boolean))];""",
  """  // TUZAK → NOKTA EŞLEŞMESİ (içerikle): aynı maddedeki noktalardan kelime/sayı örtüşmesi en yüksek olana; eşik 2.
  const tzEsle=kk=>{ if(kk._tzEs)return kk._tzEs; const kel=t=>new Set(String(t||'').toLocaleLowerCase('tr').replace(/[^a-zçğıöşü0-9\\-\\/ ]/g,' ').split(/\\s+/).filter(w=>w.length>=4||/\\d/.test(w)));
    const es={}; kk.tz.forEach((z,zi)=>{const m=tzMadde0(z);if(!m)return;const zk=kel(z.d+' '+z.y);let en=null,enP=0;
      for(const n of kk.n){if(!n.m.includes(m))continue;const nk=kel(n.b+' '+n.h+' '+(n.t||''));let p=0;zk.forEach(w=>{if(nk.has(w))p+=(/\\d/.test(w)?2:1);});if(p>enP){enP=p;en=n;}}
      if(en&&enP>=2)(es[en.i]=es[en.i]||[]).push(zi);}); return kk._tzEs=es; };
  const parcala=y=>String(y||'').split(/"\\s*(?:\\/|,|veya|ya da)\\s*"/).map(tirnakSil0).filter(Boolean).map(x=>'“'+x+'”');
  const kart=(n,kk)=>{kk=kk||k;const mm=n.m[0];const ekTz=(tzEsle(kk)[n.i]||[]).map(zi=>kk.tz[zi]);ekTz.forEach(z=>kullanilanTz.add(kk.id+'-tz'+kk.tz.indexOf(z)));
    const yanlislar=[...new Set([n.t,...ekTz.flatMap(z=>parcala(z.y))].filter(Boolean))];""")
# ayrı "Sınavın tuzağı" kartında da aynı parçalama
r("""${tirnakSil(z.y).split(/"\\s*\\/\\s*"/).map(x=>`<p>“${esc(tirnakSil(x))}”</p>`).join('')}""",
  """${parcala(z.y).map(x=>`<p>${esc(x)}</p>`).join('')}""")
open(p, 'w', encoding='utf-8').write(s)
print('ok')
