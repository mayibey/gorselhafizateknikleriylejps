/**
 * 1.0.45'i tekrar incelemeye gönderir. Apple metadata düzenlemesinden hemen sonra
 * "Version is not ready to be submitted yet" diyebiliyor → belirli aralıklarla dener.
 */
import { api, APPID } from './asc.mjs';

const VID = '2d732a21-07c1-4d87-ac12-d1d65990f6c6';
const bekle = (ms) => new Promise((r) => setTimeout(r, ms));

async function acikSubmission() {
  const ex = await api(`apps/${APPID}/reviewSubmissions?filter[platform]=IOS&limit=10&fields[reviewSubmissions]=state`);
  for (const s of (ex.body?.data || [])) {
    if (['READY_FOR_REVIEW', 'UNRESOLVED_ISSUES'].includes(s.attributes.state)) return { id: s.id, state: s.attributes.state };
  }
  return null;
}

for (let tur = 1; tur <= 12; tur++) {
  const v = await api(`appStoreVersions/${VID}?fields[appStoreVersions]=appStoreState`);
  const durum = v.body?.data?.attributes?.appStoreState;
  let sub = await acikSubmission();

  if (!sub) {
    const r = await api('reviewSubmissions', { method: 'POST', body: JSON.stringify({ data: {
      type: 'reviewSubmissions', attributes: { platform: 'IOS' },
      relationships: { app: { data: { type: 'apps', id: APPID } } },
    } }) });
    if (r.status === 201) {
      sub = { id: r.body.data.id, state: 'YENI' };
      const it = await api('reviewSubmissionItems', { method: 'POST', body: JSON.stringify({ data: {
        type: 'reviewSubmissionItems',
        relationships: {
          reviewSubmission: { data: { type: 'reviewSubmissions', id: sub.id } },
          appStoreVersion: { data: { type: 'appStoreVersions', id: VID } },
        },
      } }) });
      console.log(`[tur ${tur}] yeni submission ${sub.id} · item ekle: ${it.status}`);
    } else {
      console.log(`[tur ${tur}] submission oluşturulamadı: ${r.status}`);
    }
  }

  if (sub) {
    const g = await api(`reviewSubmissions/${sub.id}`, { method: 'PATCH', body: JSON.stringify({ data: {
      type: 'reviewSubmissions', id: sub.id, attributes: { submitted: true },
    } }) });
    if (g.status === 200) {
      console.log(`[tur ${tur}] ✅ GÖNDERİLDİ — submission durumu: ${g.body.data.attributes.state}`);
      const v2 = await api(`appStoreVersions/${VID}?fields[appStoreVersions]=appStoreState`);
      console.log('sürüm durumu:', v2.body?.data?.attributes?.appStoreState);
      process.exit(0);
    }
    const d = JSON.stringify(g.body?.errors?.[0]?.meta ?? g.body?.errors?.[0]?.detail ?? g.body).slice(0, 160);
    console.log(`[tur ${tur}] sürüm=${durum} submission=${sub.state} → ${g.status} ${d}`);
  }
  if (tur < 12) await bekle(150000); // 2,5 dk
}
console.log('12 denemede gönderilemedi — panelden elle bakmak gerek.');
process.exit(1);
