-- 19: profiles.created_at DONDUR (denetim #13). profiles_update_own politikasi kolon-kisitsiz →
-- kullanici kendi satirinda created_at'i PATCH ile degistirip ilk-giris indirimini (indirim_durumu,
-- created_at penceresine bagli) suresiz yenileyebiliyordu. Trigger created_at'i eski degerine sabitler.
create or replace function public.profiles_created_at_koru()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.created_at := old.created_at; -- created_at ASLA degismez (ilk-giris indirimi guvenligi)
  return new;
end; $$;
drop trigger if exists profiles_created_at_koru_trg on public.profiles;
create trigger profiles_created_at_koru_trg before update on public.profiles
  for each row execute function public.profiles_created_at_koru();
