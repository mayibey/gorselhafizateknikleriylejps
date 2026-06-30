// gorsel Edge Function testi (P2 geliştirme aracı): test kullanıcısı → JWT → fonksiyon → webp mi?
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';

const env = {};
for (const l of readFileSync('.env', 'utf8').split('\n')) {
  const m = l.match(/^\s*([\w.]+)\s*=\s*(.*?)\s*$/);
  if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
}
const URL = env.EXPO_PUBLIC_SUPABASE_URL;
const ANON = env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
const SVC = env.SUPABASE_SERVICE_KEY;

const admin = createClient(URL, SVC, { auth: { persistSession: false } });
const eposta = `wmtest_${Math.floor(Math.random() * 1e6)}@example.com`;
const sifre = 'Test!2345abc';
const { data: olustur, error: oHata } = await admin.auth.admin.createUser({ email: eposta, password: sifre, email_confirm: true });
if (oHata) { console.error('kullanici:', oHata.message); process.exit(1); }
const uid = olustur.user.id;

const anon = createClient(URL, ANON, { auth: { persistSession: false } });
const { data: oturum, error: gHata } = await anon.auth.signInWithPassword({ email: eposta, password: sifre });
if (gHata) { console.error('giris:', gHata.message); await admin.auth.admin.deleteUser(uid); process.exit(1); }
const jwt = oturum.session.access_token;

const res = await fetch(`${URL}/functions/v1/gorsel?yol=tck/tck_m1_1.webp`, {
  headers: { Authorization: `Bearer ${jwt}`, apikey: ANON },
});
const ct = res.headers.get('content-type');
const buf = new Uint8Array(await res.arrayBuffer());
const webpMi = buf.length > 12 && buf[0] === 0x52 && buf[8] === 0x57 && buf[9] === 0x45;
console.log(`HTTP ${res.status} · ${ct} · ${buf.length} bayt`);
console.log(`gecerli WEBP: ${webpMi ? 'EVET ✓' : 'HAYIR'}`);
if (!webpMi) console.log('govde:', new TextDecoder().decode(buf).slice(0, 400));

await admin.auth.admin.deleteUser(uid);
