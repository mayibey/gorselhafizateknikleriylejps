/** KİM ÇALIŞIYOR, KİM ÇALIŞMIYOR — kart + oyun ilerlemesi tek tabloda. */
import fs from 'node:fs';
const env=Object.fromEntries(fs.readFileSync('.env','utf8').split(/\r?\n/).filter(s=>s.includes('=')&&!s.trim().startsWith('#')).map(s=>[s.slice(0,s.indexOf('=')).trim(),s.slice(s.indexOf('=')+1).trim()]));
async function sql(q){const r=await fetch('https://api.supabase.com/v1/projects/vwmjrvolkbiofpkzzwef/database/query',{method:'POST',headers:{Authorization:`Bearer ${env.SUPABASE_ACCESS_TOKEN}`,'Content-Type':'application/json'},body:JSON.stringify({query:q})});const t=await r.text();if(!r.ok)throw new Error(t.slice(0,400));return JSON.parse(t);}

const satir = await sql(`
  select p.ad, p.soyad, p.email, p.rutbe, p.brans,
         (h.user_id is not null) premium,
         k.veri kart, k.guncelleme::date kart_gun,
         o.veri oyun, o.guncelleme::date oyun_gun
  from profiles p
  left join kullanici_ilerleme k on k.user_id = p.id
  left join oyun_ilerleme o on o.user_id = p.id
  left join (select distinct user_id from uyelik_haklari) h on h.user_id = p.id
  where p.silme_talep_tarihi is null`);

const bugun = new Date();
const gunFark = (d) => d ? Math.round((bugun - new Date(d)) / 86400000) : null;

const kisiler = satir.map((r) => {
  const v = r.kart || {};
  const perf = Array.isArray(v.performans) ? v.performans : [];
  const gun = Array.isArray(v.studyDays) ? v.studyDays.length : 0;
  const kartAdet = new Set(perf.map((x) => x.card_id)).size;
  const oyunV = r.oyun || {};
  const oyunAnahtar = Object.keys(oyunV).filter((k) => k.startsWith('mevzu_'));
  const oyunOynadi = oyunAnahtar.length > 0;
  const sonKart = gunFark(r.kart_gun);
  const sonOyun = gunFark(r.oyun_gun);
  const son = [sonKart, sonOyun].filter((x) => x != null);
  return {
    ad: [r.ad, r.soyad].filter(Boolean).join(' ') || r.email || '(isimsiz)',
    rutbe: r.rutbe, premium: r.premium,
    kartAdet, calismaGunu: gun, oyunOynadi, oyunAnahtar: oyunAnahtar.length,
    sonKartGun: sonKart, sonOyunGun: sonOyun,
    sonHareket: son.length ? Math.min(...son) : null,
  };
});

const say = (f) => kisiler.filter(f).length;
console.log('=== GENEL ===');
console.log('kayıtlı üye              :', kisiler.length);
console.log('hiç kart çalışmamış      :', say((k) => k.kartAdet === 0));
console.log('kart çalışmış            :', say((k) => k.kartAdet > 0));
console.log('oyun oynamış             :', say((k) => k.oyunOynadi));
console.log('HEM kart HEM oyun        :', say((k) => k.kartAdet > 0 && k.oyunOynadi));
console.log('hiçbirini yapmamış       :', say((k) => k.kartAdet === 0 && !k.oyunOynadi));
console.log('');
console.log('=== SON HAREKET ===');
for (const [ad, f] of [['son 1 gün', 1], ['son 7 gün', 7], ['son 30 gün', 30]]) {
  console.log(`  ${ad.padEnd(12)}: ${say((k) => k.sonHareket != null && k.sonHareket <= f)}`);
}
console.log(`  30+ gündür yok: ${say((k) => k.sonHareket != null && k.sonHareket > 30)}`);
console.log('');
console.log('=== EN ÇOK ÇALIŞANLAR (kart sayısına göre) ===');
console.log('ad'.padEnd(24) + 'RÜTBE  PREM  KART  GÜN  OYUN  SON');
console.log('─'.repeat(74));
for (const k of kisiler.filter((x) => x.kartAdet > 0).sort((a, b) => b.kartAdet - a.kartAdet).slice(0, 20)) {
  console.log(
    k.ad.slice(0, 22).padEnd(24) + String(k.rutbe || '-').padEnd(7) +
    (k.premium ? ' ✔ ' : ' — ').padEnd(6) +
    String(k.kartAdet).padStart(4) + String(k.calismaGunu).padStart(5) +
    (k.oyunOynadi ? '   ✔ ' : '   — ') +
    (k.sonHareket != null ? `${k.sonHareket}g` : '-').padStart(5));
}
console.log('');
console.log('=== PREMIUM ALIP HİÇ ÇALIŞMAYANLAR (riskli) ===');
const riskli = kisiler.filter((k) => k.premium && k.kartAdet === 0 && !k.oyunOynadi);
console.log(riskli.length ? riskli.map((k) => `${k.ad} (${k.rutbe || '-'})`).join(' · ') : 'yok');
