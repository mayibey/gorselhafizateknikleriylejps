// WebP'e geçişten sonra bucket'taki ESKİ .png orphan'larını siler (yer açar).
// Yerel her .webp'in .png kardeşini bucket'tan kaldırır (yoksa no-op). Çalıştır: node scripts/supabase-png-sil.mjs
import { createClient } from '@supabase/supabase-js';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

function envYukle() {
  let m;
  try {
    m = readFileSync('.env', 'utf8');
  } catch {
    return;
  }
  for (const s of m.split('\n')) {
    const x = s.match(/^\s*([\w.]+)\s*=\s*(.*?)\s*$/);
    if (x && process.env[x[1]] === undefined) process.env[x[1]] = x[2].replace(/^["']|["']$/g, '');
  }
}
envYukle();

const URL = process.env.SUPABASE_URL || process.env.EXPO_PUBLIC_SUPABASE_URL;
const KEY = process.env.SUPABASE_SERVICE_KEY;
const BUCKET = process.env.ICERIK_BUCKET || 'icerik';
if (!URL || !KEY) {
  console.error('SUPABASE_URL + SUPABASE_SERVICE_KEY gerekli');
  process.exit(1);
}
const supabase = createClient(URL, KEY, { auth: { persistSession: false } });

function topla(dir) {
  const r = [];
  for (const ad of readdirSync(dir)) {
    const t = join(dir, ad);
    if (statSync(t).isDirectory()) r.push(...topla(t));
    else if (/\.webp$/i.test(ad)) r.push(t);
  }
  return r;
}

const pngler = topla('assets/kartlar')
  .map((t) => relative('assets/kartlar', t).split(sep).join('/').replace(/\.webp$/i, '.png'));

console.log(`${pngler.length} olası .png siliniyor (orphan)...`);
let silindi = 0;
for (let i = 0; i < pngler.length; i += 100) {
  const grup = pngler.slice(i, i + 100);
  const { data, error } = await supabase.storage.from(BUCKET).remove(grup);
  if (error) console.error('  hata:', error.message);
  else silindi += data?.length ?? 0;
}
console.log(`Bitti: ${silindi} .png silindi.`);
