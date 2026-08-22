import { api } from './asc.mjs';
const VID='2d732a21-07c1-4d87-ac12-d1d65990f6c6';
const r=await api(`appStoreVersions/${VID}/appStoreVersionLocalizations?limit=10&fields[appStoreVersionLocalizations]=locale,description,keywords`);
console.log('LOKALIZASYONLAR:');
for(const l of r.body.data) console.log(`  ${l.attributes.locale}  id=${l.id}  aciklama=${(l.attributes.description||'').length} karakter`);
console.log('LIST='+r.body.data.map(l=>l.attributes.locale+':'+l.id).join(','));
