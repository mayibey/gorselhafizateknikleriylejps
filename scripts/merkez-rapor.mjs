// Harekât Merkezi kullanım raporu: kim açtı, kaçı kilide takıldı, kaçı soru çözmeye başladı.
//   node scripts/merkez-rapor.mjs [gün=7]
// Kaynak: merkez_olay (olaylar) + merkez_ilerleme (kayıtlı ilerleme) + auth kullanıcı e-postası (servis anahtarı).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const KOK = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const env = Object.fromEntries(
  fs.readFileSync(path.join(KOK, '.env'), 'utf8').split(/\r?\n/).filter((l) => l.includes('=') && !l.startsWith('#')).map((l) => [l.slice(0, l.indexOf('=')).trim(), l.slice(l.indexOf('=') + 1).trim()]),
);
const URL_ = env.EXPO_PUBLIC_SUPABASE_URL, KEY = env.SUPABASE_SERVICE_KEY;
const H = { apikey: KEY, Authorization: `Bearer ${KEY}` };
const GUN = Number(process.argv[2] || 7);
const BASKAN = '98be2c62-4309-4960-9ef3-0a2e032d2f4a';
const bas = new Date(Date.now() - GUN * 86400000).toISOString();

const olaylar = await fetch(`${URL_}/rest/v1/merkez_olay?select=user_id,olay,ayrinti,premium,brans,zaman&zaman=gte.${bas}&order=zaman.asc&limit=5000`, { headers: H }).then((r) => r.json());
const ilerleme = await fetch(`${URL_}/rest/v1/merkez_ilerleme?select=user_id,guncelleme,veri`, { headers: H }).then((r) => r.json());
if (!Array.isArray(olaylar)) { console.error('olay okunamadı:', olaylar); process.exit(1); }

const kisi = new Map();
for (const o of olaylar) {
  const k = kisi.get(o.user_id) ?? { acti: 0, kilit: 0, basladi: 0, premium: o.premium, brans: o.brans, son: o.zaman, kilitNerede: new Set() };
  if (o.olay === 'acti') k.acti++;
  else if (o.olay === 'kilit') { k.kilit++; if (o.ayrinti?.nerede) k.kilitNerede.add(o.ayrinti.nerede); }
  else k.basladi++;
  k.premium = o.premium ?? k.premium; k.brans = o.brans ?? k.brans; k.son = o.zaman;
  kisi.set(o.user_id, k);
}
const eposta = async (id) => {
  try { const u = await fetch(`${URL_}/auth/v1/admin/users/${id}`, { headers: H }).then((r) => r.json()); return u.email ?? id.slice(0, 8); } catch { return id.slice(0, 8); }
};
const tr = (z) => new Date(z).toLocaleString('tr-TR', { timeZone: 'Europe/Istanbul', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });

const disardan = [...kisi.entries()].filter(([id]) => id !== BASKAN);
const uye = disardan.filter(([, k]) => k.premium === true).length;
const kilitte = disardan.filter(([, k]) => k.kilit > 0).length;
const baslayan = disardan.filter(([, k]) => k.basladi > 0).length;
console.log(`Son ${GUN} gün — Harekât Merkezi (başkan hariç)`);
console.log(`  açan kişi: ${disardan.length}  (üye ${uye} · üye olmayan ${disardan.length - uye})`);
console.log(`  kilide takılan: ${kilitte}  ·  soru çözmeye/özete başlayan: ${baslayan}`);
console.log(`  toplam olay: ${olaylar.length}  ·  ilerleme kaydı olan: ${ilerleme.filter((r) => r.user_id !== BASKAN).length}`);
if (disardan.length) {
  console.log('\n  kişi                          üye  branş       açış  kilit  başlama  son');
  for (const [id, k] of disardan.sort((a, b) => b[1].son.localeCompare(a[1].son))) {
    const e = await eposta(id);
    console.log(`  ${e.padEnd(30).slice(0, 30)} ${k.premium ? 'evet' : 'hayır'} ${String(k.brans ?? '-').padEnd(11)} ${String(k.acti).padStart(4)} ${String(k.kilit).padStart(6)}${k.kilitNerede.size ? ' (' + [...k.kilitNerede].join(',') + ')' : ''} ${String(k.basladi).padStart(8)}  ${tr(k.son)}`);
  }
}
const b = kisi.get(BASKAN);
if (b) console.log(`\n  (başkan: açış ${b.acti} · başlama ${b.basladi})`);
