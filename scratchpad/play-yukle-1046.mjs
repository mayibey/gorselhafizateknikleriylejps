/**
 * PLAY'E YÜKLE — 1.0.46 (versionCode 63), servis hesabı API'siyle. Tarayıcı gerekmez.
 *   node scratchpad/play-yukle-1046.mjs           → kuru prova (sadece bağlanır, bilgi verir)
 *   node scratchpad/play-yukle-1046.mjs --yukle   → yükler + üretim kanalına gönderir
 */
import fs from 'node:fs';
import crypto from 'node:crypto';

const SA = 'D:/mazzzza üstü/vızzz/mevzu-jsps-0857dbdd570f.json';
const AAB = 'D:/buildler/mevzu-1046-resign.aab';
const PAKET = 'app.mevzujsps.android';
const SURUM = '1.0.46';

const NOTLAR = `Tasarim bastan yenilendi: koyu tema uygulamanin tamamina geldi, Karargah sadelesti, Evsaf yeniden duzenlendi.
Er Meydani yeni gorunumuyle: lobi, mac, lig ve siralama ekranlari elden gecti.
Deneme sinavlari artik her kanunun kendi sayfasinda: Mevzuat'ta kanunu ac, Talim Yap ile o kanunun denemelerine gir.
Oyun Merkezi: 14 oyunla mevzuati oynayarak ogren.
Cesitli iyilestirmeler ve hata duzeltmeleri.`;

const sa = JSON.parse(fs.readFileSync(SA, 'utf8'));
const b64u = (x) => Buffer.from(x).toString('base64url');

async function token() {
  const now = Math.floor(Date.now() / 1000);
  const h = b64u(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const p = b64u(JSON.stringify({
    iss: sa.client_email, scope: 'https://www.googleapis.com/auth/androidpublisher',
    aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3500,
  }));
  const sig = crypto.sign('RSA-SHA256', Buffer.from(`${h}.${p}`), sa.private_key).toString('base64url');
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${h}.${p}.${sig}` }),
  });
  const j = await r.json();
  if (!j.access_token) throw new Error('token alinamadi: ' + JSON.stringify(j).slice(0, 200));
  return j.access_token;
}

const T = await token();
console.log('✅ Google yetkilendirme tamam ·', sa.client_email);
const H = { Authorization: `Bearer ${T}` };
const API = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${PAKET}`;

const boyut = fs.statSync(AAB).size;
console.log(`AAB: ${AAB} · ${(boyut / 1048576).toFixed(1)} MB`);

if (!process.argv.includes('--yukle')) {
  const t = await fetch(`${API}/edits`, { method: 'POST', headers: H });
  const e = await t.json();
  if (e.id) {
    const tr = await (await fetch(`${API}/edits/${e.id}/tracks/production`, { headers: H })).json();
    console.log('ÜRETİM KANALI ŞU AN:', JSON.stringify(tr.releases?.map((r) => ({ ad: r.name, kod: r.versionCodes, durum: r.status }))));
    await fetch(`${API}/edits/${e.id}`, { method: 'DELETE', headers: H });
  }
  console.log('\n(KURU PROVA — yüklemedi. Yüklemek için --yukle)');
  process.exit(0);
}

// 1) düzenleme aç
const edit = await (await fetch(`${API}/edits`, { method: 'POST', headers: H })).json();
console.log('düzenleme açıldı:', edit.id);

// 2) AAB yükle
console.log('AAB yükleniyor…');
const up = await fetch(
  `https://androidpublisher.googleapis.com/upload/androidpublisher/v3/applications/${PAKET}/edits/${edit.id}/bundles?uploadType=media`,
  { method: 'POST', headers: { ...H, 'Content-Type': 'application/octet-stream' }, body: fs.readFileSync(AAB) },
);
const bundle = await up.json();
if (!bundle.versionCode) { console.log('❌ YÜKLEME HATASI:', JSON.stringify(bundle).slice(0, 600)); process.exit(1); }
console.log('✅ yüklendi · versionCode', bundle.versionCode);

// 3) üretim kanalına koy
const tr = await fetch(`${API}/edits/${edit.id}/tracks/production`, {
  method: 'PUT', headers: { ...H, 'Content-Type': 'application/json' },
  body: JSON.stringify({ track: 'production', releases: [{
    name: SURUM, versionCodes: [String(bundle.versionCode)], status: 'completed',
    releaseNotes: [{ language: 'tr-TR', text: NOTLAR }],
  }] }),
});
const trj = await tr.json();
if (tr.status !== 200) { console.log('❌ KANAL HATASI:', JSON.stringify(trj).slice(0, 600)); process.exit(1); }
console.log('✅ üretim kanalına kondu');

// 4) onayla
const c = await fetch(`${API}/edits/${edit.id}:commit`, { method: 'POST', headers: H });
const cj = await c.json();
console.log(c.status === 200 ? '🚀 GÖNDERİLDİ — Play incelemesine düştü' : '❌ ONAY HATASI: ' + JSON.stringify(cj).slice(0, 600));
