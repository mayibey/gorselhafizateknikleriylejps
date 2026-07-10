/**
 * ADMIN (başkan) — uygulama içi yönetim istemci katmanı: destek taleplerini yanıtla/durum
 * güncelle + duyuru ekle/sil/aktiflik. Yetki gerçek koruma DB tarafında (RLS + benadmin()):
 * bu fonksiyonlar yalnız admin oturumu için başarılı olur; UI de sadece admin'e gösterilir.
 * Supabase hazır değilse (offline/v1) güvenli: okuma boş liste, yazma çağrıları throw.
 * Canlı altyapı (benadmin / admin_kullanici_bul RPC, RLS politikaları) HAZIR varsayılır.
 */
import type { DestekDurum, DestekTalebi } from '@/lib/destek';
import { supabase } from '@/lib/supabase';

/** Admin liste satırı: destek_talebi kolonları + user_id (email auth.users'ta, göstermiyoruz). */
export type AdminTalep = DestekTalebi & { user_id: string };

/** Admin duyuru satırı: aktif kolonu dâhil (kullanıcı tarafındaki Duyuru'ya ek). */
export type AdminDuyuru = {
  id: string;
  baslik: string;
  metin: string;
  hedef: 'herkes' | 'premium';
  aktif: boolean;
  created_at: string;
};

/** Oturum sahibi admin mi (benadmin RPC). Supabase yoksa / hata / yetki yoksa false. */
export async function adminMi(): Promise<boolean> {
  if (!supabase) return false;
  try {
    const { data, error } = await supabase.rpc('benadmin');
    if (error) return false;
    return data === true;
  } catch {
    return false;
  }
}

// ── DESTEK (admin) ──────────────────────────────────────────────────────────

/** TÜM destek taleplerini (son güncellenen → eski) getirir; RLS admin'e hepsini açar. */
export async function adminTalepleriGetir(): Promise<AdminTalep[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('destek_talebi')
      .select('id, konu, durum, created_at, guncelleme_at, user_id')
      .order('guncelleme_at', { ascending: false });
    if (error || !data) return [];
    return data as AdminTalep[];
  } catch {
    return [];
  }
}

/**
 * Talebe admin cevabı ekler (destek_mesaj, gonderen='admin'). DB trigger talebi otomatik
 * 'cevaplandi' + guncelleme_at günceller (istemci UPDATE'e gerek yok).
 */
export async function adminCevapla(talepId: string, metin: string): Promise<void> {
  if (!supabase) throw new Error('Yönetim şu an kullanılamıyor.');
  const { error } = await supabase
    .from('destek_mesaj')
    .insert({ talep_id: talepId, gonderen: 'admin', metin });
  if (error) throw new Error(error.message);
}

/** Talebin durumunu günceller (RLS: yalnız admin). Kapat/Çözüldü için kullanılır. */
export async function talepDurumGuncelle(talepId: string, durum: DestekDurum): Promise<void> {
  if (!supabase) throw new Error('Yönetim şu an kullanılamıyor.');
  const { error } = await supabase.from('destek_talebi').update({ durum }).eq('id', talepId);
  if (error) throw new Error(error.message);
}

// ── DUYURULAR (admin) ───────────────────────────────────────────────────────

/** Tüm duyuruları (aktif + pasif, yeni → eski) getirir; RLS admin'e hepsini açar. */
export async function adminDuyurulariGetir(): Promise<AdminDuyuru[]> {
  if (!supabase) return [];
  try {
    const { data, error } = await supabase
      .from('duyurular')
      .select('id, baslik, metin, hedef, aktif, created_at')
      .order('created_at', { ascending: false });
    if (error || !data) return [];
    return data as AdminDuyuru[];
  } catch {
    return [];
  }
}

/**
 * Yeni duyuru ekler. hedefUserId verilirse KİŞİYE ÖZEL: hedef='herkes' + hedef_user_id set.
 * Aksi hâlde toplu: hedef 'herkes' | 'premium'.
 */
export async function duyuruEkle(p: {
  baslik: string;
  metin: string;
  hedef: 'herkes' | 'premium';
  hedefUserId?: string;
}): Promise<void> {
  if (!supabase) throw new Error('Yönetim şu an kullanılamıyor.');
  const satir: Record<string, unknown> = {
    baslik: p.baslik,
    metin: p.metin,
    hedef: p.hedefUserId ? 'herkes' : p.hedef,
  };
  if (p.hedefUserId) satir.hedef_user_id = p.hedefUserId;
  const { error } = await supabase.from('duyurular').insert(satir);
  if (error) throw new Error(error.message);
}

/** Duyuruyu aktif/pasif yapar (pasif = kullanıcılarda görünmez). */
export async function duyuruAktiflik(id: string, aktif: boolean): Promise<void> {
  if (!supabase) throw new Error('Yönetim şu an kullanılamıyor.');
  const { error } = await supabase.from('duyurular').update({ aktif }).eq('id', id);
  if (error) throw new Error(error.message);
}

/** Duyuruyu kalıcı siler. */
export async function duyuruSil(id: string): Promise<void> {
  if (!supabase) throw new Error('Yönetim şu an kullanılamıyor.');
  const { error } = await supabase.from('duyurular').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

/** Email → kullanıcı (kişiye özel duyuru hedefi). Bulunamazsa null. */
export async function kullaniciBul(email: string): Promise<{ user_id: string; email: string } | null> {
  if (!supabase) return null;
  try {
    const { data, error } = await supabase.rpc('admin_kullanici_bul', { p_email: email });
    if (error || !data) return null;
    const satir = (data as { user_id: string; email: string }[])[0];
    return satir ? { user_id: satir.user_id, email: satir.email } : null;
  } catch {
    return null;
  }
}
