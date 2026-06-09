/**
 * İçtima Alanı (genel sohbet) veri katmanı — Supabase.
 * Sadece backend hazırken çağrılır (ekran supabaseHazir kontrol eder).
 */

import { supabase } from '@/lib/supabase';

export type IctimaMesaj = {
  id: number;
  metin: string;
  tarih: string;
  gonderenId: string;
  kullaniciAdi: string;
};

type HamSatir = {
  id: number;
  metin: string;
  tarih: string;
  gonderen_id: string;
  profiles: { kullanici_adi: string } | null;
};

/** Son 50 mesaj, eskiden yeniye (liste sonunda en yeni). */
export async function mesajlariGetir(): Promise<IctimaMesaj[]> {
  const { data, error } = await supabase
    .from('ictima_mesaj')
    .select('id, metin, tarih, gonderen_id, profiles(kullanici_adi)')
    .order('id', { ascending: false })
    .limit(50);
  if (error || !data) return [];
  const rows = data as unknown as HamSatir[];
  return rows
    .map((r) => ({
      id: r.id,
      metin: r.metin,
      tarih: r.tarih,
      gonderenId: r.gonderen_id,
      kullaniciAdi: r.profiles?.kullanici_adi ?? 'er',
    }))
    .reverse();
}

export async function mesajGonder(metin: string): Promise<{ ok: boolean; hata?: string }> {
  const kirpik = metin.trim();
  if (!kirpik) return { ok: false, hata: 'Boş mesaj.' };
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return { ok: false, hata: 'Oturum yok.' };
  const { error } = await supabase
    .from('ictima_mesaj')
    .insert({ gonderen_id: u.user.id, metin: kirpik.slice(0, 1000) });
  return error ? { ok: false, hata: error.message } : { ok: true };
}

/** Kendi mesajını siler (RLS yalnız sahibine izin verir). */
export async function mesajSil(id: number): Promise<void> {
  await supabase.from('ictima_mesaj').delete().eq('id', id);
}

/** Bir mesajı raporlar (moderasyon). */
export async function mesajRaporla(mesajId: number, sebep: string): Promise<void> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return;
  await supabase.from('rapor').insert({ mesaj_id: mesajId, raporlayan_id: u.user.id, sebep });
}

/** Engellediğim kullanıcı id'leri (mesaj listesi bunları gizler). */
export async function engellenenleriGetir(): Promise<string[]> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return [];
  const { data } = await supabase
    .from('engellenenler')
    .select('engellenen_id')
    .eq('engelleyen_id', u.user.id);
  return (data ?? []).map((r) => (r as { engellenen_id: string }).engellenen_id);
}

/** Bir kullanıcıyı engeller (mesajları artık görünmez). */
export async function kullaniciEngelle(engellenenId: string): Promise<void> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return;
  await supabase
    .from('engellenenler')
    .insert({ engelleyen_id: u.user.id, engellenen_id: engellenenId });
}

/** Yeni mesaj geldiğinde `onYeni` çağırır; temizleyici döndürür. */
export function mesajAboneligi(onYeni: () => void): () => void {
  const kanal = supabase
    .channel('ictima-mesaj')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'ictima_mesaj' }, () =>
      onYeni(),
    )
    .subscribe();
  return () => {
    void supabase.removeChannel(kanal);
  };
}
