import { api } from './asc.mjs';
const APP='6787908212';
const r = await api(`apps/${APP}/reviewSubmissions?limit=5&fields[reviewSubmissions]=state,submitted,submittedDate,platform&include=items`);
console.log('İNCELEME GÖNDERİMLERİ:');
for (const s of r.body?.data ?? []) {
  const a = s.attributes;
  console.log(`  ${String(a.submittedDate ?? '-').slice(0,16).padEnd(17)} state=${String(a.state).padEnd(22)} submitted=${a.submitted} · ${(s.relationships?.items?.data ?? []).length} kalem`);
}
const v = await api(`apps/${APP}/appStoreVersions?limit=2&fields[appStoreVersions]=versionString,appStoreState,createdDate`);
console.log('\nSÜRÜM DURUMU:');
for (const x of v.body?.data ?? []) console.log(`  ${x.attributes.versionString}  ${x.attributes.appStoreState}`);
