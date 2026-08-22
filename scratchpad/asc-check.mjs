import { api } from './asc.mjs';
const SET='cf83ba22-0ba8-4e20-a08a-d8643aeb3d4e';
const r=await api(`appScreenshotSets/${SET}/appScreenshots?limit=10&fields[appScreenshots]=fileName,assetDeliveryState`);
console.log('GORSEL DURUMLARI:');
let ok=0;
for(const s of (r.body?.data||[])){const st=s.attributes.assetDeliveryState?.state; console.log(`  ${s.attributes.fileName}: ${st} ${JSON.stringify(s.attributes.assetDeliveryState?.errors||[]).slice(0,80)}`); if(st==='COMPLETE')ok++;}
console.log('COMPLETE:',ok,'/',r.body?.data?.length);
