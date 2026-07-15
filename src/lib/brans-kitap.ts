/**
 * Branş PDF özet kitapları — veri katmanı.
 *  - `bransKitaplari(slug)`: kullanıcının branşının kitap listesi (brans_kitaplari).
 *  - `kitapNotlari(dosyaYolu)`: kullanıcının o kitaptaki TÜM sayfa not/çizimleri (kişiye özel).
 *  - `kitapNotuKaydet(...)`: bir sayfanın not/çizim verisini upsert eder (tekrar açınca gelsin).
 * PDF dosyasının kendisi imzalı-URL ile indirilip cihazda çözülür (görüntüleyici tarafı, ayrı).
 * Güvenlik: liste okuması authenticated'a açık; PDF erişimi imzalı-URL + üyelik kapılı.
 */
import { supabase } from '@/lib/supabase';

export type BransKitap = { id: number; baslik: string; dosyaYolu: string; sira: number };

/** Bir sayfanın not/çizim verisi (freehand path'ler + işaretlemeler + metin notları). Şekil
 * görüntüleyici katmanında belirlenir; burada opak jsonb olarak taşınır. */
export type SayfaNotu = unknown;

/** Branşın kitap listesi (sıralı). Offline/hata → boş. */
export async function bransKitaplari(slug: string): Promise<BransKitap[]> {
  if (!supabase || !slug) return [];
  try {
    const { data, error } = await supabase
      .from('brans_kitaplari')
      .select('id, baslik, dosya_yolu, sira')
      .eq('brans_slug', slug)
      .order('sira');
    if (error || !data) return [];
    return (data as { id: number; baslik: string; dosya_yolu: string; sira: number }[]).map((r) => ({
      id: r.id,
      baslik: r.baslik,
      dosyaYolu: r.dosya_yolu,
      sira: r.sira,
    }));
  } catch {
    return [];
  }
}

/** Kullanıcının bu kitaptaki tüm sayfa not/çizimleri (sayfa no → veri). Kişiye özel (RLS). */
export async function kitapNotlari(dosyaYolu: string): Promise<Map<number, SayfaNotu>> {
  const harita = new Map<number, SayfaNotu>();
  if (!supabase || !dosyaYolu) return harita;
  try {
    const { data, error } = await supabase
      .from('kitap_notlari')
      .select('sayfa, veri')
      .eq('dosya_yolu', dosyaYolu);
    if (error || !data) return harita;
    for (const r of data as { sayfa: number; veri: SayfaNotu }[]) harita.set(r.sayfa, r.veri);
    return harita;
  } catch {
    return harita;
  }
}

/** Bir sayfanın not/çizimini kaydet (upsert). Boş veri gelirse satırı siler (temiz sayfa). */
export async function kitapNotuKaydet(dosyaYolu: string, sayfa: number, veri: SayfaNotu): Promise<void> {
  if (!supabase || !dosyaYolu) return;
  try {
    const { data: oturum } = await supabase.auth.getUser();
    const uid = oturum?.user?.id;
    if (!uid) return;
    const bos = veri == null || (Array.isArray(veri) && veri.length === 0);
    if (bos) {
      await supabase.from('kitap_notlari').delete().eq('dosya_yolu', dosyaYolu).eq('sayfa', sayfa);
      return;
    }
    await supabase.from('kitap_notlari').upsert(
      { user_id: uid, dosya_yolu: dosyaYolu, sayfa, veri, guncelleme: new Date().toISOString() },
      { onConflict: 'user_id,dosya_yolu,sayfa' },
    );
  } catch {
    /* sessiz — çevrimdışıysa bir sonraki kaydetmede senkron olur */
  }
}
