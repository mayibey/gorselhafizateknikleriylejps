import fs from 'node:fs';
const env=Object.fromEntries(fs.readFileSync('.env','utf8').split(/\r?\n/).filter(s=>s.includes('=')&&!s.trim().startsWith('#')).map(s=>[s.slice(0,s.indexOf('=')).trim(),s.slice(s.indexOf('=')+1).trim()]));
async function sql(q){
  const r=await fetch('https://api.supabase.com/v1/projects/vwmjrvolkbiofpkzzwef/database/query',{method:'POST',headers:{Authorization:`Bearer ${env.SUPABASE_ACCESS_TOKEN}`,'Content-Type':'application/json'},body:JSON.stringify({query:q})});
  const t=await r.text(); if(!r.ok) throw new Error('HTTP '+r.status+' '+t.slice(0,400)); return t;
}
const KOMUT = `
-- ── SORU HATA BİLDİRİMİ ────────────────────────────────────────────────
create table if not exists soru_hata_bildirim (
  id uuid primary key default gen_random_uuid(),
  user_id uuid default auth.uid() references auth.users on delete set null,
  soru_id text not null,
  soru_metni text,
  siklar jsonb,
  dogru_sik int,
  kaynak text,
  kanun text,
  nerede text,
  kategori text not null,
  mesaj text,
  surum text,
  durum text not null default 'yeni',
  created_at timestamptz not null default now()
);
alter table soru_hata_bildirim enable row level security;
drop policy if exists shb_insert_own on soru_hata_bildirim;
create policy shb_insert_own on soru_hata_bildirim for insert to public with check (auth.uid() = user_id);
drop policy if exists shb_select_own on soru_hata_bildirim;
create policy shb_select_own on soru_hata_bildirim for select to public using (auth.uid() = user_id);
create index if not exists shb_soru on soru_hata_bildirim (soru_id);
create index if not exists shb_durum on soru_hata_bildirim (durum, created_at desc);

-- ── DENEME SONUÇLARI ───────────────────────────────────────────────────
create table if not exists deneme_sonuc (
  id uuid primary key default gen_random_uuid(),
  user_id uuid default auth.uid() references auth.users on delete cascade,
  takim text not null,
  deneme_no int not null,
  baslik text,
  dogru int not null,
  toplam int not null,
  puan int not null,
  toplam_puan int not null,
  sure_sn int,
  yanlislar jsonb,
  created_at timestamptz not null default now()
);
alter table deneme_sonuc enable row level security;
drop policy if exists ds_insert_own on deneme_sonuc;
create policy ds_insert_own on deneme_sonuc for insert to public with check (auth.uid() = user_id);
drop policy if exists ds_select_own on deneme_sonuc;
create policy ds_select_own on deneme_sonuc for select to public using (auth.uid() = user_id);
create index if not exists ds_kisi on deneme_sonuc (user_id, created_at desc);
create index if not exists ds_deneme on deneme_sonuc (takim, deneme_no, puan desc);
`;
await sql(KOMUT);
console.log('tablolar kuruldu');
