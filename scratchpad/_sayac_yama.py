# Ekim analiz sayfasina ziyaret sayaci (Supabase analiz_ziyaret; anon yalniz insert).
import os, io
URL = os.environ['EXPO_PUBLIC_SUPABASE_URL'].rstrip('/'); ANON = os.environ['EXPO_PUBLIC_SUPABASE_ANON_KEY']
JS = r'''
/* Ziyaret sayacı: kişisel veri yok; rastgele tarayıcı kimliği. ?ben=1 ile açan cihaz sayılmaz. */
const SAYAC=(()=>{
  const U='__URL__/rest/v1/analiz_ziyaret', K='__ANON__';
  let id='', ben=false;
  try{ if(new URLSearchParams(location.search).get('ben')==='1') localStorage.setItem('mz_ben','1'); ben=localStorage.getItem('mz_ben')==='1';
       id=localStorage.getItem('mz_zid')||''; if(!id){ id=(crypto.randomUUID?crypto.randomUUID():Math.random().toString(36).slice(2)+Date.now().toString(36)); localStorage.setItem('mz_zid',id); } }
  catch(_){ id='g'+Math.random().toString(36).slice(2,12); }
  const q=new URLSearchParams(location.search);
  let kaynak=q.get('utm_source')||q.get('k')||''; if(!kaynak&&document.referrer){ try{ kaynak=new URL(document.referrer).hostname; }catch(_){} }
  if(kaynak===location.hostname) kaynak='';
  const mobil=matchMedia('(max-width:700px)').matches;
  return (olay,br)=>{ if(ben) return; try{ fetch(U,{method:'POST',keepalive:true,headers:{apikey:K,Authorization:'Bearer '+K,'Content-Type':'application/json',Prefer:'return=minimal'},
    body:JSON.stringify({olay,brans:br||null,ziyaretci:id.slice(0,40),kaynak:kaynak.slice(0,80)||null,mobil})}).catch(()=>{}); }catch(_){} };
})();
let sayIlk=true; const sayGorulen=new Set();
new IntersectionObserver((es)=>{ for(const e of es) if(e.isIntersecting&&V.length&&!sayGorulen.has(brans)){ sayGorulen.add(brans); SAYAC('sorular',brans); } },{threshold:0}).observe(document.querySelector('#liste'));
'''.replace('__URL__', URL).replace('__ANON__', ANON)
for f in ['scratchpad/ekim10-site-sablon.html', 'docs/jsps2026ekimanaliz/index.html']:
    s = io.open(f, encoding='utf-8').read()
    if 'SAYAC(' in s: print('zaten var', f); continue
    a = "function sec(r,b){ suz='hepsi'; rutbe=r; brans=b ?? RUTBELER[r].branslar[0][0]; ciz(); }"
    b = "function sec(r,b){ suz='hepsi'; rutbe=r; brans=b ?? RUTBELER[r].branslar[0][0]; ciz(); SAYAC(sayIlk?'acilis':'brans',brans); sayIlk=false; }"
    assert s.count(a) == 1
    s = s.replace(a, JS.strip() + '\n' + b)
    io.open(f, 'w', encoding='utf-8', newline='').write(s); print('yamandi', f)
