import { api } from './play-api.mjs';
const e = await api('/edits', { method: 'POST' });
const editId = e.body?.id;
if (!editId) { console.log('edit acilamadi:', JSON.stringify(e.body).slice(0, 200)); process.exit(1); }
for (const track of ['production', 'beta', 'internal']) {
  const r = await api(`/edits/${editId}/tracks/${track}`);
  const rel = (r.body?.releases ?? []).map((x) => `${x.status} · vCode ${(x.versionCodes ?? []).join(',')} · ${x.name ?? ''}`).join('  |  ');
  console.log(track.padEnd(11), rel || `(bos) ${r.status}`);
}
await api(`/edits/${editId}`, { method: 'DELETE' });
