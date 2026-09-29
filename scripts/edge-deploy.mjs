// Edge Function'ı Supabase Management API ile yayınlar (CLI/Docker gerekmez).
//   node scripts/edge-deploy.mjs <slug>            örn: node scripts/edge-deploy.mjs imzali-url
// Kaynak: supabase/functions/<slug>/index.ts (+ aynı klasördeki diğer dosyalar). verify_jwt mevcut ayardan korunur.
// .env: SUPABASE_ACCESS_TOKEN (Management API kişisel jeton), EXPO_PUBLIC_SUPABASE_URL (proje ref buradan).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const KOK = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const env = Object.fromEntries(
  fs.readFileSync(path.join(KOK, '.env'), 'utf8').split(/\r?\n/).filter((l) => l.includes('=') && !l.startsWith('#')).map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]),
);
const TOKEN = env.SUPABASE_ACCESS_TOKEN;
const REF = /https:\/\/([a-z0-9]+)\.supabase\.co/.exec(env.EXPO_PUBLIC_SUPABASE_URL)?.[1];
const slug = process.argv[2];
if (!TOKEN || !REF || !slug) { console.error('SUPABASE_ACCESS_TOKEN / proje ref / slug eksik'); process.exit(1); }
const H = { Authorization: `Bearer ${TOKEN}` };
const API = `https://api.supabase.com/v1/projects/${REF}/functions`;

// mevcut ayar (verify_jwt) — yoksa true
let verify_jwt = true;
const mevcut = await fetch(`${API}/${slug}`, { headers: H });
if (mevcut.ok) { const j = await mevcut.json(); verify_jwt = j.verify_jwt !== false; console.log('mevcut sürüm:', j.version, '| verify_jwt:', verify_jwt); }
else console.log('mevcut fonksiyon okunamadı:', mevcut.status, '(yeni oluşturulacak)');

const klasor = path.join(KOK, 'supabase', 'functions', slug);
const dosyalar = fs.readdirSync(klasor).filter((f) => fs.statSync(path.join(klasor, f)).isFile());
const form = new FormData();
form.append('metadata', JSON.stringify({ name: slug, entrypoint_path: 'index.ts', verify_jwt }));
for (const f of dosyalar) form.append('file', new Blob([fs.readFileSync(path.join(klasor, f))]), f);
const r = await fetch(`${API}/deploy?slug=${slug}`, { method: 'POST', headers: H, body: form });
const metin = await r.text();
console.log('deploy:', r.status, metin.slice(0, 300));
if (!r.ok) process.exit(1);
const sonra = await fetch(`${API}/${slug}`, { headers: H }).then((x) => x.json());
console.log('yeni sürüm:', sonra.version, '| güncelleme:', new Date(sonra.updated_at).toISOString());
