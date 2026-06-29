/**
 * Bulut senkron — kullanıcı ilerlemesini (srs/performans/sicil/sınav/günler) hesabıyla eşitler.
 * Yaklaşım: JSON snapshot (Supabase `kullanici_ilerleme.veri jsonb`). Son-yazan-kazanır;
 * SRS'te `max(kutu)` ile asla geri gitmez (DB tarafı ilerlemeIceAktar). Yeni cihazda TAM yükle.
 *
 * - senkronYukle(): GİRİŞTE buluttan çek → yerele birleştir (yeni cihaz = tam geri yükle).
 * - senkronKaydet(): çıkış/arka plan/önemli olayda yereli buluta yükle (upsert).
 * Hepsi try/catch — offline/tablo yoksa sessiz geçer, uygulama yerelle çalışır.
 */
import type { IlerlemeSnapshot } from '@/db/types';
import {
  getPerformans,
  getSicilKayitlari,
  getStudyCards,
  ilerlemeDisaAktar,
  ilerlemeIceAktar,
} from '@/db/database';
import { supabase, supabaseHazir } from '@/lib/supabase';

const TABLO = 'kullanici_ilerleme';

/** Yerelde hiç kullanıcı ilerlemesi yok mu (yeni/temiz cihaz tespiti → tam geri yükleme). */
async function yerelBosMu(): Promise<boolean> {
  const [studied, perf, sicil] = await Promise.all([
    getStudyCards(),
    getPerformans(),
    getSicilKayitlari(),
  ]);
  return studied.length === 0 && perf.length === 0 && sicil.length === 0;
}

/** GİRİŞTE: buluttaki ilerlemeyi indir + yerele birleştir. */
export async function senkronYukle(): Promise<void> {
  if (!supabaseHazir || !supabase) return;
  try {
    const { data } = await supabase.from(TABLO).select('veri').maybeSingle();
    const snapshot = data?.veri as IlerlemeSnapshot | undefined;
    if (!snapshot || snapshot.surum !== 1) return; // bulutta yok → ilk kez; sonraki push'ta oluşur
    const tamYukle = await yerelBosMu();
    await ilerlemeIceAktar(snapshot, tamYukle);
  } catch {
    // sessiz geç (offline / tablo yok → yerelle çalış)
  }
}

/** İlerlemeyi buluta yükle (push). Çıkış/arka plan/önemli olaylarda. */
export async function senkronKaydet(): Promise<void> {
  if (!supabaseHazir || !supabase) return;
  try {
    const { data: u } = await supabase.auth.getUser();
    const uid = u.user?.id;
    if (!uid) return;
    const snapshot = await ilerlemeDisaAktar();
    await supabase
      .from(TABLO)
      .upsert({ user_id: uid, veri: snapshot, guncelleme: new Date().toISOString() });
  } catch {
    // sessiz geç
  }
}
