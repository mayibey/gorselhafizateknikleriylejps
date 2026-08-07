-- İSTEMCİ SÜRÜM SAYACI — kim hangi sürümde / hangi güncelleme paketinde?
--
-- NEDEN: OTA yayınladığımızda kaç kişinin gerçekten aldığını göremiyorduk. Duyuru atıp
-- "uygulamayı kapat aç" dedikten sonra kaçının güncellediğini ölçmek için (başkan isteği,
-- 7 Ağu 2026). İstemci tarafı: src/lib/istemci-surum.ts (her açılışta çağırır, sessiz).
--
-- paket:
--   <uuid>       → OTA paketi uygulanmış, kimliği bu (hangi yayın olduğu buradan bilinir)
--   'gomulu'     → hâlâ mağazadan indirilen build'in kendi paketinde = GÜNCELLEMEYİ ALMAMIŞ
--   'gelistirme' → dev/Expo Go
--
-- Kullanıcı başına TEK satır; her açılışta üzerine yazılır (geçmiş tutulmaz — amaç anlık durum).

create table if not exists public.istemci_surum (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  app_surum  text,
  paket      text,
  platform   text,
  guncelleme timestamptz not null default now()
);

-- RLS AÇIK ve POLİTİKA YOK: istemci tabloya DOĞRUDAN yazamaz/okuyamaz.
-- Yazma yalnızca aşağıdaki RPC üzerinden (security definer) yapılır; okuma yalnızca
-- service key ile (yönetim tarafı). Böylece kimse başkasının satırını göremez/değiştiremez.
alter table public.istemci_surum enable row level security;

create or replace function public.istemci_surum_kaydet(
  p_app text,
  p_paket text,
  p_platform text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare v_uid uuid := auth.uid();
begin
  if v_uid is null then return; end if;
  insert into public.istemci_surum (user_id, app_surum, paket, platform, guncelleme)
  values (v_uid, nullif(btrim(coalesce(p_app, '')), ''), nullif(btrim(coalesce(p_paket, '')), ''),
          nullif(btrim(coalesce(p_platform, '')), ''), now())
  on conflict (user_id) do update
    set app_surum  = excluded.app_surum,
        paket      = excluded.paket,
        platform   = excluded.platform,
        guncelleme = now();
end;
$$;

revoke all on function public.istemci_surum_kaydet(text, text, text) from public, anon;
grant execute on function public.istemci_surum_kaydet(text, text, text) to authenticated;
