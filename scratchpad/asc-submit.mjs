import { api, APPID } from './asc.mjs';
const VID = '2d732a21-07c1-4d87-ac12-d1d65990f6c6';

// 1) Acik reviewSubmission var mi (submit edilmemis)
let subId = null;
const ex = await api(`apps/${APPID}/reviewSubmissions?filter[platform]=IOS&limit=10&fields[reviewSubmissions]=state,platform`);
for (const s of (ex.body?.data || [])) {
  if (['READY_FOR_REVIEW', 'UNRESOLVED_ISSUES', 'CANCELING'].includes(s.attributes.state)) { subId = s.id; console.log('mevcut acik submission:', subId, s.attributes.state); }
}
// 2) yoksa olustur
if (!subId) {
  const r = await api('reviewSubmissions', { method: 'POST', body: JSON.stringify({ data: {
    type: 'reviewSubmissions', attributes: { platform: 'IOS' },
    relationships: { app: { data: { type: 'apps', id: APPID } } },
  } }) });
  if (r.status !== 201) { console.log('SUBMISSION OLUSTURMA:', r.status, JSON.stringify(r.body).slice(0, 400)); process.exit(1); }
  subId = r.body.data.id;
  console.log('yeni submission:', subId);
}
// 3) surumu ekle (item)
const it = await api('reviewSubmissionItems', { method: 'POST', body: JSON.stringify({ data: {
  type: 'reviewSubmissionItems',
  relationships: {
    reviewSubmission: { data: { type: 'reviewSubmissions', id: subId } },
    appStoreVersion: { data: { type: 'appStoreVersions', id: VID } },
  },
} }) });
console.log('ITEM EKLE:', it.status, it.status === 201 ? 'OK (surum submission\'a eklendi)' : JSON.stringify(it.body).slice(0, 300));
// 4) submit
const sub = await api(`reviewSubmissions/${subId}`, { method: 'PATCH', body: JSON.stringify({ data: {
  type: 'reviewSubmissions', id: subId, attributes: { submitted: true },
} }) });
console.log('SUBMIT:', sub.status, sub.status === 200 ? 'GONDERILDI ✓' : JSON.stringify(sub.body).slice(0, 500));
if (sub.status === 200) console.log('DURUM:', sub.body.data.attributes.state);
