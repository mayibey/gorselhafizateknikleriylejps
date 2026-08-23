import { api } from './asc.mjs';
const APP='6787908212';
const r = await api(`apps/${APP}/appStoreVersions?limit=6&fields[appStoreVersions]=versionString,appStoreState,createdDate,releaseType`);
console.log('APP STORE SÜRÜMLERİ:');
for (const v of r.body?.data ?? []) {
  const a = v.attributes;
  console.log(`  ${String(a.versionString).padEnd(8)} ${String(a.appStoreState).padEnd(28)} ${String(a.createdDate).slice(0,10)}`);
}
