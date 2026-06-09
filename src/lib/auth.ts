/** Auth işlemleri (e-posta + şifre). Hata mesajları Türkçeleştirilir. */

import { supabase } from '@/lib/supabase';

export type AuthSonuc = { ok: boolean; hata?: string };

const ceviri = (mesaj: string): string => {
  const m = mesaj.toLowerCase();
  if (m.includes('invalid login')) return 'E-posta veya şifre hatalı.';
  if (m.includes('already registered') || m.includes('already exists'))
    return 'Bu e-posta zaten kayıtlı.';
  if (m.includes('password')) return 'Şifre en az 6 karakter olmalı.';
  if (m.includes('email')) return 'Geçerli bir e-posta gir.';
  if (m.includes('network')) return 'Bağlantı yok. İnternetini kontrol et.';
  return mesaj;
};

export async function girisYap(email: string, sifre: string): Promise<AuthSonuc> {
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: sifre });
  return error ? { ok: false, hata: ceviri(error.message) } : { ok: true };
}

export async function kayitOl(
  email: string,
  sifre: string,
  kullaniciAdi: string,
): Promise<AuthSonuc> {
  const { error } = await supabase.auth.signUp({
    email: email.trim(),
    password: sifre,
    options: { data: { kullanici_adi: kullaniciAdi.trim() } },
  });
  return error ? { ok: false, hata: ceviri(error.message) } : { ok: true };
}

export async function cikisYap(): Promise<void> {
  await supabase.auth.signOut();
}

/**
 * Hesabı ve tüm verilerini siler (KALICI). Supabase'de `hesabi_sil()` RPC'si auth
 * kullanıcısını siler; profiles/mesaj/engel kayıtları FK cascade ile gider.
 */
export async function hesabiSil(): Promise<AuthSonuc> {
  const { error } = await supabase.rpc('hesabi_sil');
  if (error) return { ok: false, hata: ceviri(error.message) };
  await supabase.auth.signOut();
  return { ok: true };
}
