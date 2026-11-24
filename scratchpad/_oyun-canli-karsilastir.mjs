// Sunucudaki güncel oyun sayfası ile yerel üretilmiş sayfayı karşılaştır (anahtar ekrana yazılmaz).
import fs from 'node:fs';
const env = Object.fromEntries(fs.readFileSync('.env', 'utf8').split(/\r?\n/).filter((l) => l.includes('=')).map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim().replace(/^"|"$/g, '')]));
const URL_ = env.EXPO_PUBLIC_SUPABASE_URL || env.SUPABASE_URL;
const KEY = env.SUPABASE_SERVICE_KEY;
const ts = fs.readFileSync('src/assets/oyun-merkezi-html.ts', 'utf8');
const yerel = JSON.parse(ts.slice(ts.indexOf('= "') + 2, ts.lastIndexOf('";') + 1));
const r = await fetch(`${URL_}/storage/v1/object/icerik/oyun/oyun-merkezi-${process.argv[2]}.html`, { headers: { Authorization: 'Bearer ' + KEY, apikey: KEY } });
const canli = await r.text();
console.log('durum', r.status, 'canli bayt', Buffer.byteLength(canli), 'yerel bayt', Buffer.byteLength(yerel));
let i = 0; while (i < canli.length && canli[i] === yerel[i]) i++;
let j = 0; while (j < canli.length - i && canli[canli.length - 1 - j] === yerel[yerel.length - 1 - j]) j++;
console.log('ilk fark', i, 'sondan', j, '\nCANLI:', canli.slice(i, canli.length - j).slice(0, 300), '\nYEREL:', yerel.slice(i, yerel.length - j).slice(0, 300));
