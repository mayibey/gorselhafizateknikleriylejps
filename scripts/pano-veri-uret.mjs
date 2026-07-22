/**
 * KULLANICI İLERLEME PANOSU — veri üreteci (v2: çalışma / deneme AYRI).
 *
 * İki istatistik grubu KARIŞMAZ:
 *  - ÇALIŞMA (gerçek kart görme): SRS (Leitner) = gerçekten çalışılan kart; `calisma` görme tekrarı;
 *    çalışılan gün. Sınav gürültüsü (genel deneme yanlışları) BURAYA GİRMEZ.
 *  - DENEME (sınav): `sinavlar` kaydından — genel deneme (law_id=-1) ve kanun/talim (law_id>0) AYRI
 *    başarı yüzdesiyle.
 *  + Er Meydanı (düello/galibiyet), Sicil (takdir/ceza), premium + "ödeyip çalışmayan" uyarısı.
 *
 * Sıralama = SRS (gerçek çalışma). ÇIKTI: <hedef>/pano-veri.json
 * ÇALIŞTIR: node scripts/pano-veri-uret.mjs [cikti-klasoru]
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
if (!URL_ || !KEY) throw new Error('.env: EXPO_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_KEY yok');
const H = { apikey: KEY, Authorization: 'Bearer ' + KEY };

async function tumu(yol, adim = 200) {
  const hepsi = [];
  for (let off = 0; ; off += adim) {
    const ayrac = yol.includes('?') ? '&' : '?';
    const r = await fetch(`${URL_}/rest/v1/${yol}${ayrac}limit=${adim}&offset=${off}`, { headers: H });
    if (!r.ok) throw new Error(`${yol}: ${r.status} ${await r.text()}`);
    const j = await r.json();
    hepsi.push(...j);
    if (j.length < adim) return hepsi;
  }
}

const RUTBE = { sb: 'Subay', asb: 'Astsubay', uzmj: 'Uzman Jandarma', uzmerb: 'Uzman Erbaş' };
const BRANS = {
  jandarma: 'Jandarma', mebs: 'MEBS', havacilik: 'Havacılık', personel: 'Personel', maliye: 'Maliye',
  istihkam: 'İstihkam', ikmal: 'İkmal', bakim: 'Bakım', bando: 'Bando', tabip: 'Tabip', dis: 'Diş Tabibi',
  eczaci: 'Eczacı', saglik: 'Sağlık', kimyager: 'Kimyager', veteriner: 'Veteriner', muhendis: 'Mühendis',
};
const CEZA_DER = new Set(['yazili_ikaz', 'uyari', 'kinama', 'ayliktan_kesme']);
const ODUL_DER = new Set(['takdir', 'basari', 'ustun_basari']);

const [ilerleme, profiller, haklar, maclar] = await Promise.all([
  tumu('kullanici_ilerleme?select=user_id,veri,guncelleme&order=guncelleme.desc', 100),
  tumu('profiles?select=id,email,ad,soyad,rutbe,brans,created_at'),
  tumu('uyelik_haklari?select=user_id&satin_alma_token=not.is.null'),
  tumu('er_meydani_mac?select=oyuncu_id,kazandim'),
]);

const pm = Object.fromEntries(profiller.map((p) => [p.id, p]));
const alici = new Set(haklar.map((h) => h.user_id)); // gerçek satın alan (premium)
const mac = {};
maclar.forEach((m) => {
  const x = (mac[m.oyuncu_id] ||= { n: 0, g: 0 });
  x.n++;
  if (m.kazandim) x.g++;
});

const rows = ilerleme.map((r) => {
  const v = r.veri || {};
  const p = pm[r.user_id] || {};
  const pf = v.performans || [], srs = v.srs || [], sn = v.sinavlar || [], sd = v.studyDays || [], si = v.sicil || [];

  // ÇALIŞMA (gerçek) — sadece 'calisma'; SRS = temiz "çalışılan kart"
  const gor = pf.filter((x) => x.kaynak === 'calisma').length;

  // DENEME — sinavlar'dan, genel (law_id=-1) vs kanun (law_id>0) AYRI
  const gen = sn.filter((s) => s.law_id === -1);
  const kan = sn.filter((s) => (s.law_id ?? 0) > 0);
  const topla = (arr, k) => arr.reduce((a, s) => a + (s[k] || 0), 0);
  const yuzde = (arr) => { const t = topla(arr, 'toplam'); return t ? Math.round((topla(arr, 'dogru') / t) * 100) : null; };

  // SİCİL
  const takdir = si.filter((s) => ODUL_DER.has(s.derece) || s.tip === 'odul').length;
  const ceza = si.filter((s) => CEZA_DER.has(s.derece) || s.tip === 'ceza').length;

  const em = mac[r.user_id] || { n: 0, g: 0 };
  const premium = alici.has(r.user_id);

  return {
    n: ((p.ad || '') + ' ' + (p.soyad || '')).trim() || null,
    e: p.email || null,
    r: RUTBE[p.rutbe] || p.rutbe || null,
    b: BRANS[p.brans] || p.brans || null,
    pr: premium,
    uyuyan: premium && srs.length === 0, // ödeyip hiç çalışmayan
    // çalışma
    srs: srs.length,
    gor,
    gun: new Set(sd).size,
    // deneme
    sv: sn.length,
    gsn: gen.length, gsy: yuzde(gen), gst: topla(gen, 'toplam'),
    ksn: kan.length, ksy: yuzde(kan), kst: topla(kan, 'toplam'),
    // er meydanı
    duello: em.n, galip: em.g,
    // sicil
    takdir, ceza,
    so: (r.guncelleme || '').slice(0, 10),
  };
});

const gunluk = {};
ilerleme.forEach((r) => (r.veri?.studyDays || []).forEach((d) => { gunluk[d] = (gunluk[d] || 0) + 1; }));

const bugun = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Istanbul' });
const uyuyanSay = rows.filter((r) => r.uyuyan).length;
writeFileSync(
  join(cikti, 'pano-veri.json'),
  JSON.stringify({ rows, gunluk, toplamProfil: profiller.length, toplamAlici: alici.size, uyuyan: uyuyanSay, bugun }),
);

console.log(
  `pano-veri.json → ${cikti}\n` +
  `  profil ${profiller.length} · gerçek çalışan (SRS>0) ${rows.filter((r) => r.srs > 0).length} · ` +
  `ödeyen ${alici.size} · ödeyip-çalışmayan ${uyuyanSay} · düello oynayan ${Object.keys(mac).length}`,
);
