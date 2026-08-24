/** Play Developer API — googleapis paketi olmadan (JWT + REST). */
import fs from 'node:fs';
import crypto from 'node:crypto';
const KEY = JSON.parse(fs.readFileSync('D:/mazzzza üstü/vızzz/mevzu-jsps-0857dbdd570f.json', 'utf8'));
const b64 = (o) => Buffer.from(typeof o === 'string' ? o : JSON.stringify(o)).toString('base64url');
const simdi = Math.floor(Date.now() / 1000);
const govde = b64({ alg: 'RS256', typ: 'JWT' }) + '.' + b64({
  iss: KEY.client_email, scope: 'https://www.googleapis.com/auth/androidpublisher',
  aud: 'https://oauth2.googleapis.com/token', iat: simdi, exp: simdi + 3600,
});
const imza = crypto.createSign('RSA-SHA256').update(govde).sign(KEY.private_key, 'base64url');
const tok = await (await fetch('https://oauth2.googleapis.com/token', {
  method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${govde}.${imza}` }),
})).json();
if (!tok.access_token) { console.log('TOKEN HATA:', JSON.stringify(tok).slice(0, 300)); process.exit(1); }
export const AT = tok.access_token;
export const PKG = 'app.mevzujsps.android';
export async function api(yol, opt = {}) {
  const r = await fetch(`https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${PKG}${yol}`, {
    ...opt, headers: { Authorization: `Bearer ${AT}`, 'Content-Type': 'application/json', ...(opt.headers ?? {}) },
  });
  const t = await r.text();
  return { status: r.status, body: t ? JSON.parse(t) : null };
}
