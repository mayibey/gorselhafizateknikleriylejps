import crypto from 'node:crypto'; import fs from 'node:fs';
export const KEYID='RGL99F5D25', ISS='6ad2e590-a37b-41d0-bcd6-0462ff64781f', APPID='6787908212';
const KEYPATH='C:/Users/GIGABYTE/OneDrive/Desktop/AuthKey_RGL99F5D25.p8';
const key=fs.readFileSync(KEYPATH,'utf8');
const b64u=x=>Buffer.from(x).toString('base64url');
export function jwt(){
  const h=b64u(JSON.stringify({alg:'ES256',kid:KEYID,typ:'JWT'}));
  const now=Math.floor(Date.now()/1000);
  const p=b64u(JSON.stringify({iss:ISS,iat:now,exp:now+1100,aud:'appstoreconnect-v1'}));
  const sig=crypto.sign('SHA256',Buffer.from(h+'.'+p),{key,dsaEncoding:'ieee-p1363'}).toString('base64url');
  return `${h}.${p}.${sig}`;
}
export async function api(path,opts={}){
  const T=jwt();
  const url=path.startsWith('http')?path:'https://api.appstoreconnect.apple.com/v1/'+path;
  const r=await fetch(url,{...opts,headers:{Authorization:'Bearer '+T,'Content-Type':'application/json',...(opts.headers||{})}});
  let body=null; try{body=await r.json();}catch(e){}
  return {status:r.status, body};
}
// CLI: build durumu
if(process.argv[2]==='build'){
  const r=await api(`builds?filter[app]=${APPID}&sort=-uploadedDate&limit=6&fields[builds]=version,processingState,uploadedDate,expired`);
  if(r.status!==200){console.log('HATA',r.status,JSON.stringify(r.body).slice(0,300));process.exit(1);}
  console.log('SON BUILDLER:');
  for(const b of r.body.data) console.log(`  v${b.attributes.version}  ${b.attributes.processingState}  ${(b.attributes.uploadedDate||'').slice(0,16)}  expired=${b.attributes.expired}  id=${b.id}`);
}
