/**
 * DESTEK / TALEPLERİM — kullanıcı destek (ticket) sistemi istemci katmanı.
 * - Kullanıcı talep açar (konu + ilk mesaj), talebe cevap yazar; kendi taleplerini/mesajlarını
 *   okur. Admin (başkan) cevapları service_role ile yazılır (sunucu tarafı; burada YOK).
 * - RLS gerçek koruma: istemci yalnız KENDİ satırlarını görür/ekler (docs/v2/21_destek_sistemi.sql).
 * - Supabase hazır değilse (offline/v1) güvenli boş/hata: liste boş döner, yazma çağrıları throw.
 */
import { supabase } from '@/lib/supabase';

export type DestekDurum = 'acik' | 'cevaplandi' | 'kapandi';

export type DestekTalebi = {
  id: string;
  konu: string;
  durum: DestekDurum;
  created_at: string;
  guncelleme_at: string;
};

export type DestekMesaj = {
  id: string;
  talep_id: string;
  gonderen: 'kullanici' | 'admin';
  metin: string;
  created_at: string;
};

/** Kullanıcının kendi taleplerini (yeni→eski) getirir. Supabase yoksa boş liste (çökme yok). */
export async function destekTalepleriGetir(): Promise<DestekTalebi[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('destek_talebi')
      .select('id, konu, durum, created_at, guncelleme_at')
      .order('created_at', { ascending: false });
    if (error || !data) return [];
    return data as DestekTalebi[];
  } catch {
    return [];
  }
}

/** Bir talebin mesajlarını (eski→yeni, thread sırası) getirir. Supabase yoksa boş liste. */
export async function talepMesajlariGetir(talepId: string): Promise<DestekMesaj[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('destek_mesaj')
      .select('id, talep_id, gonderen, metin, created_at')
      .eq('talep_id', talepId)
      .order('created_at', { ascending: true });
    if (error || !data) return [];
    return data as DestekMesaj[];
  } catch {
    return [];
  }
}

/**
 * Yeni talep açar: önce destek_talebi (durum 'acik'), dönen id ile ilk destek_mesaj
 * (gonderen 'kullanici'). Oluşan talep id'sini döndürür.
 */
export async function yeniTalep(konu: string, ilkMesaj: string): Promise<string> {
  if (!supabase) throw new Error('Destek şu an kullanılamıyor.');

  const { data: kullanici } = await supabase.auth.getUser();
  const userId = kullanici.user?.id;
  if (!userId) throw new Error('Oturum bulunamadı.');

  const { data: talep, error: talepHata } = await supabase
    .from('destek_talebi')
    .insert({ user_id: userId, konu, durum: 'acik' })
    .select('id')
    .single();
  if (talepHata || !talep) throw new Error(talepHata?.message ?? 'Talep açılamadı.');

  const talepId = (talep as { id: string }).id;
  const { error: mesajHata } = await supabase
    .from('destek_mesaj')
    .insert({ talep_id: talepId, gonderen: 'kullanici', metin: ilkMesaj });
  if (mesajHata) throw new Error(mesajHata.message);

  return talepId;
}

/**
 * Var olan talebe kullanıcı mesajı ekler. Talebin durumu ('acik') + guncelleme_at OTOMATİK
 * güncellenir (DB trigger destek_mesaj_sonrasi; istemci UPDATE'e gerek yok, RLS'e takılmaz).
 */
export async function talebeMesajEkle(talepId: string, metin: string): Promise<void> {
  if (!supabase) throw new Error('Destek şu an kullanılamıyor.');

  const { error: mesajHata } = await supabase
    .from('destek_mesaj')
    .insert({ talep_id: talepId, gonderen: 'kullanici', metin });
  if (mesajHata) throw new Error(mesajHata.message);
}
