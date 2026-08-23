import fs from 'node:fs';
const env=Object.fromEntries(fs.readFileSync('.env','utf8').split(/\r?\n/).filter(s=>s.includes('=')&&!s.trim().startsWith('#')).map(s=>[s.slice(0,s.indexOf('=')).trim(),s.slice(s.indexOf('=')+1).trim()]));
async function sql(q){
  const r=await fetch('https://api.supabase.com/v1/projects/vwmjrvolkbiofpkzzwef/database/query',{method:'POST',headers:{Authorization:`Bearer ${env.SUPABASE_ACCESS_TOKEN}`,'Content-Type':'application/json'},body:JSON.stringify({query:q})});
  const t=await r.text(); if(!r.ok) throw new Error('HTTP '+r.status+' '+t.slice(0,500)); return t;
}
// Sıralama: herkes görebilsin ama SATIRLARA erişim açılmasın -> SECURITY DEFINER fonksiyon.
// Yalnız ad + puan döner; e-posta/kimlik sızmaz. Kişi başına EN İYİ puan alınır.
await sql(`
create or replace function deneme_siralama(p_takim text, p_deneme int, p_limit int default 50)
returns table (sira bigint, ad text, puan int, toplam_puan int, dogru int, toplam int, tarih timestamptz, benim boolean)
language sql security definer set search_path = public as $$
  with en_iyi as (
    select distinct on (d.user_id)
      d.user_id, d.puan, d.toplam_puan, d.dogru, d.toplam, d.created_at
    from deneme_sonuc d
    where d.takim = p_takim and d.deneme_no = p_deneme
    order by d.user_id, d.puan desc, d.created_at asc
  )
  select row_number() over (order by e.puan desc, e.created_at asc) as sira,
         coalesce(nullif(trim(p.ad || ' ' || left(coalesce(p.soyad,''), 1)), ''), 'Aday') as ad,
         e.puan, e.toplam_puan, e.dogru, e.toplam, e.created_at as tarih,
         (e.user_id = auth.uid()) as benim
  from en_iyi e left join profiles p on p.id = e.user_id
  order by e.puan desc, e.created_at asc
  limit p_limit;
$$;
grant execute on function deneme_siralama(text,int,int) to anon, authenticated;

create or replace function deneme_sirami_bul(p_takim text, p_deneme int)
returns table (sira bigint, toplam_kisi bigint, puan int)
language sql security definer set search_path = public as $$
  with en_iyi as (
    select distinct on (d.user_id) d.user_id, d.puan, d.created_at
    from deneme_sonuc d
    where d.takim = p_takim and d.deneme_no = p_deneme
    order by d.user_id, d.puan desc, d.created_at asc
  ), sirali as (
    select user_id, puan, row_number() over (order by puan desc, created_at asc) as sira,
           count(*) over () as toplam_kisi
    from en_iyi
  )
  select sira, toplam_kisi, puan from sirali where user_id = auth.uid();
$$;
grant execute on function deneme_sirami_bul(text,int) to anon, authenticated;
`);
console.log('siralama fonksiyonlari kuruldu');
