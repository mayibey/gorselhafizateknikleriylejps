import { api, APPID } from './asc.mjs';
const r=await api(`apps/${APPID}/appStoreVersions?limit=8&fields[appStoreVersions]=versionString,appStoreState,platform,createdDate`);
if(r.status!==200){console.log('HATA',r.status,JSON.stringify(r.body).slice(0,400));process.exit(1);}
console.log('APP STORE SURUMLERI:');
for(const v of r.body.data) console.log(`  ${v.attributes.versionString}  ${v.attributes.appStoreState}  ${v.attributes.platform}  id=${v.id}`);
