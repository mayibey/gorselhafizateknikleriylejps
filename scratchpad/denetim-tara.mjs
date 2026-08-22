import fs from 'node:fs';
import { spawn } from 'node:child_process';
const KOK = 'D:/GorselHafizaTeknikleriyleJSPS/scratchpad';
const HEDEF = 'C:/Users/GIGABYTE/OneDrive/Desktop/mevzu-oyun-denetim';
const PORT = 9470;
const bekle = (ms) => new Promise((r) => setTimeout(r, ms));
fs.mkdirSync(HEDEF, { recursive: true });

// [id, ad, acmaIfadesi, haritaVar]
const OYUNLAR = [
  ['cengel','Cengel',"haritaAc('cengel')",true],
  ['dy','DogruYanlis','dyKur()',false],
  ['milyoner','RutbeMerdiveni','acMilyoner()',false],
  ['asmaca','AdamAsmaca',"haritaAc('asmaca')",true],
  ['ayrim','TCK-CMK-Kabahat',"haritaAc('ayrim')",true],
  ['bosluk','BoslukDoldurma',"haritaAc('bosluk')",true],
  ['terazi','CezaTerazisi',"haritaAc('terazi')",true],
  ['esles','KimYapar',"haritaAc('esles')",true],
  ['sure','SureSeridi',"haritaAc('sure')",true],
  ['sira','SirayaDiz',"haritaAc('sira')",true],
  ['hangi','HangiKanun',"haritaAc('hangi')",true],
  ['yalan','YalanciMadde',"haritaAc('yalan')",true],
  ['kelime','GununMaddesi','acKelime()',false],
];
const ch = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',
  ['--headless=new','--disable-gpu','--no-first-run',`--remote-debugging-port=${PORT}`,`--user-data-dir=${KOK}/chrome-den`,'about:blank'],{stdio:'ignore'});
async function hedef(){for(let i=0;i<40;i++){try{const t=await(await fetch(`http://127.0.0.1:${PORT}/json`)).json();const p=t.find(x=>x.type==='page');if(p?.webSocketDebuggerUrl)return p.webSocketDebuggerUrl;}catch{}await bekle(300);}throw new Error('yok');}
function cdp(w){const ws=new WebSocket(w);let id=0;const b=new Map();ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id&&b.has(m.id)){b.get(m.id)(m.result);b.delete(m.id);}});const hazir=new Promise(r=>ws.addEventListener('open',r));const g=(me,pa)=>new Promise(res=>{const i=++id;b.set(i,res);ws.send(JSON.stringify({id:i,method:me,params:pa}));});return{hazir,g};}
const evl=(c,e)=>c.g('Runtime.evaluate',{expression:e,returnByValue:true,awaitPromise:true}).then(r=>r?.result?.value);
async function ss(c,ad){const s=await c.g('Page.captureScreenshot',{format:'png'});if(s?.data)fs.writeFileSync(`${HEDEF}/${ad}.png`,Buffer.from(s.data,'base64'));}
try{
  const c=cdp(await hedef());await c.hazir;await c.g('Page.enable',{});await c.g('Runtime.enable',{});
  await c.g('Emulation.setDeviceMetricsOverride',{width:400,height:880,deviceScaleFactor:2,mobile:true});
  await c.g('Page.navigate',{url:`file:///${KOK}/canli-fix.html`});await bekle(2500);
  await evl(c,"try{premiumAyarla(true)}catch(e){};try{localStorage.setItem('mevzu_premium','1')}catch(e){};1");await bekle(400);
  // once oyun MENUSU
  await ss(c,'00-menu');
  let no=1;
  for(const [oid,ad,ac,harita] of OYUNLAR){
    const p=String(no).padStart(2,'0');
    try{
      await evl(c,`try{${ac}}catch(e){e.message}`);await bekle(1100);
      if(harita){ await ss(c,`${p}-${ad}-1harita`); } // bolum haritasi (cam parcalar)
      // NASIL OYNANIR modali
      const nasilVar=await evl(c,"(function(){var n=document.querySelector('#nasil');if(n){n.click();return true;}return false;})()");
      await bekle(700);
      if(nasilVar) await ss(c,`${p}-${ad}-2nasil`);
      await evl(c,"(function(){var k=document.querySelector('[aria-modal] .kapat,[aria-modal] button,#tanitimKapat,.modalKapat');if(k)k.click();document.querySelectorAll('[aria-modal]').forEach(m=>m.style.display='none');})()");
      await bekle(500);
      // OYUN ekrani (haritada ilk dugume gir)
      if(harita){ await evl(c,"(function(){var d=document.querySelector('#tel .dugum');if(d)d.click()})()");await bekle(900);
        await evl(c,"(function(){var d=document.querySelector('#tel .dugum');if(d)d.click();var pd=document.querySelector('.perde,.introDevam');if(pd)pd.click()})()");await bekle(1300); }
      await ss(c,`${p}-${ad}-3oyun`);
      console.log(`${ad}: harita=${harita} nasil=${nasilVar}`);
    }catch(e){console.log(`${ad}: HATA ${e.message}`);}
    no++;
  }
  console.log('BITTI → '+HEDEF);
}finally{ch.kill();}
