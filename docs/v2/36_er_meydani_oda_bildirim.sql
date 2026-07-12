-- 36: ODA BİLDİRİMLERİ (başkan: "oda dolunca/katılınca kurana push").
-- Uzak push: push_token tablosu + kayıt RPC + Expo Push API'ye pg_net ile gönderim +
-- er_meydani_oda_oyuncu insert tetikleyicisi (kurana bildir).

-- Push token (kişi başına tek token).
create table if not exists public.push_token (
  user_id uuid primary key references auth.users(id) on delete cascade,
  token text not null,
  platform text,
  guncelleme timestamptz not null default now()
);
alter table public.push_token enable row level security;
drop policy if exists push_token_own on public.push_token;
create policy push_token_own on public.push_token for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Token kaydet/güncelle (client açılışta çağırır).
create or replace function public.er_meydani_push_kaydet(p_token text, p_platform text default null)
returns void language plpgsql security definer set search_path to 'public' as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null or coalesce(btrim(p_token),'') = '' then return; end if;
  insert into public.push_token (user_id, token, platform)
    values (v_uid, btrim(p_token), p_platform)
  on conflict (user_id) do update
    set token = excluded.token, platform = excluded.platform, guncelleme = now();
end; $$;
grant execute on function public.er_meydani_push_kaydet(text, text) to authenticated;

-- Bir kullanıcıya Expo push gönder (net.http_post — async, insert'i bloklamaz).
create or replace function public._er_meydani_push_gonder(p_uid uuid, p_baslik text, p_govde text)
returns void language plpgsql security definer set search_path to 'public' as $$
declare v_token text;
begin
  select token into v_token from public.push_token where user_id = p_uid;
  if v_token is null or v_token = '' then return; end if;
  perform net.http_post(
    url := 'https://exp.host/--/api/v2/push/send',
    body := jsonb_build_object('to', v_token, 'title', p_baslik, 'body', p_govde, 'sound', 'default', 'priority', 'high'),
    headers := jsonb_build_object('Content-Type', 'application/json')
  );
end; $$;

-- Tetikleyici: odaya biri katılınca (kuran hariç) kurana bildir; dolunca ekstra "oda doldu".
create or replace function public._er_meydani_oda_katilim_bildir()
returns trigger language plpgsql security definer set search_path to 'public' as $$
declare o public.er_meydani_oda; v_sayi int; v_rumuz text;
begin
  select * into o from public.er_meydani_oda where id = NEW.oda_id;
  if o.id is null or NEW.user_id = o.kuran_id or o.durum <> 'acik' then return NEW; end if;
  select count(*) into v_sayi from public.er_meydani_oda_oyuncu where oda_id = o.id;
  v_rumuz := coalesce(NEW.rumuz, 'Bir oyuncu');
  if v_sayi >= o.max_oyuncu then
    perform public._er_meydani_push_gonder(o.kuran_id, 'Oda doldu! 🎯',
      v_rumuz || ' katıldı — oda doldu, maçı başlatabilirsin.');
  else
    perform public._er_meydani_push_gonder(o.kuran_id, 'Odana katılım var ⚔️',
      v_rumuz || ' odana katıldı (' || v_sayi || '/' || o.max_oyuncu || ').');
  end if;
  return NEW;
end; $$;

drop trigger if exists er_meydani_oda_katilim_bildir on public.er_meydani_oda_oyuncu;
create trigger er_meydani_oda_katilim_bildir
  after insert on public.er_meydani_oda_oyuncu
  for each row execute function public._er_meydani_oda_katilim_bildir();
