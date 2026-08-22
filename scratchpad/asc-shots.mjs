import { api, jwt } from './asc.mjs';
import fs from 'node:fs';
import crypto from 'node:crypto';
const LOC = 'c3c76536-4aa2-4235-aaee-5be17d9b82f8';
const DISPLAY = 'APP_IPHONE_67'; // 1290x2796 = 6.7"
const KARE = [
  'kare-1-menu.png', 'kare-2-cengel.png', 'kare-3-bosluk.png',
  'kare-4-dogruyanlis.png', 'kare-5-asmaca.png', 'kare-6-rutbe.png',
];

// 1) Mevcut set var mi? (bu localization + displayType)
let setId = null;
const sets = await api(`appStoreVersionLocalizations/${LOC}/appScreenshotSets?limit=20&include=appScreenshots`);
for (const s of (sets.body?.data || [])) if (s.attributes.screenshotDisplayType === DISPLAY) setId = s.id;
if (setId) {
  console.log('Mevcut set bulundu:', setId, '— eski gorseller siliniyor...');
  const ex = await api(`appScreenshotSets/${setId}/appScreenshots?limit=20`);
  for (const sc of (ex.body?.data || [])) {
    const d = await api(`appScreenshots/${sc.id}`, { method: 'DELETE' });
    console.log('  eski sil', sc.id, d.status);
  }
} else {
  const r = await api('appScreenshotSets', { method: 'POST', body: JSON.stringify({ data: {
    type: 'appScreenshotSets',
    attributes: { screenshotDisplayType: DISPLAY },
    relationships: { appStoreVersionLocalization: { data: { type: 'appStoreVersionLocalizations', id: LOC } } },
  } }) });
  if (r.status !== 201) { console.log('SET OLUSTURMA HATA:', r.status, JSON.stringify(r.body).slice(0, 300)); process.exit(1); }
  setId = r.body.data.id;
  console.log('Yeni set:', setId);
}

const ids = [];
for (const ad of KARE) {
  const buf = fs.readFileSync('scratchpad/' + ad);
  const md5 = crypto.createHash('md5').update(buf).digest('hex');
  // a) rezerve
  const rr = await api('appScreenshots', { method: 'POST', body: JSON.stringify({ data: {
    type: 'appScreenshots',
    attributes: { fileName: ad, fileSize: buf.length },
    relationships: { appScreenshotSet: { data: { type: 'appScreenshotSets', id: setId } } },
  } }) });
  if (rr.status !== 201) { console.log('REZERVE HATA', ad, rr.status, JSON.stringify(rr.body).slice(0, 200)); continue; }
  const scId = rr.body.data.id;
  const ops = rr.body.data.attributes.uploadOperations || [];
  // b) yukle (her operation)
  for (const op of ops) {
    const headers = {}; for (const h of (op.requestHeaders || [])) headers[h.name] = h.value;
    const part = buf.subarray(op.offset, op.offset + op.length);
    const up = await fetch(op.url, { method: op.method, headers, body: part });
    if (!up.ok) { console.log('  YUKLEME HATA', ad, up.status); }
  }
  // c) onayla (checksum)
  const cm = await api(`appScreenshots/${scId}`, { method: 'PATCH', body: JSON.stringify({ data: {
    type: 'appScreenshots', id: scId, attributes: { uploaded: true, sourceFileChecksum: md5 },
  } }) });
  console.log('YUKLENDI', ad, '->', cm.status === 200 ? 'OK' : cm.status);
  ids.push(scId);
}
console.log('TOPLAM yuklenen gorsel:', ids.length, '/', KARE.length);
