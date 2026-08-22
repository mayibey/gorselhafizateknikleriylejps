import { spawn } from 'node:child_process';
const KEY = 'C:/Users/GIGABYTE/OneDrive/Desktop/mevzu-jsps-59639-firebase-adminsdk-fbsvc-9ef9cb207a.json';
const strip = s => s.replace(/\x1b\[[0-9;?]*[a-zA-Z]/g,'').replace(/\x1b[=>]/g,'').replace(/\r/g,'');
const child = spawn('winpty', ['cmd','/c','npx eas credentials -p android'], {
  cwd:'D:/GorselHafizaTeknikleriyleJSPS',
  env:{...process.env, TMPDIR:'D:/easbuild-tmp', TEMP:'D:/easbuild-tmp', TMP:'D:/easbuild-tmp'},
});
let buf='';
child.stdout.on('data',d=>{buf+=d.toString();process.stdout.write(d.toString());});
child.stderr.on('data',d=>{buf+=d.toString();});
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const send=s=>child.stdin.write(s);
const DOWN='\x1b[B', ENTER='\r';
async function waitFor(sub, tmo=45000){
  const t0=Date.now();
  while(Date.now()-t0<tmo){ if(strip(buf).includes(sub)) return true; await sleep(250); }
  throw new Error('BEKLEME ASILDI: "'+sub+'"');
}
// bir menude hedef metni iceren secenegin indexini (0-based, tepeden) bul; markPos sonrasi cikti icinde
function optionsSince(markPos){
  const s=strip(buf).slice(markPos).split('\n');
  // inquirer secenek satirlari: genelde "❯ " veya "  " ile baslar
  const opts=[];
  for(const ln of s){
    const m=ln.match(/^\s*(❯|>)?\s+(.*\S)\s*$/);
    if(m && /[A-Za-z]/.test(m[2]) && !/\?|Input is required|eas-cli|npm notice|Proceeding/.test(m[2])){
      opts.push(m[2]);
    }
  }
  return opts;
}
async function pickByText(target){
  await sleep(1000); // render otursun
  const mark = 0; // tum buffer; en son menu en sonda
  const stripped = strip(buf).split('\n');
  // en son "❯" isaretli bloktan itibaren secenekleri topla
  let lastQ=-1;
  for(let i=stripped.length-1;i>=0;i--){ if(stripped[i].includes('❯')){ lastQ=i; break; } }
  // bloktaki tum secenek satirlarini (ardisik) al
  let start=lastQ, end=lastQ;
  while(start-1>=0 && /^\s*(❯|\s)\s*\S/.test(stripped[start-1]) && !stripped[start-1].includes('?')) start--;
  while(end+1<stripped.length && /^\s*(❯|\s)\s*\S/.test(stripped[end+1]) && stripped[end+1].trim()) end++;
  const block=stripped.slice(start,end+1).map(l=>l.replace(/❯/g,' ').trim()).filter(Boolean);
  const idx=block.findIndex(o=>o.includes(target));
  console.log('\n[SURUCU] menu secenekleri:', JSON.stringify(block), '| hedef:', target, '| index:', idx);
  if(idx<0) throw new Error('HEDEF SECENEK YOK: "'+target+'" | menu: '+JSON.stringify(block));
  for(let k=0;k<idx;k++){ send(DOWN); await sleep(180); }
  await sleep(200); send(ENTER); await sleep(1200);
}
(async()=>{
  try{
    await waitFor('build profile');
    await pickByText('production');
    // Android ust menu
    await waitFor('Google Service Account');
    await pickByText('Google Service Account');
    // GSA alt menu -> FCM V1
    await waitFor('FCM V1');
    await pickByText('Push Notifications (FCM V1)');
    // FCM V1 menu -> Set up / Change / Upload
    await sleep(1500);
    const s=strip(buf);
    let hedef = s.includes('Set up a Google Service Account Key for Push Notifications')?'Set up a Google Service Account Key for Push Notifications'
      : s.includes('Change the Google Service Account Key')?'Change the Google Service Account Key'
      : s.includes('Upload')?'Upload':null;
    console.log('[SURUCU] FCM V1 menu hedefi:', hedef);
    if(!hedef){ console.log('[SURUCU] FCM V1 menusu taninmadi, DURDUM. Ekran:\n'+s.slice(-1200)); child.kill(); process.exit(2); }
    await pickByText(hedef);
    // olasi "upload new" alt secimi
    await sleep(1500);
    const s2=strip(buf);
    if(/Upload a new|upload a new/.test(s2) && !/Path|path/.test(s2.slice(-400))){
      await pickByText('Upload a new');
    }
    // path prompt
    await waitFor('path', 30000).catch(()=>{});
    await sleep(800);
    console.log('[SURUCU] anahtar yolu yaziliyor');
    send(KEY); await sleep(400); send(ENTER);
    // tamamlanma / dogrulama
    await sleep(6000);
    const fin=strip(buf);
    console.log('\n[SURUCU] SON EKRAN:\n'+fin.slice(-1500));
    child.kill(); process.exit(0);
  }catch(e){
    console.log('\n[SURUCU HATA]', e.message);
    console.log('SON EKRAN:\n'+strip(buf).slice(-1500));
    child.kill(); process.exit(1);
  }
})();
