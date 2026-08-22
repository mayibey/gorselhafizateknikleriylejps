import { api, APPID } from './asc.mjs';
const BUILD72='a201fd0d-7add-434b-bd34-89497d97e55c';
// 1) 1.0.45 surumu olustur
let r=await api('appStoreVersions',{method:'POST',body:JSON.stringify({data:{
  type:'appStoreVersions',
  attributes:{platform:'IOS',versionString:'1.0.45'},
  relationships:{app:{data:{type:'apps',id:APPID}}}
}})});
if(r.status!==201){
  console.log('SURUM OLUSTURMA:',r.status,JSON.stringify(r.body).slice(0,300));
  // zaten varsa bul
  const q=await api(`apps/${APPID}/appStoreVersions?filter[versionString]=1.0.45&limit=1`);
  if(q.body?.data?.[0]){ r={body:{data:q.body.data[0]}}; console.log('mevcut 1.0.45 bulundu'); }
  else process.exit(1);
}
const VID=r.body.data.id;
console.log('SURUM ID (1.0.45):',VID,'| durum:',r.body.data.attributes?.appStoreState);
// 2) build 72 bagla
const rb=await api(`appStoreVersions/${VID}/relationships/build`,{method:'PATCH',body:JSON.stringify({data:{type:'builds',id:BUILD72}})});
console.log('BUILD BAGLAMA:',rb.status, rb.status===204?'OK (build 72 bagli)':JSON.stringify(rb.body).slice(0,200));
console.log('VID='+VID);
