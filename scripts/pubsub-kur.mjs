/**
 * GOOGLE PUB/SUB KURULUMU — Play'in iade/abonelik bildirimlerini anlık almak için.
 *
 * ÖNCE BAŞKANIN YAPACAĞI İKİ ŞEY (Google Cloud Console, proje: mevzu-jsps):
 *   1. Pub/Sub API'sini aç:
 *      https://console.cloud.google.com/apis/library/pubsub.googleapis.com?project=mevzu-jsps
 *   2. Servis hesabına yetki ver (IAM › Erişim izni ver):
 *      Üye : play-dogrulama@mevzu-jsps.iam.gserviceaccount.com
 *      Rol : Pub/Sub Admin
 *
 * SONRA (biz çalıştırırız):
 *   node scripts/pubsub-kur.mjs
 * Bu betik şunları yapar:
 *   - `play-bildirim` konusunu oluşturur
 *   - Google Play'in o konuya yazabilmesi için yayıncı yetkisini verir
 *   - Bildirimleri sunucumuza ileten push aboneliğini kurar
 *
 * EN SON, yine başkan (Play Console › Monetization setup › Real-time developer notifications):
 *   Konu adı: projects/mevzu-jsps/topics/play-bildirim  → kaydet → "Send test notification"
 *
 * Betik TEKRAR ÇALIŞTIRILABİLİR: zaten varsa "zaten vardı" der, bozmaz.
 */
import fs from 'node:fs';
import crypto from 'node:crypto';

const SA_YOL = 'D:/mazzzza üstü/vızzz/mevzu-jsps-0857dbdd570f.json';
const KONU = 'play-bildirim';
const ABONELIK = 'play-bildirim-sunucu';
const UC = 'https://vwmjrvolkbiofpkzzwef.supabase.co/functions/v1/magaza-bildirim';
/** Google Play'in bildirimleri yayınlamak için kullandığı sabit sistem hesabı. */
const PLAY_HESABI = 'serviceAccount:google-play-developer-notifications@system.gserviceaccount.com';

const sa = JSON.parse(fs.readFileSync(SA_YOL, 'utf8'));
const PROJE = sa.project_id;
const b64u = (x) => Buffer.from(x).toString('base64url');

async function jeton() {
  const n = Math.floor(Date.now() / 1000);
  const h = b64u(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const p = b64u(JSON.stringify({
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/cloud-platform',
    aud: 'https://oauth2.googleapis.com/token',
    iat: n, exp: n + 3500,
  }));
  const s = crypto.sign('RSA-SHA256', Buffer.from(`${h}.${p}`), sa.private_key).toString('base64url');
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${h}.${p}.${s}` }),
  });
  const j = await r.json();
  if (!j.access_token) throw new Error('Google jetonu alınamadı: ' + JSON.stringify(j).slice(0, 200));
  return j.access_token;
}

const t = await jeton();
const cagir = async (yol, secenek = {}) => {
  const r = await fetch(`https://pubsub.googleapis.com/v1/${yol}`, {
    ...secenek,
    headers: { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json', ...(secenek.headers ?? {}) },
  });
  let g = {};
  try { g = JSON.parse(await r.text()); } catch { /* boş gövde */ }
  return { http: r.status, g };
};

const anahtarUyarisi = (http, g) => {
  if (http === 403 && String(g?.error?.message ?? '').includes('has not been used in project')) {
    console.log('\n⛔ Pub/Sub API kapalı. Başkanın açması gerekiyor:');
    console.log('   https://console.cloud.google.com/apis/library/pubsub.googleapis.com?project=' + PROJE);
    process.exit(1);
  }
  if (http === 403) {
    console.log('\n⛔ Servis hesabının yetkisi yok. IAM\'de şu üyeye "Pub/Sub Admin" rolü verilmeli:');
    console.log('   ' + sa.client_email);
    console.log('   Google cevabı: ' + String(g?.error?.message ?? '').slice(0, 160));
    process.exit(1);
  }
};

// 1) Konu
let r = await cagir(`projects/${PROJE}/topics/${KONU}`, { method: 'PUT', body: '{}' });
anahtarUyarisi(r.http, r.g);
console.log(r.http === 200 ? '✅ konu oluşturuldu' : r.http === 409 ? 'ℹ️  konu zaten vardı' : `konu HTTP ${r.http} ${JSON.stringify(r.g).slice(0, 160)}`);

// 2) Google Play'e o konuya yazma yetkisi (mevcut politikayı KORUYARAK ekle)
r = await cagir(`projects/${PROJE}/topics/${KONU}:getIamPolicy`);
anahtarUyarisi(r.http, r.g);
const politika = r.http === 200 ? r.g : { bindings: [] };
politika.bindings = politika.bindings ?? [];
let bag = politika.bindings.find((b) => b.role === 'roles/pubsub.publisher');
if (!bag) { bag = { role: 'roles/pubsub.publisher', members: [] }; politika.bindings.push(bag); }
if (!bag.members.includes(PLAY_HESABI)) {
  bag.members.push(PLAY_HESABI);
  r = await cagir(`projects/${PROJE}/topics/${KONU}:setIamPolicy`, { method: 'POST', body: JSON.stringify({ policy: politika }) });
  anahtarUyarisi(r.http, r.g);
  console.log(r.http === 200 ? '✅ Google Play yayıncı yetkisi verildi' : `yetki HTTP ${r.http} ${JSON.stringify(r.g).slice(0, 160)}`);
} else {
  console.log('ℹ️  Google Play yetkisi zaten vardı');
}

// 3) Push aboneliği → sunucumuz
const anahtar = process.env.MAGAZA_BILDIRIM_ANAHTARI
  ?? fs.readFileSync('scratchpad/_magaza_bildirim_anahtari.txt', 'utf8').trim();
r = await cagir(`projects/${PROJE}/subscriptions/${ABONELIK}`, {
  method: 'PUT',
  body: JSON.stringify({
    topic: `projects/${PROJE}/topics/${KONU}`,
    pushConfig: { pushEndpoint: `${UC}?anahtar=${anahtar}` },
    ackDeadlineSeconds: 60,
    // Ulaşamazsak Google bir süre artan aralıkla tekrar dener; sonsuza kadar denemesin diye 7 gün.
    messageRetentionDuration: '604800s',
  }),
});
anahtarUyarisi(r.http, r.g);
console.log(r.http === 200 ? '✅ push aboneliği kuruldu' : r.http === 409 ? 'ℹ️  abonelik zaten vardı' : `abonelik HTTP ${r.http} ${JSON.stringify(r.g).slice(0, 200)}`);

console.log(`\nSON ADIM (başkan, Play Console › Monetization setup › Real-time developer notifications):`);
console.log(`   Konu adı: projects/${PROJE}/topics/${KONU}`);
console.log(`   Kaydet → "Send test notification" → sonra bana söyle, canlı kayıttan doğrularım.`);
