import fs from 'node:fs';
import { spawn } from 'node:child_process';
const KOK = 'D:/GorselHafizaTeknikleriyleJSPS/scratchpad';
const HEDEF = 'C:/Users/GIGABYTE/OneDrive/Desktop/mevzu-oyun-denetim';
const PORT = 9473;
const bekle = (ms) => new Promise((r) => setTimeout(r, ms));
fs.mkdirSync(HEDEF, { recursive: true });

// [id, klasor, harita, acmaFn(sadece haritasizlar)]
const OYUNLAR = [
  ['cengel','01-Cengel',true],
  ['dy','02-DogruYanlis',false,'dyKur()'],
  ['milyoner','03-RutbeMerdiveni',false,'acMilyoner()'],
  ['asmaca','04-AdamAsmaca',true],
  ['ayrim','05-TCK-CMK-Kabahat',true],
  ['bosluk','06-BoslukDoldurma',true],
  ['terazi','07-CezaTerazisi',true],
  ['esles','08-KimYapar',true],
  ['sure','09-SureSeridi',true],
  ['sira','10-SirayaDiz',true],
  ['hangi','11-HangiKanun',true],
  ['yalan','12-YalanciMadde',true],
  ['kelime','13-GununMaddesi',false,'acKelime()'],
];

const ch = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe',
  ['--headless=new','--disable-gpu','--no-first-run',`--remote-debugging-port=${PORT}`,`--user-data-dir=${KOK}/chrome-tam`,'about:blank'],{stdio:'ignore'});
async function hedef(){for(let i=0;i<40;i++){try{const t=await(await fetch(`http://127.0.0.1:${PORT}/json`)).json();const p=t.find(x=>x.type==='page');if(p?.webSocketDebuggerUrl)return p.webSocketDebuggerUrl;}catch{}await bekle(300);}throw new Error('yok');}
function cdp(w){const ws=new WebSocket(w);let id=0;const b=new Map();ws.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.id&&b.has(m.id)){b.get(m.id)(m.result);b.delete(m.id);}});const hazir=new Promise(r=>ws.addEventListener('open',r));const g=(me,pa)=>new Promise(res=>{const i=++id;b.set(i,res);ws.send(JSON.stringify({id:i,method:me,params:pa}));});return{hazir,g};}
const evl=(c,e)=>c.g('Runtime.evaluate',{expression:e,returnByValue:true,awaitPromise:true}).then(r=>r?.result?.value);
async function ss(c,path){const s=await c.g('Page.captureScreenshot',{format:'png'});if(s?.data)fs.writeFileSync(path,Buffer.from(s.data,'base64'));}

const BULGULAR=[];
const LOG=[];
function say(...a){const s=a.join(' ');LOG.push(s);console.log(s);}

// govde tanilama: bos mi, tasma var mi
async function tani(c,etiket){
  const d=await evl(c,`(function(){var g=document.getElementById('govde');if(!g)return {yok:1};
    var t=(g.innerText||'').replace(/\\s+/g,' ').trim();
    return {len:t.length, sh:g.scrollHeight, ch:g.clientHeight, ilk:t.slice(0,60)};})()`);
  if(d&&d.len!==undefined){
    if(d.len<3) BULGULAR.push(`[BOŞ] ${etiket}: govde neredeyse boş (metin=${d.len})`);
  }
  return d;
}

// harita: govde'yi kaydirarak parca parca cek
async function haritaCek(c,dir){
  await evl(c,"document.getElementById('govde').scrollTop=0;1");await bekle(250);
  const sh=await evl(c,"document.getElementById('govde').scrollHeight");
  const ch=await evl(c,"document.getElementById('govde').clientHeight");
  let parca=Math.max(1,Math.ceil(sh/ch));
  if(parca>6)parca=6;
  for(let p=0;p<parca;p++){
    await evl(c,`document.getElementById('govde').scrollTop=${p}*(${ch}-40);1`);await bekle(300);
    await ss(c,`${dir}/harita-${p+1}.png`);
  }
  await evl(c,"document.getElementById('govde').scrollTop=0;1");await bekle(150);
  return parca;
}

try{
  const c=cdp(await hedef());await c.hazir;await c.g('Page.enable',{});await c.g('Runtime.enable',{});
  await c.g('Emulation.setDeviceMetricsOverride',{width:400,height:880,deviceScaleFactor:2,mobile:true});
  await c.g('Page.navigate',{url:`file:///${KOK}/canli-fix.html`});await bekle(2600);
  await evl(c,"try{premiumAyarla(true)}catch(e){};try{localStorage.setItem('mevzu_premium','1')}catch(e){};try{localStorage.setItem('mevzu_test_modu','1')}catch(e){};1");
  await evl(c,"try{if(typeof testModuAyarla==='function')testModuAyarla(true)}catch(e){};1");await bekle(400);
  // MENU
  await evl(c,"try{menu()}catch(e){}");await bekle(600);
  await ss(c,`${HEDEF}/00-menu.png`);
  await tani(c,'MENU');

  let toplamSS=0;
  for(const oy of OYUNLAR){
    const [oid,klas,harita,acFn]=oy;
    const dir=`${HEDEF}/${klas}`; fs.mkdirSync(dir,{recursive:true});
    say(`\n=== ${klas} (${oid}) harita=${harita} ===`);
    try{
      if(harita){
        // temayi kur + haritayi ac
        await evl(c,`try{acikOyun='${oid}';temaUygula('${oid}');haritaAc('${oid}');}catch(e){e.message}`);await bekle(750);
        const np=await haritaCek(c,dir); toplamSS+=np;
        say(`harita parca=${np}`);
        // bolum sayisi
        const n=await evl(c,"(BOLUM&&BOLUM.length)||0");
        say(`BOLUM.length=${n}`);
        // NASIL OYNANIR
        const nvar=await evl(c,`(function(){try{document.querySelectorAll('#tanitimOrtu').forEach(e=>e.remove());if(typeof tanitimAc==='function'&&NASIL['${oid}']){tanitimAc('${oid}',false);return 1;}return 0;}catch(e){return 'ERR:'+e.message}})()`);await bekle(600);
        if(nvar===1){await ss(c,`${dir}/nasil-oynanir.png`);toplamSS++;}
        else BULGULAR.push(`[NASIL YOK] ${klas}: nasil oynanir modali acilamadi (${nvar})`);
        await evl(c,"document.querySelectorAll('#tanitimOrtu').forEach(e=>e.remove());1");await bekle(200);
        // HER BOLUM
        let cevapAlindi=false;
        for(let i=0;i<n;i++){
          const r=await evl(c,`(function(){try{bolumBasla(${i});return 1;}catch(e){return 'ERR:'+e.message}})()`);
          await bekle(680);
          const p=String(i+1).padStart(2,'0');
          await ss(c,`${dir}/bolum-${p}-oyun.png`);toplamSS++;
          const d=await tani(c,`${klas} bolum ${i+1}`);
          if(r!==1) BULGULAR.push(`[HATA] ${klas} bolum ${i+1}: bolumBasla hata → ${r}`);
          // ilk bolumde cevap ekrani (sik/cip'li oyunlar)
          if(!cevapAlindi && (oid==='hangi'||oid==='ayrim'||oid==='terazi'||oid==='yalan'||oid==='bosluk')){
            const tik=await evl(c,`(function(){var b=document.querySelector('.sik,.cip');if(b){b.click();return 1;}return 0;})()`);
            await bekle(650);
            if(tik===1){await ss(c,`${dir}/cevap.png`);toplamSS++;cevapAlindi=true;
              // yeniden bolumu kur ki sonraki cekimler temiz
              await evl(c,`try{bolumBasla(${i})}catch(e){}`);await bekle(400);
            }
          }
        }
      } else {
        // HARITASIZ
        await evl(c,`try{acikOyun='${oid}';temaUygula('${oid}');${acFn}}catch(e){e.message}`);await bekle(900);
        await ss(c,`${dir}/oyun.png`);toplamSS++;
        await tani(c,`${klas} oyun`);
        // nasil
        const nvar=await evl(c,`(function(){try{document.querySelectorAll('#tanitimOrtu').forEach(e=>e.remove());if(typeof tanitimAc==='function'&&NASIL['${oid}']){tanitimAc('${oid}',false);return 1;}return 0;}catch(e){return 'ERR:'+e.message}})()`);await bekle(600);
        if(nvar===1){await ss(c,`${dir}/nasil-oynanir.png`);toplamSS++;}
        await evl(c,"document.querySelectorAll('#tanitimOrtu').forEach(e=>e.remove());1");await bekle(200);
        // birkac adim: bir sik/cevap tikla
        await ss(c,`${dir}/soru-1.png`);toplamSS++;
        const tik=await evl(c,`(function(){var b=document.querySelector('.sik,.cip,.dySik,.mSik,.mCik,button.dyCevap,.dyBtn');if(b){b.click();return b.className;}return 0;})()`);
        await bekle(750);
        await ss(c,`${dir}/cevap.png`);toplamSS++;
        say(`haritasiz tik=${tik}`);
      }
    }catch(e){ BULGULAR.push(`[COK HATA] ${klas}: ${e.message}`); say(`HATA ${klas}: ${e.message}`); }
    // menuye don
    await evl(c,"try{menu()}catch(e){}");await bekle(400);
  }
  say(`\nTOPLAM SS≈${toplamSS}`);
  say(`\n===== BULGULAR (${BULGULAR.length}) =====`);
  BULGULAR.forEach(b=>say(b));
  fs.writeFileSync(`${KOK}/denetim-log.txt`,LOG.join('\n'));
  fs.writeFileSync(`${KOK}/denetim-bulgular.json`,JSON.stringify(BULGULAR,null,2));
  say('BITTI');
}catch(e){console.log('GENEL HATA',e);}finally{ch.kill();}
