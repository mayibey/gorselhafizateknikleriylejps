/**
 * KULLANICI İLERLEME PANOSU — veri üreteci.
 *
 * Supabase'den (service key) kullanıcı ilerlemesi + profil + üyelik haklarını çeker,
 * panonun beklediği sadeleştirilmiş JSON'u yazar. HTML birleştirme `pano-uret.mjs`te.
 *
 * ÇIKTI: <hedef>/pano-veri.json   (varsayılan: scratchpad)
 * ÇALIŞTIR: node scripts/pano-veri-uret.mjs [cikti-klasoru]
 *
 * NOT: .env'deki SUPABASE_SERVICE_KEY gerekir. Bu dosya anahtarı ASLA yazdırmaz,
 *      çıktı JSON'una da koymaz.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const kok = join(dirname(fileURLToPath(import.meta.url)), '..');
const cikti = process.argv[2] || kok;

const env = readFileSync(join(kok, '.env'), 'utf8');
const oku = (k) => (env.match(new RegExp('^' + k + '=(.*)$', 'm')) || [])[1]?.trim();
const URL_ = oku('EXPO_PUBLIC_SUPABASE_URL');
const KEY = oku('SUPABASE_SERVICE_KEY');
if (!URL_ || !KEY) throw new Error('.env içinde EXPO_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_KEY yok');
const H = { apikey: KEY, Authorization: 'Bearer ' + KEY };

/** Sayfalayarak tüm satırları çeker (PostgREST varsayılan 1000 sınırını aşar). */
async function tumu(yol, adim = 200) {
  const hepsi = [];
  for (let off = 0; ; off += adim) {
    const ayrac = yol.includes('?') ? '&' : '?';
    const r = await fetch(`${URL_}/rest/v1/${yol}${ayrac}limit=${adim}&offset=${off}`, { headers: H });
    if (!r.ok) throw new Error(`${yol} okunamadı: ${r.status} ${await r.text()}`);
    const j = await r.json();
    hepsi.push(...j);
    if (j.length < adim) return hepsi;
  }
}

const RUTBE = { sb: 'Subay', asb: 'Astsubay', uzmj: 'Uzman Jandarma', uzmerb: 'Uzman Erbaş' };
const BRANS = {
  jandarma: 'Jandarma', mebs: 'MEBS', havacilik: 'Havacılık', personel: 'Personel',
  maliye: 'Maliye', istihkam: 'İstihkam', ikmal: 'İkmal', bakim: 'Bakım', bando: 'Bando',
  tabip: 'Tabip', dis: 'Diş Tabibi', eczaci: 'Eczacı', saglik: 'Sağlık', kimyager: 'Kimyager',
  veteriner: 'Veteriner', muhendis: 'Mühendis',
};

const [ilerleme, profiller, haklar] = await Promise.all([
  tumu('kullanici_ilerleme?select=user_id,veri,guncelleme&order=guncelleme.desc', 100),
  tumu('profiles?select=id,email,ad,soyad,rutbe,brans,created_at'),
  tumu('uyelik_haklari?select=user_id,urun,tip,platform'),
]);

const pm = Object.fromEntries(profiller.map((p) => [p.id, p]));
const hm = new Set(haklar.map((h) => h.user_id));

const rows = ilerleme.map((r) => {
  const v = r.veri || {};
  const p = pm[r.user_id] || {};
  const sn = v.sinavlar || [], pf = v.performans || [], sd = v.studyDays || [], srs = v.srs || [], si = v.sicil || [];
  const dg = sn.reduce((a, s) => a + (s.dogru || 0), 0);
  const tp = sn.reduce((a, s) => a + (s.toplam || 0), 0);
  return {
    n: ((p.ad || '') + ' ' + (p.soyad || '')).trim() || null,
    e: p.email || null,
    r: RUTBE[p.rutbe] || p.rutbe || null,
    b: BRANS[p.brans] || p.brans || null,
    pr: hm.has(r.user_id),
    tk: pf.length,
    kt: new Set(pf.map((x) => x.card_id)).size,
    gn: new Set(sd).size,
    sv: sn.length,
    dg, tp,
    sr: srs.length,
    sc: si.length,
    so: (r.guncelleme || '').slice(0, 10),
  };
});

const gunluk = {};
ilerleme.forEach((r) => (r.veri?.studyDays || []).forEach((d) => { gunluk[d] = (gunluk[d] || 0) + 1; }));

const bugun = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Istanbul' }); // YYYY-MM-DD
writeFileSync(
  join(cikti, 'pano-veri.json'),
  JSON.stringify({ rows, gunluk, toplamProfil: profiller.length, toplamHak: haklar.length, bugun }),
);

console.log(
  `pano-veri.json yazıldı → ${cikti}\n` +
  `  profil ${profiller.length} · ilerleme ${rows.length} · çalışan ${rows.filter((r) => r.tk > 0).length} · ücretli ${haklar.length}`,
);
